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
    this.zoom = null;
    this.currentDecade = null; // null means "All"
    this.transitionDuration = 200; // milliseconds - fast for responsive dragging
    this.width = 1200;
    this.height = 900;
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

    // Add zoom behavior
    this.zoom = d3.zoom()
      .scaleExtent([0.5, 3])
      // Prevent the built-in zoom handler from reacting to wheel events so we can
      // control wheel behavior separately (mouse wheel will be used for year scrub).
      .filter(function(event) {
        if (!event) return true;
        if (event.type === 'wheel') return false;
        return true;
      })
      .on('zoom', (event) => {
        this.g.attr('transform', event.transform);
      });

    this.svg.call(this.zoom);

    this.g = this.svg.append('g');
    this.linkGroup = this.g.append('g').attr('class', 'links');
    this.nodeGroup = this.g.append('g').attr('class', 'nodes');

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
    if (!this.svg) {
      this.initializeSVG(options);
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

    // Create curved path generator
    const linkPath = (d) => {
      const sourceNode = nodes[d.source];
      const targetNode = nodes[d.target];
      const dx = targetNode.x - sourceNode.x;
      const dy = targetNode.y - sourceNode.y;
      const dr = Math.sqrt(dx * dx + dy * dy);

      // Create a curved path
      return `M${sourceNode.x},${sourceNode.y}A${dr},${dr} 0 0,1 ${targetNode.x},${targetNode.y}`;
    };

    const tooltip = this.tooltip;

    // Draw links (curved paths) with transitions - DARK THEME
    const link = this.linkGroup
      .selectAll('path.link')
      .data(links, d => `${d.sourceTheme}-${d.targetTheme}`)
      .join(
        enter => enter.append('path')
          .attr('class', 'link')
          .attr('d', linkPath)
          .attr('stroke', '#3b82f6')
          .attr('stroke-width', d => Math.max(1, Math.sqrt(d.value) * 1.5))
          .attr('fill', 'none')
          .attr('opacity', 0)
          .call(enter => enter.transition()
            .duration(this.transitionDuration)
            .attr('opacity', 0.4)
          ),
        update => update
          .call(update => update.transition()
            .duration(this.transitionDuration)
            .attr('d', linkPath)
            .attr('stroke-width', d => Math.max(1, Math.sqrt(d.value) * 1.5))
          ),
        exit => exit
          .call(exit => exit.transition()
            .duration(this.transitionDuration)
            .attr('opacity', 0)
            .remove()
          )
      )
      .on('mouseover', function(event, d) {
        // Highlight the hovered chord
        d3.select(this)
          .attr('stroke', '#60a5fa')
          .attr('opacity', 1)
          .attr('stroke-width', d => Math.max(3, Math.sqrt(d.value) * 2))
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
        // Reset chord color
        d3.select(this)
          .attr('stroke', '#3b82f6')
          .attr('opacity', 0.4)
          .attr('stroke-width', d => Math.max(1, Math.sqrt(d.value) * 1.5));

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

    // Node hover interactions
    node.on('mouseover', function(event, d) {
      d3.select(this).select('circle')
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

      // Count connections
      const connections = links.filter(l =>
        l.source === d.index || l.target === d.index
      ).length;

      tooltip
        .html(`
          <strong style="color: #60a5fa;">${d.label}</strong><br/>
          ${connections} connection${connections !== 1 ? 's' : ''} to other themes
        `)
        .style('opacity', 1);
    })
    .on('mouseout', function(event, d) {
      d3.select(this).select('circle')
        .transition()
        .duration(200)
        .attr('r', 20)
  .attr('stroke', '#3b82f6')
        .attr('stroke-width', 2);

      // Reset chord colors
      d3.selectAll('.link')
  .attr('stroke', '#3b82f6')
        .attr('opacity', 0.4);

      tooltip.style('opacity', 0);
    });

    // Return stats for display
    return {
      themeCount: nodes.length,
      connectionCount: links.length,
      relatedMovieCount: relatedMoviesSet.size
    };
  }

  /**
   * Reset zoom to default view
   */
  resetZoom() {
    if (this.svg && this.zoom) {
      this.svg.transition()
        .duration(750)
        .call(this.zoom.transform, d3.zoomIdentity);
    }
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
      // reset links
      d3.selectAll('.link').each(function(d){
        try {
          d3.select(this)
            .transition().duration(300)
            .attr('stroke', '#e0f2fe')
            .attr('stroke-width', d => Math.max(1, Math.sqrt(d.value) * 1.5))
            .style('opacity', 0.6);
        } catch(e){}
      });
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

    // compute max weight
    let maxW = 0;
    Object.keys(windowCo).forEach(a => {
      Object.keys(windowCo[a]||{}).forEach(b => { maxW = Math.max(maxW, windowCo[a][b] || 0); });
    });

    // update links
    d3.selectAll('.link').each(function(d){
      try {
        const a = d.sourceTheme || (d.source && d.source.label) || d.source;
        const b = d.targetTheme || (d.target && d.target.label) || d.target;
        const weight = (windowCo[a] && windowCo[a][b]) ? windowCo[a][b] : 0;
        const opacity = weight > 0 ? 0.95 : 0.08;
        const strokeW = weight > 0 ? Math.max(1, Math.sqrt(weight) * 1.6) : 1;
  d3.select(this).transition().duration(300).attr('stroke-width', strokeW).style('opacity', opacity).attr('stroke', weight>0 ? '#93c5fd' : '#e0f2fe');
      } catch(e){}
    });

    // update nodes
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
          circle.transition().duration(300).attr('r',24).attr('stroke','#93c5fd').attr('stroke-width',5).style('opacity',1);
        } else {
          circle.transition().duration(300).attr('r',20).attr('stroke','#60a5fa').attr('stroke-width',4).style('opacity',0.9);
        }
      } catch(e){}
    });

    // gather movies for this 5-year window and show popup
    try {
      const moviesInWindow = [];
      this.movies.forEach(m => {
        const y = parseYearField(m.year);
        if (!y) return;
        if (y >= startYear && y <= endYear) moviesInWindow.push(m.title + (m.year ? ` (${m.year})` : ''));
      });
      // sort alphabetically
      moviesInWindow.sort((a,b)=> a.localeCompare(b));
      if (moviesInWindow.length > 0) this.showMoviePopup(moviesInWindow, startYear);
      else this.hideMoviePopup();
    } catch(e){}
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
