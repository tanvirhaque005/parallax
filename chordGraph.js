/**
 * Circular Network Graph Visualization for Sci-Fi Movie Themes
 * Shows theme co-occurrences as a circular network
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
    this.showLabels = true;
    this.zoom = null;
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
  calculateCooccurrences() {
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

    // Count co-occurrences
    this.movies.forEach(movie => {
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
   * Render the circular network graph
   */
  render(movieTitle, options = {}) {
    const {
      width = 1200,
      height = 900
    } = options;

    // Clear previous content
    this.container.html('');

    const movie = this.movies.find(m => m.title === movieTitle);
    if (!movie) {
      console.error(`Movie "${movieTitle}" not found`);
      return null;
    }

    this.currentMovie = movie;
    const movieThemes = movie.themes;

    // Create nodes (themes) positioned in a circle
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 150;

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

    // Create tooltip
    const tooltip = this.container
      .append('div')
      .attr('class', 'chord-tooltip')
      .style('position', 'absolute')
      .style('padding', '16px 20px')
      .style('background', 'rgba(0, 0, 0, 0.95)')
      .style('color', 'white')
      .style('border-radius', '6px')
      .style('pointer-events', 'none')
      .style('opacity', '0')
      .style('transition', 'opacity 0.2s')
      .style('font-family', "'Space Mono', 'Courier New', monospace")
      .style('font-size', '11px')
      .style('font-weight', '400')
      .style('max-width', '500px')
      .style('max-height', '600px')
      .style('z-index', '1000')
      .style('box-shadow', '0 6px 20px rgba(0,0,0,0.5)')
      .style('line-height', '1.6')
      .style('left', '50%')
      .style('transform', 'translateX(-50%)')
      .style('bottom', '20px');

    // Draw links (curved paths)
    const link = this.g.append('g')
      .selectAll('path')
      .data(links)
      .join('path')
      .attr('class', 'link')
      .attr('d', linkPath)
      .attr('stroke', '#e0e0e0')
      .attr('stroke-width', d => Math.max(1, Math.sqrt(d.value) * 1.5))
      .attr('fill', 'none')
      .attr('opacity', 0.6)
      .on('mouseover', function(event, d) {
        // Highlight the hovered chord
        d3.select(this)
          .attr('stroke', '#93c5fd')
          .attr('opacity', 1)
          .attr('stroke-width', d => Math.max(3, Math.sqrt(d.value) * 2))
          .raise();

        // Highlight connected nodes
        d3.selectAll('.node')
          .filter((n, i) => i === d.source || i === d.target)
          .select('circle')
          .attr('stroke', '#93c5fd')
          .attr('stroke-width', 5)
          .attr('r', 25);

        let tooltipHTML = `
          <strong style="color: #93c5fd;">${d.sourceTheme}</strong> ↔ <strong style="color: #93c5fd;">${d.targetTheme}</strong><br/>
          <span style="color: #93c5fd;">${d.value} movie${d.value !== 1 ? 's' : ''}</span> with both themes
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
          .attr('stroke', '#e0e0e0')
          .attr('opacity', 0.6)
          .attr('stroke-width', d => Math.max(1, Math.sqrt(d.value) * 1.5));

        // Reset node colors
        d3.selectAll('.node')
          .select('circle')
          .attr('stroke', '#60a5fa')
          .attr('stroke-width', 4)
          .attr('r', 20);

        tooltip.style('opacity', 0);
      });

    // Create nodes
    const node = this.g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x},${d.y})`);

    node.append('circle')
      .attr('r', 20)
      .attr('fill', 'white')
      .attr('stroke', '#60a5fa')
      .attr('stroke-width', 4)
      .style('cursor', 'pointer')
      .style('transition', 'all 0.2s');

    // Add labels with background
    const labelGroup = node.append('g')
      .attr('class', 'label-group');

    const text = labelGroup.append('text')
      .attr('class', 'node-text')
      .attr('dy', 40)
      .attr('text-anchor', 'middle')
      .style('font-family', "'Space Mono', 'Courier New', monospace")
      .style('font-size', '11px')
      .style('font-weight', '400')
      .style('fill', '#1a1a1a')
      .style('letter-spacing', '0')
      .style('pointer-events', 'none')
      .text(d => d.label);

    // Add background to labels
    text.each(function(d) {
      const bbox = this.getBBox();
      d3.select(this.parentNode)
        .insert('rect', 'text')
        .attr('class', 'node-label-bg')
        .attr('x', bbox.x - 4)
        .attr('y', bbox.y - 2)
        .attr('width', bbox.width + 8)
        .attr('height', bbox.height + 4)
        .attr('rx', 3)
        .attr('fill', 'white')
        .attr('opacity', 0.9);
    });

    // Node hover interactions
    node.on('mouseover', function(event, d) {
      d3.select(this).select('circle')
        .transition()
        .duration(200)
        .attr('r', 25)
        .attr('stroke', '#93c5fd')
        .attr('stroke-width', 5);

      // Highlight connected chords
      d3.selectAll('.link')
        .filter((l) => l.source === d.index || l.target === d.index)
        .attr('stroke', '#93c5fd')
        .attr('opacity', 1)
        .raise();

      // Count connections
      const connections = links.filter(l =>
        l.source === d.index || l.target === d.index
      ).length;

      tooltip
        .html(`
          <strong style="color: #93c5fd;">${d.label}</strong><br/>
          ${connections} connection${connections !== 1 ? 's' : ''} to other themes
        `)
        .style('opacity', 1);
    })
    .on('mouseout', function(event, d) {
      d3.select(this).select('circle')
        .transition()
        .duration(200)
        .attr('r', 20)
        .attr('stroke', '#60a5fa')
        .attr('stroke-width', 4);

      // Reset chord colors
      d3.selectAll('.link')
        .attr('stroke', '#e0e0e0')
        .attr('opacity', 0.6);

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
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChordGraph;
}
