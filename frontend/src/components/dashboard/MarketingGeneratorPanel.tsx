export default function MarketingGeneratorPanel() {
    return (
        <div className="space-y-3">
            <p className="text-sm" style={{ color: "#374151" }}>
                Generate one-sheets, shelf talkers, and tasting cards.
            </p>

            <button 
                className="px-4 py-2 rounded-lg transition"
                style={{ backgroundColor: "#e11d48", color: "#ffffff" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#be123c"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#e11d48"}
            >
                Generate Sample Material
            </button>

            <div className="p-4 bg-neutral-50 border rounded-lg">
                <p className="text-sm" style={{ color: "#525252" }}>Your preview will appear here.</p>
            </div>
        </div>
    );
}
