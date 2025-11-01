const { useEffect, useRef, useState } = React;

// Gradient colors that transition as you scroll
const GRADIENT_COLORS = [
  { from: '#1a0033', via: '#330066', to: '#4d0099' }, // Start with purple (not black)
  { from: '#330066', via: '#4d0099', to: '#6600cc' }, // Purple
  { from: '#4d0099', via: '#0066cc', to: '#0099ff' }, // Purple to blue
  { from: '#0066cc', via: '#00ccff', to: '#66ffff' }, // Blue to cyan
  { from: '#00ccff', via: '#0099cc', to: '#006699' }, // Cyan to dark blue
  { from: '#006699', via: '#003366', to: '#000033' }, // Dark blue to black
];

function ParallaxGradient() {
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
    handleScroll(); // Initial call
    updateMaxScroll();

    // Update after a short delay to ensure content is rendered
    const timeout = setTimeout(updateMaxScroll, 100);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateMaxScroll);
      clearTimeout(timeout);
    };
  }, []);

  // Calculate which gradient to use based on scroll position
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
        transition: 'background 0.1s ease-out',
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

      {/* Content sections to enable scrolling */}
      <div ref={contentRef} className="relative z-10">
        {Array.from({ length: 10 }, (_, i) => (
          <section
            key={i}
            className="min-h-screen flex items-center justify-center"
            style={{
              padding: '4rem 2rem',
            }}
          >
            <div className="text-center text-white/90 max-w-4xl">
              <h2 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-lg">
                Section {i + 1}
              </h2>
              <p className="text-lg md:text-xl opacity-80">
                Scroll down to see the gradient colors transition smoothly
              </p>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<ParallaxGradient />);
