export default function OrderingPredictionsPanel() {
    const predictions = [
        { store: "Harbor Spirits", eta: "2–3 weeks", cases: 4 },
        { store: "Eastside Cellars", eta: "1 week", cases: 2 },
        { store: "Vine & Oak", eta: "3–4 weeks", cases: 6 },
    ];

    return (
        <ul className="space-y-2">
            {predictions.map((p) => (
                <li key={p.store} className="p-4 bg-neutral-50 border rounded-lg">
                    <div className="font-semibold">{p.store}</div>
                    <div>Likely reorder: {p.eta}</div>
                    <div>Suggested: {p.cases} cases</div>
                </li>
            ))}
        </ul>
    );
}
