export default function MarketingGeneratorPanel() {
    return (
        <div className="space-y-3">
            <p className="text-sm">
                Generate one-sheets, shelf talkers, and tasting cards.
            </p>

            <button className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700">
                Generate Sample Material
            </button>

            <div className="p-4 bg-neutral-50 border rounded-lg">
                <p className="text-sm text-neutral-600">Your preview will appear here.</p>
            </div>
        </div>
    );
}
