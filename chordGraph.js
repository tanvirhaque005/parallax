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
  }

  /**
   * Show the movie popup with a list of movies for the current window.
   * movies: array of strings
   * startYear: number or null
   */
  showMoviePopup(movies, startYear) {
    try {
      if (!this.moviePopup) return;
      const title = startYear ? `${movies.length} Movie${movies.length!==1?'s':''} (${startYear}-${startYear+4})` : `${movies.length} Movie${movies.length!==1?'s':''}`;
      const html = `
        <div style="font-weight:700; margin-bottom:8px; color:#0f172a">${title}</div>
        <div style="font-size:12px; color:#0f172a; line-height:1.5;">
          ${movies.map(m => `<div style=\"padding:4px 0; border-bottom:1px solid #f1f5f9;\">${m}</div>`).join('')}
        </div>
      `;

      this.moviePopup.html(html)
        .style('opacity', 1)
        .style('pointer-events', 'auto');

      // Position the popup at the top-right of the SVG/visualization area with a margin
      try {
        const containerRect = this.container.node().getBoundingClientRect();
        const svgRect = this.svg && this.svg.node() ? this.svg.node().getBoundingClientRect() : containerRect;
        const popupRect = this.moviePopup.node().getBoundingClientRect();
        // Place further to the top-right (closer to the page's right edge) so long lists don't overlap the graph
        const marginRight = 32; // distance from the right edge
        const marginTop = 12; // distance from top of svg
        // compute left relative to container (container left -> 0)
        let left = Math.round(containerRect.width - popupRect.width - marginRight);
        let top = Math.round((svgRect.top - containerRect.top) + marginTop);
        // clamp so popup stays within container
        if (left < 8) left = 8;
        if (top < 8) top = 8;
        this.moviePopup.style('left', `${left}px`).style('top', `${top}px`);
      } catch(e) {
        // fallback to previous approximate position
        const containerRect = this.container.node().getBoundingClientRect();
        const left = Math.round(containerRect.width - 320 - 32);
        const top = Math.round(24);
        this.moviePopup.style('left', `${left}px`).style('top', `${top}px`);
      }
    } catch (e) {
      // silent
    }
  }

  hideMoviePopup() {
    try {
      if (!this.moviePopup) return;
      this.moviePopup.style('opacity', 0).style('pointer-events', 'none');
    } catch(e){}
  }

  /**
   * Load and parse the CSV data
   */
  async loadData(csvPath) {
    const data = await d3.csv(csvPath);

    // Parse movies and extract themes
    this.movies = data.map(d => {
      const themesStr = d['Sci-fi Categories'] || '';
      const themes = themesStr
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      return {
        title: d['Movie / TV Show Name'],
        year: d['Year'],
        themes: themes,
        rating: d['Rating']
      };
    });

    // Collect all unique themes
    this.movies.forEach(movie => {
      movie.themes.forEach(theme => this.themes.add(theme));
    });

    // Pre-calculate co-occurrences for all theme pairs
    this.calculateCooccurrences();

    console.log(`Loaded ${this.movies.length} movies with ${this.themes.size} unique themes`);
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

      // Create a white movie popup (matches the attached mockup) — hidden by default
      this.moviePopup = this.container
        .append('div')
        .attr('class', 'movie-popup')
        .style('position', 'absolute')
        .style('min-width', '200px')
        .style('max-width', '320px')
        .style('background', '#ffffff')
        .style('color', '#0f172a')
        .style('border-radius', '10px')
        .style('padding', '12px 14px')
        .style('box-shadow', '0 12px 30px rgba(16,24,40,0.12)')
        .style('opacity', 0)
        .style('pointer-events', 'none')
        .style('z-index', 1200)
        .style('font-family', "'Space Mono', 'Courier New', monospace")
        .style('font-size', '12px')
        .style('max-height', '320px')
        .style('overflow', 'auto');
  }

  /**
   * Render the circular network graph with smooth transitions
   */
  render(movieTitle, options = {}) {
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

    const movie = this.movies.find(m => m.title === movieTitle);
    if (!movie) {
      console.error(`Movie "${movieTitle}" not found`);
      return null;
    }

    this.currentMovie = movie;
    const movieThemes = movie.themes;

    // Recalculate co-occurrences with current decade filter
    this.calculateCooccurrences(this.currentDecade);

    // Create nodes (themes) positioned in a circle
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const radius = Math.min(this.width, this.height) / 2 - 150;

    const nodes = movieThemes.map((theme, i) => {
      const angle = (i / movieThemes.length) * 2 * Math.PI - Math.PI / 2;
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

    for (let i = 0; i < movieThemes.length; i++) {
      for (let j = i + 1; j < movieThemes.length; j++) {
        const weight = this.themeCooccurrence[movieThemes[i]][movieThemes[j]] || 0;
        if (weight > 0) {
          const moviesWithBoth = this.themeMovies[movieThemes[i]][movieThemes[j]] || [];
          links.push({
            source: i,
            target: j,
            value: weight,
            movies: moviesWithBoth,
            sourceTheme: movieThemes[i],
            targetTheme: movieThemes[j]
          });

          // Collect related movies
          moviesWithBoth.forEach(m => relatedMoviesSet.add(m));
        }
      }
    }

    // Create curved path generator that curves inward toward center
    const linkPath = (d) => {
      const sourceNode = nodes[d.source];
      const targetNode = nodes[d.target];
      const dx = targetNode.x - sourceNode.x;
      const dy = targetNode.y - sourceNode.y;
      const dr = Math.sqrt(dx * dx + dy * dy);

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
      
      // Pull the curve inward by moving the control point toward the center
      const pullFactor = 0.5; // Increased pull factor to curve more inward
      const controlX = midX + (toCenterX / toCenterDist) * dr * pullFactor;
      const controlY = midY + (toCenterY / toCenterDist) * dr * pullFactor;
      
      // Create a quadratic bezier curve that curves inward
      return `M${sourceNode.x},${sourceNode.y}Q${controlX},${controlY} ${targetNode.x},${targetNode.y}`;
    };

    // Create color scale: darker blue = more connections, lighter blue = fewer connections
    const maxValue = d3.max(links, d => d.value) || 1;
    const minValue = d3.min(links, d => d.value) || 1;
    
    // Use a more sensitive color scale with better distribution
    // Use a custom interpolation that emphasizes differences better
    const colorScale = (value) => {
      // Normalize value to 0-1 range
      const t = (value - minValue) / (maxValue - minValue);
      // Use a square root curve to make differences more visible
      // This ensures that links with 16 vs 37 connections have clearly different shades
      const adjustedT = Math.pow(t, 0.4); // More aggressive curve
      // Use a wider color range for better differentiation
      return d3.interpolateRgb('#bfdbfe', '#030712')(adjustedT); // Lighter start, much darker end
    };

    // Store original color scale and links for "All" view
    this.originalColorScale = colorScale;
    this.originalLinks = links;

    const tooltip = this.tooltip;

    // Draw links (curved paths) with color gradient based on connection count
    const link = this.linkGroup
      .selectAll('path.link')
      .data(links, d => `${d.sourceTheme}-${d.targetTheme}`)
      .join(
        enter => enter.append('path')
          .attr('class', 'link')
          .attr('d', linkPath)
          .attr('stroke', d => colorScale(d.value))
          .attr('stroke-width', d => Math.max(1.5, Math.sqrt(d.value) * 2)) // Increased base thickness
          .attr('fill', 'none')
          .attr('opacity', 0.9) // Increased opacity for better visibility
          .style('stroke', d => colorScale(d.value)) // Use style to override CSS
          .style('stroke-width', d => Math.max(1.5, Math.sqrt(d.value) * 2)) // Also set via style
          .call(enter => enter.transition()
            .duration(this.transitionDuration)
            .attr('opacity', 0.9)
          ),
        update => update
          .call(update => update.transition()
            .duration(this.transitionDuration)
            .attr('d', linkPath)
            .attr('stroke', d => colorScale(d.value))
            .style('stroke', d => colorScale(d.value)) // Use style to override CSS
            .attr('stroke-width', d => Math.max(1.5, Math.sqrt(d.value) * 2)) // Increased base thickness
            .style('stroke-width', d => Math.max(1.5, Math.sqrt(d.value) * 2)) // Also set via style
            .attr('opacity', 0.9) // Increased opacity for better visibility
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

        // Highlight connected nodes
        d3.selectAll('.node')
          .filter((n, i) => i === d.source || i === d.target)
          .select('circle')
          .attr('stroke', '#60a5fa')
          .attr('stroke-width', 4)
          .attr('r', 25);

        let tooltipHTML = `
          <strong style="color: #60a5fa;">${d.sourceTheme}</strong> ↔ <strong style="color: #60a5fa;">${d.targetTheme}</strong><br/>
          <span style="color: #60a5fa;">${d.value} movie${d.value !== 1 ? 's' : ''}</span> with both themes
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

        // Reset node colors
        d3.selectAll('.node')
          .select('circle')
          .attr('stroke', '#3b82f6')
          .attr('stroke-width', 2)
          .attr('r', 20);

        tooltip.style('opacity', 0);
      });

    // Create nodes with transitions - DARK THEME
    const node = this.nodeGroup
      .selectAll('g.node')
      .data(nodes, d => d.id)
      .join(
        enter => {
          const nodeEnter = enter.append('g')
            .attr('class', 'node')
            .attr('transform', d => `translate(${d.x},${d.y})`)
            .style('opacity', 0);

          nodeEnter.append('circle')
            .attr('r', 20)
            .attr('fill', '#2a2a2a')
            .attr('stroke', '#3b82f6')
            .attr('stroke-width', 2)
            .style('cursor', 'pointer');

          const labelGroup = nodeEnter.append('g')
            .attr('class', 'label-group');

          labelGroup.append('rect')
            .attr('class', 'node-label-bg')
            .attr('rx', 3)
            .attr('fill', '#1a1a1a')
            .attr('stroke', '#333333')
            .attr('stroke-width', 1)
            .attr('opacity', 0.9);

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
    node.on('mouseover', (event, d) => {
      d3.select(event.currentTarget).select('circle')
        .transition()
        .duration(200)
        .attr('r', 25)
        .attr('stroke', '#60a5fa')
        .attr('stroke-width', 4);

      // Highlight connected chords
      d3.selectAll('.link')
        .filter((l) => l.source === d.index || l.target === d.index)
        .attr('stroke', '#60a5fa')
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
        if (!m.themes.includes(theme)) return false;
        if (startYear !== null) {
          const y = parseYearField(m.year);
          if (!y || y < startYear || y > endYear) return false;
        }
        return true;
      }).map(m => m.title + (m.year ? ` (${m.year})` : ''));
      // sort alphabetically
      moviesForTheme.sort((a,b)=> a.localeCompare(b));
      if (moviesForTheme.length > 0) this.showMoviePopup(moviesForTheme, startYear);
      else this.hideMoviePopup();
    })
    .on('mouseout', (event, d) => {
      d3.select(event.currentTarget).select('circle')
        .transition()
        .duration(200)
        .attr('r', 20)
        .attr('stroke', '#3b82f6')
        .attr('stroke-width', 2);

      // Reset chord colors
      d3.selectAll('.link')
        .attr('stroke', '#3b82f6')
        .attr('opacity', 0.4);

      this.hideMoviePopup();
    });

    // Create color gradient legend (only if SVG is ready)
    if (this.svg && links.length > 0) {
      try {
        this.createColorLegend(maxValue, minValue, colorScale);
      } catch(e) {
        console.warn('Legend creation failed:', e);
      }
    }

    // Create circle border with white glow effect
    this.createCircleBorder(centerX, centerY, radius);

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
    
    // Gradient starts dark (more opaque) at the edge and gets lighter (more transparent) as it goes outward
    // Offset 0% = circle edge (fr), 100% = outer edge (r)
    radialGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#ffffff')
      .attr('stop-opacity', '0.6'); // Darker/more opaque white at edge
    
    radialGradient.append('stop')
      .attr('offset', '20%')
      .attr('stop-color', '#ffffff')
      .attr('stop-opacity', '0.4');
    
    radialGradient.append('stop')
      .attr('offset', '40%')
      .attr('stop-color', '#ffffff')
      .attr('stop-opacity', '0.25');
    
    radialGradient.append('stop')
      .attr('offset', '60%')
      .attr('stop-color', '#ffffff')
      .attr('stop-opacity', '0.12');
    
    radialGradient.append('stop')
      .attr('offset', '80%')
      .attr('stop-color', '#ffffff')
      .attr('stop-opacity', '0.05');
    
    radialGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#ffffff')
      .attr('stop-opacity', '0'); // Lighter/fully transparent at outer edge
    
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
    
    // Create the main circle with background color (blends in)
    this.circleGroup.append('circle')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('r', circleRadius)
      .attr('fill', 'none')
      .attr('stroke', '#1a1a1a') // Same as background color
      .attr('stroke-width', '2')
      .attr('opacity', '1')
      .style('pointer-events', 'none'); // Don't interfere with interactions
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

    // If null, reset to default visuals based on overall cooccurrence
    if (!decade) {
      // Use stored original color scale if available
      if (this.originalColorScale && this.originalLinks) {
        const allMaxValue = d3.max(this.originalLinks, d => d.value) || 1;
        const allMinValue = d3.min(this.originalLinks, d => d.value) || 1;
        const allColorScale = (value) => {
          const t = (value - allMinValue) / (allMaxValue - allMinValue);
          const adjustedT = Math.pow(t, 0.4); // More aggressive curve
          return d3.interpolateRgb('#bfdbfe', '#030712')(adjustedT);
        };

        // reset links with color gradient and thickness
        d3.selectAll('.link').each(function(d){
          try {
            if (d && d.value !== undefined) {
              const strokeColor = allColorScale(d.value);
              const strokeWidth = Math.max(1.5, Math.sqrt(d.value) * 2); // Increased base thickness
              d3.select(this)
                .transition().duration(300)
                .attr('stroke', strokeColor)
                .style('stroke', strokeColor) // Use style to override CSS
                .attr('stroke-width', strokeWidth)
                .style('stroke-width', strokeWidth) // Also set via style
                .style('opacity', 0.9); // Increased opacity for better visibility
            }
          } catch(e){}
        });
        
        // Update legend for "All" view (only if SVG is ready)
        if (this.svg && this.svg.node()) {
          try {
            const allMaxValue = d3.max(this.originalLinks, d => d.value) || 1;
            const allMinValue = d3.min(this.originalLinks, d => d.value) || 1;
            this.createColorLegend(allMaxValue, allMinValue, allColorScale);
          } catch(e) {
            console.warn('Legend update failed:', e);
          }
        }
      }
      // reset nodes
      d3.selectAll('.node').each(function(d){
        try {
          d3.select(this).select('circle')
            .transition().duration(300)
            .attr('r', 20)
            .attr('stroke', '#60a5fa')
            .attr('stroke-width', 4)
            .style('opacity', 0.95);
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

    // compute max weight for color scale
    let maxW = 0;
    Object.keys(windowCo).forEach(a => {
      Object.keys(windowCo[a]||{}).forEach(b => { maxW = Math.max(maxW, windowCo[a][b] || 0); });
    });

    // Create color scale for this decade window
    const minWindowValue = 1;
    const maxWindowValue = maxW || 1;
    const windowColorScale = (value) => {
      const t = (value - minWindowValue) / (maxWindowValue - minWindowValue);
      const adjustedT = Math.pow(t, 0.4); // More aggressive curve for better differentiation
      // Use a wider color range - lighter start to very dark end
      return d3.interpolateRgb('#bfdbfe', '#030712')(adjustedT);
    };

    // Update legend for this decade (only if SVG is ready)
    if (maxW > 0 && this.svg && this.svg.node()) {
      try {
        this.createColorLegend(maxW, minWindowValue, windowColorScale);
      } catch(e) {
        console.warn('Legend update failed:', e);
      }
    }

    // update links with color gradient and thickness based on connection count
    d3.selectAll('.link').each(function(d){
      try {
        const a = d.sourceTheme || (d.source && d.source.label) || d.source;
        const b = d.targetTheme || (d.target && d.target.label) || d.target;
        const weight = (windowCo[a] && windowCo[a][b]) ? windowCo[a][b] : 0;
        const opacity = weight > 0 ? 0.9 : 0.08; // Increased opacity for better visibility
        const strokeW = weight > 0 ? Math.max(1.5, Math.sqrt(weight) * 2) : 1; // Increased base thickness
        const strokeColor = weight > 0 ? windowColorScale(weight) : '#e0f2fe';
        
        // Apply both color and thickness consistently
        d3.select(this).transition().duration(300)
          .attr('stroke', strokeColor)
          .style('stroke', strokeColor) // Use style to override CSS
          .attr('stroke-width', strokeW)
          .style('stroke-width', strokeW) // Also set via style for consistency
          .style('opacity', opacity);
      } catch(e){}
    });

    // update nodes - remove blue outline if no connections
    d3.selectAll('.node').each(function(d){
      try {
        const theme = d && d.label ? d.label : (d.id || d);
        let has = false;
        if (windowCo[theme]) {
          for (const k in windowCo[theme]) { if ((windowCo[theme][k]||0) > 0) { has = true; break; } }
        }
        const g = d3.select(this);
        const circle = g.select('circle');
        if (has) {
          // Node has connections - show blue outline
          circle.transition().duration(300)
            .attr('r', 24)
            .attr('stroke', '#93c5fd')
            .style('stroke', '#93c5fd')
            .attr('stroke-width', 5)
            .style('stroke-width', 5)
            .style('opacity', 1);
        } else {
          // Node has no connections - remove blue outline (no stroke)
          circle.transition().duration(300)
            .attr('r', 20)
            .attr('stroke', 'none')
            .style('stroke', 'none')
            .attr('stroke-width', 0)
            .style('stroke-width', 0)
            .style('opacity', 0.5);
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
