import React, { useEffect, useRef } from 'react';
import background from '@/assets/background.png';
import { cn } from '@/lib/utils';

// Ensure the background image is cached in memory to avoid rendering delay/flickering
if (typeof window !== 'undefined') {
  const bgImg = new Image();
  bgImg.src = background;
}

const conicMask = `conic-gradient(
  from 0deg,
  white        0%,    white        14.67%,
  transparent  16.67%, transparent  31.33%,
  white        33.33%, white        48%,
  transparent  50%,   transparent  64.67%,
  white        66.67%, white        81.33%,
  transparent  83.33%, transparent  98%,
  white        100%
)`;

const linearFade =
  'linear-gradient(to bottom, black 0%, black 100%, transparent 88%)';

/* ---------------- Orbit Dot ---------------- */
const OrbitDot: React.FC<{
  ringRef: React.RefObject<HTMLDivElement | null>;
  speed: number;
  cx: number;
  cy: number;
}> = ({ ringRef, speed, cx, cy }) => {
  const dotRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number>(0);
  const startRef = useRef<number>(performance.now());

  useEffect(() => {
    const animate = (now: number) => {
      if (!dotRef.current || !ringRef.current) {
        frameRef.current = requestAnimationFrame(animate);
        return;
      }
      const elapsed = (now - startRef.current) / 1000;
      const angle = (elapsed / speed) * Math.PI * 2 - Math.PI / 2;
      const radius = ringRef.current.getBoundingClientRect().width / 2;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      dotRef.current.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [ringRef, speed, cx, cy]);

  return (
    <div
      ref={dotRef}
      className="absolute"
      style={{
        width: 6, height: 6, borderRadius: '50%', background: 'white',
        boxShadow: '0 0 8px 3px rgba(255,255,255,0.95), 0 0 18px 6px rgba(255,255,255,0.35)',
        top: 0, left: 0, willChange: 'transform',
      }}
    />
  );
};

/* ---------------- Rings ---------------- */
const FadingRings: React.FC = () => {
  const mobileRingRefs = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
  ];
  const desktopRingRefs = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
  ];

  return (
    <>
      {/* Mobile */}
      <div
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 z-0 md:hidden"
        style={{ top: '28vh', width: 0, height: 0 }}
      >
        {[
          { w: '75vw', t: '-37.5vw', l: '-37.5vw', o: 0.35 },
          { w: '140vw', t: '-70vw', l: '-70vw', o: 0.28 },
          { w: '220vw', t: '-110vw', l: '-110vw', o: 0.22 },
        ].map(({ w, t, l, o }, i) => (
          <div
            key={i}
            ref={mobileRingRefs[i]}
            className="absolute rounded-full"
            style={{
              width: w, height: w, top: t, left: l,
              border: `1px solid rgba(120,120,120,${o})`,
              maskImage: `${linearFade}, ${conicMask}`,
              maskComposite: 'intersect',
              WebkitMaskImage: `${linearFade}, ${conicMask}`,
              WebkitMaskComposite: 'source-in',
            }}
          />
        ))}
      </div>

      {/* Desktop */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0 hidden md:block"
      >
        {[
          { r: 300, opacity: 0.35, speed: 14 },
          { r: 450, opacity: 0.28, speed: 22 },
          { r: 650, opacity: 0.22, speed: 34 },
        ].map(({ r, opacity, speed }, i) => (
          <React.Fragment key={r}>
            <div
              ref={desktopRingRefs[i]}
              className="absolute rounded-full"
              style={{
                width: r * 2, height: r * 2,
                top: -r, left: -r,
                border: `1px solid rgba(120,120,120,${opacity})`,
                maskImage: conicMask,
                WebkitMaskImage: conicMask,
              }}
            />
            <OrbitDot ringRef={desktopRingRefs[i]} speed={speed} cx={0} cy={0} />
          </React.Fragment>
        ))}
      </div>
    </>
  );
};

/* ---------------- Background Wrapper ---------------- */
interface AppBackgroundProps {
  children?: React.ReactNode;
  className?: string;
  innerClassName?: string;
  displayRings?: boolean;
}

export const AppBackground: React.FC<AppBackgroundProps> = ({ 
  children, 
  className, 
  innerClassName,
  displayRings = true 
}) => (
  <div className={`relative bg-[#0d0a09] overflow-hidden ${className ?? 'h-full'}`}>
    <div className="pointer-events-none absolute rounded-full" style={{ width: 169, height: 220, top: -108, right: -92, background: '#FF7700', filter: 'blur(180px)', mixBlendMode: 'color-dodge' }} />
    <div className="pointer-events-none absolute rounded-full" style={{ width: 220, height: 220, bottom: -110, left: -110, background: '#3E2AB5', filter: 'blur(354px)', mixBlendMode: 'color-dodge' }} />
    {displayRings && <FadingRings />}
    {/* High-priority eager LCP image tag for immediate browser HTML preloader discovery */}
    <img
      src={background}
      alt=""
      className="absolute opacity-0 pointer-events-none w-px h-px"
      aria-hidden="true"
      fetchPriority="high"
      loading="eager"
    />
    <div className="absolute inset-0 mix-blend-overlay pointer-events-none" style={{ backgroundImage: `url(${background})`, backgroundRepeat: 'repeat', backgroundSize: '300px 300px' }} />
    {children && (
      <div className={cn("relative z-10 h-full overflow-y-auto", innerClassName)}>
        {children}
      </div>
    )}
  </div>
);