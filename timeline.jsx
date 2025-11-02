const { useEffect, useRef, useState, useMemo } = React;

// Sample film data
const FILMS = [
  { id: 1, title: "2001 A Space Odyssey", year: 1968, depicted: 2001, rating: 8.3, tags: ["AI", "Space"], director: "Stanley Kubrick", location: "Los Angeles, CA, USA", plot: "After discovering a mysterious artifact buried beneath the Lunar surface, humanity sets off on a quest to Saturn with the sentient computer HAL to uncover the artifact's origins." },
  { id: 2, title: "Blade Runner", year: 1982, depicted: 2019, rating: 8.1, tags: ["Dystopia", "AI"], director: "Ridley Scott", location: "Los Angeles, CA, USA", plot: "In a dystopian future, a blade runner must pursue and terminate four replicants who stole a ship in space and returned to Earth to find their creator." },
  { id: 3, title: "Minority Report", year: 2002, depicted: 2054, rating: 7.6, tags: ["Dystopia", "Surveillance Capitalism"], director: "Steven Spielberg", location: "Los Angeles, CA, USA", plot: "In a future where a special police unit can arrest people before they commit their crimes, an officer is accused of a future murder. In 2054, the federal government plans to nationally [See more]." },
  { id: 4, title: "Gattaca", year: 1997, depicted: 2150, rating: 7.8, tags: ["Genetic Engineering", "Dystopia"], director: "Andrew Niccol", location: "Los Angeles, CA, USA", plot: "A genetically inferior man assumes the identity of a superior one in order to pursue his lifelong dream of space travel." },
  { id: 5, title: "Total Recall", year: 1990, depicted: 2084, rating: 7.5, tags: ["Memory", "Mars"], director: "Paul Verhoeven", location: "Los Angeles, CA, USA", plot: "When a man goes in to have virtual vacation memories of the planet Mars implanted in his mind, an unexpected and harrowing series of events forces him to go to the planet for real - or is he?" },
  { id: 6, title: "Metropolis", year: 1927, depicted: 2026, rating: 8.3, tags: ["Robots", "Dystopia"], director: "Fritz Lang", location: "Berlin, Germany", plot: "In a futuristic city sharply divided between the working class and the city planners, the son of the city's mastermind falls in love with a working-class prophet who predicts the coming of a savior to mediate their differences." },
  { id: 7, title: "The Matrix", year: 1999, depicted: 2199, rating: 8.7, tags: ["Virtual Reality", "Free Will"], director: "The Wachowskis", location: "Sydney, Australia", plot: "When a beautiful stranger leads computer hacker Neo to a forbidding underworld, he discovers the shocking truth--the life he knows is the elaborate deception of an evil cyber-intelligence." },
  { id: 8, title: "Ex Machina", year: 2014, depicted: 2030, rating: 7.7, tags: ["AI", "Surveillance"], director: "Alex Garland", location: "London, UK", plot: "A young programmer is selected to participate in a ground-breaking experiment in synthetic intelligence by evaluating the human qualities of a highly advanced humanoid A.I." },
  { id: 9, title: "Her", year: 2013, depicted: 2025, rating: 8.0, tags: ["AI", "Love"], director: "Spike Jonze", location: "Los Angeles, CA, USA", plot: "In a near future, a lonely writer develops an unlikely relationship with an operating system designed to meet his every need." },
  { id: 10, title: "Interstellar", year: 2014, depicted: 2150, rating: 8.6, tags: ["Space", "Time Travel"], director: "Christopher Nolan", location: "Los Angeles, CA, USA", plot: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival." },
];

// Motifs data
const MOTIFS = {
  "Surveillance": {
    movies: 26,
    connections: ["Time Travel", "Total Recall", "Minority Report", "Gattaca", "Blade Runner", "Robots", "AI", "Dystopia", "Privacy", "Family Bonds", "The Matrix", "Ex Machina"]
  },
  "Artificial Intelligence": {
    movies: 32,
    connections: ["Robots", "Free Will", "Blade Runner", "2001", "Ex Machina", "Her", "The Matrix", "Surveillance", "Consciousness"]
  },
  "Free Will": {
    movies: 18,
    connections: ["AI", "Surveillance", "The Matrix", "Minority Report", "Dystopia", "Choice"]
  },
  "Crime": {
    movies: 15,
    connections: ["Surveillance", "Dystopia", "Minority Report", "Blade Runner", "Justice"]
  }
};

// Navigation state
function App() {
  const [currentSection, setCurrentSection] = useState('library'); // library, film, motif, fiction, reimagine, conclusion
  const [selectedFilm, setSelectedFilm] = useState(null);
  const [selectedMotif, setSelectedMotif] = useState(null);
  const [breadcrumb, setBreadcrumb] = useState(['Library']);

  // Browser history management
  useEffect(() => {
    // Initialize history state
    if (!window.history.state) {
      window.history.replaceState({ section: 'library', filmId: null, motif: null }, '', '/');
    }

    // Listen for browser back/forward buttons
    const handlePopState = (e) => {
      const state = e.state || { section: 'library', filmId: null, motif: null };
      
      if (state.section === 'library') {
        setCurrentSection('library');
        setSelectedFilm(null);
        setSelectedMotif(null);
      } else if (state.section === 'film' && state.filmId) {
        const film = FILMS.find(f => f.id === state.filmId);
        if (film) {
          setSelectedFilm(film);
          setCurrentSection('film');
          setSelectedMotif(null);
        }
      } else if (state.section === 'motif' && state.motif) {
        // Restore film if motif was accessed from a film
        if (state.filmId) {
          const film = FILMS.find(f => f.id === state.filmId);
          if (film) setSelectedFilm(film);
        }
        setCurrentSection('motif');
        setSelectedMotif(state.motif);
      } else if (state.section === 'fiction') {
        setCurrentSection('fiction');
      } else if (state.section === 'reimagine') {
        setCurrentSection('reimagine');
      } else if (state.section === 'conclusion') {
        setCurrentSection('conclusion');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update history when section changes
  useEffect(() => {
    // Skip initial render to avoid double history entry
    if (window.history.state?.section === currentSection && 
        window.history.state?.filmId === (selectedFilm?.id || null) &&
        window.history.state?.motif === (selectedMotif || null)) {
      return;
    }

    let state = { section: currentSection };
    
    if (currentSection === 'film' && selectedFilm) {
      state.filmId = selectedFilm.id;
    } else if (currentSection === 'motif' && selectedMotif) {
      state.motif = selectedMotif;
      // Also include filmId if navigating to motif from a film
      if (selectedFilm) {
        state.filmId = selectedFilm.id;
      }
    }

    const url = `/${currentSection === 'library' ? '' : currentSection}`;
    window.history.pushState(state, '', url);
  }, [currentSection, selectedFilm, selectedMotif]);

  // Update breadcrumb based on section
  useEffect(() => {
    const breadcrumbs = {
      library: ['Library'],
      film: ['Library', 'Film'],
      motif: ['Library', 'Film', 'Motif'],
      fiction: ['Library', 'Film', 'Motif', 'Fiction vs Reality'],
      reimagine: ['Library', 'Film', 'Motif', 'Fiction vs Reality', 'Reimagine'],
      conclusion: ['Library', 'Film', 'Motif', 'Fiction vs Reality', 'Reimagine']
    };
    setBreadcrumb(breadcrumbs[currentSection] || ['Library']);
  }, [currentSection]);

  const handleFilmClick = (film) => {
    setSelectedFilm(film);
    setCurrentSection('film');
  };

  const handleMotifClick = (motifName) => {
    // Use motif name if available in MOTIFS, otherwise use defaults
    const motifKey = Object.keys(MOTIFS).find(key => 
      key.toLowerCase() === motifName.toLowerCase()
    ) || "Surveillance"; // Default fallback
    
    setSelectedMotif(motifKey);
    setCurrentSection('motif');
  };

  const handleBack = () => {
    if (currentSection === 'film') {
      setCurrentSection('library');
      setSelectedFilm(null);
    } else if (currentSection === 'motif') {
      setCurrentSection('film');
    } else if (currentSection === 'fiction') {
      setCurrentSection('motif');
    } else if (currentSection === 'reimagine') {
      setCurrentSection('fiction');
    } else if (currentSection === 'conclusion') {
      setCurrentSection('reimagine');
    }
  };

  return (
    <div className="w-full h-screen overflow-hidden bg-gradient-to-br from-[#0a0e1a] via-[#1a0f2e] to-[#2d1b4e]">
      {currentSection === 'library' && (
        <LibrarySection onFilmClick={handleFilmClick} />
      )}
      {currentSection === 'film' && selectedFilm && (
        <FilmSection 
          film={selectedFilm} 
          onMotifClick={handleMotifClick}
          onBack={handleBack}
          breadcrumb={breadcrumb}
        />
      )}
      {currentSection === 'motif' && selectedMotif && (
        <MotifSection 
          motifName={selectedMotif}
          motifData={MOTIFS[selectedMotif]}
          onBack={handleBack}
          breadcrumb={breadcrumb}
          selectedFilm={selectedFilm}
          onNext={() => setCurrentSection('fiction')}
        />
      )}
      {currentSection === 'fiction' && (
        <FictionVsRealitySection 
          onBack={handleBack}
          breadcrumb={breadcrumb}
          onNext={() => setCurrentSection('reimagine')}
        />
      )}
      {currentSection === 'reimagine' && (
        <ReimagineSection 
          onBack={handleBack}
          breadcrumb={breadcrumb}
          onComplete={() => setCurrentSection('conclusion')}
        />
      )}
      {currentSection === 'conclusion' && (
        <ConclusionSection 
          breadcrumb={breadcrumb}
          onRestart={() => {
            setCurrentSection('library');
            setSelectedFilm(null);
            setSelectedMotif(null);
          }}
        />
      )}
    </div>
  );
}

// Three.js Bookshelf Component
function ThreeBookshelf({ films, filmPositions, scrollPosition, timelineWidth, onFilmClick }) {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const booksRef = useRef([]);
  const raycasterRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) {
      console.log('Canvas ref not ready');
      return;
    }

    let cleanup = null;
    let animationId = null;

    // Wait for THREE.js to be available
    const initThree = () => {
      const THREE = window.THREE || window.THREE;
      
      if (!THREE) {
        console.error('THREE.js not available');
        return;
      }

      console.log('Initializing Three.js scene');
      
      const { Scene, PerspectiveCamera, WebGLRenderer, AmbientLight, DirectionalLight, BoxGeometry, MeshStandardMaterial, Mesh, Group, Raycaster } = THREE;

      // Scene setup
      const scene = new Scene();
      scene.background = null;
      sceneRef.current = scene;

      const camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.set(0, 0.6, 8);
      cameraRef.current = camera;

      const renderer = new WebGLRenderer({ canvas: canvasRef.current, antialias: true, alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      rendererRef.current = renderer;

      // Lighting
      scene.add(new AmbientLight(0xffffff, 0.75));
      const dir = new DirectionalLight(0xffffff, 1.2);
      dir.position.set(3, 5, 6);
      scene.add(dir);

      // Book geometry
      const BOOK_W = 1.5;
      const BOOK_H = 2.5;
      const BOOK_D = 0.7;
      const geometry = new BoxGeometry(BOOK_W, BOOK_H, BOOK_D);

      // Color palette for books
      const palette = [
        { front: 0x0ea5e9, back: 0x0f172a },
        { front: 0xf59e0b, back: 0x78350f },
        { front: 0x10b981, back: 0x064e3b },
        { front: 0x8b5cf6, back: 0x3b0764 },
        { front: 0xef4444, back: 0x7f1d1d },
        { front: 0x22d3ee, back: 0x083344 },
        { front: 0xf472b6, back: 0x831843 },
        { front: 0x6366f1, back: 0x1e1b4b },
        { front: 0xec4899, back: 0x831843 },
        { front: 0x14b8a6, back: 0x134e4a },
      ];

      function makeMaterials(coverHex, backHex) {
        const spineHex = 0x1e293b;
        const edgeHex = 0x334155;
        return [
          new MeshStandardMaterial({ color: spineHex }),
          new MeshStandardMaterial({ color: spineHex }),
          new MeshStandardMaterial({ color: edgeHex }),
          new MeshStandardMaterial({ color: edgeHex }),
          new MeshStandardMaterial({ color: coverHex }),
          new MeshStandardMaterial({ color: backHex })
        ];
      }

      // Create books group
      const booksGroup = new Group();
      const books = [];

      console.log('Creating books for', films.length, 'films');
      console.log('Film positions:', filmPositions);
      console.log('Timeline width:', timelineWidth);

      films.forEach((film, index) => {
        const colors = palette[index % palette.length];
        const bookMesh = new Mesh(geometry, makeMaterials(colors.front, colors.back));
        
        // Position based on film position (convert px to 3D space)
        // Map film positions (in pixels) to 3D space (-30 to 30 range)
        const normalizedPos = filmPositions[index] / timelineWidth; // 0 to 1
        const xPos = (normalizedPos * 50) - 25; // -25 to 25 range
        bookMesh.position.set(xPos, 0, 0);
        bookMesh.rotation.y = Math.PI / 2;
        bookMesh.userData.film = film;
        bookMesh.userData.index = index;
        
        console.log(`Book ${index}: ${film.title} at x=${xPos.toFixed(2)} (from pos ${filmPositions[index]})`);
        
        booksGroup.add(bookMesh);
        books.push({
          mesh: bookMesh,
          film: film,
          baseX: xPos,
          targetRotY: Math.PI / 2,
          rotY: Math.PI / 2,
        });
      });

      scene.add(booksGroup);
      booksRef.current = books;
      console.log('Books created:', books.length);

      // Raycaster for clicking
      const raycaster = new Raycaster();
      raycasterRef.current = raycaster;

      const handleClick = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouseRef.current, camera);
        const intersects = raycaster.intersectObjects(books.map(b => b.mesh));

        if (intersects.length > 0) {
          const clickedBook = books.find(b => b.mesh === intersects[0].object);
          if (clickedBook) {
            onFilmClick(clickedBook.film);
          }
        }
      };

      canvasRef.current.addEventListener('click', handleClick);

      // Animation loop
      const animate = () => {
        animationId = requestAnimationFrame(animate);

        const t = performance.now() * 0.0015;
        
        // Parallax scrolling effect - adjust based on scroll
        const scrollRatio = scrollPosition / timelineWidth;
        const scrollOffset = (scrollRatio * 50) - 25;
        booksGroup.position.x = scrollOffset;

        // Floating animation
        booksGroup.position.y = Math.sin(t) * 0.03;

        // Individual book animations
        books.forEach((book, idx) => {
          book.mesh.rotation.y += (book.targetRotY - book.mesh.rotation.y) * 0.1;
          if (!book.mesh.userData.isHovered) {
            book.mesh.rotation.z = Math.sin(t + idx) * 0.02;
          }
        });

        renderer.render(scene, camera);
      };

      animate();

      // Hover effect
      const handleMouseMove = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouseRef.current, camera);
        const intersects = raycaster.intersectObjects(books.map(b => b.mesh));

        books.forEach(book => {
          const isHovered = intersects.some(int => int.object === book.mesh);
          book.mesh.userData.isHovered = isHovered;
          if (isHovered) {
            book.targetRotY = Math.PI / 2 - 0.2;
            canvasRef.current.style.cursor = 'pointer';
          } else {
            book.targetRotY = Math.PI / 2;
            canvasRef.current.style.cursor = 'default';
          }
        });
      };

      canvasRef.current.addEventListener('mousemove', handleMouseMove);

      // Resize handler
      const handleResize = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };

      window.addEventListener('resize', handleResize);

      // Cleanup function
      cleanup = () => {
        console.log('Cleaning up Three.js scene');
        window.removeEventListener('resize', handleResize);
        if (canvasRef.current) {
          canvasRef.current.removeEventListener('click', handleClick);
          canvasRef.current.removeEventListener('mousemove', handleMouseMove);
        }
        if (animationId) {
          cancelAnimationFrame(animationId);
        }
        if (renderer) {
          renderer.dispose();
          // Clear the canvas
          const context = canvasRef.current.getContext('webgl');
          if (context) {
            context.clear(context.COLOR_BUFFER_BIT | context.DEPTH_BUFFER_BIT);
          }
        }
      };
    };

    // Try to initialize immediately
    if (typeof window.THREE !== 'undefined') {
      initThree();
    } else {
      // Poll for THREE.js to load
      const checkThree = setInterval(() => {
        if (typeof window.THREE !== 'undefined') {
          clearInterval(checkThree);
          initThree();
        }
      }, 100);

      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkThree);
        if (typeof window.THREE === 'undefined') {
          console.error('THREE.js failed to load after 5 seconds');
        }
      }, 5000);

      return () => {
        clearInterval(checkThree);
        if (cleanup) cleanup();
      };
    }

    return cleanup || (() => {
      if (animationId) cancelAnimationFrame(animationId);
    });
  }, [films, filmPositions, scrollPosition, timelineWidth, onFilmClick]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-auto"
      style={{ 
        zIndex: 10,
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%'
      }}
    />
  );
}

// Section 1: Library (Horizontal Timeline with 3D Books)
function LibrarySection({ onFilmClick }) {
  const containerRef = useRef(null);
  const timelineRef = useRef(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Fixed timeline range: 1960 to 2020
  const minYear = 1960;
  const maxYear = 2020;
  const yearRange = maxYear - minYear;
  
  // Generate year labels for 5-year intervals
  const yearLabels = useMemo(() => {
    const years = [];
    for (let year = minYear; year <= maxYear; year += 5) {
      years.push(year);
    }
    return years;
  }, []);

  // Get current scroll position for gradient
  const currentScroll = scrollPosition;
  const maxScroll = 5000;
  const scrollProgress = Math.max(0, Math.min(Math.abs(currentScroll) / maxScroll, 1));

  // Gradient colors based on scroll
  const gradientColors = [
    { from: '#1a0033', to: '#330066' }, // Deep purple
    { from: '#330066', to: '#4d0099' }, // Purple
    { from: '#4d0099', to: '#6600cc' }, // Bright purple
    { from: '#6600cc', to: '#8000ff' }, // Bright purple-blue
    { from: '#8000ff', to: '#0066cc' }, // Purple to blue
  ];
  const gradientIndex = Math.floor(scrollProgress * (gradientColors.length - 1));
  const gradient = gradientColors[Math.min(gradientIndex, gradientColors.length - 1)];

  // Mouse drag handling
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - (timelineRef.current?.offsetLeft || 0));
    setScrollLeft(timelineRef.current?.scrollLeft || 0);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !timelineRef.current) return;
    e.preventDefault();
    const x = e.pageX - (timelineRef.current.offsetLeft || 0);
    const walk = (x - startX) * 2;
    timelineRef.current.scrollLeft = scrollLeft - walk;
    setScrollPosition(timelineRef.current.scrollLeft);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch support
  const handleTouchStart = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setStartX(e.touches[0].pageX - (timelineRef.current?.offsetLeft || 0));
    setScrollLeft(timelineRef.current?.scrollLeft || 0);
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !timelineRef.current) return;
    e.preventDefault();
    const x = e.touches[0].pageX - (timelineRef.current.offsetLeft || 0);
    const walk = (x - startX) * 2;
    timelineRef.current.scrollLeft = scrollLeft - walk;
    setScrollPosition(timelineRef.current.scrollLeft);
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  useEffect(() => {
    if (timelineRef.current) {
      const handleScroll = () => {
        setScrollPosition(timelineRef.current.scrollLeft);
      };
      timelineRef.current.addEventListener('scroll', handleScroll);
      return () => timelineRef.current?.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Sort films by year for consistent positioning
  const sortedFilms = useMemo(() => {
    return [...FILMS].sort((a, b) => a.year - b.year);
  }, []);

  // Calculate timeline width once
  const timelineWidth = useMemo(() => {
    const minSpacing = 180;
    return Math.max(6000, sortedFilms.length * minSpacing + 1000);
  }, [sortedFilms.length]);

  // Calculate positions for all films with proper spacing based on year
  const filmPositions = useMemo(() => {
    const positions = [];
    const minSpacing = 180; // Minimum spacing between bars (including bar width ~60px)
    const startOffset = 600;
    
    sortedFilms.forEach((film, index) => {
      let position;
      // Calculate year-based position (1960-2020 range)
      const normalizedYear = Math.max(minYear, Math.min(film.year, maxYear));
      const yearBasedPos = ((normalizedYear - minYear) / yearRange) * (timelineWidth - 1200) + startOffset;
      
      if (index === 0) {
        // First film: use year-based position, but ensure it's at least at startOffset
        position = Math.max(startOffset, yearBasedPos);
      } else {
        // Ensure minimum spacing from previous film
        const minPosition = positions[index - 1] + minSpacing;
        // Use the maximum to ensure spacing while respecting chronological order
        position = Math.max(yearBasedPos, minPosition);
      }
      positions.push(position);
    });
    
    return positions;
  }, [sortedFilms, minYear, maxYear, yearRange, timelineWidth]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Background gradient with parallax */}
      <div 
        className="absolute inset-0 transition-all duration-300"
        style={{
          background: `linear-gradient(to right, ${gradient.from}, ${gradient.to})`,
        }}
      />
      
      {/* Parallax layers */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          background: `radial-gradient(circle at ${50 + scrollProgress * 20}% ${30 + scrollProgress * 10}%, rgba(255,255,255,0.3), transparent 70%)`,
          transform: `translateX(${currentScroll * 0.3}px)`,
        }}
      />

      {/* Top header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-6 bg-gradient-to-b from-black/40 to-transparent backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Library of Futures</h1>
          <div className="text-white/80 text-sm">An archive of sci-fi films arranged by how far they imaged the future. Explore a story by clicking on a film spine.</div>
        </div>
      </div>

      {/* Timeline container */}
      <div 
        ref={timelineRef}
        className="absolute inset-0 overflow-x-auto overflow-y-hidden cursor-grab active:cursor-grabbing"
        style={{ 
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative h-full" style={{ width: `${timelineWidth}px`, paddingTop: '200px' }}>
          {/* Timeline years axis - 5 year intervals from 1960 to 2020 */}
          <div className="absolute bottom-20 left-0 right-0 flex" style={{ width: `${timelineWidth}px` }}>
            {yearLabels.map((year) => {
              // Calculate position based on timeline width
              const x = ((year - minYear) / yearRange) * (timelineWidth - 1200) + 600;
              return (
                <div
                  key={year}
                  className="absolute"
                  style={{ left: `${x}px`, bottom: 0 }}
                >
                  <div className="h-2 w-px bg-white/40" />
                  <div className="text-white/60 text-xs mt-1 whitespace-nowrap">{year}</div>
                </div>
              );
            })}
          </div>

          {/* 3D Books Canvas */}
          <ThreeBookshelf 
            films={sortedFilms}
            filmPositions={filmPositions}
            scrollPosition={currentScroll}
            timelineWidth={timelineWidth}
            onFilmClick={onFilmClick}
          />
          
          {/* Film labels below books */}
          {sortedFilms.map((film, index) => {
            const x = filmPositions[index];
            const parallaxOffset = currentScroll * 0.2;
            
            return (
              <div
                key={`label-${film.id}`}
                className="absolute pointer-events-none"
                style={{
                  left: `${x}px`,
                  bottom: '20px',
                  transform: `translateX(${parallaxOffset}px)`,
                  transition: 'transform 0.1s linear',
                }}
              >
                <div className="text-white text-xs font-medium whitespace-nowrap text-center" style={{ width: '120px', left: '50%', transform: 'translateX(-50%)' }}>
                  {film.title}
                </div>
                <div className="text-white/70 text-xs whitespace-nowrap text-center mt-1" style={{ width: '120px', left: '50%', transform: 'translateX(-50%)' }}>
                  {film.year}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Section 2: Film Details
function FilmSection({ film, onMotifClick, onBack, breadcrumb }) {
  const motifs = film?.tags || [];
  const filmData = film || {
    title: "Minority Report",
    rating: 7.6,
    tags: ["Dystopia", "Surveillance Capitalism"],
    plot: "In a future where a special police unit can arrest murderers before they commit their crimes, an officer is accused of a future murder. In 2054, the federal government plans to nationally [See more].",
    director: "Steven Spielberg",
    year: 2002,
    location: "Los Angeles, CA, USA",
    depicted: 2054
  };

  // Default motifs if none provided
  const defaultMotifs = ["Surveillance", "Free Will", "Artificial Intelligence", "Crime"];
  const displayMotifs = motifs.length > 0 ? motifs : defaultMotifs;

  return (
    <div className="relative w-full h-full overflow-y-auto bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] text-gray-900">
      {/* Breadcrumb */}
      <div className="absolute top-6 left-6 z-20 text-gray-600 text-sm font-medium">
        {breadcrumb.join(' > ')}
      </div>

      <div className="max-w-7xl mx-auto px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Left side - Placeholder image */}
          <div className="order-2 md:order-1">
            <div className="w-full h-96 bg-gray-300 rounded-lg border border-gray-400 flex items-center justify-center">
              <span className="text-gray-500 text-lg">Film Poster Placeholder</span>
            </div>
          </div>

          {/* Right side - Film details */}
          <div className="order-1 md:order-2">
            {/* Film Header */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <h1 className="text-4xl font-bold text-gray-900">{filmData.title}</h1>
                <div className="px-3 py-1.5 bg-gray-200 rounded-full text-gray-700 font-semibold text-sm">
                  {filmData.rating}/10
                </div>
              </div>
              
              <div className="flex gap-2 mb-6 flex-wrap">
                {filmData.tags.map((tag, i) => (
                  <span key={i} className="px-3 py-1 bg-gray-200 border border-gray-300 rounded-full text-gray-700 text-sm">
                    {tag}
                  </span>
                ))}
              </div>

              <p className="text-gray-700 text-base leading-relaxed mb-6">
                {filmData.plot}
              </p>

              <div className="space-y-4 text-gray-700">
                <div>
                  <div className="text-sm text-gray-500 mb-1 font-medium">Director</div>
                  <div className="text-base">{filmData.director}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1 font-medium">Released</div>
                  <div className="text-base">{filmData.year}, {filmData.location}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1 font-medium">Depicted</div>
                  <div className="text-base">{filmData.depicted}, Washington DC, USA</div>
                </div>
              </div>
            </div>

            {/* Technological Motifs */}
            <div className="mt-12">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Technological Motifs</h2>
              <p className="text-gray-600 text-sm mb-6">Click on any motif to explore how it connects to other films across decades.</p>
              
              <div className="flex gap-4 flex-wrap">
                {displayMotifs.map((motif, i) => (
                  <div
                    key={i}
                    className="relative cursor-pointer group"
                    onClick={() => onMotifClick(motif)}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    style={{ transition: 'transform 0.2s ease' }}
                  >
                    <div className="w-20 h-20 rounded-full bg-gray-300 border-2 border-gray-400 flex items-center justify-center text-gray-700 font-semibold text-xs text-center shadow-md group-hover:bg-gray-400 group-hover:border-gray-500">
                      {motif}
                    </div>
                    {i === 0 && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-pink-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="mt-8">
              <button
                onClick={onBack}
                className="px-6 py-3 bg-gray-200 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-300 transition-all"
              >
                ← Back to Library
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Section 3: Motif Network Graph
function MotifSection({ motifName, motifData, onBack, breadcrumb, selectedFilm, onNext }) {
  const centerNode = { x: 50, y: 50 };
  const [hoveredNode, setHoveredNode] = useState(null);

  // Safe access to motif data
  const safeMotifData = motifData || {
    movies: 26,
    connections: ["Time Travel", "Total Recall", "Minority Report", "Gattaca", "Blade Runner", "Robots", "AI", "Dystopia", "Privacy", "Family Bonds"]
  };
  const displayMotifName = motifName || "Surveillance";

  // Generate positions for connected nodes in a circular arrangement
  const nodeCount = safeMotifData.connections.length;
  const angleStep = (2 * Math.PI) / nodeCount;
  
  const nodes = safeMotifData.connections.map((name, i) => {
    const angle = i * angleStep;
    const radius = 22;
    return {
      name,
      x: centerNode.x + radius * Math.cos(angle),
      y: centerNode.y + radius * Math.sin(angle),
      isHighlighted: selectedFilm && (
        selectedFilm.title?.includes(name) || 
        selectedFilm.tags?.some(tag => name.toLowerCase().includes(tag.toLowerCase()))
      ),
    };
  });

  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] text-gray-900">
      {/* Breadcrumb */}
      <div className="absolute top-6 left-6 z-20 text-gray-600 text-sm font-medium">
        {breadcrumb.join(' > ')}
      </div>

      <div className="w-full h-full flex flex-col items-center justify-center px-8">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">{displayMotifName}</h1>
          <p className="text-gray-700 text-lg max-w-2xl">
            Recurring technological motifs linking films across decades and cultures. The web of shared ideas - from robots to dystopias to family bonds.
          </p>
        </div>

        {/* Network Graph */}
        <div className="relative w-full max-w-5xl h-[500px] bg-white rounded-xl p-8 border-2 border-gray-300 shadow-lg">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="0.5" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* Connections */}
            {nodes.map((node, i) => (
              <line
                key={i}
                x1={centerNode.x}
                y1={centerNode.y}
                x2={node.x}
                y2={node.y}
                stroke="rgba(147, 197, 253, 0.5)"
                strokeWidth="0.4"
              />
            ))}
            
            {/* Connected nodes */}
            {nodes.map((node, i) => (
              <g key={i}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={hoveredNode === node.name ? "3" : "2.5"}
                  fill={node.isHighlighted ? "#3b82f6" : hoveredNode === node.name ? "#60a5fa" : "#94a3b8"}
                  stroke={node.isHighlighted ? "#1e40af" : "#64748b"}
                  strokeWidth="0.3"
                  className="cursor-pointer transition-all"
                  onMouseEnter={() => setHoveredNode(node.name)}
                  onMouseLeave={() => setHoveredNode(null)}
                />
                <text
                  x={node.x}
                  y={node.y - 4}
                  textAnchor="middle"
                  fill={hoveredNode === node.name || node.isHighlighted ? "#1e3a8a" : "#475569"}
                  fontSize="1.8"
                  fontWeight={node.isHighlighted ? "bold" : "normal"}
                  className="pointer-events-none"
                >
                  {node.name}
                </text>
              </g>
            ))}

            {/* Center node */}
            <circle
              cx={centerNode.x}
              cy={centerNode.y}
              r="5"
              fill="#3b82f6"
              stroke="#1e40af"
              strokeWidth="0.5"
              className="cursor-pointer"
            />
            <text
              x={centerNode.x}
              y={centerNode.y - 8}
              textAnchor="middle"
              fill="#1e3a8a"
              fontSize="3.5"
              fontWeight="bold"
              className="pointer-events-none"
            >
              {safeMotifData.movies} Movies
            </text>
            
            {/* Highlight line for selected film */}
            {selectedFilm && nodes.find(n => n.isHighlighted) && (
              <line
                x1={centerNode.x}
                y1={centerNode.y}
                x2={nodes.find(n => n.isHighlighted).x}
                y2={nodes.find(n => n.isHighlighted).y}
                stroke="#3b82f6"
                strokeWidth="0.8"
                strokeDasharray="1,1"
                opacity="0.6"
              />
            )}
          </svg>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex gap-4 justify-center">
          <button
            onClick={onBack}
            className="px-6 py-3 bg-gray-200 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-300 transition-all"
          >
            ← Back
          </button>
          <button
            onClick={onNext}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-all"
          >
            Fiction vs Reality →
          </button>
        </div>
      </div>
    </div>
  );
}

// Section 4: Fiction vs Reality
function FictionVsRealitySection({ onBack, breadcrumb, onNext }) {
  // Bar data matching the timeline years
  const bars = [
    { year: 1970, arrived: false, height: 80, label: "1970" },
    { year: 1980, arrived: true, height: 120, label: "1980" },
    { year: 1990, arrived: true, height: 100, label: "1990" },
    { year: 2000, arrived: true, height: 140, label: "2000" },
    { year: 2100, arrived: false, height: 90, label: "2100" },
    { year: 2200, arrived: false, height: 110, label: "2200" },
    { year: 2300, arrived: false, height: 130, label: "2300" },
  ];

  // Calculate positions for bars on x-axis
  const years = [1970, 1980, 1990, 2000, 2100, 2200, 2300];
  const minYear = 1970;
  const maxYear = 2300;
  const yearRange = maxYear - minYear;
  const todayYear = 2023;
  const todayPosition = ((todayYear - minYear) / (maxYear - minYear)) * 100;

  return (
    <div className="relative w-full h-full overflow-y-auto bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] text-gray-900">
      <div className="absolute top-6 left-6 z-20 text-gray-600 text-sm font-medium">
        {breadcrumb.join(' > ')}
      </div>

      <div className="max-w-6xl mx-auto px-8 py-20">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Fiction vs. Reality</h1>
          <p className="text-gray-700 text-lg max-w-2xl mx-auto">
            Compare each film's predicted year to real technological milestones. See which imagined futures have already arrived — and which remain fiction.
          </p>
        </div>

        {/* Chart Container */}
        <div className="relative w-full h-[500px] bg-white rounded-lg p-8 border-2 border-gray-300 shadow-lg">
          {/* 80% Accurate Label */}
          <div className="absolute left-6 top-6 bg-gray-100 border border-gray-300 rounded-lg p-3">
            <div className="text-gray-700 text-sm font-medium mb-2">80% Accurate</div>
            <div className="h-3 w-24 bg-purple-600 rounded-full" />
          </div>

          {/* Chart Area */}
          <div className="relative w-full h-full mt-16">
            {/* Today (2023) Marker Line */}
            <div 
              className="absolute top-0 bottom-16 w-0.5 bg-gray-900 z-10"
              style={{ left: `${todayPosition}%` }}
            >
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-gray-700 text-sm font-medium whitespace-nowrap">
                Today (2023)
              </div>
            </div>

            {/* X-axis with year labels */}
            <div className="absolute bottom-0 left-0 right-0 h-16 flex justify-between items-end px-4">
              {years.map((year) => {
                const position = ((year - minYear) / yearRange) * 100;
                return (
                  <div
                    key={year}
                    className="absolute flex flex-col items-center"
                    style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
                  >
                    <div className="h-2 w-px bg-gray-400 mb-1" />
                    <div className="text-gray-600 text-sm font-medium">{year}</div>
                  </div>
                );
              })}
            </div>

            {/* Bars/Boxes */}
            <div className="absolute bottom-16 left-0 right-0 top-0">
              {bars.map((bar, i) => {
                const position = ((bar.year - minYear) / yearRange) * 100;
                return (
                  <div
                    key={i}
                    className="absolute cursor-pointer group transition-all hover:opacity-80 hover:scale-105"
                    style={{ 
                      left: `${position}%`, 
                      transform: 'translateX(-50%)',
                      bottom: 0,
                    }}
                    onClick={onNext}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
                    }}
                  >
                    <div
                      className={`w-16 rounded-t border-2 shadow-md transition-all ${
                        bar.arrived 
                          ? 'bg-blue-500 border-blue-600' 
                          : 'bg-gray-300 border-gray-400'
                      }`}
                      style={{ height: `${bar.height}px` }}
                    />
                    {/* Hover tooltip */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none">
                      {bar.arrived ? 'Arrived' : 'Fiction'} - Click to explore
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex gap-4 justify-center">
          <button
            onClick={onBack}
            className="px-6 py-3 bg-gray-200 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-300 transition-all"
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
}

// Section 5: Reimagine Quiz
function ReimagineSection({ onBack, breadcrumb, onComplete }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selectedYear, setSelectedYear] = useState(2050);

  const questions = [
    "When will humans establish a permanent colony on Mars?",
    "When will artificial general intelligence be achieved?",
    "When will teleportation become a reality?",
  ];

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setAnswers([...answers, selectedYear]);
      setCurrentQuestion(currentQuestion + 1);
      setSelectedYear(2050);
    } else {
      setAnswers([...answers, selectedYear]);
      onComplete();
    }
  };

  if (currentQuestion === 0 && answers.length === 0) {
    // Introduction screen
    return (
      <div className="relative w-full h-full overflow-y-auto bg-gradient-to-br from-[#0a0e1a] via-[#1a0f2e] to-[#2d1b4e]">
        <div className="absolute top-6 left-6 z-20 text-white/70 text-sm">
          {breadcrumb.join(' > ')}
        </div>

        <div className="w-full h-full flex flex-col items-center justify-center px-8">
          <div className="max-w-2xl text-center">
            <h1 className="text-5xl font-bold text-white mb-6">Reimagine</h1>
            <p className="text-white/80 text-xl leading-relaxed mb-8">
              You've seen how filmmakers across decades predicted the future. Now, we want to understand how you see tomorrow. Over the next few questions, you'll make predictions about emerging technologies. There are no right or wrong answers here.
            </p>
            <button
              onClick={() => setCurrentQuestion(0)}
              className="px-8 py-4 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-lg font-semibold transition-all flex items-center gap-2 mx-auto"
            >
              Begin Predictions
              <span className="text-2xl">→</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-y-auto bg-gradient-to-br from-[#0a0e1a] via-[#1a0f2e] to-[#2d1b4e]">
      <div className="absolute top-6 left-6 z-20 text-white/70 text-sm">
        {breadcrumb.join(' > ')}
      </div>

      <div className="w-full h-full flex flex-col items-center justify-center px-8">
        <div className="max-w-2xl w-full">
          <h1 className="text-3xl font-bold text-white mb-12 text-center">Reimagine</h1>
          
          <div className="mb-12">
            <h2 className="text-2xl text-white mb-8 text-center">{questions[currentQuestion]}</h2>
            
            <div className="text-center mb-8">
              <div className="text-6xl font-bold text-purple-400 mb-4">{selectedYear}</div>
            </div>

            <input
              type="range"
              min="2025"
              max="2300"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${((selectedYear - 2025) / (2300 - 2025)) * 100}%, rgba(255,255,255,0.2) ${((selectedYear - 2025) / (2300 - 2025)) * 100}%, rgba(255,255,255,0.2) 100%)`
              }}
            />
          </div>

          <button
            onClick={handleNext}
            className="w-full px-8 py-4 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-lg font-semibold transition-all flex items-center justify-center gap-2"
          >
            {currentQuestion < questions.length - 1 ? 'Next →' : 'See Results →'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Section 6: Conclusion
function ConclusionSection({ breadcrumb, onRestart }) {
  const userDistance = 15;
  const directorDistance = 54;

  return (
    <div className="relative w-full h-full overflow-y-auto bg-gradient-to-br from-[#0a0e1a] via-[#1a0f2e] to-[#2d1b4e]">
      <div className="absolute top-6 left-6 z-20 text-white/70 text-sm">
        {breadcrumb.join(' > ')}
      </div>

      <div className="w-full h-full flex flex-col items-center justify-center px-8">
        <div className="max-w-3xl text-center">
          <h1 className="text-5xl font-bold text-white mb-6">Mirror of Imagination</h1>
          <p className="text-white/80 text-xl leading-relaxed mb-12">
            Your prediction reveal not just when you think the future will arrive, but how you feel about it arriving.
          </p>

          {/* Comparison */}
          <div className="bg-white/5 rounded-lg p-8 mb-12 border border-white/10">
            <div className="text-white/70 mb-6">Your Imagination Distance</div>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-white font-semibold">You</span>
                  <span className="text-purple-400 font-bold text-xl">{userDistance} Years</span>
                </div>
                <div className="h-4 bg-purple-600 rounded-full" style={{ width: `${(userDistance / directorDistance) * 100}%` }} />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-white font-semibold">Sci-Fi Directors</span>
                  <span className="text-purple-400 font-bold text-xl">{directorDistance} Years</span>
                </div>
                <div className="text-white/60 text-sm mb-2">Future average (1940-2000)</div>
                <div className="h-4 bg-purple-800 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
          </div>

          <p className="text-white/70 text-lg leading-relaxed mb-12">
            In the 1950s, the future stretched light-years away. Today, it feels only a few clicks ahead. Have we become better realists - or smaller dreamers? Do we think there's a decline in innovation today, or are we simply living through it? What causes creators to imagine shorter futures? Faster technology? Greater fear? Or clearer vision?
          </p>

          <div className="flex gap-4 justify-center">
            <button
              onClick={onRestart}
              className="px-8 py-4 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all"
            >
              Take Again
            </button>
            <button
              onClick={onRestart}
              className="px-8 py-4 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-all"
            >
              Explore the Library
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Render the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (ReactDOM.createRoot) {
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(<App />);
    } else {
      ReactDOM.render(<App />, document.getElementById('root'));
    }
  });
} else {
  if (ReactDOM.createRoot) {
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<App />);
  } else {
    ReactDOM.render(<App />, document.getElementById('root'));
  }
}