"use client";

import Sidebar from "@/components/dashboard/Sidebar";
import PanelContainer from "@/components/dashboard/PanelContainer";

// Panels
import StoreDistributionPanel from "@/components/dashboard/StoreDistributionPanel";
import TargetingPanel from "@/components/dashboard/TargetingPanel";
import OrderingPredictionsPanel from "@/components/dashboard/OrderingPredictionsPanel";
import PricingAnalyticsPanel from "@/components/dashboard/PricingAnalyticsPanel";
import PurchasingInsightsPanel from "@/components/dashboard/PurchasingInsightsPanel";
import LocationRequestsPanel from "@/components/dashboard/LocationRequestsPanel";
import RetailContactsPanel from "@/components/dashboard/RetailContactsPanel";
import MarketingGeneratorPanel from "@/components/dashboard/MarketingGeneratorPanel";

export default function ProducerDashboard() {
    return (
        <div className="min-h-screen flex bg-neutral-50">
            <Sidebar />

            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                <PanelContainer title="Store Location & Distribution Insights">
                    <StoreDistributionPanel />
                </PanelContainer>

                <PanelContainer title="Submarket & Demographic Targeting">
                    <TargetingPanel />
                </PanelContainer>

                <PanelContainer title="Ordering Predictions (Reorder Radar)">
                    <OrderingPredictionsPanel />
                </PanelContainer>

                <PanelContainer title="Wholesale Pricing Analytics">
                    <PricingAnalyticsPanel />
                </PanelContainer>

                <PanelContainer title="Retail & Consumer Purchasing Insights">
                    <PurchasingInsightsPanel />
                </PanelContainer>

                <PanelContainer title="Integrated Location Requesting System">
                    <LocationRequestsPanel />
                </PanelContainer>

                <PanelContainer title="Retail Contact System">
                    <RetailContactsPanel />
                </PanelContainer>

                <PanelContainer title="Marketing Material Generator">
                    <MarketingGeneratorPanel />
                </PanelContainer>
            </div>
        </div>
    );
}
