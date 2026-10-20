import { cn } from "@/lib/utils";

/** Hue from green (0) through yellow and orange to red (10). */
const hue = (skor: number) => 135 - 13.5 * skor;

/**
 * A pain face for any 0–10 score, in the spirit of the Wong-Baker FACES scale
 * but with a face for every score: the smile turns into a frown, the brows
 * worry from 4, the eyes squeeze shut from 8 and tears come at 9–10, while
 * the colour runs from green to red. Drawn, not emoji, so it looks the same
 * on every phone.
 */
export function MukaKesakitan({
  skor,
  className,
}: {
  skor: number;
  className?: string;
}) {
  const s = Math.min(10, Math.max(0, Math.round(skor)));
  const h = hue(s);
  const ink = `hsl(${h}, 45%, 24%)`;
  // Mouth: the control point sits below the corners for a smile, above for a frown.
  const lengkung = 9 - 1.6 * s;
  const mulutY = lengkung < 0 ? 33 : 31;
  // How far the inner ends of the brows rise.
  const kening = s >= 4 ? 1 + ((s - 3) / 7) * 4 : 0;
  const mata = s >= 6 ? 2.3 : 2.7;

  return (
    <svg
      viewBox="0 0 48 48"
      className={cn("h-8 w-8", className)}
      aria-hidden="true"
    >
      <circle
        cx="24"
        cy="24"
        r="21.5"
        fill={`hsl(${h}, 85%, 80%)`}
        stroke={`hsl(${h}, 50%, 42%)`}
        strokeWidth="1.5"
      />
      {kening > 0 && (
        <g stroke={ink} strokeWidth="2" strokeLinecap="round" fill="none">
          <path d={`M12 15.5 L20 ${15.5 - kening}`} />
          <path d={`M36 15.5 L28 ${15.5 - kening}`} />
        </g>
      )}
      {s >= 8 ? (
        <g
          stroke={ink}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        >
          <path d="M14 18 L19 20.5 L14 23" />
          <path d="M34 18 L29 20.5 L34 23" />
        </g>
      ) : (
        <g fill={ink}>
          <circle cx="17" cy="20.5" r={mata} />
          <circle cx="31" cy="20.5" r={mata} />
        </g>
      )}
      {s >= 9 && (
        <g fill="hsl(212, 90%, 66%)">
          <path d="M15.5 25 q -2.2 3.6 0 5.2 q 2.2 -1.6 0 -5.2 z" />
          <path d="M32.5 25 q -2.2 3.6 0 5.2 q 2.2 -1.6 0 -5.2 z" />
        </g>
      )}
      {s === 10 ? (
        <path d="M15 36 Q24 25 33 36 Q24 33 15 36 z" fill={ink} />
      ) : (
        <path
          d={`M15 ${mulutY} Q24 ${mulutY + lengkung} 33 ${mulutY}`}
          stroke={ink}
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />
      )}
    </svg>
  );
}
