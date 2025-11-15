export default function PanelContainer({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="bg-white rounded-xl shadow p-6 border border-neutral-200">
            <h2 className="text-xl font-semibold mb-4">{title}</h2>
            {children}
        </div>
    );
}
