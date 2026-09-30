import React, { useEffect, useRef, useState } from 'react';

const CustomCursor: React.FC = () => {
    // Refs for direct DOM manipulation (performance)
    const cursorDotRef = useRef<HTMLDivElement>(null);
    const cursorRingRef = useRef<HTMLDivElement>(null);

    // State to track if device has a mouse (to avoid rendering on mobile)
    const [isVisible, setIsVisible] = useState(false);

    // Refs for physics variables
    const mousePos = useRef({ x: 0, y: 0 });
    const ringPos = useRef({ x: 0, y: 0 });
    const isHovering = useRef(false);
    const isClicking = useRef(false);

    useEffect(() => {
        const hasMouse = window.matchMedia('(pointer: fine)').matches;
        if (!hasMouse) return;

        setIsVisible(true);

        const onMouseMove = (e: MouseEvent) => {
            mousePos.current.x = e.clientX;
            mousePos.current.y = e.clientY;
        };

        const onMouseDown = () => { isClicking.current = true; };
        const onMouseUp = () => { isClicking.current = false; };

        const onMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const isClickable = target.matches('a, button, input, textarea, select, [role="button"]') ||
                target.closest('a, button, input, textarea, select, [role="button"]');
            isHovering.current = !!isClickable;
        };

        window.addEventListener('mousemove', onMouseMove, { passive: true });
        window.addEventListener('mousedown', onMouseDown, { passive: true });
        window.addEventListener('mouseup', onMouseUp, { passive: true });
        document.addEventListener('mouseover', onMouseOver, { capture: true, passive: true });

        let animationFrameId: number;
        let lastHovering = false;
        let lastClicking = false;

        const loop = () => {
            const dot = cursorDotRef.current;
            const ring = cursorRingRef.current;

            if (dot && ring) {
                // Smooth follow for ring - Snappier lerp (0.35)
                ringPos.current.x += (mousePos.current.x - ringPos.current.x) * 0.35;
                ringPos.current.y += (mousePos.current.y - ringPos.current.y) * 0.35;

                // Sync dot (translate3d is faster than top/left)
                dot.style.transform = `translate3d(${mousePos.current.x}px, ${mousePos.current.y}px, 0) translate(-50%, -50%)`;

                let scale = 1;
                if (isClicking.current) scale = 0.8;
                else if (isHovering.current) scale = 1.5;

                // Only update classList and scale if changed
                if (isHovering.current !== lastHovering) {
                    ring.classList.toggle('cursor-hover', isHovering.current);
                    lastHovering = isHovering.current;
                }
                if (isClicking.current !== lastClicking) {
                    ring.classList.toggle('cursor-clicking', isClicking.current);
                    lastClicking = isClicking.current;
                }

                ring.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0) translate(-50%, -50%) scale(${scale})`;
            }

            animationFrameId = requestAnimationFrame(loop);
        };

        loop();

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mouseup', onMouseUp);
            document.removeEventListener('mouseover', onMouseOver, { capture: true });
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    if (!isVisible) return null;

    return (
        <>
            {/* Styles specific to cursor */}
            <style>{`
                body, a, button, input {
                    cursor: none !important; /* Hide default cursor */
                }
                
                .custom-cursor-dot {
                    width: 12px;
                    height: 12px;
                    background-color: #141414;
                    border-radius: 50%;
                    position: fixed;
                    top: 0;
                    left: 0;
                    pointer-events: none;
                    z-index: 9999;
                    will-change: transform;
                }
                
                .custom-cursor-ring {
                    width: 40px;
                    height: 40px;
                    border: 1px solid rgba(20, 20, 20, 0.5);
                    border-radius: 50%;
                    position: fixed;
                    top: 0;
                    left: 0;
                    pointer-events: none;
                    z-index: 9998;
                    transition: border-color 0.2s, background-color 0.2s, width 0.2s, height 0.2s;
                    will-change: transform;
                }

                /* Hover State: Green Glow */
                .custom-cursor-ring.cursor-hover {
                    border-color: #22C55E;
                    background-color: rgba(34, 197, 94, 0.1);
                    box-shadow: 0 0 15px rgba(34, 197, 94, 0.4);
                }
                
                /* Click State */
                .custom-cursor-ring.cursor-clicking {
                    background-color: rgba(20, 20, 20, 0.1);
                }
            `}</style>

            <div ref={cursorDotRef} className="custom-cursor-dot" />
            <div ref={cursorRingRef} className="custom-cursor-ring" />
        </>
    );
};

export default CustomCursor;
