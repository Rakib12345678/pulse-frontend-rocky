import { ColumnSet } from '@/features/landing/components/ColumnSet'

export function LandingRailFallback() {
    return (
        <div className="scrollbar-hide flex w-max overflow-hidden">
            <ColumnSet />
            <ColumnSet />
            <ColumnSet />
            <ColumnSet />
        </div>
    )
}