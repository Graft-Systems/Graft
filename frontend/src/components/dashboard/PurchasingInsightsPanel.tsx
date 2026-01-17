export default function PurchasingInsightsPanel() {
    const insights = [
        { product: "Brie Cheese", freq: "Often Bought Together" },
        { product: "Prosciutto", freq: "Strong Pairing" },
        { product: "Crackers", freq: "Frequent Basket Item" },
    ];

    return (
        <div className="space-y-3">
            {insights.map((i) => (
                <div key={i.product} className="p-4 bg-neutral-50 border rounded-lg" style={{ color: "#374151" }}>
                    <strong style={{ color: "#171717" }}>{i.product}</strong> — {i.freq}
                </div>
            ))}
        </div>
    );
}
