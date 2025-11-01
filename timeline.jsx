const { useEffect, useRef, useState } = React;

// Years from 1960 to 2020 (5-year intervals)
const YEARS = Array.from({ length: Math.floor((2020 - 1960) / 5) + 1 }, (_, i) => 1960 + i * 5);

// Gradient colors that transition as you scroll through timeline
// Each gradient represents a different era
const GRADIENT_COLORS = [
  { from: '#1a0033', via: '#330066', to: '#4d0099' }, // 1960s - Deep purple
  { from: '#4d0099', via: '#6600cc', to: '#8000ff' }, // 1965-1970 - Bright purple
  { from: '#6600cc', via: '#0066cc', to: '#0099ff' }, // 1970-1975 - Purple to blue
  { from: '#0066cc', via: '#00ccff', to: '#66ffff' }, // 1975-1980 - Blue to cyan
  { from: '#00ccff', via: '#00ffcc', to: '#00ff99' }, // 1980-1985 - Cyan to green
  { from: '#00ff99', via: '#66ff66', to: '#99ff66' }, // 1985-1990 - Green to yellow-green
  { from: '#99ff66', via: '#ffcc00', to: '#ff9900' }, // 1990-1995 - Yellow to orange
  { from: '#ff9900', via: '#ff6600', to: '#ff3300' }, // 1995-2000 - Orange to red
  { from: '#ff3300', via: '#cc0066', to: '#990099' }, // 2000-2005 - Red to magenta
  { from: '#990099', via: '#6600cc', to: '#3300cc' }, // 2005-2010 - Magenta to purple
  { from: '#3300cc', via: '#0066ff', to: '#0099ff' }, // 2010-2015 - Purple to blue
  { from: '#0099ff', via: '#00ccff', to: '#33ffff' }, // 2015-2020 - Cyan
  { from: '#33ffff', via: '#00cc99', to: '#009966' }, // 2020 - Final teal
];

function TimelineParallax() {
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const [scrollY, setScrollY] = useState(0);
  const [maxScroll, setMaxScroll] = useState(10000);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollY(container.scrollTop);
    };

    const updateMaxScroll = () => {
      if (contentRef.current) {
        const height = contentRef.current.scrollHeight - window.innerHeight;
        setMaxScroll(Math.max(height, 1000));
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateMaxScroll);
    handleScroll();
    updateMaxScroll();

    const timeout = setTimeout(updateMaxScroll, 100);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateMaxScroll);
      clearTimeout(timeout);
    };
  }, []);

  // Calculate gradient based on scroll position
  const scrollProgress = Math.max(0, Math.min(scrollY / maxScroll, 1));
  const normalizedProgress = scrollProgress * (GRADIENT_COLORS.length - 1);
  const gradientIndex = Math.min(Math.floor(normalizedProgress), GRADIENT_COLORS.length - 1);
  const nextGradientIndex = Math.min(gradientIndex + 1, GRADIENT_COLORS.length - 1);
  const localProgress = normalizedProgress - gradientIndex;

  const currentGradient = GRADIENT_COLORS[gradientIndex];
  const nextGradient = GRADIENT_COLORS[nextGradientIndex];

  // Interpolate between current and next gradient
  const interpolateColor = (color1, color2, t) => {
    const hex1 = color1.replace('#', '');
    const hex2 = color2.replace('#', '');
    const r1 = parseInt(hex1.substr(0, 2), 16);
    const g1 = parseInt(hex1.substr(2, 2), 16);
    const b1 = parseInt(hex1.substr(4, 2), 16);
    const r2 = parseInt(hex2.substr(0, 2), 16);
    const g2 = parseInt(hex2.substr(2, 2), 16);
    const b2 = parseInt(hex2.substr(4, 2), 16);
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  const fromColor = interpolateColor(currentGradient.from, nextGradient.from, localProgress);
  const viaColor = interpolateColor(currentGradient.via, nextGradient.via, localProgress);
  const toColor = interpolateColor(currentGradient.to, nextGradient.to, localProgress);

  // Parallax layers moving at different speeds
  const parallaxLayers = [
    { speed: 0.3, opacity: 0.6 },
    { speed: 0.5, opacity: 0.4 },
    { speed: 0.7, opacity: 0.3 },
  ];

  return (
    <div
      ref={containerRef}
      className="w-full h-screen overflow-y-auto overflow-x-hidden"
      style={{
        background: `linear-gradient(to bottom, ${fromColor}, ${viaColor}, ${toColor})`,
        transition: 'background 0.15s ease-out',
      }}
    >
      {/* Parallax moving layers */}
      {parallaxLayers.map((layer, i) => (
        <div
          key={i}
          className="fixed inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at ${30 + i * 20}% ${20 + i * 15}%, rgba(255,255,255,${layer.opacity * 0.1}), transparent 70%)`,
            transform: `translateY(${scrollY * layer.speed}px)`,
            transition: 'transform 0.1s linear',
          }}
        />
      ))}

      {/* Main Content */}
      <div ref={contentRef} className="relative z-10">
        <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
          {/* Grid: Left Timeline, Right Boxes */}
          <div className="grid grid-cols-[140px_1fr] md:grid-cols-[180px_1fr] gap-6 md:gap-10 py-12">
            {/* Left Column: Vertical Timeline */}
            <div className="relative">
              {/* Timeline rail */}
              <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[4px] rounded bg-white/30" />
              
              {/* Year markers */}
              {YEARS.map((year, index) => (
                <div key={year} className="relative min-h-[8rem] md:min-h-[10rem] flex items-center mb-8 md:mb-10 last:mb-0">
                  {/* Node */}
                  <div
                    className="absolute left-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 border-white/60 bg-white/20 shadow-[0_0_15px_rgba(255,255,255,0.4)] z-10"
                  />
                  {/* Year label */}
                  <div className="absolute -left-4 md:-left-6 top-1/2 -translate-y-1/2 text-white/90 text-xs md:text-sm font-medium select-none whitespace-nowrap">
                    {year}
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column: Content Boxes */}
            <div className="relative">
              {YEARS.map((year, index) => (
                <section
                  key={year}
                  className="min-h-[8rem] md:min-h-[10rem] flex items-center mb-8 md:mb-10 last:mb-0"
                >
                  <div className="w-full rounded-xl border-2 border-white/30 bg-white/10 backdrop-blur-sm p-5 md:p-6 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg md:text-2xl font-bold text-white drop-shadow-lg">
                        {year}
                      </h3>
                    </div>
                    <div className="h-24 md:h-32 rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm">
                      <div className="flex items-center justify-center h-full text-white/50 text-sm">
                        Content placeholder for {year}
                      </div>
                    </div>
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>

        {/* Footer spacing */}
        <div className="h-20" />
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<TimelineParallax />);
