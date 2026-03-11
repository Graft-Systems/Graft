export default function PanelContainer({ 
    title, 
    children, 
    titleColor = "#9f1239" 
}: { 
    title: string; 
    children: React.ReactNode; 
    titleColor?: string;
}) {
    return (
        <div className="rounded-2xl shadow-sm overflow-hidden" style={{ backgroundColor: "#ffffff", border: "1px solid #e5e5e5" }}>
            <div className="px-5 py-3 xl:px-6 xl:py-4" style={{ borderBottom: "1px solid #e5e5e5", backgroundColor: "#f5f5f5" }}>
                <h2 className="text-base xl:text-lg font-bold leading-tight" style={{ color: titleColor }}>{title}</h2>
            </div>
            <div className="p-4 xl:p-5 2xl:p-6">
                {children}
            </div>
        </div>
    );
}
