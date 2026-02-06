'use client'

import { useEffect, useRef, useState } from 'react'
import { ColumnSet } from '@/features/landing/components/ColumnSet'

const SPEED = 0.04

export function LandingRailClient() {
    const innerRef = useRef<HTMLDivElement>(null)
    const pos = useRef(0)
    const lastTime = useRef<number>(0)
    const requestRef = useRef<number | null>(null)
    const [paused, setPaused] = useState(false)

    useEffect(() => {
        const animate = (time: number) => {
            if (lastTime.current !== undefined && !paused) {
                const deltaTime = time - lastTime.current
                pos.current -= deltaTime * SPEED

                if (innerRef.current) {
                    const halfWidth = innerRef.current.scrollWidth / 2
                    if (Math.abs(pos.current) >= halfWidth) {
                        pos.current += halfWidth
                    }
                    innerRef.current.style.transform = `translate3d(${pos.current}px, 0, 0)`
                }
            }
            lastTime.current = time
            requestRef.current = requestAnimationFrame(animate)
        }

        requestRef.current = requestAnimationFrame(animate)
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current)
        }
    }, [paused])

    return (
        <div
            ref={innerRef}
            className="flex w-max will-change-transform"
            style={{ transform: 'translate3d(0, 0, 0)' }}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            <ColumnSet />
            <ColumnSet />
            <ColumnSet />
            <ColumnSet />
        </div>
    )
}
