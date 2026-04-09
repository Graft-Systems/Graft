from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta
from statistics import median

from django.db.models import Avg, Sum
from django.utils import timezone

from .models.agriculture import IrrigationLog, WeatherData
from .models.irrigation import SoilMoistureReading


def _to_float(value, default: float | None = None) -> float | None:
    if value is None:
        return default
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _round(value: float | None, digits: int = 2) -> float | None:
    if value is None:
        return None
    return round(value, digits)


@dataclass
class RecommendationPayload:
    horizon_days: int
    action: str
    recommended_total_gallons: float | None
    recommended_gallons_per_acre: float | None
    next_irrigation_date: date | None
    target_moisture_pct: float
    confidence_score: float
    drivers: dict
    explanation: str


class IrrigationAdvisorEngine:
    default_target_min_pct = 22.0
    default_target_max_pct = 28.0
    default_critical_min_pct = 18.0

    def generate_for_block(self, block) -> list[RecommendationPayload]:
        latest_reading = (
            SoilMoistureReading.objects.filter(block=block).order_by("-recorded_at", "-id").first()
        )
        if not latest_reading:
            raise ValueError("Add at least one soil moisture reading before generating recommendations.")

        targets = self._get_targets(block)
        readings = list(
            SoilMoistureReading.objects.filter(
                block=block,
                recorded_at__gte=timezone.now() - timedelta(days=7),
            ).order_by("recorded_at", "id")
        )
        recent_logs = list(IrrigationLog.objects.filter(block=block).order_by("-date")[:14])

        recommendations = []
        for horizon_days in (3, 7):
            weather_context = self._weather_context(block, horizon_days)
            recommendations.append(
                self._build_recommendation(
                    block=block,
                    latest_reading=latest_reading,
                    readings=readings,
                    recent_logs=recent_logs,
                    targets=targets,
                    weather_context=weather_context,
                    horizon_days=horizon_days,
                )
            )
        return recommendations

    def _get_targets(self, block) -> dict[str, float]:
        target = getattr(block, "moisture_target", None)
        return {
            "target_min_pct": _to_float(getattr(target, "target_min_pct", None), self.default_target_min_pct),
            "target_max_pct": _to_float(getattr(target, "target_max_pct", None), self.default_target_max_pct),
            "critical_min_pct": _to_float(getattr(target, "critical_min_pct", None), self.default_critical_min_pct),
            "configured": target is not None,
        }

    def _weather_context(self, block, horizon_days: int) -> dict[str, float | bool | None]:
        today = timezone.now().date()
        forecast = WeatherData.objects.filter(
            vineyard=block.vineyard,
            source="forecast",
            date__gte=today,
            date__lte=today + timedelta(days=horizon_days),
        )
        aggregate = forecast.aggregate(
            total_precipitation=Sum("precipitation_in"),
            avg_temp_high=Avg("temp_high_f"),
            avg_humidity=Avg("humidity_pct"),
            avg_wind=Avg("wind_speed_mph"),
        )
        total_precipitation = _to_float(aggregate["total_precipitation"], 0.0)
        avg_temp_high = _to_float(aggregate["avg_temp_high"])
        avg_humidity = _to_float(aggregate["avg_humidity"])
        avg_wind = _to_float(aggregate["avg_wind"])
        hot_dry = bool(
            avg_temp_high is not None
            and avg_temp_high >= 90.0
            and total_precipitation <= 0.2
            and (avg_humidity is None or avg_humidity <= 45.0)
        )
        heavy_rain = total_precipitation >= (0.8 if horizon_days == 3 else 1.5)
        return {
            "forecast_available": forecast.exists(),
            "total_precipitation_in": total_precipitation,
            "avg_temp_high_f": avg_temp_high,
            "avg_humidity_pct": avg_humidity,
            "avg_wind_mph": avg_wind,
            "hot_dry": hot_dry,
            "heavy_rain": heavy_rain,
        }

    def _build_recommendation(
        self,
        *,
        block,
        latest_reading,
        readings,
        recent_logs,
        targets,
        weather_context,
        horizon_days: int,
    ) -> RecommendationPayload:
        latest_moisture = float(latest_reading.moisture_pct)
        target_min = targets["target_min_pct"]
        target_max = targets["target_max_pct"]
        critical_min = targets["critical_min_pct"]
        target_mid = round((target_min + target_max) / 2, 1)

        trend_per_day = self._trend_per_day(readings)
        stats = self._reading_stats(readings)
        days_since_last_irrigation = self._days_since_last_irrigation(recent_logs)
        gallons_context = self._gallons_context(block, recent_logs)

        below_critical = latest_moisture < critical_min
        below_target = latest_moisture < target_min
        above_target = latest_moisture > target_max
        sharply_drying = trend_per_day is not None and trend_per_day <= -1.5
        heavy_rain = bool(weather_context["heavy_rain"])
        hot_dry = bool(weather_context["hot_dry"])

        if above_target and heavy_rain:
            action = "skip"
        elif above_target:
            action = "reduce"
        elif below_critical or (below_target and sharply_drying and hot_dry):
            action = "increase" if days_since_last_irrigation is not None and days_since_last_irrigation <= 2 else "schedule"
        elif below_target:
            action = "schedule"
        else:
            action = "maintain"

        gallons_per_acre = self._recommended_gallons_per_acre(
            action=action,
            baseline_gallons_per_acre=gallons_context["baseline_gallons_per_acre"],
            latest_moisture=latest_moisture,
            target_mid=target_mid,
            precipitation_in=_to_float(weather_context["total_precipitation_in"], 0.0) or 0.0,
        )
        total_gallons = None
        acres = _to_float(getattr(block, "acres", None))
        if gallons_per_acre is not None and acres is not None:
            total_gallons = gallons_per_acre * acres

        next_irrigation_date = None
        if action in {"schedule", "increase"}:
            offset = 0 if below_critical or action == "increase" else 1
            next_irrigation_date = timezone.now().date() + timedelta(days=offset)

        confidence = self._confidence_score(
            reading_count=len(readings),
            forecast_available=bool(weather_context["forecast_available"]),
            has_targets=bool(targets["configured"]),
            has_baseline=gallons_context["baseline_gallons_per_acre"] is not None,
        )

        drivers = {
            "latest_moisture_pct": _round(latest_moisture, 1),
            "target_min_pct": _round(target_min, 1),
            "target_max_pct": _round(target_max, 1),
            "critical_min_pct": _round(critical_min, 1),
            "target_moisture_pct": _round(target_mid, 1),
            "trend_pct_per_day": _round(trend_per_day, 2),
            "seven_day_min_pct": stats["min_pct"],
            "seven_day_max_pct": stats["max_pct"],
            "seven_day_avg_pct": stats["avg_pct"],
            "days_since_last_irrigation": days_since_last_irrigation,
            "forecast_total_precipitation_in": _round(_to_float(weather_context["total_precipitation_in"]), 2),
            "forecast_avg_temp_high_f": _round(_to_float(weather_context["avg_temp_high_f"]), 1),
            "forecast_avg_humidity_pct": _round(_to_float(weather_context["avg_humidity_pct"]), 1),
            "forecast_avg_wind_mph": _round(_to_float(weather_context["avg_wind_mph"]), 1),
            "baseline_gallons_per_acre": gallons_context["baseline_gallons_per_acre"],
            "baseline_total_gallons": gallons_context["baseline_total_gallons"],
        }

        explanation = self._build_explanation(
            action=action,
            latest_moisture=latest_moisture,
            target_min=target_min,
            target_max=target_max,
            trend_per_day=trend_per_day,
            weather_context=weather_context,
            horizon_days=horizon_days,
        )

        return RecommendationPayload(
            horizon_days=horizon_days,
            action=action,
            recommended_total_gallons=_round(total_gallons, 2),
            recommended_gallons_per_acre=_round(gallons_per_acre, 2),
            next_irrigation_date=next_irrigation_date,
            target_moisture_pct=target_mid,
            confidence_score=confidence,
            drivers=drivers,
            explanation=explanation,
        )

    def _trend_per_day(self, readings) -> float | None:
        if len(readings) < 2:
            return None
        first = readings[0]
        last = readings[-1]
        elapsed_hours = max((last.recorded_at - first.recorded_at).total_seconds() / 3600.0, 1.0)
        elapsed_days = elapsed_hours / 24.0
        return (float(last.moisture_pct) - float(first.moisture_pct)) / elapsed_days

    def _reading_stats(self, readings) -> dict[str, float | None]:
        if not readings:
            return {"min_pct": None, "max_pct": None, "avg_pct": None}
        values = [float(reading.moisture_pct) for reading in readings]
        return {
            "min_pct": _round(min(values), 1),
            "max_pct": _round(max(values), 1),
            "avg_pct": _round(sum(values) / len(values), 1),
        }

    def _days_since_last_irrigation(self, logs) -> int | None:
        if not logs:
            return None
        return (timezone.now().date() - logs[0].date).days

    def _gallons_context(self, block, logs) -> dict[str, float | None]:
        usable_logs = [log for log in logs if log.gallons_applied is not None]
        baseline_total = None
        if len(usable_logs) >= 3:
            baseline_total = float(
                median([float(log.gallons_applied) for log in usable_logs[:3]])
            )

        acres = _to_float(getattr(block, "acres", None))
        baseline_per_acre = None
        if baseline_total is not None and acres not in (None, 0):
            baseline_per_acre = baseline_total / acres

        return {
            "baseline_total_gallons": _round(baseline_total, 2),
            "baseline_gallons_per_acre": _round(baseline_per_acre, 2),
        }

    def _recommended_gallons_per_acre(
        self,
        *,
        action: str,
        baseline_gallons_per_acre: float | None,
        latest_moisture: float,
        target_mid: float,
        precipitation_in: float,
    ) -> float | None:
        if baseline_gallons_per_acre is None or action in {"maintain", "skip"}:
            return 0.0 if action == "skip" and baseline_gallons_per_acre is not None else None

        deficit = max(target_mid - latest_moisture, 0.0)
        multiplier = 1.0 + min(deficit * 0.08, 0.5)
        rain_factor = max(0.55, 1.0 - min(precipitation_in * 0.12, 0.45))

        if action == "increase":
            multiplier += 0.2
        elif action == "reduce":
            multiplier = 0.65

        gallons_per_acre = baseline_gallons_per_acre * multiplier * rain_factor
        return max(gallons_per_acre, 0.0)

    def _confidence_score(
        self,
        *,
        reading_count: int,
        forecast_available: bool,
        has_targets: bool,
        has_baseline: bool,
    ) -> float:
        score = 0.35
        if reading_count >= 2:
            score += 0.2
        if reading_count >= 4:
            score += 0.1
        if forecast_available:
            score += 0.15
        if has_targets:
            score += 0.1
        if has_baseline:
            score += 0.1
        return round(min(score, 0.95), 2)

    def _build_explanation(
        self,
        *,
        action: str,
        latest_moisture: float,
        target_min: float,
        target_max: float,
        trend_per_day: float | None,
        weather_context: dict,
        horizon_days: int,
    ) -> str:
        moisture_text = f"Soil moisture is {latest_moisture:.1f}% against a target band of {target_min:.1f}% to {target_max:.1f}%."
        if trend_per_day is not None:
            moisture_text += f" The short-term moisture trend is {trend_per_day:.2f} points per day."

        weather_text = "Forecast data is limited."
        if weather_context["forecast_available"]:
            precip = _to_float(weather_context["total_precipitation_in"], 0.0) or 0.0
            temp_high = _to_float(weather_context["avg_temp_high_f"])
            weather_text = f"The next {horizon_days} days project {precip:.2f} inches of rain"
            if temp_high is not None:
                weather_text += f" with average highs near {temp_high:.1f}F"
            weather_text += "."

        action_map = {
            "increase": "Increase irrigation immediately to recover moisture faster.",
            "schedule": "Schedule the next irrigation cycle soon to bring the block back into range.",
            "maintain": "Maintain the current irrigation program and continue monitoring.",
            "reduce": "Reduce irrigation volume because moisture is already above target.",
            "skip": "Skip the next irrigation cycle because moisture is high and rain is expected.",
        }
        return f"{action_map[action]} {moisture_text} {weather_text}"
