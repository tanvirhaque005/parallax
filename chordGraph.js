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
          .attr('stroke', '#444444')
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
          .attr('stroke', '#444444')
          .attr('opacity', 0.4)
          .attr('stroke-width', d => Math.max(1, Math.sqrt(d.value) * 1.5));

        // Reset node colors
        d3.selectAll('.node')
          .select('circle')
          .attr('stroke', '#555555')
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
            .attr('stroke', '#555555')
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
        .attr('stroke', '#555555')
        .attr('stroke-width', 2);

      // Reset chord colors
      d3.selectAll('.link')
        .attr('stroke', '#444444')
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

  /**
   * Set decade filter and re-render
   */
  setDecade(decade) {
    this.currentDecade = decade;
    if (this.currentMovie) {
      this.render(this.currentMovie.title, {
        width: Math.min(1400, window.innerWidth - 100),
        height: Math.min(1000, window.innerHeight - 100)
      });
    }
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChordGraph;
}
