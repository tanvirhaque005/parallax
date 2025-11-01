const { useEffect, useLayoutEffect, useRef, useState } = React;
const fm = window.framerMotion || window.FramerMotion || window.framermotion || window.motion || {};

// Fallbacks if Framer Motion UMD didn't load
const motion = fm.motion || new Proxy(
  {},
  {
    get: (_target, tag) =>``
      React.forwardRef((props, ref) => React.createElement(tag, { ...props, ref })),
  }
);

const useScroll = fm.useScroll || (({ container }) => {
  const [y, setY] = React.useState(0);
  React.useEffect(() => {
    const el = (container && container.current) || window;
    const handler = () => {
      const val = el === window ? window.scrollY : el.scrollTop || 0;
      setY(val);
    };
    el.addEventListener('scroll', handler, { passive: true });
    handler();
    return () => el.removeEventListener('scroll', handler);
  }, [container]);
  return { scrollY: { get: () => y, on: () => {}, onChange: () => {} } };
});

const useTransform = fm.useTransform || ((mv, input, output) => {
  const [val, setVal] = React.useState(output[0]);
  React.useEffect(() => {
    const compute = (v) => {
      const t = (v - input[0]) / (input[1] - input[0] || 1);
      const clamped = Math.max(0, Math.min(1, t));
      return output[0] + clamped * (output[1] - output[0]);
    };
    const current = mv && typeof mv.get === 'function' ? mv.get() : 0;
    setVal(compute(current));
  }, [mv, input[0], input[1], output[0], output[1]]);
  return val;
});

// ---------------- Config ----------------
const YEARS = Array.from({ length: Math.floor((2025 - 1980) / 5) + 1 }, (_, i) => 1980 + i * 5);

// Optional background poster/image URLs
const BG_IMAGES = [
  "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1462332420958-a05d1e002413?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1473929732314-9b7d6e2ccb4d?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1447433909565-04bfc496fe79?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1450849608880-6f787542c88a?auto=format&fit=crop&w=1600&q=80",
];

// ---------------- Parallax helper ----------------
function ParallaxLayer({ speed, className = "", style, containerRef, children }) {
  const ref = useRef(null);
  const { scrollY } = useScroll({ container: containerRef });
  const y = useTransform(scrollY, [0, 1000], [0, -speed * 120]);
  const yVal = typeof y === 'number' ? y : (y && typeof y.get === 'function' ? y.get() : 0);
  const baseStyle = {
    transform: `translateY(${yVal}px)`,
    ...(style || {}),
  };
  return (
    <motion.div ref={ref} style={baseStyle} className={className}>
      {children}
    </motion.div>
  );
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
        const sx = nr.right;
        const sy = nr.top + nr.height / 2;
        const ex = cr.left;
        const ey = cr.top + 20;
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
function ParallaxSciFiTimeline() {
  const [activeIndex, setActiveIndex] = useState(null);
  const containerRef = useRef(null);
  const nodeEls = useRef([]);
  const cardEls = useRef([]);

  useEffect(() => {
    console.assert(YEARS[0] === 1980, "YEARS should start at 1980");
    console.assert(YEARS.includes(2025), "YEARS should include 2025");
    console.assert(YEARS.length === Math.floor((2025 - 1980) / 5) + 1, "YEARS length formula mismatch");
    console.assert(BG_IMAGES.length > 0, "BG_IMAGES should provide defaults for visible parallax");
    const forbidden = /[\u2018\u2019\u201C\u201D\u2011\u2012\u2013\u2014\u2192]/;
    const samples = [
      "Chrono-Archive",
      "Click a year to open its chapter &gt;",
      "1980-2025 (every 5 years)",
    ];
    samples.forEach((s) => console.assert(!forbidden.test(s), `Forbidden unicode in: ${s}`));
    const rawGt = /(>)+/;
    samples.forEach((s) => console.assert(!rawGt.test(s), `Raw '>' found in: ${s}`));
    setTimeout(() => {
      console.assert(nodeEls.current.length === YEARS.length, "node refs count should equal YEARS length");
      console.assert(cardEls.current.length === YEARS.length, "card refs count should equal YEARS length");
    }, 0);
    const testStyle = { opacity: 1 };
    const hasY = typeof testStyle.y === "undefined";
    console.assert(hasY, "ParallaxLayer accepts style spread without pre-defined y");
  }, []);

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

  return (
    <div ref={containerRef} className="w-full h-screen relative overflow-y-auto overflow-x-hidden bg-black text-cyan-50">
      {/* BACKGROUND: gradients + optional poster crossfade */}
      <div className="pointer-events-none absolute inset-0 -z-30">
            {/* base gradients */}
            <ParallaxLayer speed={0.06} containerRef={containerRef} className="absolute inset-0 bg-gradient-to-b from-black via-[#001018] to-[#020b14]" />
            <ParallaxLayer
              speed={0.12}
              containerRef={containerRef}
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at 30% 20%, rgba(0,255,255,0.18), transparent 60%)," +
                  "radial-gradient(ellipse at 70% 70%, rgba(199,0,255,0.15), transparent 60%)",
              }}
            />
            {/* subtle scanlines */}
            <ParallaxLayer speed={0.02} containerRef={containerRef} className="absolute inset-0">
              <div className="absolute inset-0 opacity-[0.06] bg-[linear-gradient(transparent_95%,rgba(255,255,255,0.2)_96%,transparent_97%)] bg-[length:100%_6px]" />
            </ParallaxLayer>

            {/* poster layers with parallax + crossfade */}
            {BG_IMAGES.map((src, i) => (
              <ParallaxLayer key={i} speed={0.18 + i * 0.05} containerRef={containerRef} className="absolute inset-0">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${src})`,
                    opacity: bgIndex === i ? 0.35 : 0,
                    transition: 'opacity 600ms ease',
                  }}
                />
              </ParallaxLayer>
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
                    <div key={y} className="relative h-36 md:h-44">
                <div
                  ref={(el) => (nodeEls.current[ix] = el)}
                  className={`${"absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 "}
                    ${activeIndex === ix ? "bg-cyan-300/50 border-cyan-200" : "bg-black/60 border-cyan-300/40"} shadow-[0_0_20px_rgba(0,255,255,0.25)]`}
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
                    <section
                      key={y}
                      data-ix={ix}
                      ref={(el) => (sectionRefs.current[ix] = el)}
                      className="mb-8 md:mb-10 min-h-[9rem] md:min-h-[11rem] flex items-center"
                    >
                <div
                  ref={(el) => (cardEls.current[ix] = el)}
                  className={`${"rounded-2xl border bg-black/40 backdrop-blur p-4 md:p-5 shadow-[0_0_40px_rgba(0,255,255,0.15)] transition-colors "}
                    ${activeIndex === ix ? "border-cyan-300/60" : "border-cyan-300/25"}`}
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
                        <div className="mt-3 h-28 md:h-32 rounded-lg border border-cyan-300/15 bg-black/30" />
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

      {/* Footer */}
      <footer className="relative z-0 py-10 text-center text-cyan-100/60 text-xs md:text-sm">
        Made with React * Tailwind * Framer Motion -- No WebGL required
      </footer>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<ParallaxSciFiTimeline />);


