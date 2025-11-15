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
                    <div className="font-semibold">{r.store}</div>
                    <div>Stage: {r.stage}</div>
                    <div>Fit Score: {r.score}</div>
                </li>
            ))}
        </ul>
    );
}
