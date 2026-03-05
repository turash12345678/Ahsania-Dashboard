'use client';

import React, { useState, useLayoutEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface RippleType {
    x: number;
    y: number;
    size: number;
    id: number;
}

export function Ripple({ color = 'rgba(0, 0, 0, 0.1)', duration = 600 }: { color?: string; duration?: number; }) {
    const [ripples, setRipples] = useState<RippleType[]>([]);
    const rippleContainer = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        let bounce: ReturnType<typeof setTimeout> | undefined;
        if (ripples.length > 0) {
            bounce = setTimeout(() => {
                setRipples([]);
            }, duration * 2);
        }
        return () => clearTimeout(bounce);
    }, [ripples.length, duration]);

    const addRipple = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        const container = rippleContainer.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 2;
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        const newRipple = {
            x,
            y,
            size,
            id: Date.now(),
        };

        setRipples((prevRipples) => [...prevRipples, newRipple]);
    };

    return (
        <div
            ref={rippleContainer}
            className="absolute inset-0 overflow-hidden rounded-inherit z-0"
            onMouseDown={addRipple}
        >
            {ripples.map((ripple) => (
                <span
                    key={ripple.id}
                    className="absolute rounded-full opacity-50 bg-current pointer-events-none animate-ripple"
                    style={{
                        top: ripple.y,
                        left: ripple.x,
                        width: ripple.size,
                        height: ripple.size,
                        backgroundColor: color,
                        animationDuration: `${duration}ms`,
                    }}
                />
            ))}
        </div>
    );
}
