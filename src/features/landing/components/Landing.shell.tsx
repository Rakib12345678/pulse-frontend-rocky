export function LandingRailShell({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        // The outer container handles positioning; this handles the scroll window
        <div className="w-full overflow-hidden">
            {children}
        </div>
    )
}