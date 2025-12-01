/**
 * Circular Network Graph Visualization for Sci-Fi Movie Themes
 * Shows theme co-occurrences as a circular network
 * DARK THEME VERSION
 */

class ChordGraph {
  constructor(containerId) {
    this.containerId = containerId;
    this.container = d3.select(`#${containerId}`);
    this.movies = [];
    this.themes = new Set();
    this.currentMovie = null;
    this.themeCooccurrence = {};
    this.themeMovies = {};
    this.svg = null;
    this.g = null;
    this.linkGroup = null;
    this.nodeGroup = null;
    this.tooltip = null;
    this.showLabels = true;
    this.zoom = null; // Zoom disabled - graph is fixed in place
    this.currentDecade = null; // null means "All"
    this.transitionDuration = 200; // milliseconds - fast for responsive dragging
    this.width = 1200;
    this.height = 900;
    this.originalColorScale = null; // Store original color scale for "All" view
    this.originalLinks = null; // Store original links data
    this.nodeHoverDivs = []; // Store invisible hover divs above nodes
    
    // Theme to image mapping
    this.themeImages = {
      'AI': 'node-images/Artificial_Intelligence.png',
      'Consciousness': 'node-images/Consiousness.png',
      'Free Will': 'node-images/Free Will.png',
      'Social Control': 'node-images/Social Control.png',
      'Evolution/Genetic Engineering': 'node-images/Evolution.png',
      'Space': 'node-images/Space Travel.png',
      'Interstellar Travel': 'node-images/Space Travel.png',
      'Transcendence': 'node-images/Transcendence.png',
      'Surveillance': 'node-images/Surveillance.png',
      'Robotics': 'node-images/Robotics.png'
    };
    
    // Theme descriptions
    this.themeDescriptions = {
      'AI': 'Stories exploring machine intelligence—logical, emotional, or superhuman. These films question what happens when thinking systems surpass human control, ethics, or understanding. Common elements: sentient programs, digital assistants, neural networks.',
      'Artificial Intelligence': 'Stories exploring machine intelligence—logical, emotional, or superhuman. These films question what happens when thinking systems surpass human control, ethics, or understanding. Common elements: sentient programs, digital assistants, neural networks.',
      'Consciousness': 'Explores the nature of awareness—human, artificial, or alien. These stories ask what makes a mind "alive" and how identity forms in bodies, machines, or networks. Includes memory, perception, and selfhood.',
      'Free Will': 'Stories centered on choice versus determinism. Characters confront systems that predict, restrict, or override their decisions—raising questions about autonomy, fate, and moral responsibility.',
      'Social Control': 'Examines societies shaped by power, governance, and manipulation. These futures use technology, propaganda, or surveillance to maintain order—or suppress freedom. Themes include authoritarianism, compliance, and resistance.',
      'Evolution/Genetic Engineering': 'Explores the reshaping of life—through mutation, biotechnology, or engineered futures. These stories imagine new species, enhanced humans, or the consequences of altering biology. Raises questions about nature, ethics, and unintended change.',
      'Evolution & Genetic Engineering': 'Explores the reshaping of life—through mutation, biotechnology, or engineered futures. These stories imagine new species, enhanced humans, or the consequences of altering biology. Raises questions about nature, ethics, and unintended change.',
      'Space': 'Journeys through galaxies, planets, or cosmic frontiers. This trope symbolizes exploration, ambition, and encounters with the unknown. Common elements: starships, colonization, alien worlds, celestial danger.',
      'Space Travel': 'Journeys through galaxies, planets, or cosmic frontiers. This trope symbolizes exploration, ambition, and encounters with the unknown. Common elements: starships, colonization, alien worlds, celestial danger.',
      'Interstellar Travel': 'Journeys through galaxies, planets, or cosmic frontiers. This trope symbolizes exploration, ambition, and encounters with the unknown. Common elements: starships, colonization, alien worlds, celestial danger.',
      'Transcendence': 'Stories about surpassing human limits—physically, mentally, or spiritually. Characters merge with machines, ascend to new forms, or transcend mortality. Themes include singularity, digital afterlife, and metaphysical evolution.',
      'Surveillance': 'Futures where watching becomes a system of power. These stories explore monitoring, prediction, and the tension between safety and privacy. Themes include omnipresent sensors, predictive policing, and algorithmic control.',
      'Robotics': 'Stories featuring mechanical or synthetic beings. Robots act as tools, companions, or rivals—reflecting hopes and fears about automation and artificial life. Themes include labor, autonomy, and machine emotions.',
      'Class Struggle': 'Futures divided by wealth, access, and opportunity. Sci-fi uses dystopias, megacities, and off-world colonies to show how inequality shapes society. Themes include rebellion, scarcity, and structural power.'
    };
  }

  /**
   * Show the movie popup with a list of movies for the current window.
   * movies: array of strings
   * startYear: number or null
   */
  showMoviePopup(movies, startYear, theme, nodeX, nodeY) {
    try {
      // Ensure popup exists, create if missing
      if (!this.moviePopup || !this.moviePopup.node()) {
        console.warn('Popup not found, creating new one');
        this.moviePopup = d3.select('body')
          .append('div')
          .attr('class', 'movie-popup')
          .attr('id', 'chordGraphPopup')
          .style('position', 'fixed')
          .style('min-width', '280px')
          .style('max-width', '320px')
          .style('background', 'rgba(0, 0, 0, 0.6)')
          .style('color', '#ffffff')
          .style('border-radius', '8px')
          .style('padding', '20px')
          .style('z-index', '99999')
          .style('font-family', "'IBM Plex Sans', sans-serif")
          .style('font-size', '12px')
          .style('max-height', '400px')
          .style('overflow-y', 'auto')
          .style('backdrop-filter', 'blur(4px)')
          .style('box-shadow', '0 8px 32px rgba(0, 0, 0, 0.8)')
          .style('border', '1px solid rgba(255, 255, 255, 0.2)');
      }
      
      console.log('showMoviePopup called', {
        theme,
        moviesCount: movies?.length,
        nodeX,
        nodeY,
        popupElement: this.moviePopup.node()
      });
      
      // Get theme description
      const themeName = theme || 'Unknown Theme';
      const description = this.themeDescriptions[theme] || this.themeDescriptions[themeName] || 'Explore movies featuring this theme.';
      
      // Format movies as "[Year] [Title of Movie]"
      const formattedMovies = movies.length > 0 ? movies.map(m => {
        const match = m.match(/^(.+?)\s*\((\d{4})\)$/);
        if (match) {
          return `[${match[2]}] ${match[1]}`;
        }
        return m;
      }) : ['No movies found for this time period'];
      
      const html = `
        <div style="font-weight:700; margin-bottom:12px; color:#ffffff; font-size:16px; letter-spacing:0.5px;">${themeName}</div>
        <div style="font-size:11px; color:#ffffff; line-height:1.6; margin-bottom:12px; opacity:0.9;">
          ${description}
        </div>
        <div style="width:100%; height:1px; background-color:rgba(255,255,255,0.3); margin-bottom:12px;"></div>
        <div style="font-size:11px; color:#ffffff; line-height:1.8; margin-top:12px;">
          ${formattedMovies.map(m => `<div style="padding:2px 0;">${m}</div>`).join('')}
        </div>
      `;

      // Show the popup - make absolutely sure it's visible
      const popupNode = this.moviePopup.node();
      if (!popupNode) {
        console.error('Popup node is null!');
        return;
      }
      
      // Set HTML content first
      this.moviePopup.html(html);
      
      // Make it visible immediately - use setProperty for !important
      const popupEl = this.moviePopup.node();
      popupEl.style.setProperty('display', 'block', 'important');
      popupEl.style.setProperty('visibility', 'visible', 'important');
      popupEl.style.setProperty('opacity', '1', 'important');
      popupEl.style.setProperty('pointer-events', 'auto', 'important');
      popupEl.style.setProperty('z-index', '99999', 'important');
      
      // Also set via d3 for consistency
      this.moviePopup
        .style('display', 'block')
        .style('visibility', 'visible')
        .style('opacity', '1')
        .style('pointer-events', 'auto')
        .style('z-index', '99999');
      
      // Force a reflow to ensure styles are applied
      void popupEl.offsetHeight;
      
      console.log('Popup HTML set and made visible');

      // Position the popup next to the node
      try {
        // First, make sure popup is visible to get accurate dimensions
        this.moviePopup
          .style('display', 'block')
          .style('visibility', 'visible')
          .style('opacity', 0.01); // Nearly invisible but rendered
        
        // Force a reflow
        void this.moviePopup.node().offsetHeight;
        
        const popupRect = this.moviePopup.node().getBoundingClientRect();
        
        // Convert SVG coordinates to screen coordinates
        const svgPoint = this.svg.node().createSVGPoint();
        svgPoint.x = nodeX;
        svgPoint.y = nodeY;
        const svgMatrix = this.svg.node().getScreenCTM();
        if (!svgMatrix) return;
        
        const screenPoint = svgPoint.matrixTransform(svgMatrix);
        
        const offsetX = 60; // Distance from node to popup
        const offsetY = -popupRect.height / 2; // Center vertically with node
        
        // Use screen coordinates directly since popup is fixed
        let left = Math.round(screenPoint.x + offsetX);
        let top = Math.round(screenPoint.y + offsetY);
        
        // Keep popup within viewport bounds
        if (left + popupRect.width > window.innerWidth - 20) {
          left = Math.round(screenPoint.x - popupRect.width - offsetX); // Show to the left instead
        }
        if (left < 20) left = 20;
        if (top < 20) top = 20;
        if (top + popupRect.height > window.innerHeight - 20) {
          top = Math.round(window.innerHeight - popupRect.height - 20);
        }
        
        // Set position and make fully visible - use setProperty for !important
        const popupEl = this.moviePopup.node();
        popupEl.style.setProperty('left', `${left}px`, 'important');
        popupEl.style.setProperty('top', `${top}px`, 'important');
        popupEl.style.setProperty('right', 'auto', 'important');
        popupEl.style.setProperty('position', 'fixed', 'important');
        popupEl.style.setProperty('opacity', '1', 'important');
        popupEl.style.setProperty('display', 'block', 'important');
        popupEl.style.setProperty('visibility', 'visible', 'important');
        popupEl.style.setProperty('z-index', '99999', 'important');
        popupEl.style.setProperty('pointer-events', 'auto', 'important');
        
        // Also set via d3 for consistency
        this.moviePopup
          .style('left', `${left}px`)
          .style('top', `${top}px`)
          .style('right', 'auto')
          .style('position', 'fixed')
          .style('opacity', '1')
          .style('display', 'block')
          .style('visibility', 'visible')
          .style('z-index', '99999')
          .style('pointer-events', 'auto');
        
        // Force another reflow to ensure visibility
        void popupEl.offsetHeight;
        
        // Double-check it's visible
        const finalStyles = window.getComputedStyle(popupEl);
        console.log('Popup positioned next to node:', { left, top, width: popupRect.width, height: popupRect.height, finalDisplay: finalStyles.display, finalOpacity: finalStyles.opacity });
        
        if (finalStyles.display === 'none' || finalStyles.visibility === 'hidden' || parseFloat(finalStyles.opacity) < 0.1) {
          console.warn('Popup still hidden after positioning, forcing visibility with !important');
          popupEl.style.setProperty('display', 'block', 'important');
          popupEl.style.setProperty('visibility', 'visible', 'important');
          popupEl.style.setProperty('opacity', '1', 'important');
        }
        
        // Hide connecting line since popup is next to node
        if (this.popupLine) {
          this.popupLine.attr('opacity', 0);
        }
      } catch(e) {
        // fallback
        const containerRect = this.container.node().getBoundingClientRect();
        const left = Math.round(containerRect.width - 400 - 32);
        const top = Math.round(100);
        this.moviePopup.style('left', `${left}px`).style('top', `${top}px`);
      }
    } catch (e) {
      // silent
    }
  }

  hideMoviePopup() {
    try {
      if (!this.moviePopup) return;
      this.moviePopup.style('opacity', 0).style('pointer-events', 'none').style('display', 'none');
      if (this.popupLine) {
        this.popupLine.attr('opacity', 0);
      }
    } catch(e){}
  }

  /**
   * Load and parse the CSV data
   */
  async loadData(csvPath) {
    const data = await d3.csv(csvPath);

    // Define allowed themes - only these will be included in the chord graph
    // Note: Using exact theme names as they appear in the CSV
    const allowedThemes = new Set([
      'AI',
      'Consciousness',
      'Free Will',
      'Social Control',
      'Evolution/Genetic Engineering',
      'Space', // CSV uses 'Space' instead of 'Space Travel'
      'Interstellar Travel', // Also including this space-related theme
      'Transcendence',
      'Surveillance',
      'Robotics'
      // Note: 'Class Struggle' does not exist in the CSV data
    ]);

    // Parse movies and extract only allowed themes
    const allMovies = data.map(d => {
      const themesStr = d['Sci-fi Categories'] || '';
      const allThemes = themesStr
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      // Filter to only include allowed themes
      const filteredThemes = allThemes.filter(t => allowedThemes.has(t));

      return {
        title: d['Movie / TV Show Name'],
        year: d['Year'],
        themes: filteredThemes,
        rating: d['Rating']
      };
    });

    // Only keep movies that have at least one of the allowed themes
    this.movies = allMovies.filter(movie => movie.themes.length > 0);

    // Collect all unique themes (will only be the allowed themes)
    this.movies.forEach(movie => {
      movie.themes.forEach(theme => this.themes.add(theme));
    });

    // Pre-calculate co-occurrences for all theme pairs
    this.calculateCooccurrences();

    console.log(`Loaded ${this.movies.length} movies with ${this.themes.size} unique themes`);
    console.log(`Filtered to movies containing: ${Array.from(this.themes).join(', ')}`);
  }

  /**
   * Calculate co-occurrences for all theme pairs across all movies
   */
  calculateCooccurrences(decadeFilter = null) {
    const themesList = Array.from(this.themes);

    // Initialize matrices
    themesList.forEach(theme1 => {
      this.themeCooccurrence[theme1] = {};
      this.themeMovies[theme1] = {};
      themesList.forEach(theme2 => {
        this.themeCooccurrence[theme1][theme2] = 0;
        this.themeMovies[theme1][theme2] = [];
      });
    });

    // Filter movies by decade if specified
    const moviesToProcess = decadeFilter === null ? this.movies : this.movies.filter(movie => {
      const year = parseInt(movie.year);
      if (isNaN(year)) return false;
      return year >= decadeFilter && year < decadeFilter + 10;
    });

    // Count co-occurrences
    moviesToProcess.forEach(movie => {
      const themes = movie.themes;
      for (let i = 0; i < themes.length; i++) {
        for (let j = i + 1; j < themes.length; j++) {
          if (themes[i] && themes[j]) {
            this.themeCooccurrence[themes[i]][themes[j]]++;
            this.themeCooccurrence[themes[j]][themes[i]]++;

            const movieLabel = `${movie.title} (${movie.year})`;
            this.themeMovies[themes[i]][themes[j]].push(movieLabel);
            this.themeMovies[themes[j]][themes[i]].push(movieLabel);
          }
        }
      }
    });
  }

  /**
   * Initialize SVG structure (called once)
   */
  initializeSVG(options = {}) {
    const {
      width = 1200,
      height = 900
    } = options;

    this.width = width;
    this.height = height;

    // Clear previous content
    this.container.html('');

    // Create SVG
    this.svg = this.container
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])
      .style('max-width', '100%')
      .style('height', 'auto');

    // Zoom behavior disabled - graph stays in place and cannot be dragged
    // Removed zoom/pan functionality to keep graph fixed in position

    // Create SVG filter for white glow effect
    const defs = this.svg.append('defs');
    const glowFilter = defs.append('filter')
      .attr('id', 'whiteGlow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    
    glowFilter.append('feGaussianBlur')
      .attr('stdDeviation', '4')
      .attr('result', 'coloredBlur');
    
    const feMerge = glowFilter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
    
    // Create SVG filter to convert images to grayscale (visible, not black)
    const grayscaleFilter = defs.append('filter')
      .attr('id', 'grayscale')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    
    // Convert to grayscale - keeps images visible
    grayscaleFilter.append('feColorMatrix')
      .attr('type', 'saturate')
      .attr('values', '0');
    
    // Create a darker grayscale filter for better visibility
    const darkGrayscaleFilter = defs.append('filter')
      .attr('id', 'darkGrayscale')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    
    // Convert to grayscale and darken slightly
    darkGrayscaleFilter.append('feColorMatrix')
      .attr('type', 'saturate')
      .attr('values', '0')
      .attr('result', 'grayscale');
    
    // Darken the grayscale image slightly
    const darkenTransfer = darkGrayscaleFilter.append('feComponentTransfer')
      .attr('in', 'grayscale');
    
    darkenTransfer.append('feFuncR')
      .attr('type', 'linear')
      .attr('slope', '0.8')
      .attr('intercept', '0');
    
    darkenTransfer.append('feFuncG')
      .attr('type', 'linear')
      .attr('slope', '0.8')
      .attr('intercept', '0');
    
    darkenTransfer.append('feFuncB')
      .attr('type', 'linear')
      .attr('slope', '0.8')
      .attr('intercept', '0');

    // Gradient will be created dynamically in createCircleBorder with proper sizing

    this.g = this.svg.append('g');
    this.linkGroup = this.g.append('g').attr('class', 'links');
    this.nodeGroup = this.g.append('g').attr('class', 'nodes');
    
    // Create a group for the circle border (will be populated in render)
    this.circleGroup = this.g.append('g').attr('class', 'circle-border');

    // Create tooltip
    this.tooltip = this.container
      .append('div')
      .attr('class', 'chord-tooltip')
      .style('position', 'absolute')
      .style('padding', '16px 20px')
      .style('background', 'rgba(26, 26, 26, 0.98)')
      .style('color', '#cccccc')
      .style('border', '1px solid #444444')
      .style('border-radius', '6px')
      .style('pointer-events', 'none')
      .style('opacity', '0')
      .style('transition', 'opacity 0.2s')
      .style('font-family', "'IBM Plex Sans', sans-serif")
      .style('font-size', '12px')
      .style('font-weight', '400')
      .style('max-width', '500px')
      .style('max-height', '600px')
      .style('z-index', '1000')
      .style('box-shadow', '0 6px 20px rgba(0,0,0,0.8)')
      .style('line-height', '1.6')
      .style('left', '50%')
      .style('transform', 'translateX(-50%)')
      .style('bottom', '20px');

      // Create a black transparent popup on top of chord graph
      // Append to the container so it's positioned relative to the graph
      this.moviePopup = d3.select('body')
        .append('div')
        .attr('class', 'movie-popup')
        .attr('id', 'chordGraphPopup')
        .style('position', 'fixed')
        .style('min-width', '280px')
        .style('max-width', '320px')
        .style('background', 'rgba(0, 0, 0, 0.6)') // Black and transparent
        .style('color', '#ffffff')
        .style('border-radius', '8px')
        .style('padding', '20px')
        .style('opacity', '0')
        .style('pointer-events', 'none')
        .style('display', 'none')
        .style('z-index', '99999')
        .style('font-family', "'IBM Plex Sans', sans-serif")
        .style('font-size', '12px')
        .style('max-height', '400px')
        .style('overflow-y', 'auto')
        .style('backdrop-filter', 'blur(4px)')
        .style('box-shadow', '0 8px 32px rgba(0, 0, 0, 0.8)')
        .style('border', '1px solid rgba(255, 255, 255, 0.2)');
      
      console.log('Popup created:', this.moviePopup.node());
      
      // Test that popup can be shown
      if (this.moviePopup && this.moviePopup.node()) {
        console.log('Popup element exists and is ready');
        // Test visibility
        const testNode = this.moviePopup.node();
        console.log('Popup initial styles:', {
          display: window.getComputedStyle(testNode).display,
          visibility: window.getComputedStyle(testNode).visibility,
          opacity: window.getComputedStyle(testNode).opacity,
          zIndex: window.getComputedStyle(testNode).zIndex
        });
      } else {
        console.error('Popup creation failed!');
      }
      
      // Create SVG line connector (will be positioned dynamically)
      this.popupLine = this.svg.append('line')
        .attr('class', 'popup-connector-line')
        .attr('stroke', '#46AACB')
        .attr('stroke-width', '2')
        .attr('opacity', 0)
        .style('pointer-events', 'none');
  }

  /**
   * Render the circular network graph with smooth transitions
   * Now shows ALL filtered themes and their connections across all movies
   */
  render(movieTitle = null, options = {}) {
    const {
      width = 1200,
      height = 900
    } = options;

    // Initialize SVG if not already created
    if (!this.svg || !this.svg.node()) {
      this.initializeSVG(options);
    }

    // Ensure SVG is ready before proceeding
    if (!this.svg || !this.svg.node()) {
      console.error('SVG initialization failed');
      return null;
    }

    // Use ALL themes from the filtered dataset instead of just one movie's themes
    const allThemes = Array.from(this.themes).sort();

    // Recalculate co-occurrences with current decade filter
    this.calculateCooccurrences(this.currentDecade);

    // Ensure width and height match the viewBox (which is the coordinate system)
    // The viewBox defines the coordinate system, so we should use those dimensions
    const svgNode = this.svg.node();
    if (svgNode && svgNode.viewBox && svgNode.viewBox.baseVal) {
      const viewBox = svgNode.viewBox.baseVal;
      // Use viewBox dimensions as they define the coordinate system
      if (viewBox.width > 0) this.width = viewBox.width;
      if (viewBox.height > 0) this.height = viewBox.height;
    }

    // Create nodes (themes) positioned in a circle
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const radius = Math.min(this.width, this.height) / 2 - 150;

    const nodes = allThemes.map((theme, i) => {
      const angle = (i / allThemes.length) * 2 * Math.PI - Math.PI / 2;
      return {
        id: theme,
        label: theme,
        angle: angle,
        index: i,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      };
    });

    // Create links (connections between themes)
    const links = [];
    const relatedMoviesSet = new Set();
    
    // Track which nodes have connections
    const nodesWithConnections = new Set();

    for (let i = 0; i < allThemes.length; i++) {
      for (let j = i + 1; j < allThemes.length; j++) {
        // Validate that both themes exist in the cooccurrence data
        const theme1 = allThemes[i];
        const theme2 = allThemes[j];
        
        // Ensure both themes have cooccurrence data (initialize if missing)
        if (!this.themeCooccurrence[theme1]) {
          this.themeCooccurrence[theme1] = {};
        }
        if (!this.themeCooccurrence[theme2]) {
          this.themeCooccurrence[theme2] = {};
        }
        
        // Get weight (0 if no connection)
        const weight = (this.themeCooccurrence[theme1][theme2] || 0);
        
        // Validate that nodes exist for both indices
        if (i >= nodes.length || j >= nodes.length || !nodes[i] || !nodes[j]) {
          console.warn(`Skipping invalid link: ${theme1} -> ${theme2} (node indices: ${i}, ${j}, nodes length: ${nodes.length})`);
          continue;
        }
        
        // Create link for ALL pairs, regardless of weight (weight 0 = no connection = gray)
        const moviesWithBoth = (this.themeMovies[theme1] && this.themeMovies[theme1][theme2]) ? this.themeMovies[theme1][theme2] : [];
        links.push({
          source: i,
          target: j,
          value: weight, // Can be 0 for no connections
          movies: moviesWithBoth,
          sourceTheme: theme1,
          targetTheme: theme2
        });

        // Mark both nodes as having connections only if weight > 0
        if (weight > 0) {
          nodesWithConnections.add(i);
          nodesWithConnections.add(j);
          // Collect related movies
          moviesWithBoth.forEach(m => relatedMoviesSet.add(m));
        }
      }
    }

    // Create curved path generator that curves inward toward center
    const linkPath = (d) => {
      // Validate that source and target indices are valid
      if (typeof d.source !== 'number' || typeof d.target !== 'number' ||
          d.source < 0 || d.source >= nodes.length ||
          d.target < 0 || d.target >= nodes.length) {
        console.warn('Invalid link indices:', d.source, d.target, 'nodes length:', nodes.length);
        return `M0,0L0,0`; // Return a minimal valid path for invalid links
      }
      
      const sourceNode = nodes[d.source];
      const targetNode = nodes[d.target];
      
      // Safety check: ensure nodes exist and have valid coordinates
      if (!sourceNode || !targetNode) {
        console.warn('Missing node:', { source: sourceNode, target: targetNode });
        return `M0,0L0,0`; // Return a minimal valid path
      }
      
      // Validate coordinates are numbers and within reasonable bounds
      if (typeof sourceNode.x !== 'number' || typeof sourceNode.y !== 'number' ||
          typeof targetNode.x !== 'number' || typeof targetNode.y !== 'number' ||
          isNaN(sourceNode.x) || isNaN(sourceNode.y) ||
          isNaN(targetNode.x) || isNaN(targetNode.y)) {
        console.warn('Invalid node coordinates:', {
          source: { x: sourceNode.x, y: sourceNode.y },
          target: { x: targetNode.x, y: targetNode.y },
          sourceTheme: d.sourceTheme,
          targetTheme: d.targetTheme
        });
        return `M0,0L0,0`; // Return a minimal valid path
      }
      
      // Check if coordinates are within SVG bounds (with some margin for safety)
      const margin = 100;
      if (sourceNode.x < -margin || sourceNode.x > this.width + margin ||
          sourceNode.y < -margin || sourceNode.y > this.height + margin ||
          targetNode.x < -margin || targetNode.x > this.width + margin ||
          targetNode.y < -margin || targetNode.y > this.height + margin) {
        console.warn('Node coordinates out of bounds:', {
          source: { x: sourceNode.x, y: sourceNode.y },
          target: { x: targetNode.x, y: targetNode.y },
          svgSize: { width: this.width, height: this.height },
          sourceTheme: d.sourceTheme,
          targetTheme: d.targetTheme
        });
        // Still draw the line, but log a warning
      }
      
      const dx = targetNode.x - sourceNode.x;
      const dy = targetNode.y - sourceNode.y;
      const dr = Math.sqrt(dx * dx + dy * dy);

      // If nodes are at the same position, return a straight line
      if (dr === 0) {
        return `M${sourceNode.x},${sourceNode.y}L${targetNode.x},${targetNode.y}`;
      }

      // Calculate center point
      const centerX = this.width / 2;
      const centerY = this.height / 2;
      
      // Calculate midpoint between source and target
      const midX = (sourceNode.x + targetNode.x) / 2;
      const midY = (sourceNode.y + targetNode.y) / 2;
      
      // Calculate direction from center to midpoint
      const toCenterX = centerX - midX;
      const toCenterY = centerY - midY;
      const toCenterDist = Math.sqrt(toCenterX * toCenterX + toCenterY * toCenterY);
      
      // Prevent division by zero
      if (toCenterDist === 0) {
        // If midpoint is exactly at center, use a simple curve
        const controlX = midX;
        const controlY = midY - dr * 0.3; // Curve upward
        return `M${sourceNode.x},${sourceNode.y}Q${controlX},${controlY} ${targetNode.x},${targetNode.y}`;
      }
      
      // Pull the curve inward by moving the control point toward the center
      const pullFactor = 0.5; // Increased pull factor to curve more inward
      const controlX = midX + (toCenterX / toCenterDist) * dr * pullFactor;
      const controlY = midY + (toCenterY / toCenterDist) * dr * pullFactor;
      
      // Validate control point
      if (isNaN(controlX) || isNaN(controlY)) {
        // Fallback to straight line if control point is invalid
        return `M${sourceNode.x},${sourceNode.y}L${targetNode.x},${targetNode.y}`;
      }
      
      // Create a quadratic bezier curve that curves inward
      return `M${sourceNode.x},${sourceNode.y}Q${controlX},${controlY} ${targetNode.x},${targetNode.y}`;
    };

    // Color for links: blue for connections, gray for no connections
    const linkColor = '#46AACB';
    const noConnectionColor = '#535353';
    
    // Calculate max value for thickness scaling
    const maxValue = d3.max(links, d => d.value) || 1;
    const minValue = d3.min(links, d => d.value) || 1;

    // Store original links for "All" view
    this.originalLinks = links;

    const tooltip = this.tooltip;

    // Filter out invalid links (where source or target index is out of bounds)
    // Also ensure both sourceTheme and targetTheme exist in allThemes
    const validLinks = links.filter(link => {
      // Check indices are valid
      if (typeof link.source !== 'number' || typeof link.target !== 'number' ||
          link.source < 0 || link.source >= nodes.length ||
          link.target < 0 || link.target >= nodes.length) {
        return false;
      }
      
      // Check nodes exist
      if (!nodes[link.source] || !nodes[link.target]) {
        return false;
      }
      
      // Check that both themes exist in allThemes array
      if (!allThemes.includes(link.sourceTheme) || !allThemes.includes(link.targetTheme)) {
        console.warn(`Filtering out link with missing theme: ${link.sourceTheme} -> ${link.targetTheme}`);
        return false;
      }
      
      // Check that node coordinates are valid
      const sourceNode = nodes[link.source];
      const targetNode = nodes[link.target];
      if (!sourceNode || !targetNode ||
          typeof sourceNode.x !== 'number' || typeof sourceNode.y !== 'number' ||
          typeof targetNode.x !== 'number' || typeof targetNode.y !== 'number' ||
          isNaN(sourceNode.x) || isNaN(sourceNode.y) ||
          isNaN(targetNode.x) || isNaN(targetNode.y)) {
        return false;
      }
      
      return true;
    });
    
    // Draw links (curved paths) with thickness based on connection count, fixed color
    // Thickness scale: min 1.5px, max based on value
    const minThickness = 1.5;
    const maxThickness = 8; // Maximum thickness for lines with most connections
    const thicknessScale = (value) => {
      if (maxValue === minValue) return minThickness;
      const t = (value - minValue) / (maxValue - minValue);
      return minThickness + (maxThickness - minThickness) * t;
    };
    
    const link = this.linkGroup
      .selectAll('path.link')
      .data(validLinks, d => `${d.sourceTheme}-${d.targetTheme}`)
      .join(
        enter => enter.append('path')
          .attr('class', 'link')
          .attr('d', linkPath)
          .attr('stroke', d => d.value > 0 ? linkColor : noConnectionColor)
          .attr('stroke-width', d => thicknessScale(d.value))
          .attr('fill', 'none')
          .attr('opacity', d => d.value > 0 ? 0.9 : 0.3)
          .style('stroke', d => d.value > 0 ? linkColor : noConnectionColor)
          .style('stroke-width', d => thicknessScale(d.value))
          .call(enter => enter.transition()
            .duration(this.transitionDuration)
            .attr('opacity', d => d.value > 0 ? 0.9 : 0.3)
          ),
        update => update
          .call(update => update.transition()
            .duration(this.transitionDuration)
            .attr('d', linkPath)
            .attr('stroke', d => d.value > 0 ? linkColor : noConnectionColor)
            .style('stroke', d => d.value > 0 ? linkColor : noConnectionColor)
            .attr('stroke-width', d => thicknessScale(d.value))
            .style('stroke-width', d => thicknessScale(d.value))
            .attr('opacity', d => d.value > 0 ? 0.9 : 0.3)
          ),
        exit => exit
          .call(exit => exit.transition()
            .duration(this.transitionDuration)
            .attr('opacity', 0)
            .remove()
          )
      )
      .on('mouseover', function(event, d) {
        // Highlight the hovered chord (only color change, no width change)
        d3.select(this)
          .attr('opacity', 1)
          .raise();

        // Highlight connected nodes (scale up images)
        const highlightSize = 75; // Increased to match hover size
        d3.selectAll('.node')
          .filter((n, i) => i === d.source || i === d.target)
          .select('image')
          .attr('width', highlightSize)
          .attr('height', highlightSize)
          .attr('x', -highlightSize / 2)
          .attr('y', -highlightSize / 2);

        let tooltipHTML = `
          <strong style="color: #46AACB;">${d.sourceTheme}</strong> ↔ <strong style="color: #46AACB;">${d.targetTheme}</strong><br/>
          <span style="color: #46AACB;">${d.value} movie${d.value !== 1 ? 's' : ''}</span> with both themes
          <div style="margin-top: 10px; max-height: 500px; overflow-y: auto; font-size: 11px; padding-left: 4px; padding-right: 8px;">
        `;

        d.movies.forEach(movie => {
          tooltipHTML += `<div style="padding: 3px 0;">• ${movie}</div>`;
        });

        tooltipHTML += `</div>`;

        tooltip
          .html(tooltipHTML)
          .style('opacity', 1);
      })
      .on('mouseout', function(event, d) {
        // Reset chord opacity (keep color and width based on value)
        d3.select(this)
          .attr('opacity', 0.9);

        // Reset node sizes
        const normalSize = 60; // Match the base image size
        d3.selectAll('.node')
          .select('image')
          .attr('width', normalSize)
          .attr('height', normalSize)
          .attr('x', -normalSize / 2)
          .attr('y', -normalSize / 2);

        tooltip.style('opacity', 0);
      });

    // Create nodes with transitions - DARK THEME
    const node = this.nodeGroup
      .selectAll('g.node')
      .data(nodes, d => d.id)
      .join(
        enter => {
          const self = this; // Store reference to ChordGraph instance
          const connectionsSet = nodesWithConnections; // Store reference to connections set
          const nodeEnter = enter.append('g')
            .attr('class', 'node')
            .attr('transform', d => `translate(${d.x},${d.y})`)
            .style('pointer-events', 'auto') // Enable pointer events on the node group
            .style('opacity', 0)
            .each(function(d) {
              // Get or create defs for clip paths
              let defs = self.svg.select('defs');
              if (defs.empty()) {
                defs = self.svg.append('defs');
              }
              
              // Image size constant
              const imageSize = 60; // Increased from 40 to 60
              
              const nodeGroup = d3.select(this);
              const imagePath = self.themeImages[d.label];
              
              // Check if this node has connections
              const hasConnections = connectionsSet.has(d.index);
              const imageOpacity = hasConnections ? 1 : 0.2; // Solid if has connections, transparent if not
              
              // Add the image - make it darker and more solid
              if (imagePath) {
                // Create a darker background circle behind the image for solid appearance
                nodeGroup.append('circle')
                  .attr('r', imageSize / 2)
                  .attr('fill', '#000000') // Solid black background
                  .attr('stroke', 'none')
                  .style('pointer-events', 'none')
                  .style('opacity', hasConnections ? 1 : 0.2)
                  .lower(); // Put it behind the image
                
                nodeGroup.append('image')
                  .attr('x', -imageSize / 2)
                  .attr('y', -imageSize / 2)
                  .attr('width', imageSize)
                  .attr('height', imageSize)
                  .attr('href', imagePath)
                  .attr('preserveAspectRatio', 'xMidYMid meet')
                  .style('pointer-events', 'none')
                  .style('opacity', hasConnections ? 1 : 0.2)
                  .attr('filter', 'url(#darkGrayscale)') // Use grayscale filter to keep images visible
                  .style('mix-blend-mode', 'normal')
                  .attr('data-has-connections', hasConnections ? 'true' : 'false');
              } else {
                console.warn('No image path found for theme:', d.label);
              }
              
              // Add circle for hover/click interactions (invisible but functional)
              // Make it larger to cover the whole image area, including hover scale-up
              const hoverSize = 90; // Increased to ensure full coverage
              const hoverCircle = nodeGroup.append('circle')
                .attr('r', hoverSize / 2) // Larger radius to cover entire image area
                .attr('cx', 0) // Center at origin
                .attr('cy', 0) // Center at origin
                .attr('fill', 'none')
                .attr('stroke', 'none')
                .style('cursor', 'pointer')
                .style('pointer-events', 'auto')
                .attr('class', 'hover-area'); // Add class for debugging
              
              // Ensure hover circle is on top
              hoverCircle.raise();
            });

          const labelGroup = nodeEnter.append('g')
            .attr('class', 'label-group')
            .style('pointer-events', 'none'); // Don't block events from image area

          // Remove the box/rectangle - only show text
          // labelGroup.append('rect') - REMOVED

          labelGroup.append('text')
            .attr('class', 'node-text')
            .attr('dy', 40)
            .attr('text-anchor', 'middle')
            .style('font-family', "'IBM Plex Sans', sans-serif")
            .style('font-size', '12px')
            .style('font-weight', '400')
            .style('fill', '#FFFFFF') // White color
            .style('letter-spacing', '0.5px')
            .style('pointer-events', 'none')
            .text(d => d.label);

          return nodeEnter.call(enter => enter.transition()
            .duration(this.transitionDuration)
            .style('opacity', 1)
          );
        },
        update => update
          .call(update => update.transition()
            .duration(this.transitionDuration)
            .attr('transform', d => `translate(${d.x},${d.y})`)
          ),
        exit => exit
          .call(exit => exit.transition()
            .duration(this.transitionDuration)
            .style('opacity', 0)
            .remove()
          )
      );

    // Node hover interactions — show movie popup for movies in this theme and window
    // Attach to both the node group and hover circle for better coverage
    node.on('mouseenter', (event, d) => {
      event.stopPropagation();
      console.log('Mouseenter on node:', d.label, 'Popup exists:', !!this.moviePopup, 'Target:', event.target);
      
      // Ensure popup is initialized
      if (!this.moviePopup) {
        console.error('Popup not initialized! Reinitializing...');
        // Try to reinitialize if missing
        this.initializeSVG({ width: this.width, height: this.height });
      }
      
      if (!this.moviePopup || !this.moviePopup.node()) {
        console.error('Popup still not available after reinit');
        return;
      }
      const nodeGroup = d3.select(event.currentTarget);
      // Scale up the image on hover
      const hoverSize = 75; // Increased from 50 to 75
      const image = nodeGroup.select('image');
      if (!image.empty()) {
        image
          .transition()
          .duration(200)
          .attr('width', hoverSize)
          .attr('height', hoverSize)
          .attr('x', -hoverSize / 2)
          .attr('y', -hoverSize / 2);
      }

        // Highlight connected chords (only blue ones, not gray)
        d3.selectAll('.link')
          .filter((l) => l.source === d.index || l.target === d.index)
          .each(function(linkData) {
            const currentStroke = d3.select(this).attr('stroke');
            // Only highlight if it's a blue link (has connections), not gray
            if (currentStroke === '#46AACB' || linkData.value > 0) {
              d3.select(this)
                .attr('stroke', '#46AACB')
                .attr('opacity', 1)
                .raise();
            }
          });

      // Find movies in the current window that have this theme
      const theme = d.label;
      let startYear = null;
      if (this.currentDecade) startYear = +this.currentDecade;
      let endYear = startYear ? startYear + 4 : null;
      // helper to parse a 4-digit year from various movie.year formats
      function parseYearField(y){
        if (!y && y !== 0) return 0;
        const s = String(y);
        const m = s.match(/(\d{4})/);
        if (m) return +m[1];
        return 0;
      }
      const moviesForTheme = this.movies.filter(m => {
        if (!m.themes || !m.themes.includes(theme)) return false;
        if (startYear !== null) {
          const y = parseYearField(m.year);
          if (!y || y < startYear || y > endYear) return false;
        }
        return true;
      }).map(m => m.title + (m.year ? ` (${m.year})` : ''));
      // sort alphabetically
      moviesForTheme.sort((a,b)=> a.localeCompare(b));
      
      // Get node position for popup placement
      const nodeX = d.x;
      const nodeY = d.y;
      
      // Always show popup when hovering, even if no movies (show theme info)
      console.log('Calling showMoviePopup with:', { theme, moviesCount: moviesForTheme.length, nodeX, nodeY });
      console.log('Popup before call:', {
        exists: !!this.moviePopup,
        nodeExists: !!(this.moviePopup && this.moviePopup.node()),
        currentDisplay: this.moviePopup ? window.getComputedStyle(this.moviePopup.node()).display : 'N/A'
      });
      
      // Force show the popup
      try {
        this.showMoviePopup(moviesForTheme, startYear, theme, nodeX, nodeY);
        
        // Immediately check and force visibility
        setTimeout(() => {
          if (this.moviePopup && this.moviePopup.node()) {
            const popup = this.moviePopup.node();
            const styles = window.getComputedStyle(popup);
            console.log('Popup styles after show:', {
              display: styles.display,
              visibility: styles.visibility,
              opacity: styles.opacity,
              zIndex: styles.zIndex,
              left: styles.left,
              top: styles.top,
              position: styles.position
            });
            
            // Force show if still hidden - use !important via setProperty
            if (styles.display === 'none' || styles.visibility === 'hidden' || parseFloat(styles.opacity) < 0.1) {
              console.warn('Popup is still hidden, forcing visibility with !important');
              popup.style.setProperty('display', 'block', 'important');
              popup.style.setProperty('visibility', 'visible', 'important');
              popup.style.setProperty('opacity', '1', 'important');
              popup.style.setProperty('z-index', '99999', 'important');
            }
          } else {
            console.error('Popup node is null in timeout check');
          }
        }, 10);
      } catch (error) {
        console.error('Error showing popup:', error, error.stack);
      }
    })
    .on('mouseout', (event, d) => {
      const nodeGroup = d3.select(event.currentTarget);
      const image = nodeGroup.select('image');
      const baseSize = 60; // Base size for the image

      if (!image.empty()) {
        image
          .transition()
          .duration(200)
          .attr('width', baseSize)
          .attr('height', baseSize)
          .attr('x', -baseSize / 2)
          .attr('y', -baseSize / 2);
      }

      // Reset chord colors (restore original colors: blue for connections, gray for no connections)
      d3.selectAll('.link')
        .each(function(linkData) {
          const weight = linkData.value || 0;
          const strokeColor = weight > 0 ? '#46AACB' : '#535353';
          const opacity = weight > 0 ? 0.9 : 0.3;
          d3.select(this)
            .attr('stroke', strokeColor)
            .attr('opacity', opacity);
        });

      this.hideMoviePopup();
    });

    // No color legend needed - using fixed color with thickness variation

    // Create circle border with white glow effect (but hide it behind nodes)
    this.createCircleBorder(centerX, centerY, radius);
    
    // Create invisible divs above each node for hover interactions
    setTimeout(() => {
      // Always create/update hover divs for this graph instance
      if (!this.nodeHoverDivs || this.nodeHoverDivs.length === 0 || this.nodeHoverDivs.length !== nodes.length) {
        this.createNodeHoverDivs(nodes);
      }
      this.updateNodeHoverDivs(nodes);
      
      // For main graph, continuously update hover divs to keep them in sync
      if (this.containerId === 'chordContainer') {
        // Clear any existing update interval
        if (this.hoverUpdateInterval) {
          clearInterval(this.hoverUpdateInterval);
        }
        // Store nodes reference for continuous updates
        this.currentNodes = nodes;
        // Update hover divs every 100ms to keep them in sync with node positions
        this.hoverUpdateInterval = setInterval(() => {
          if (this.currentNodes && this.currentNodes.length > 0 && this.svg && this.svg.node()) {
            // Get current node positions from DOM
            const nodeElements = this.nodeGroup.selectAll('g.node');
            if (!nodeElements.empty()) {
              nodeElements.each(function(d) {
                if (d) {
                  // Update node position from transform attribute
                  const transform = d3.select(this).attr('transform');
                  if (transform) {
                    const match = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
                    if (match) {
                      d.x = parseFloat(match[1]);
                      d.y = parseFloat(match[2]);
                    }
                  }
                }
              });
              this.updateNodeHoverDivs(this.currentNodes);
            }
          }
        }, 100);
      }
    }, 200);
    
    // Hide the circle border behind nodes by lowering it
    if (this.circleGroup) {
      this.circleGroup.lower(); // Put circle behind nodes
    }

    // Return stats for display
    return {
      themeCount: nodes.length,
      connectionCount: links.length,
      relatedMovieCount: relatedMoviesSet.size
    };
  }

  /**
   * Create a circle border around the chord graph with white glow effect
   */
  createCircleBorder(centerX, centerY, radius) {
    // Remove existing circle if present
    if (this.circleGroup) {
      this.circleGroup.selectAll('circle').remove();
    } else {
      // Create circle group if it doesn't exist
      this.circleGroup = this.g.append('g').attr('class', 'circle-border');
    }

    // Calculate circle radius to be in the center of the nodes
    const circleRadius = radius - 0; // At node radius

    // Create outer gradient circle that fades away from the edge outward (small, subtle effect)
    const gradientRadius = circleRadius + 30; // Small extension outward for subtle fade
    
    // Create a unique gradient for this circle instance (properly sized)
    const gradientId = `whiteRadialGradient_${Date.now()}`;
    const defs = this.svg.select('defs');
    
    // Create radial gradient using userSpaceOnUse with focal radius (fr) to start at circle edge
    const radialGradient = defs.append('radialGradient')
      .attr('id', gradientId)
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('r', gradientRadius)
      .attr('fx', centerX)
      .attr('fy', centerY)
      .attr('fr', circleRadius); // Focal radius starts at circle edge - this makes it work!
    
    // Gradient starts dimmer at the edge and gets more transparent as it goes outward
    // Offset 0% = circle edge (fr), 100% = outer edge (r)
    radialGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#ffffff')
      .attr('stop-opacity', '0.15'); // Dimmer white at edge
    
    radialGradient.append('stop')
      .attr('offset', '20%')
      .attr('stop-color', '#ffffff')
      .attr('stop-opacity', '0.1');
    
    radialGradient.append('stop')
      .attr('offset', '40%')
      .attr('stop-color', '#ffffff')
      .attr('stop-opacity', '0.06');
    
    radialGradient.append('stop')
      .attr('offset', '60%')
      .attr('stop-color', '#ffffff')
      .attr('stop-opacity', '0.03');
    
    radialGradient.append('stop')
      .attr('offset', '80%')
      .attr('stop-color', '#ffffff')
      .attr('stop-opacity', '0.012');
    
    radialGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#ffffff')
      .attr('stop-opacity', '0'); // Fully transparent at outer edge
    
    // Create a unique mask for this circle instance
    const maskId = `circleMask_${Date.now()}`;
    
    // Create mask to clip gradient so it only shows OUTSIDE the main circle
    // In SVG masks: white = visible, black = hidden
    const mask = defs.append('mask')
      .attr('id', maskId);
    
    // White rectangle (shows everything initially)
    mask.append('rect')
      .attr('x', centerX - gradientRadius)
      .attr('y', centerY - gradientRadius)
      .attr('width', gradientRadius * 2)
      .attr('height', gradientRadius * 2)
      .attr('fill', 'white');
    
    // Black circle (hides the inside) - this creates the "hole" to hide inside
    mask.append('circle')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('r', circleRadius)
      .attr('fill', 'black'); // Black hides, so inside circle is hidden
    
    // Create gradient circle with mask (only shows outside the main circle) - subtle effect
    this.circleGroup.append('circle')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('r', gradientRadius)
      .attr('fill', `url(#${gradientId})`)
      .attr('mask', `url(#${maskId})`)
      .attr('opacity', '1') // Full opacity, gradient handles the fade
      .style('pointer-events', 'none'); // Don't interfere with interactions
    
    // Don't create the main circle - it interferes with node images
    // The images should appear solid without the circle behind them
  }

  /**
   * Create a color gradient legend showing connection count scale
   */
  createColorLegend(maxValue, minValue, colorScale) {
    // Safety check: ensure SVG exists
    if (!this.svg || !this.svg.node()) {
      return;
    }

    // Remove existing legend and gradient if present
    d3.select('#chordColorLegend').remove();
    d3.select('#chordGradient').remove();

    const legendWidth = 200;
    const legendHeight = 20;
    const legendMargin = { top: 20, right: 20, bottom: 40, left: 20 };
    const legendX = this.width - legendWidth - legendMargin.right;
    const legendY = this.height - legendHeight - legendMargin.bottom;

    // Ensure defs exists
    let defs = this.svg.select('defs');
    if (defs.empty()) {
      defs = this.svg.append('defs');
    }

    // Create gradient definition
    const gradientId = 'chordGradient';
    const gradient = defs.append('linearGradient')
      .attr('id', gradientId)
      .attr('x1', '0%')
      .attr('x2', '100%');

    // Add gradient stops
    const numStops = 10;
    for (let i = 0; i <= numStops; i++) {
      const value = minValue + (maxValue - minValue) * (i / numStops);
      const color = typeof colorScale === 'function' ? colorScale(value) : colorScale(value);
      gradient.append('stop')
        .attr('offset', `${(i / numStops) * 100}%`)
        .attr('stop-color', color);
    }

    // Create legend group
    const legendGroup = this.svg.append('g')
      .attr('id', 'chordColorLegend')
      .attr('transform', `translate(${legendX}, ${legendY})`);

    // Draw gradient rectangle
    legendGroup.append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .attr('fill', `url(#${gradientId})`)
      .attr('stroke', '#666666')
      .attr('stroke-width', 1);

    // Add labels
    legendGroup.append('text')
      .attr('x', 0)
      .attr('y', -5)
      .attr('font-family', "'IBM Plex Sans', sans-serif")
      .attr('font-size', '11px')
      .attr('fill', '#cccccc')
      .text('Connections');

    legendGroup.append('text')
      .attr('x', 0)
      .attr('y', legendHeight + 20)
      .attr('font-family', "'IBM Plex Sans', sans-serif")
      .attr('font-size', '10px')
      .attr('fill', '#999999')
      .text(`${Math.round(minValue)}`);

    legendGroup.append('text')
      .attr('x', legendWidth)
      .attr('y', legendHeight + 20)
      .attr('text-anchor', 'end')
      .attr('font-family', "'IBM Plex Sans', sans-serif")
      .attr('font-size', '10px')
      .attr('fill', '#999999')
      .text(`${Math.round(maxValue)}`);
  }

  /**
   * Reset zoom to default view (disabled - graph is fixed in place)
   */
  resetZoom() {
    // Zoom/pan functionality disabled - graph stays in fixed position
  }

  /**
   * Toggle label visibility
   */
  toggleLabels() {
    this.showLabels = !this.showLabels;
    d3.selectAll('.label-group')
      .transition()
      .duration(300)
      .style('opacity', this.showLabels ? 1 : 0);
  }

  /**
   * Set the current decade (e.g., 1960) to highlight links/nodes that co-occurred in that decade.
   * Passing null resets visuals to the full-movie view.
   */
  setDecade(decade) {
    // helper to parse a 4-digit year from various movie.year formats
    function parseYearField(y){
      if (!y && y !== 0) return 0;
      const s = String(y);
      const m = s.match(/(\d{4})/);
      if (m) return +m[1];
      return 0;
    }

    // Color constants for links
    const linkColor = '#46AACB';
    const noConnectionColor = '#535353';
    
    // If null, reset to default visuals based on overall cooccurrence
    if (!decade) {
      // Use stored original links if available
      if (this.originalLinks) {
        const allMaxValue = d3.max(this.originalLinks, d => d.value) || 1;
        const allMinValue = d3.min(this.originalLinks, d => d.value) || 1;
        
        // Thickness scale function
        const minThickness = 1.5;
        const maxThickness = 8;
        const thicknessScale = (value) => {
          if (allMaxValue === allMinValue) return minThickness;
          const t = (value - allMinValue) / (allMaxValue - allMinValue);
          return minThickness + (maxThickness - minThickness) * t;
        };

        // reset links with fixed color and thickness based on connections
        d3.selectAll('.link').each(function(d){
          try {
            if (d && d.value !== undefined) {
              const strokeWidth = thicknessScale(d.value);
              d3.select(this)
                .transition().duration(300)
                .attr('stroke', linkColor)
                .style('stroke', linkColor)
                .attr('stroke-width', strokeWidth)
                .style('stroke-width', strokeWidth)
                .style('opacity', 0.9);
            }
          } catch(e){}
        });
      }
      // Update node images - all COMPLETELY opaque (no transparency) when showing "All"
      d3.selectAll('.node').each(function(d){
        try {
          const image = d3.select(this).select('image');
          if (image && !image.empty()) {
            image.transition().duration(300)
              .style('opacity', '1')
              .style('opacity', 1)
              .attr('data-has-connections', 'true');
          }
        } catch(e){}
      });
      // hide popup when showing 'All'
      try { this.hideMoviePopup(); } catch(e){}
      return;
    }

  const startYear = +decade;
  // Use a 5-year window (start..start+4) so setDecade updates match the timeline's 5-year steps
  const endYear = startYear + 4;

    // compute cooccurrence limited to the decade
    const windowCo = {};
    this.movies.forEach(m => {
      const y = parseYearField(m.year);
      if (!y) return;
      if (y < startYear || y > endYear) return;
      const t = (m.themes || []).filter(Boolean);
      for (let i=0;i<t.length;i++){
        for (let j=i+1;j<t.length;j++){
          const a = t[i], b = t[j];
          windowCo[a] = windowCo[a] || {};
          windowCo[b] = windowCo[b] || {};
          windowCo[a][b] = (windowCo[a][b]||0) + 1;
          windowCo[b][a] = (windowCo[b][a]||0) + 1;
        }
      }
    });

    // Track which themes have connections in this decade
    const themesWithConnections = new Set();
    Object.keys(windowCo).forEach(theme => {
      const connections = windowCo[theme];
      if (connections && Object.keys(connections).length > 0) {
        themesWithConnections.add(theme);
      }
    });
    
    // compute max weight for color scale
    let maxW = 0;
    Object.keys(windowCo).forEach(a => {
      Object.keys(windowCo[a]||{}).forEach(b => { maxW = Math.max(maxW, windowCo[a][b] || 0); });
    });

    // Thickness scale for this decade window
    const minWindowValue = 1;
    const maxWindowValue = maxW || 1;
    const minThickness = 1.5;
    const maxThickness = 8;
    const thicknessScale = (value) => {
      if (maxWindowValue === minWindowValue) return minThickness;
      const t = (value - minWindowValue) / (maxWindowValue - minWindowValue);
      return minThickness + (maxThickness - minThickness) * t;
    };

    // update links with fixed color and thickness based on connection count
    d3.selectAll('.link').each(function(d){
      try {
        const a = d.sourceTheme || (d.source && d.source.label) || d.source;
        const b = d.targetTheme || (d.target && d.target.label) || d.target;
        const weight = (windowCo[a] && windowCo[a][b]) ? windowCo[a][b] : 0;
        const opacity = weight > 0 ? 0.9 : 0.3;
        const strokeW = weight > 0 ? thicknessScale(weight) : 1;
        const strokeColor = weight > 0 ? linkColor : noConnectionColor; // Blue for connections, gray for no connections
        
        // Only update if both themes exist in the current window
        if (!a || !b) {
          // Show links in gray even if themes don't exist in current window
          d3.select(this).transition().duration(300)
            .attr('stroke', noConnectionColor)
            .style('stroke', noConnectionColor)
            .style('opacity', 0.3)
            .style('display', 'block');
          return;
        }
        
        // Apply color: blue for connections, gray for no connections
        d3.select(this).transition().duration(300)
          .attr('stroke', strokeColor)
          .style('stroke', strokeColor)
          .attr('stroke-width', strokeW)
          .style('stroke-width', strokeW)
          .style('opacity', opacity)
          .style('display', 'block'); // Always show, regardless of weight
      } catch(e){}
    });

    // update node images - make transparent if no connections, completely opaque and dark if has connections
    d3.selectAll('.node').each(function(d){
      try {
        const theme = d && d.label ? d.label : (d.id || d);
        let hasConnections = false;
        if (windowCo[theme]) {
          for (const k in windowCo[theme]) { 
            if ((windowCo[theme][k]||0) > 0) { 
              hasConnections = true; 
              break; 
            } 
          }
        }
        const g = d3.select(this);
        const image = g.select('image');
        const bgCircle = g.select('circle').filter(function() {
          // Find the background circle (first circle, not the interaction circle)
          return d3.select(this).attr('fill') === '#000000';
        });
        
        if (image && !image.empty()) {
          // Update image opacity: COMPLETELY opaque (opacity 1, NO transparency) if has connections, transparent if not
          if (hasConnections) {
            image.transition().duration(300)
              .style('opacity', 1)
              .attr('filter', 'url(#darkGrayscale)')
              .attr('data-has-connections', 'true');
            
            // Update background circle
            if (!bgCircle.empty()) {
              bgCircle.transition().duration(300)
                .style('opacity', 1);
            }
          } else {
            image.transition().duration(300)
              .style('opacity', 0.2)
              .attr('filter', 'url(#darkGrayscale)')
              .attr('data-has-connections', 'false');
            
            // Update background circle
            if (!bgCircle.empty()) {
              bgCircle.transition().duration(300)
                .style('opacity', 0.2);
            }
          }
        }
      } catch(e){}
    });

    // Remove automatic popup on scroll — only show on node hover now
      try { this.hideMoviePopup(); } catch(e){}
    }

  /**
   * Create invisible divs above each node for hover interactions
   */
  createNodeHoverDivs(nodes) {
    // Remove only hover divs for this specific container
    d3.selectAll(`.node-hover-div[data-container="${this.containerId}"]`).remove();
    
    // Store reference to nodes for positioning
    this.nodeHoverDivs = [];
    
    nodes.forEach((nodeData, index) => {
      // Use lower z-index than navigation menu (menu is 10000) to prevent blocking
      // Reduce hover size to prevent interference with navigation menu area
      const zIndex = this.containerId === 'chordContainer' ? '9999' : '10000';
      const hoverSize = this.containerId === 'chordContainer' ? '140px' : '180px';
      
      const hoverDiv = d3.select('body')
        .append('div')
        .attr('class', 'node-hover-div')
        .attr('data-container', this.containerId)
        .style('position', 'fixed')
        .style('width', hoverSize)
        .style('height', hoverSize)
        .style('background', 'transparent')
        .style('pointer-events', 'auto')
        .style('cursor', 'none')
        .style('z-index', zIndex)
        .style('opacity', '0')
        .datum(nodeData);
      
      this.nodeHoverDivs.push(hoverDiv);
      
      // Attach hover events
      hoverDiv
        .on('mouseenter', (event, d) => {
          event.stopPropagation();
          // Add cursor hover effect
          const cursorEl = document.getElementById('cursorCircle');
          if (cursorEl) {
            cursorEl.classList.add('hover');
            cursorEl.style.setProperty('width', '45px', 'important');
            cursorEl.style.setProperty('height', '45px', 'important');
            cursorEl.style.setProperty('opacity', '0.7', 'important');
            cursorEl.style.setProperty('background', 'white', 'important');
          }
          this.handleNodeHover(d, event);
        })
        .on('mouseleave', (event, d) => {
          event.stopPropagation();
          // Remove cursor hover effect
          const cursorEl = document.getElementById('cursorCircle');
          if (cursorEl) {
            cursorEl.classList.remove('hover');
            cursorEl.style.setProperty('width', '18px', 'important');
            cursorEl.style.setProperty('height', '18px', 'important');
            cursorEl.style.setProperty('opacity', '1', 'important');
            cursorEl.style.setProperty('background', 'rgba(200, 200, 200, 0.5)', 'important');
          }
          this.handleNodeHoverOut(d, event);
        });
    });
  }

  /**
   * Update positions of invisible hover divs based on node positions
   */
  updateNodeHoverDivs(nodes) {
    if (!this.nodeHoverDivs || !this.svg || !this.svg.node()) {
      if (nodes && nodes.length > 0) {
        this.createNodeHoverDivs(nodes);
      }
      return;
    }
    
    if (!nodes || nodes.length === 0) return;
    
    // Ensure we have enough hover divs
    while (this.nodeHoverDivs.length < nodes.length) {
      // Use lower z-index than navigation menu (menu is 10000) to prevent blocking
      // Reduce hover size to prevent interference with navigation menu area
      const zIndex = this.containerId === 'chordContainer' ? '9999' : '10000';
      const hoverSize = this.containerId === 'chordContainer' ? '140px' : '180px';
      
      const hoverDiv = d3.select('body')
        .append('div')
        .attr('class', 'node-hover-div')
        .attr('data-container', this.containerId)
        .style('position', 'fixed')
        .style('width', hoverSize)
        .style('height', hoverSize)
        .style('background', 'transparent')
        .style('pointer-events', 'auto')
        .style('cursor', 'none')
        .style('z-index', zIndex)
        .style('opacity', '0')
        .datum(nodes[this.nodeHoverDivs.length]);
      
      hoverDiv
        .on('mouseenter', (event, d) => {
          // Add cursor hover effect
          const cursorEl = document.getElementById('cursorCircle');
          if (cursorEl) {
            cursorEl.classList.add('hover');
            cursorEl.style.setProperty('width', '45px', 'important');
            cursorEl.style.setProperty('height', '45px', 'important');
            cursorEl.style.setProperty('opacity', '0.7', 'important');
            cursorEl.style.setProperty('background', 'white', 'important');
          }
          this.handleNodeHover(d, event);
        })
        .on('mouseleave', (event, d) => {
          // Remove cursor hover effect
          const cursorEl = document.getElementById('cursorCircle');
          if (cursorEl) {
            cursorEl.classList.remove('hover');
            cursorEl.style.setProperty('width', '18px', 'important');
            cursorEl.style.setProperty('height', '18px', 'important');
            cursorEl.style.setProperty('opacity', '1', 'important');
            cursorEl.style.setProperty('background', 'rgba(200, 200, 200, 0.5)', 'important');
          }
          this.handleNodeHoverOut(d, event);
        });
      
      this.nodeHoverDivs.push(hoverDiv);
    }
    
    nodes.forEach((nodeData, index) => {
      if (!this.nodeHoverDivs[index]) return;
      
      // Update datum
      this.nodeHoverDivs[index].datum(nodeData);
      
      // Convert SVG coordinates to screen coordinates
      const svgPoint = this.svg.node().createSVGPoint();
      svgPoint.x = nodeData.x;
      svgPoint.y = nodeData.y;
      const svgMatrix = this.svg.node().getScreenCTM();
      if (!svgMatrix) return;
      
      const screenPoint = svgPoint.matrixTransform(svgMatrix);
      
      // Position div above the node
      // Reduced hover area to prevent interference with navigation menu
      const divSize = this.containerId === 'chordContainer' ? 140 : 180;
      const offsetY = -60;
      
      // Calculate hover div position
      let left = screenPoint.x - divSize / 2;
      let top = screenPoint.y - divSize / 2 + offsetY;
      
      // Navigation menu area: top-right corner (approximately 40px from top and right)
      // Disable pointer events if hover div overlaps with menu area
      const menuAreaRight = window.innerWidth - 40;
      const menuAreaTop = 40;
      const menuAreaWidth = 200; // Approximate menu width
      const menuAreaHeight = 300; // Approximate menu height
      
      const hoverRight = left + divSize;
      const hoverBottom = top + divSize;
      const hoverTop = top;
      const hoverLeft = left;
      
      // Check if hover div overlaps with navigation menu area
      const overlapsMenu = hoverRight > menuAreaRight - menuAreaWidth && 
                          hoverTop < menuAreaTop + menuAreaHeight &&
                          hoverLeft < menuAreaRight;
      
      this.nodeHoverDivs[index]
        .style('left', `${left}px`)
        .style('top', `${top}px`)
        .style('display', 'block')
        .style('visibility', 'visible')
        .style('pointer-events', overlapsMenu ? 'none' : 'auto') // Disable if overlaps menu
        .style('opacity', '0');
    });
  }

  /**
   * Handle node hover - show popup
   */
  handleNodeHover(d, event) {
    event.stopPropagation();
    
    if (!this.moviePopup || !this.moviePopup.node()) {
      if (!this.svg || !this.svg.node()) {
        this.initializeSVG({ width: this.width, height: this.height });
      }
    }
    
    if (!this.moviePopup || !this.moviePopup.node()) {
      return;
    }
    
    const theme = d.label;
    let startYear = null;
    if (this.currentDecade) startYear = +this.currentDecade;
    let endYear = startYear ? startYear + 4 : null;
    
    function parseYearField(y){
      if (!y && y !== 0) return 0;
      const s = String(y);
      const m = s.match(/(\d{4})/);
      if (m) return +m[1];
      return 0;
    }
    
    const moviesForTheme = this.movies.filter(m => {
      if (!m.themes || !m.themes.includes(theme)) return false;
      if (startYear !== null) {
        const y = parseYearField(m.year);
        if (!y || y < startYear || y > endYear) return false;
      }
      return true;
    }).map(m => m.title + (m.year ? ` (${m.year})` : ''));
    
    moviesForTheme.sort((a,b)=> a.localeCompare(b));
    
    const nodeX = d.x;
    const nodeY = d.y;
    
    this.showMoviePopup(moviesForTheme, startYear, theme, nodeX, nodeY);
    
    const nodeGroup = this.nodeGroup.selectAll('g.node')
      .filter(node => node.id === d.id);
    
    const hoverSize = 75;
    const image = nodeGroup.select('image');
    if (!image.empty()) {
      image
        .transition()
        .duration(200)
        .attr('width', hoverSize)
        .attr('height', hoverSize)
        .attr('x', -hoverSize / 2)
        .attr('y', -hoverSize / 2);
    }
    
    d3.selectAll('.link')
      .filter((l) => l.source === d.index || l.target === d.index)
      .each(function(linkData) {
        const currentStroke = d3.select(this).attr('stroke');
        if (currentStroke === '#46AACB' || linkData.value > 0) {
          d3.select(this)
            .attr('stroke', '#46AACB')
            .attr('opacity', 1)
            .raise();
        }
      });
  }

  /**
   * Handle node hover out - hide popup
   */
  handleNodeHoverOut(d, event) {
    event.stopPropagation();
    
    this.hideMoviePopup();
    
    const nodeGroup = this.nodeGroup.selectAll('g.node')
      .filter(node => node.id === d.id);
    const image = nodeGroup.select('image');
    const baseSize = 60;
    if (!image.empty()) {
      image
        .transition()
        .duration(200)
        .attr('width', baseSize)
        .attr('height', baseSize)
        .attr('x', -baseSize / 2)
        .attr('y', -baseSize / 2);
    }
    
    d3.selectAll('.link')
      .each(function(linkData) {
        const weight = linkData.value || 0;
        const strokeColor = weight > 0 ? '#46AACB' : '#535353';
        const opacity = weight > 0 ? 0.9 : 0.3;
        d3.select(this)
          .attr('stroke', strokeColor)
          .attr('opacity', opacity);
      });
  }
  
    /**
   * Get movie titles for search/autocomplete
   */
  getMovieTitles() {
    return this.movies.map(m => m.title).sort();
  }

  /**
   * Get themes for a specific movie
   */
  getMovieThemes(movieTitle) {
    const movie = this.movies.find(m => m.title === movieTitle);
    return movie ? movie.themes : [];
  }

}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChordGraph;
}
