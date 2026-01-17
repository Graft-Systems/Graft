export default function LocationRequestsPanel() {
    const requests = [
        { store: "Eastwood Market", stage: "Requested", score: 92 },
        { store: "Harbor Food Co.", stage: "Outreach", score: 88 },
        { store: "Oak Ridge Liquor", stage: "Tasting Scheduled", score: 85 },
    ];

    return (
        <ul className="space-y-3">
            {requests.map((r) => (
                <li key={r.store} className="bg-neutral-50 p-4 border rounded-lg">
                    <div className="font-semibold" style={{ color: "#171717" }}>{r.store}</div>
                    <div style={{ color: "#374151" }}>Stage: {r.stage}</div>
                    <div style={{ color: "#374151" }}>Fit Score: {r.score}</div>
                </li>
            ))}
        </ul>
    );
}
