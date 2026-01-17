export default function PricingAnalyticsPanel() {
    const pricing = [
        { account: "Midtown Wine", price: 12.5, median: 13 },
        { account: "Market Plaza", price: 11.8, median: 12.5 },
        { account: "Blue Lake Liquor", price: 13.9, median: 13.2 },
    ];

    return (
        <div>
            <table className="w-full text-sm" style={{ color: "#374151" }}>
                <thead className="border-b">
                    <tr style={{ color: "#171717" }}>
                        <th>Account</th>
                        <th>Net Price</th>
                        <th>Region Median</th>
                    </tr>
                </thead>
                <tbody>
                    {pricing.map((p) => (
                        <tr key={p.account} className="border-b">
                            <td>{p.account}</td>
                            <td>${p.price}</td>
                            <td>${p.median}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
