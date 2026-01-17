export default function RetailContactsPanel() {
    const contacts = [
        { store: "Downtown Wine", name: "Sarah Lopez", phone: "555-7190", last: "10 days ago" },
        { store: "Harbor Spirits", name: "Michael Dunn", phone: "555-1123", last: "4 days ago" },
    ];

    return (
        <div className="space-y-3">
            {contacts.map((c) => (
                <div key={c.store} className="p-4 bg-neutral-50 border rounded-lg">
                    <h3 className="font-semibold text-lg" style={{ color: "#171717" }}>{c.store}</h3>
                    <p style={{ color: "#374151" }}>Buyer: {c.name}</p>
                    <p style={{ color: "#374151" }}>Phone: {c.phone}</p>
                    <p style={{ color: "#374151" }}>Last Contact: {c.last}</p>
                </div>
            ))}
        </div>
    );
}
