import { useRef, useState, useCallback } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

/* ──────────────────────────────────────────────────────────────────
   5×7 dot-matrix pixel font
────────────────────────────────────────────────────────────────────*/
const GLYPHS: Record<string, number[][]> = {
  A: [
    [0,0,1,0,0],
    [0,1,0,1,0],
    [1,0,0,0,1],
    [1,1,1,1,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
  ],
  P: [
    [1,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,1,1,1,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
  ],
  E: [
    [1,1,1,1,1],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,1,1,1,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,1,1,1,1],
  ],
  X: [
    [1,0,0,0,1],
    [1,0,0,0,1],
    [0,1,0,1,0],
    [0,0,1,0,0],
    [0,1,0,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
  ],
};

const WORD = ["A", "P", "E", "X"];
const GAP_COLS = 2;
const DOT_STEP = 22;   // px between dot centres (size + gap)
const DOT_BASE = 12;   // base dot diameter px
const HOVER_RADIUS = 110; // px — how far the hover ripple reaches

function buildGrid() {
  const rows: Array<Array<{ filled: boolean; col: number }>> = Array.from({ length: 7 }, () => []);
  let colIdx = 0;
  WORD.forEach((letter, li) => {
    const glyph = GLYPHS[letter];
    glyph.forEach((row, ri) => {
      row.forEach((cell) => {
        rows[ri].push({ filled: cell === 1, col: colIdx++ });
      });
      if (li < WORD.length - 1) {
        for (let g = 0; g < GAP_COLS; g++) {
          rows[ri].push({ filled: false, col: colIdx++ });
        }
      }
      colIdx = rows[ri].length; // keep col in sync across rows
    });
  });
  // Fix: col should be global X position, not per-row. Let's redo:
  return null;
}

// Flat list of all dots with grid position
interface Dot {
  row: number;
  col: number;
  filled: boolean;
}

function buildDots(): Dot[] {
  const dots: Dot[] = [];
  let globalCol = 0;

  WORD.forEach((letter, li) => {
    const glyph = GLYPHS[letter];
    // For each column in the glyph
    for (let gc = 0; gc < 5; gc++) {
      for (let row = 0; row < 7; row++) {
        dots.push({ row, col: globalCol + gc, filled: glyph[row][gc] === 1 });
      }
      globalCol++;
    }
    // gap columns between letters
    if (li < WORD.length - 1) {
      for (let g = 0; g < GAP_COLS; g++) {
        for (let row = 0; row < 7; row++) {
          dots.push({ row, col: globalCol, filled: false });
        }
        globalCol++;
      }
    }
    globalCol++; // already advanced by gc loop (0-4), so this is the 5th step - we do NOT need this
  });

  return dots;
}

// Correct builder
function buildDotsCorrect(): Dot[] {
  const dots: Dot[] = [];
  let colCursor = 0;

  WORD.forEach((letter, li) => {
    const glyph = GLYPHS[letter];
    for (let gc = 0; gc < 5; gc++) {
      for (let row = 0; row < 7; row++) {
        dots.push({ row, col: colCursor, filled: glyph[row][gc] === 1 });
      }
      colCursor++;
    }
    if (li < WORD.length - 1) {
      for (let g = 0; g < GAP_COLS; g++) {
        for (let row = 0; row < 7; row++) {
          dots.push({ row, col: colCursor, filled: false });
        }
        colCursor++;
      }
    }
  });

  return dots;
}

const DOTS = buildDotsCorrect();
const TOTAL_COLS = Math.max(...DOTS.map((d) => d.col)) + 1;

/* Base color for each dot: purple → teal gradient left to right */
function baseColor(col: number, filled: boolean) {
  if (!filled) return null;
  const t = col / (TOTAL_COLS - 1);
  const hue  = Math.round(270 - t * 90);
  const light = Math.round(40 + t * 24);
  const alpha = 1 - t * 0.5;
  return { hue, light, alpha };
}

/* ─── Individual animated dot ──────────────────────────────────── */
function Dot({
  dot,
  mouseX,
  mouseY,
  containerRef,
}: {
  dot: Dot;
  mouseX: number | null;
  mouseY: number | null;
  containerRef: React.RefObject<HTMLDivElement>;
}) {
  const dotRef = useRef<HTMLDivElement>(null);

  // Calculate hover influence
  let scale = 1;
  let extraLight = 0;
  let extraAlpha = 0;
  let glowStr = 0;

  if (mouseX !== null && mouseY !== null && dotRef.current && containerRef.current) {
    const rect = dotRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top  + rect.height / 2;
    const dist = Math.sqrt((mouseX - cx) ** 2 + (mouseY - cy) ** 2);
    if (dist < HOVER_RADIUS) {
      const strength = 1 - dist / HOVER_RADIUS; // 1 at center, 0 at edge
      scale      = 1 + strength * (dot.filled ? 1.4 : 0.6);
      extraLight = strength * 30;
      extraAlpha = strength * 0.5;
      glowStr    = strength;
    }
  }

  const base = baseColor(dot.col, dot.filled);

  let bg = "transparent";
  let boxShadow = "none";

  if (base || (mouseX !== null && !dot.filled && scale > 1)) {
    const h = base ? base.hue : Math.round(270 - (dot.col / (TOTAL_COLS - 1)) * 90);
    const l = base ? Math.min(92, base.light + extraLight) : Math.min(88, 60 + extraLight);
    const a = base ? Math.min(1, base.alpha + extraAlpha) : Math.min(0.35, extraAlpha);
    bg = `hsla(${h}, 65%, ${l}%, ${a})`;

    if (glowStr > 0.1) {
      const glowSize = Math.round(DOT_BASE * glowStr * 1.5);
      boxShadow = `0 0 ${glowSize}px hsla(${h}, 80%, ${l}%, ${glowStr * 0.8})`;
    }
  }

  const size = DOT_BASE;

  return (
    <motion.div
      ref={dotRef}
      animate={{ scale, backgroundColor: bg }}
      transition={{ type: "spring", stiffness: 300, damping: 22, mass: 0.4 }}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        margin: (DOT_STEP - size) / 2,
        gridRow:    dot.row + 1,
        gridColumn: dot.col + 1,
        boxShadow,
        backgroundColor: bg,
        willChange: "transform",
      }}
    />
  );
}

/* ─── Main section ───────────────────────────────────────────────── */
export function DotMatrixName() {
  const ref = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null!);
  const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"],
  });

  const scale   = useTransform(scrollYProgress, [0, 1], [0.88, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.35], [0, 1]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMouse({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMouse(null);
  }, []);

  return (
    <div
      ref={ref}
      className="relative overflow-hidden bg-white py-20 select-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Fade edges */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-white to-transparent pointer-events-none z-10" />
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none z-10" />

      {/* Subtle ambient glow that follows the mouse */}
      {mouse && (
        <motion.div
          className="absolute pointer-events-none rounded-full"
          animate={{ left: mouse.x - 150, top: mouse.y - 150 + (ref.current?.getBoundingClientRect().top ?? 0) * -1 }}
          transition={{ type: "spring", stiffness: 200, damping: 30 }}
          style={{
            width: 300, height: 300,
            background: "radial-gradient(circle, rgba(108,76,241,0.12) 0%, transparent 70%)",
            zIndex: 0,
          }}
        />
      )}

      <motion.div
        style={{ scale, opacity }}
        className="flex flex-col items-center relative z-10"
      >
        {/* CSS Grid for dots */}
        <div
          ref={gridRef}
          style={{
            display: "grid",
            gridTemplateRows:    `repeat(7, ${DOT_STEP}px)`,
            gridTemplateColumns: `repeat(${TOTAL_COLS}, ${DOT_STEP}px)`,
          }}
        >
          {DOTS.map((dot, i) => (
            <Dot
              key={i}
              dot={dot}
              mouseX={mouse?.x ?? null}
              mouseY={mouse?.y ?? null}
              containerRef={gridRef}
            />
          ))}
        </div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-[12px] font-bold text-gray-300 tracking-[0.32em] uppercase mt-8"
        >
          One Company Brain · Smarter Decisions
        </motion.p>
      </motion.div>
    </div>
  );
}
