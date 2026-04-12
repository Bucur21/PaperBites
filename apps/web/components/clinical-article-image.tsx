import type { ReactNode } from "react";
import { getArticleVisualTheme, type VisualMotif } from "../lib/article-visual-theme";
import type { TopicId } from "@research-feed/shared";

/** Stable string for SVG coords — avoids SSR/client hydration drift from float `Math.sin` differences. */
function svgCoord(n: number): string {
  return (Math.round(n * 10000) / 10000).toFixed(4);
}

function MotifLayer({
  motif,
  safeId,
  hueA,
  hueB,
  accentHue
}: {
  motif: VisualMotif;
  safeId: string;
  hueA: number;
  hueB: number;
  accentHue: number;
}) {
  const strokeA = `hsla(${hueA}, 40%, 42%, 0.22)`;
  const strokeB = `hsla(${hueB}, 45%, 48%, 0.2)`;
  const fillSoft = `hsla(${accentHue}, 55%, 70%, 0.1)`;

  switch (motif) {
    case "waveform": {
      const points: string[] = [];
      for (let x = 0; x <= 100; x += 2) {
        const y = 48 + Math.sin(x / 6 + hueA * 0.02) * 12 + Math.sin(x / 3) * 3;
        points.push(`${svgCoord(x)},${svgCoord(y)}`);
      }
      const [first, ...rest] = points;
      const d = rest.length ? `M ${first} L ${rest.join(" L ")}` : `M ${first}`;
      return (
        <path
          d={d}
          fill="none"
          stroke={strokeA}
          strokeWidth="1.2"
          vectorEffect="non-scaling-stroke"
        />
      );
    }
    case "network": {
      const nodes = [
        [20, 30],
        [45, 55],
        [72, 28],
        [82, 62],
        [35, 72]
      ];
      return (
        <g>
          {[
            [0, 1],
            [1, 2],
            [1, 3],
            [2, 3],
            [1, 4]
          ].map(([a, b], i) => (
            <line
              key={`e-${i}`}
              x1={nodes[a][0]}
              y1={nodes[a][1]}
              x2={nodes[b][0]}
              y2={nodes[b][1]}
              stroke={strokeB}
              strokeWidth="0.8"
            />
          ))}
          {nodes.map((n, i) => (
            <circle key={`n-${i}`} cx={n[0]} cy={n[1]} r="3.2" fill={fillSoft} stroke={strokeA} strokeWidth="0.6" />
          ))}
        </g>
      );
    }
    case "motion": {
      return (
        <path
          d="M 8 68 Q 28 20, 52 52 T 92 38"
          fill="none"
          stroke={strokeA}
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      );
    }
    case "pulse": {
      return (
        <g>
          <ellipse cx="50" cy="50" rx="36" ry="22" fill="none" stroke={strokeB} strokeWidth="0.9" />
          <ellipse cx="50" cy="50" rx="26" ry="14" fill="none" stroke={strokeA} strokeWidth="0.9" />
        </g>
      );
    }
    case "grid": {
      const dots: ReactNode[] = [];
      for (let x = 12; x <= 88; x += 10) {
        for (let y = 18; y <= 82; y += 10) {
          const jitter = ((x + y + safeId.length) % 5) / 10;
          dots.push(
            <circle
              key={`${x}-${y}`}
              cx={svgCoord(x + jitter)}
              cy={svgCoord(y - jitter)}
              r="1.1"
              fill={strokeA}
              opacity={0.35}
            />
          );
        }
      }
      return <g>{dots}</g>;
    }
    case "spectrum":
    default: {
      const bars = [12, 22, 35, 28, 48, 40, 55, 32, 20];
      return (
        <g>
          {bars.map((h, i) => (
            <rect
              key={i}
              x={10 + i * 9}
              y={78 - h}
              width="5"
              height={h}
              rx="1"
              fill={`hsla(${hueA + i * 2}, 50%, 55%, 0.25)`}
            />
          ))}
        </g>
      );
    }
  }
}

type ClinicalArticleImageProps = {
  seed: string;
  topicIds: TopicId[];
  title: string;
  summary?: string;
};

/**
 * Topic-aware abstract art: motif + palette come from primary topic + title/summary keywords.
 * Stays non-diagnostic (no anatomy, no scans) — editorial / clinical-journal style.
 */
export function ClinicalArticleImage({ seed, topicIds, title, summary }: ClinicalArticleImageProps) {
  const theme = getArticleVisualTheme({ seed, topicIds, title, summary });
  const { motif, caption, safeId, hueA, hueB, hueC, accentHue } = theme;

  const c1 = `hsl(${hueA} 78% 93%)`;
  const c2 = `hsl(${hueB} 65% 88%)`;
  const c3 = `hsl(${hueC} 55% 96%)`;

  return (
    <div
      className="relative aspect-video w-full overflow-hidden rounded-sm border border-amber-200/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
      style={{
        background: `linear-gradient(128deg, ${c1} 0%, ${c2} 42%, ${c3} 100%)`
      }}
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern id={`grid-${safeId}`} width="8" height="8" patternUnits="userSpaceOnUse">
            <path
              d="M 8 0 L 0 0 0 8"
              fill="none"
              stroke={`hsla(${hueA}, 35%, 45%, 0.07)`}
              strokeWidth="0.35"
            />
          </pattern>
        </defs>
        <rect width="100" height="100" fill={`url(#grid-${safeId})`} />
        <circle cx="78" cy="22" r="16" fill={`hsla(${hueB}, 60%, 70%, 0.1)`} />
        <circle cx="18" cy="72" r="20" fill={`hsla(${accentHue}, 45%, 72%, 0.08)`} />
        <g opacity="0.95">
          <MotifLayer motif={motif} safeId={safeId} hueA={hueA} hueB={hueB} accentHue={accentHue} />
        </g>
      </svg>
      <div className="pointer-events-none absolute bottom-2 left-3 right-3 border-t border-amber-900/10 pt-2 text-[9px] font-semibold uppercase leading-tight tracking-[0.2em] text-amber-900/40">
        {caption}
      </div>
    </div>
  );
}
