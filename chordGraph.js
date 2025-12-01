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
      if (!this.moviePopup) {
        console.error('Movie popup not initialized!');
        return;
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
        <div style="font-weight:700; margin-bottom:12px; color:#ffffff; font-size:18px;">${themeName}</div>
        <div style="font-size:13px; color:#ffffff; line-height:1.6; margin-bottom:16px; opacity:0.95;">
          ${description}
        </div>
        <div style="font-size:12px; color:#ffffff; line-height:1.8; margin-top:12px;">
          ${formattedMovies.map(m => `<div style="padding:4px 0;">${m}</div>`).join('')}
        </div>
      `;

      // Show the popup - make absolutely sure it's visible
      this.moviePopup
        .html(html)
        .style('display', 'block')
        .style('visibility', 'visible')
        .style('opacity', 1)
        .style('pointer-events', 'auto')
        .style('z-index', '99999'); // Extremely high z-index

      // Position the popup to the right of the node
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
        const screenPoint = svgPoint.matrixTransform(svgMatrix);
        
        const offsetX = 60; // Distance from node
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
        
        // Set position and make fully visible
        this.moviePopup
          .style('left', `${left}px`)
          .style('top', `${top}px`)
          .style('position', 'fixed')
          .style('opacity', 1)
          .style('display', 'block')
          .style('visibility', 'visible')
          .style('z-index', '99999'); // Extremely high z-index
        
        // Draw connecting line from node to popup
        if (this.popupLine && this.svg) {
          // Node position is in SVG coordinates (relative to SVG)
          const nodeSvgX = nodeX;
          const nodeSvgY = nodeY;
          
          // Popup position is in screen coordinates, need to convert to SVG coordinates
          const svgRect = this.svg.node().getBoundingClientRect();
          const popupCenterX = left + popupRect.width / 2 - svgRect.left;
          const popupCenterY = top + popupRect.height / 2 - svgRect.top;
          
          this.popupLine
            .attr('x1', nodeSvgX)
            .attr('y1', nodeSvgY)
            .attr('x2', popupCenterX)
            .attr('y2', popupCenterY)
            .attr('opacity', 1);
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
    
    // Create SVG filter to make images completely solid black
    const solidBlackFilter = defs.append('filter')
      .attr('id', 'solidBlack')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    
    // Convert to grayscale first
    solidBlackFilter.append('feColorMatrix')
      .attr('type', 'saturate')
      .attr('values', '0')
      .attr('result', 'grayscale');
    
    // Make it completely black using component transfer
    const blackTransfer = solidBlackFilter.append('feComponentTransfer')
      .attr('in', 'grayscale')
      .attr('result', 'black');
    
    blackTransfer.append('feFuncR')
      .attr('type', 'linear')
      .attr('slope', '0')
      .attr('intercept', '0');
    
    blackTransfer.append('feFuncG')
      .attr('type', 'linear')
      .attr('slope', '0')
      .attr('intercept', '0');
    
    blackTransfer.append('feFuncB')
      .attr('type', 'linear')
      .attr('slope', '0')
      .attr('intercept', '0');
    
    // Apply threshold to make it completely solid - convert any visible pixel to pure black
    const thresholdTransfer = solidBlackFilter.append('feComponentTransfer')
      .attr('in', 'black')
      .attr('result', 'threshold');
    
    // Use discrete transfer to force all non-transparent pixels to be pure black
    thresholdTransfer.append('feFuncR')
      .attr('type', 'discrete')
      .attr('tableValues', '0');
    
    thresholdTransfer.append('feFuncG')
      .attr('type', 'discrete')
      .attr('tableValues', '0');
    
    thresholdTransfer.append('feFuncB')
      .attr('type', 'discrete')
      .attr('tableValues', '0');
    
    thresholdTransfer.append('feFuncA')
      .attr('type', 'discrete')
      .attr('tableValues', '1');
    
    const solidMerge = solidBlackFilter.append('feMerge');
    solidMerge.append('feMergeNode').attr('in', 'threshold');

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
      .style('font-family', "'Courier New', monospace")
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

      // Create a semi-transparent gray movie popup (matches the attached image) — hidden by default
      // Append to body instead of container to avoid positioning issues
      this.moviePopup = d3.select('body')
        .append('div')
        .attr('class', 'movie-popup')
        .style('position', 'fixed') // Fixed positioning for viewport-relative placement
        .style('min-width', '320px')
        .style('max-width', '420px')
        .style('background', 'rgba(140, 140, 140, 0.9)') // Semi-transparent light gray (matches image)
        .style('color', '#ffffff')
        .style('border-radius', '8px')
        .style('padding', '24px')
        .style('opacity', 0)
        .style('pointer-events', 'none')
        .style('display', 'none')
        .style('z-index', '99999') // Extremely high z-index to ensure it's on top
        .style('font-family', "'Courier New', monospace")
        .style('font-size', '13px')
        .style('max-height', '600px')
        .style('overflow-y', 'auto')
        .style('backdrop-filter', 'blur(2px)')
        .style('box-shadow', '0 8px 32px rgba(0, 0, 0, 0.4)');
      
      console.log('Popup created:', this.moviePopup.node());
      
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
        const weight = this.themeCooccurrence[allThemes[i]][allThemes[j]] || 0;
        if (weight > 0) {
          const moviesWithBoth = this.themeMovies[allThemes[i]][allThemes[j]] || [];
          links.push({
            source: i,
            target: j,
            value: weight,
            movies: moviesWithBoth,
            sourceTheme: allThemes[i],
            targetTheme: allThemes[j]
          });

          // Mark both nodes as having connections
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
        return `M0,0L0,0`; // Return a minimal valid path for invalid links
      }
      
      const sourceNode = nodes[d.source];
      const targetNode = nodes[d.target];
      
      // Safety check: ensure nodes exist and have valid coordinates
      if (!sourceNode || !targetNode || 
          typeof sourceNode.x !== 'number' || typeof sourceNode.y !== 'number' ||
          typeof targetNode.x !== 'number' || typeof targetNode.y !== 'number' ||
          isNaN(sourceNode.x) || isNaN(sourceNode.y) ||
          isNaN(targetNode.x) || isNaN(targetNode.y)) {
        return `M0,0L0,0`; // Return a minimal valid path
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

    // Fixed color for all links - no gradient
    const linkColor = '#46AACB';
    
    // Calculate max value for thickness scaling
    const maxValue = d3.max(links, d => d.value) || 1;
    const minValue = d3.min(links, d => d.value) || 1;

    // Store original links for "All" view
    this.originalLinks = links;

    const tooltip = this.tooltip;

    // Filter out invalid links (where source or target index is out of bounds)
    const validLinks = links.filter(link => {
      return typeof link.source === 'number' && typeof link.target === 'number' &&
             link.source >= 0 && link.source < nodes.length &&
             link.target >= 0 && link.target < nodes.length &&
             nodes[link.source] && nodes[link.target];
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
          .attr('stroke', linkColor)
          .attr('stroke-width', d => thicknessScale(d.value))
          .attr('fill', 'none')
          .attr('opacity', 0.9)
          .style('stroke', linkColor)
          .style('stroke-width', d => thicknessScale(d.value))
          .call(enter => enter.transition()
            .duration(this.transitionDuration)
            .attr('opacity', 0.9)
          ),
        update => update
          .call(update => update.transition()
            .duration(this.transitionDuration)
            .attr('d', linkPath)
            .attr('stroke', linkColor)
            .style('stroke', linkColor)
            .attr('stroke-width', d => thicknessScale(d.value))
            .style('stroke-width', d => thicknessScale(d.value))
            .attr('opacity', 0.9)
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
                  .style('opacity', hasConnections ? '1' : '0.2')
                  .style('opacity', hasConnections ? 1 : 0.2)
                  .attr('filter', 'url(#solidBlack)') // Use SVG filter to make completely solid black
                  .style('mix-blend-mode', 'normal')
                  .style('filter', 'url(#solidBlack) brightness(0) contrast(3)') // Make darker and more solid
                  .attr('data-has-connections', hasConnections ? 'true' : 'false');
              } else {
                console.warn('No image path found for theme:', d.label);
              }
              
              // Add circle for hover/click interactions (invisible but functional)
              // Make it larger to cover the whole image area, including hover scale-up
              const hoverSize = 75; // Match the hover size
              nodeGroup.append('circle')
                .attr('r', hoverSize / 2) // Larger radius to cover entire image area
                .attr('cx', 0) // Center at origin
                .attr('cy', 0) // Center at origin
                .attr('fill', 'none')
                .attr('stroke', 'none')
                .style('cursor', 'pointer')
                .style('pointer-events', 'auto')
                .raise(); // Ensure it's on top for event handling
            });

          const labelGroup = nodeEnter.append('g')
            .attr('class', 'label-group')
            .style('pointer-events', 'none'); // Don't block events from image area

          labelGroup.append('rect')
            .attr('class', 'node-label-bg')
            .attr('rx', 3)
            .attr('fill', '#1a1a1a')
            .attr('stroke', '#333333')
            .attr('stroke-width', 1)
            .attr('opacity', 0.9)
            .style('pointer-events', 'none'); // Don't block events

          labelGroup.append('text')
            .attr('class', 'node-text')
            .attr('dy', 40)
            .attr('text-anchor', 'middle')
            .style('font-family', "'Courier New', monospace")
            .style('font-size', '12px')
            .style('font-weight', '400')
            .style('fill', '#cccccc')
            .style('letter-spacing', '0.5px')
            .style('pointer-events', 'none')
            .text(d => d.label)
            .each(function() {
              const bbox = this.getBBox();
              d3.select(this.parentNode).select('rect')
                .attr('x', bbox.x - 4)
                .attr('y', bbox.y - 2)
                .attr('width', bbox.width + 8)
                .attr('height', bbox.height + 4);
            });

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
    // Use mouseenter instead of mouseover for more reliable triggering
    node.on('mouseenter', (event, d) => {
      event.stopPropagation();
      console.log('Mouseenter on node:', d.label, 'Popup exists:', !!this.moviePopup);
      if (!this.moviePopup) {
        console.error('Popup not initialized!');
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

        // Highlight connected chords
        d3.selectAll('.link')
          .filter((l) => l.source === d.index || l.target === d.index)
          .attr('stroke', '#46AACB')
          .attr('opacity', 1)
          .raise();

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
      this.showMoviePopup(moviesForTheme, startYear, theme, nodeX, nodeY);
    })
    .on('mouseout', (event, d) => {
      const nodeGroup = d3.select(event.currentTarget);
      nodeGroup.select('circle')
        .transition()
        .duration(200)
        .attr('r', 20)
        .attr('stroke', '#46AACB')
        .attr('stroke-width', 2);

      // Reset chord colors
      d3.selectAll('.link')
        .attr('stroke', '#46AACB')
        .attr('opacity', 0.4);

      this.hideMoviePopup();
    });

    // No color legend needed - using fixed color with thickness variation

    // Create circle border with white glow effect (but hide it behind nodes)
    this.createCircleBorder(centerX, centerY, radius);
    
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
      .attr('font-family', "'Courier New', monospace")
      .attr('font-size', '11px')
      .attr('fill', '#cccccc')
      .text('Connections');

    legendGroup.append('text')
      .attr('x', 0)
      .attr('y', legendHeight + 20)
      .attr('font-family', "'Courier New', monospace")
      .attr('font-size', '10px')
      .attr('fill', '#999999')
      .text(`${Math.round(minValue)}`);

    legendGroup.append('text')
      .attr('x', legendWidth)
      .attr('y', legendHeight + 20)
      .attr('text-anchor', 'end')
      .attr('font-family', "'Courier New', monospace")
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

    // Fixed color for all links
    const linkColor = '#46AACB';
    
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
        const opacity = weight > 0 ? 0.9 : 0.08;
        const strokeW = weight > 0 ? thicknessScale(weight) : 1;
        
        // Only update if both themes exist in the current window
        if (!a || !b || (!windowCo[a] && !windowCo[b])) {
          // Hide links that don't have valid connections
          d3.select(this).transition().duration(300)
            .style('opacity', 0)
            .style('display', 'none');
          return;
        }
        
        // Apply fixed color and thickness based on connections
        d3.select(this).transition().duration(300)
          .attr('stroke', linkColor)
          .style('stroke', linkColor)
          .attr('stroke-width', strokeW)
          .style('stroke-width', strokeW)
          .style('opacity', opacity)
          .style('display', weight > 0 ? 'block' : 'none');
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
              .style('opacity', '1')
              .style('opacity', 1)
              .attr('filter', 'url(#solidBlack)')
              .style('filter', 'url(#solidBlack) brightness(0) contrast(2)') // Make darker
              .attr('data-has-connections', 'true');
            
            // Update background circle
            if (!bgCircle.empty()) {
              bgCircle.transition().duration(300)
                .style('opacity', 1);
            }
          } else {
            image.transition().duration(300)
              .style('opacity', '0.2')
              .style('opacity', 0.2)
              .attr('filter', 'url(#solidBlack)')
              .style('filter', 'url(#solidBlack) brightness(0) contrast(2)')
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
