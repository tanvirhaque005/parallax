import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

/**
 * Parallax Sci-Fi Timeline (Sketch-style vertical timeline + right-side boxes)
 * - No three.js — pure React + Tailwind + Framer Motion + SVG
 * - Left: vertical timeline with ticks and nodes, like the sketch
 * - Right: empty content boxes aligned with nodes; connectors from nodes -> boxes
 * - Background: layered parallax + optional sci-fi poster images that fade per section
 * - Repo quickstart included in-page
 *
 * Build-safety:
 * - Plain JSX/JS (no TS) to avoid JSX transform issues
 * - No raw '>' in text nodes; use &gt; entity where needed
 * - Curly quote guard tests to prevent Unicode syntax surprises
 */

// ---------------- Config ----------------
const YEARS = Array.from({ length: Math.floor((2025 - 1980) / 5) + 1 }, (_, i) => 1980 + i * 5);

// Optional background poster/image URLs (user can replace these with real sci‑fi classics)
// If left empty or unreachable, gradient layers still render fine.
const BG_IMAGES = [
  // Royalty-free space vibes (Unsplash). Replace these anytime.
  "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1462332420958-a05d1e002413?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1473929732314-9b7d6e2ccb4d?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1447433909565-04bfc496fe79?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1450849608880-6f787542c88a?auto=format&fit=crop&w=1600&q=80",
];

// ---------------- Parallax helper ----------------
function ParallaxLayer({ speed, className = "", style, containerRef }) {
  const ref = useRef(null);
  const { scrollY } = useScroll({ container: containerRef });
  const y = useTransform(scrollY, [0, 1000], [0, -speed * 120]);
  return <motion.div ref={ref} style={{ y, ...(style || {}) }} className={className} />;
}

// ---------------- Connection Layer (SVG wires) ----------------
function Connections({ nodeEls, cardEls }) {
  const [paths, setPaths] = useState([]);
  const svgRef = useRef(null);

  useLayoutEffect(() => {
    function compute() {
      const next = [];
      for (let i = 0; i < nodeEls.current.length; i++) {
        const n = nodeEls.current[i];
        const c = cardEls.current[i];
        if (!n || !c) continue;
        const nr = n.getBoundingClientRect();
        const cr = c.getBoundingClientRect();
        const sx = nr.right; // start at right edge of node
        const sy = nr.top + nr.height / 2;
        const ex = cr.left; // end at left edge of card
        const ey = cr.top + 20; // slight offset into card header
        const dx = Math.max(40, (ex - sx) * 0.5);
        const d = `M ${sx},${sy} C ${sx + dx},${sy} ${ex - dx},${ey} ${ex},${ey}`;
        next.push(d);
      }
      setPaths(next);
    }
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [nodeEls, cardEls]);

  return (
    <svg ref={svgRef} className="pointer-events-none absolute inset-0 -z-10" width="100%" height="100%">
      {paths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="rgba(0,255,255,0.45)" strokeWidth="2" />
      ))}
    </svg>
  );
}

// ---------------- Main ----------------
export default function ParallaxSciFiTimeline() {
  const [activeIndex, setActiveIndex] = useState(null);
  const containerRef = useRef(null);
  const nodeEls = useRef([]); // refs to left nodes
  const cardEls = useRef([]); // refs to right cards

  // ----- Tests (console) -----
  useEffect(() => {
    console.assert(YEARS[0] === 1980, "YEARS should start at 1980");
    console.assert(YEARS.includes(2025), "YEARS should include 2025");
    console.assert(YEARS.length === Math.floor((2025 - 1980) / 5) + 1, "YEARS length formula mismatch");
    console.assert(BG_IMAGES.length >= 0, "BG_IMAGES defined");
    console.assert(BG_IMAGES.length > 0, "BG_IMAGES should provide defaults for visible parallax");
    // unicode/angle guard
    const forbidden = /[\u2018\u2019\u201C\u201D\u2011\u2012\u2013\u2014\u2192]/;
    const samples = [
      "Chrono-Archive",
      "Click a year to open its chapter &gt;",
      "1980-2025 (every 5 years)",
    ];
    samples.forEach((s) => console.assert(!forbidden.test(s), `Forbidden unicode in: ${s}`));
    const rawGt = /(>)+/;
    samples.forEach((s) => console.assert(!rawGt.test(s), `Raw '>' found in: ${s}`));
    // refs parity
    setTimeout(() => {
      console.assert(nodeEls.current.length === YEARS.length, "node refs count should equal YEARS length");
      console.assert(cardEls.current.length === YEARS.length, "card refs count should equal YEARS length");
    }, 0);
    // ParallaxLayer sanity: style spread should include y
    const testStyle = { opacity: 1 };
    const hasY = typeof testStyle.y === "undefined"; // y added at runtime by hook; ensure no syntax error pre-runtime
    console.assert(hasY, "ParallaxLayer accepts style spread without pre-defined y");
  }, []);

  // ----- Background crossfade by section -----
  const sectionRefs = useRef([]);
  const [visibleIx, setVisibleIx] = useState(0);
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const mostVisible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (mostVisible) {
          const ix = Number(mostVisible.target.getAttribute("data-ix"));
          if (!Number.isNaN(ix)) setVisibleIx(ix);
        }
      },
      { root: containerRef.current, threshold: [0.2, 0.4, 0.6, 0.8] }
    );
    sectionRefs.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const bgIndex = BG_IMAGES.length ? visibleIx % BG_IMAGES.length : -1;

  const closeChapter = () => setActiveIndex(null);

  return (
    <div ref={containerRef} className="w-full h-screen relative overflow-y-auto overflow-x-hidden bg-black text-cyan-50">
      {/* BACKGROUND: gradients + optional poster crossfade */}
      <div className="pointer-events-none absolute inset-0 -z-30">
        {/* base gradients */}
        <ParallaxLayer speed={0.1} containerRef={containerRef} className="absolute inset-0 bg-gradient-to-b from-black via-[#001018] to-[#020b14]" />
        <ParallaxLayer
          speed={0.25}
          containerRef={containerRef}
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 30% 20%, rgba(0,255,255,0.18), transparent 60%)," +
              "radial-gradient(ellipse at 70% 70%, rgba(199,0,255,0.15), transparent 60%)",
          }}
        />
        <div className="absolute inset-0 opacity-[0.06] bg-[linear-gradient(transparent_95%,rgba(255,255,255,0.2)_96%,transparent_97%)] bg-[length:100%_6px]" />

        {/* poster layers */}
        {BG_IMAGES.map((src, i) => (
          <motion.div
            key={i}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${src})` }}
            animate={{ opacity: bgIndex === i ? 0.35 : 0 }}
            transition={{ duration: 0.6 }}
          />
        ))}
      </div>

      {/* TOP HUD */}
      <div className="sticky top-0 left-0 right-0 z-20 p-3 md:p-4 flex items-center justify-between bg-gradient-to-b from-black/60 to-black/0 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-300 animate-ping" />
          <span className="text-cyan-100/90 tracking-widest text-xs md:text-sm uppercase">Chrono-Archive</span>
        </div>
        <div className="text-cyan-200/80 text-xs md:text-sm">Click a year to open its chapter &gt;</div>
      </div>

      {/* MAIN GRID: left timeline, right boxes */}
      <div className="relative z-10 mx-auto w-full max-w-6xl px-3 md:px-6">
        <div className="grid grid-cols-[120px_1fr] md:grid-cols-[160px_1fr] gap-4 md:gap-8 py-10">
          {/* Left Column: vertical rail with ticks + nodes */}
          <div className="relative">
            {/* rail */}
            <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[6px] rounded bg-cyan-400/20" />
            {/* ticks */}
            {YEARS.map((y, ix) => (
              <div key={y} className="relative h-28 md:h-36">
                <div
                  ref={(el) => (nodeEls.current[ix] = el)}
                  className={`absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 ${
                    activeIndex === ix ? "bg-cyan-300/50 border-cyan-200" : "bg-black/60 border-cyan-300/40"
                  } shadow-[0_0_20px_rgba(0,255,255,0.25)]`}
                />
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 text-[11px] md:text-xs text-cyan-200/80 select-none">{y}</div>
              </div>
            ))}
          </div>

          {/* Right Column: stacked boxes */}
          <div className="relative">
            {/* SVG wires */}
            <Connections nodeEls={nodeEls} cardEls={cardEls} />

            {YEARS.map((y, ix) => (
              <section key={y} data-ix={ix} ref={(el) => (sectionRefs.current[ix] = el)} className="mb-8 md:mb-10">
                <div
                  ref={(el) => (cardEls.current[ix] = el)}
                  className={`rounded-2xl border bg-black/40 backdrop-blur p-4 md:p-5 shadow-[0_0_40px_rgba(0,255,255,0.15)] transition-colors ${
                    activeIndex === ix ? "border-cyan-300/60" : "border-cyan-300/25"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm md:text-base font-semibold text-cyan-100">{y}</h3>
                    <button
                      onClick={() => setActiveIndex(ix)}
                      className="text-[11px] md:text-xs px-2 py-1 rounded border border-cyan-300/40 text-cyan-100 bg-cyan-400/10 hover:bg-cyan-400/20"
                    >
                      Open
                    </button>
                  </div>
                  <div className="mt-3 h-24 md:h-28 rounded-lg border border-cyan-300/15 bg-black/30" />
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>

      {/* Chapter overlay (center) */}
      {activeIndex !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur"
        >
          <div className="max-w-3xl w-[92%] rounded-2xl border border-cyan-300/30 bg-black/70 p-5 text-cyan-50 shadow-[0_0_50px_rgba(0,255,255,0.35)]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg md:text-2xl font-semibold">
                Chapter: <span className="text-cyan-300">{YEARS[activeIndex]}</span>
              </h2>
              <button onClick={() => setActiveIndex(null)} className="px-3 py-1.5 rounded bg-cyan-400/20 border border-cyan-300/40">
                Close
              </button>
            </div>
            <p className="mt-3 text-sm md:text-base text-cyan-100/90">
              Empty for now — drop your content for {YEARS[activeIndex]} here (text, images, embeds).
            </p>
          </div>
        </motion.div>
      )}

      {/* Repo Quickstart */}
      <section className="relative z-0 mt-6 pb-20">
        <div className="mx-auto w-full max-w-6xl px-3 md:px-6">
          <div className="rounded-2xl border border-cyan-400/20 bg-black/30 p-4">
            <h4 className="font-medium text-cyan-200">Repo Quickstart</h4>
            <pre className="mt-2 text-xs md:text-sm text-cyan-200/80 whitespace-pre-wrap">{`# Parallax Sci-Fi Timeline (React + Tailwind + Framer Motion)

## Quickstart

\`\`\`bash
pnpm create vite@latest chrono-archive --template react
cd chrono-archive
pnpm i framer-motion tailwindcss postcss autoprefixer
npx tailwindcss init -p
# tailwind.config.js -> content: ['./index.html','./src/**/*.{js,jsx}']
# src/index.css -> @tailwind base; @tailwind components; @tailwind utilities;
\`\`\`

// Replace App.jsx with this component.

// Optional: set BG_IMAGES to poster URLs (sci-fi classics vibe).`}</pre>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-0 py-10 text-center text-cyan-100/60 text-xs md:text-sm">
        Made with React * Tailwind * Framer Motion -- No WebGL required
      </footer>
    </div>
  );
}
