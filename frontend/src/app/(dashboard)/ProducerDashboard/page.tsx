"use client";

import Sidebar from "@/components/dashboard/Sidebar";
import PanelContainer from "@/components/dashboard/PanelContainer";
import SummaryCards from "@/components/dashboard/SummaryCards"; // New Import

// Panels
import StoreDistributionPanel from "@/components/dashboard/StoreDistributionPanel";
import TargetingPanel from "@/components/dashboard/TargetingPanel";
import OrderingPredictionsPanel from "@/components/dashboard/OrderingPredictionsPanel";
import PricingAnalyticsPanel from "@/components/dashboard/PricingAnalyticsPanel";
import PurchasingInsightsPanel from "@/components/dashboard/PurchasingInsightsPanel";
import LocationRequestsPanel from "@/components/dashboard/LocationRequestsPanel";
import RetailContactsPanel from "@/components/dashboard/RetailContactsPanel";
import MarketingGeneratorPanel from "@/components/dashboard/MarketingGeneratorPanel";
import YourWinesPanel from "@/components/dashboard/YourWinesPanel";

export default function ProducerDashboard() {
    return (
        <div className="min-h-screen flex" style={{ backgroundColor: "#fafafa" }}>
            <Sidebar />

            <div className="flex-1 p-8 space-y-8 overflow-y-auto">
                {/* Header Section */}
                <header className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold" style={{ color: "#171717" }}>Producer Overview</h1>
                    <p style={{ color: "#737373" }}>Real-time distribution and sales intelligence.</p>
                </header>

                {/* Top Level Summary - The First Thing Users See */}
                <SummaryCards />

                {/* Dashboard Grid - Using 2 columns for a more professional look */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

                    <div className="space-y-8">
                        <PanelContainer title="Your Portfolio" titleColor="#9f1239">
                            <YourWinesPanel />
                        </PanelContainer>
                        <PanelContainer title="Store Location & Distribution Insights" titleColor="#9f1239">
                            <StoreDistributionPanel />
                        </PanelContainer>

                        <PanelContainer title="Ordering Predictions (Reorder Radar)" titleColor="#9f1239">
                            <OrderingPredictionsPanel />
                        </PanelContainer>

                        <PanelContainer title="Retail & Consumer Purchasing Insights" titleColor="#9f1239">
                            <PurchasingInsightsPanel />
                        </PanelContainer>

                        <PanelContainer title="Retail Contact System" titleColor="#9f1239">
                            <RetailContactsPanel />
                        </PanelContainer>
                    </div>

                    <div className="space-y-8">
                        <PanelContainer title="Submarket & Demographic Targeting" titleColor="#9f1239">
                            <TargetingPanel />
                        </PanelContainer>

                        <PanelContainer title="Wholesale Pricing Analytics" titleColor="#9f1239">
                            <PricingAnalyticsPanel />
                        </PanelContainer>

                        <PanelContainer title="Integrated Location Requesting System" titleColor="#9f1239">
                            <LocationRequestsPanel />
                        </PanelContainer>

                        <PanelContainer title="Marketing Material Generator" titleColor="#9f1239">
                            <MarketingGeneratorPanel />
                        </PanelContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}