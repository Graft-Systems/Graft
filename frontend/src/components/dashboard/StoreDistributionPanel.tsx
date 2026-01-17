export default function StoreDistributionPanel() {
    const stores = [
        { name: "Downtown Wine Co.", neighborhood: "Central", status: "Active", bottles: 12 },
        { name: "Harbor Spirits", neighborhood: "Waterfront", status: "Low Stock", bottles: 3 },
        { name: "Hilltop Market", neighborhood: "North Side", status: "Inactive", bottles: 0 },
    ];

    return (
        <div className="space-y-3">
            <table className="w-full text-sm" style={{ color: "#374151" }}>
                <thead className="text-left border-b">
                    <tr style={{ color: "#171717" }}>
                        <th>Store</th>
                        <th>Neighborhood</th>
                        <th>Status</th>
                        <th>Bottles</th>
                    </tr>
                </thead>
                <tbody>
                    {stores.map((s) => (
                        <tr key={s.name} className="border-b">
                            <td>{s.name}</td>
                            <td>{s.neighborhood}</td>
                            <td>{s.status}</td>
                            <td>{s.bottles}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
