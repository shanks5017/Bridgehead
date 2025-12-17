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
    const dotPos = useRef({ x: 0, y: 0 });
    const isHovering = useRef(false);
    const isClicking = useRef(false);

    useEffect(() => {
        // Only enable on devices with fine pointer (mouse)
        const hasMouse = window.matchMedia('(pointer: fine)').matches;
        if (!hasMouse) return;

        setIsVisible(true);

        const onMouseMove = (e: MouseEvent) => {
            mousePos.current = { x: e.clientX, y: e.clientY };
        };

        const onMouseDown = () => { isClicking.current = true; };
        const onMouseUp = () => { isClicking.current = false; };

        // Interaction sensing
        const onMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // Check if hovering over clickable elements
            const isClickable = target.matches('a, button, input, textarea, select, [role="button"]') ||
                target.closest('a, button, input, textarea, select, [role="button"]');

            isHovering.current = !!isClickable;
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mouseup', onMouseUp);
        // Using capture phase for mouseover to catch deep elements
        document.addEventListener('mouseover', onMouseOver, { capture: true });

        // Animation Loop
        let animationFrameId: number;

        const loop = () => {
            const dot = cursorDotRef.current;
            const ring = cursorRingRef.current;

            if (dot && ring) {
                // 1. Dot follows mouse instantly (or very fast)
                // Linear lerp for dot
                dotPos.current.x += (mousePos.current.x - dotPos.current.x) * 1; // Instant
                dotPos.current.y += (mousePos.current.y - dotPos.current.y) * 1;

                // 2. Ring follows with delay (Smooth Spring-like Lerp)
                // Lerp factor 0.25 for faster/smoother follow (reduced lag)
                ringPos.current.x += (mousePos.current.x - ringPos.current.x) * 0.25;
                ringPos.current.y += (mousePos.current.y - ringPos.current.y) * 0.25;

                // Apply Transforms
                dot.style.transform = `translate3d(${mousePos.current.x}px, ${mousePos.current.y}px, 0) translate(-50%, -50%)`;

                // Ring Transformations based on State
                let scale = 1;
                if (isClicking.current) {
                    scale = 0.8;
                } else if (isHovering.current) {
                    scale = 1.5;
                }

                // Opacity/Color logic could be CSS transitions, let's toggle classes
                if (isHovering.current) {
                    ring.classList.add('cursor-hover');
                } else {
                    ring.classList.remove('cursor-hover');
                }

                if (isClicking.current) {
                    ring.classList.add('cursor-clicking');
                } else {
                    ring.classList.remove('cursor-clicking');
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
                    background-color: white;
                    border-radius: 50%;
                    position: fixed;
                    top: 0;
                    left: 0;
                    pointer-events: none;
                    z-index: 9999;
                    mix-blend-mode: difference;
                }
                
                .custom-cursor-ring {
                    width: 40px;
                    height: 40px;
                    border: 1px solid rgba(255, 255, 255, 0.5);
                    border-radius: 50%;
                    position: fixed;
                    top: 0;
                    left: 0;
                    pointer-events: none;
                    z-index: 9998;
                    transition: border-color 0.2s, background-color 0.2s, width 0.2s, height 0.2s;
                    mix-blend-mode: difference;
                }

                /* Hover State: Red Glow */
                .custom-cursor-ring.cursor-hover {
                    border-color: #FF0000;
                    background-color: rgba(255, 0, 0, 0.1);
                    box-shadow: 0 0 15px rgba(255, 0, 0, 0.4);
                    mix-blend-mode: normal; /* To show true color */
                }
                
                /* Click State */
                .custom-cursor-ring.cursor-clicking {
                    background-color: rgba(255, 255, 255, 0.8);
                }
            `}</style>

            <div ref={cursorDotRef} className="custom-cursor-dot" />
            <div ref={cursorRingRef} className="custom-cursor-ring" />
        </>
    );
};

export default CustomCursor;
