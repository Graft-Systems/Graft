from datetime import timedelta

from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APITestCase

from graftapi.irrigation_engine import IrrigationAdvisorEngine
from graftapi.models import (
    BlockMoistureTarget,
    IrrigationLog,
    Producer,
    SoilMoistureReading,
    Vineyard,
    VineyardBlock,
    WeatherData,
)


class IrrigationTestMixin:
    def create_producer(self, username="grower"):
        user = User.objects.create_user(username=username, password="password123")
        producer = Producer.objects.create(user=user, name=f"{username} Cellars")
        return user, producer

    def create_block(self, producer, *, acres=10):
        vineyard = Vineyard.objects.create(producer=producer, name="Estate North", total_acres=40)
        block = VineyardBlock.objects.create(
            vineyard=vineyard,
            name="Block A",
            grape_species="Cabernet Sauvignon",
            acres=acres,
        )
        return vineyard, block

    def add_forecast(self, vineyard, *, days=7, precipitation=0.0, high=92.0, humidity=40.0, wind=10.0):
        today = timezone.now().date()
        for offset in range(days):
            WeatherData.objects.create(
                vineyard=vineyard,
                source="forecast",
                date=today + timedelta(days=offset),
                precipitation_in=precipitation,
                temp_high_f=high,
                humidity_pct=humidity,
                wind_speed_mph=wind,
            )

    def add_irrigation_logs(self, block, gallons=(1200, 1000, 1100)):
        today = timezone.now().date()
        for index, gallons_applied in enumerate(gallons):
            IrrigationLog.objects.create(
                block=block,
                date=today - timedelta(days=index + 1),
                method="drip",
                gallons_applied=gallons_applied,
                soil_moisture_pct_before=20 + index,
                soil_moisture_pct_after=24 + index,
            )

    def add_readings(self, block, values):
        now = timezone.now()
        for hours_ago, moisture in values:
            SoilMoistureReading.objects.create(
                block=block,
                recorded_at=now - timedelta(hours=hours_ago),
                moisture_pct=moisture,
                source="manual",
            )


class IrrigationAdvisorEngineTests(IrrigationTestMixin, TestCase):
    def setUp(self):
        _, self.producer = self.create_producer()
        self.vineyard, self.block = self.create_block(self.producer)
        self.engine = IrrigationAdvisorEngine()

    def test_critical_dry_block_generates_schedule_or_increase(self):
        self.add_forecast(self.vineyard, precipitation=0.0, high=95.0, humidity=35.0)
        self.add_irrigation_logs(self.block)
        self.add_readings(self.block, [(48, 21.5), (0, 16.0)])

        recommendations = self.engine.generate_for_block(self.block)

        immediate = next(item for item in recommendations if item.horizon_days == 3)
        self.assertIn(immediate.action, {"schedule", "increase"})
        self.assertIsNotNone(immediate.recommended_gallons_per_acre)
        self.assertGreater(immediate.confidence_score, 0.5)

    def test_in_range_block_maintains_current_program(self):
        self.add_forecast(self.vineyard, precipitation=0.15, high=84.0, humidity=52.0)
        self.add_readings(self.block, [(48, 24.5), (0, 25.0)])

        recommendations = self.engine.generate_for_block(self.block)

        self.assertTrue(all(item.action == "maintain" for item in recommendations))

    def test_overwatered_block_with_heavy_rain_skips_irrigation(self):
        self.add_forecast(self.vineyard, precipitation=0.6, high=74.0, humidity=65.0)
        self.add_readings(self.block, [(48, 29.0), (0, 31.0)])

        recommendations = self.engine.generate_for_block(self.block)

        immediate = next(item for item in recommendations if item.horizon_days == 3)
        self.assertEqual(immediate.action, "skip")

    def test_missing_forecast_still_returns_recommendations(self):
        BlockMoistureTarget.objects.create(block=self.block, target_min_pct=21, target_max_pct=27, critical_min_pct=17)
        self.add_readings(self.block, [(72, 22.5), (0, 20.5)])

        recommendations = self.engine.generate_for_block(self.block)

        self.assertEqual(len(recommendations), 2)
        self.assertTrue(all(item.confidence_score < 0.8 for item in recommendations))


class IrrigationApiTests(IrrigationTestMixin, APITestCase):
    def setUp(self):
        self.user, self.producer = self.create_producer()
        self.vineyard, self.block = self.create_block(self.producer)
        self.other_user, self.other_producer = self.create_producer("othergrower")
        self.other_vineyard, self.other_block = self.create_block(self.other_producer, acres=8)
        self.client.force_authenticate(user=self.user)

    def test_soil_moisture_create_and_scoped_list(self):
        SoilMoistureReading.objects.create(
            block=self.other_block,
            recorded_at=timezone.now(),
            moisture_pct=18.4,
            source="manual",
        )

        create_response = self.client.post(
            "/api/irrigation/soil-moisture/",
            {
                "block": self.block.id,
                "recorded_at": timezone.now().isoformat(),
                "moisture_pct": 21.7,
                "notes": "Probe A",
            },
            format="json",
        )
        list_response = self.client.get("/api/irrigation/soil-moisture/", {"block_id": self.block.id})

        self.assertEqual(create_response.status_code, 201)
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(len(list_response.data), 1)
        self.assertEqual(float(list_response.data[0]["moisture_pct"]), 21.7)

    def test_csv_upload_skips_duplicates(self):
        recorded_at = timezone.now().replace(microsecond=0)
        SoilMoistureReading.objects.create(
            block=self.block,
            recorded_at=recorded_at,
            moisture_pct=22.0,
            source="csv",
        )
        csv_content = (
            "recorded_at,moisture_pct,source_label\n"
            f"{recorded_at.isoformat()},22.0,sensor-1\n"
            f"{(recorded_at - timedelta(hours=2)).isoformat()},20.5,sensor-1\n"
        )
        upload = SimpleUploadedFile("readings.csv", csv_content.encode("utf-8"), content_type="text/csv")

        response = self.client.post(
            "/api/irrigation/soil-moisture/upload/",
            {"block": self.block.id, "file": upload},
            format="multipart",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["imported"], 1)
        self.assertEqual(response.data["skipped"], 1)

    def test_target_update_and_recommendation_generation(self):
        self.add_forecast(self.vineyard, precipitation=0.0, high=94.0, humidity=34.0)
        self.add_irrigation_logs(self.block)
        self.add_readings(self.block, [(48, 22.0), (0, 17.2)])

        target_response = self.client.put(
            f"/api/irrigation/targets/{self.block.id}/",
            {"target_min_pct": 23.0, "target_max_pct": 28.0, "critical_min_pct": 18.0},
            format="json",
        )
        generate_response = self.client.post(
            "/api/irrigation/recommendations/generate/",
            {"block": self.block.id},
            format="json",
        )
        list_response = self.client.get("/api/irrigation/recommendations/", {"block_id": self.block.id})

        self.assertEqual(target_response.status_code, 200)
        self.assertEqual(generate_response.status_code, 201)
        self.assertEqual(len(generate_response.data), 2)
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(len(list_response.data), 2)

    def test_shared_agriculture_endpoints_and_vigil_share_same_core_data(self):
        Vineyard.objects.create(producer=self.producer, name="Estate South")

        agriculture_response = self.client.get("/api/agriculture/vineyards/")
        vigil_response = self.client.get("/api/vigil/vineyards/")

        self.assertEqual(agriculture_response.status_code, 200)
        self.assertEqual(vigil_response.status_code, 200)
        self.assertEqual(len(agriculture_response.data), len(vigil_response.data))
