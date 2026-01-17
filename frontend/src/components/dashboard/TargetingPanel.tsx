export default function TargetingPanel() {
    const neighborhoods = [
        { name: "Eastwood", avgPrice: 24.5, growth: "+8%" },
        { name: "Riverside", avgPrice: 31.2, growth: "+12%" },
        { name: "Midtown", avgPrice: 18.9, growth: "+3%" },
    ];

    return (
        <div className="grid grid-cols-3 gap-4">
            {neighborhoods.map((n) => (
                <div key={n.name} className="p-4 border rounded-lg bg-neutral-50">
                    <h3 className="text-lg font-semibold" style={{ color: "#171717" }}>{n.name}</h3>
                    <p style={{ color: "#374151" }}>Avg Price: ${n.avgPrice}</p>
                    <p style={{ color: "#374151" }}>Growth: {n.growth}</p>
                </div>
            ))}
        </div>
    );
}
