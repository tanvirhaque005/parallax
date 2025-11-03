/**
 * Interactive Timeline Visualization for Sci-Fi Movies and Historical Events
 * Shows how movies reflect social, political, technological, and economic events
 */

class Timeline {
  constructor(containerId) {
    this.containerId = containerId;
    this.container = d3.select(`#${containerId}`);
    this.movies = [];
    this.events = [];
    this.selectedThemes = new Set();
    this.svg = null;
    this.width = 0;
    this.height = 1400;
    this.margin = { top: 600, right: 40, bottom: 60, left: 80 };
    this.yearScale = null;

    // Track positions (movies now above the timeline axis at y=0)
    this.tracks = {
      movies: { y: -560, height: 500, label: 'Movies' },
      technology: { y: 80, height: 60, label: 'Technology' },
      political: { y: 160, height: 60, label: 'Political' },
      social: { y: 240, height: 60, label: 'Social' },
      economic: { y: 320, height: 60, label: 'Economic' }
    };
  }

  /**
   * Load movie and event data
   */
  async loadData(csvPath) {
    const data = await d3.csv(csvPath);

    // Parse movies
    this.movies = data.map(d => {
      const themesStr = d['Sci-fi Categories'] || '';
      const themes = themesStr
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      return {
        title: d['Movie / TV Show Name'],
        year: parseInt(d['Year']) || 0,
        themes: themes,
        rating: parseFloat(d['Rating']) || 0,
        description: d['Description'] || ''
      };
    }).filter(m => m.year > 0);

    // Historical events with theme connections
    this.events = this.createHistoricalEvents();

    console.log(`Loaded ${this.movies.length} movies and ${this.events.length} events`);
  }

  /**
   * Create historical events data with theme tags
   */
  createHistoricalEvents() {
    return [
      // Technology Events
      { year: 1945, title: 'First Computer (ENIAC)', category: 'technology', themes: ['Technology', 'AI', 'Consciousness'] },
      { year: 1950, title: 'Turing Test Proposed', category: 'technology', themes: ['AI', 'Consciousness', 'Identity'] },
      { year: 1956, title: 'AI Field Founded', category: 'technology', themes: ['AI', 'Technology', 'Robotics'] },
      { year: 1961, title: 'First Industrial Robot', category: 'technology', themes: ['Robotics', 'Technology', 'Dehumanization'] },
      { year: 1969, title: 'ARPANET (Internet)', category: 'technology', themes: ['Technology', 'Communication', 'Social Control'] },
      { year: 1975, title: 'Personal Computer Era', category: 'technology', themes: ['Technology', 'Free Will', 'Identity'] },
      { year: 1981, title: 'IBM PC Released', category: 'technology', themes: ['Technology', 'Consciousness'] },
      { year: 1990, title: 'World Wide Web', category: 'technology', themes: ['Technology', 'Communication', 'Social Control'] },
      { year: 1997, title: 'Deep Blue Beats Kasparov', category: 'technology', themes: ['AI', 'Consciousness', 'Technology'] },
      { year: 2011, title: 'IBM Watson Wins Jeopardy', category: 'technology', themes: ['AI', 'Technology', 'Consciousness'] },
      { year: 2012, title: 'Deep Learning Breakthrough', category: 'technology', themes: ['AI', 'Technology', 'Evolution'] },
      { year: 2016, title: 'AlphaGo Beats World Champion', category: 'technology', themes: ['AI', 'Technology', 'Consciousness'] },

      // Political Events
      { year: 1945, title: 'Atomic Bomb', category: 'political', themes: ['Violence', 'Dehumanization', 'Moral Corruption'] },
      { year: 1947, title: 'Cold War Begins', category: 'political', themes: ['Dystopia', 'Authoritarianism', 'Social Control'] },
      { year: 1950, title: 'Korean War', category: 'political', themes: ['Violence', 'Dystopia', 'Authoritarianism'] },
      { year: 1962, title: 'Cuban Missile Crisis', category: 'political', themes: ['Dystopia', 'Violence', 'Dehumanization'] },
      { year: 1963, title: 'JFK Assassination', category: 'political', themes: ['Moral Corruption', 'Social Control', 'Dystopia'] },
      { year: 1965, title: 'Vietnam War Escalates', category: 'political', themes: ['Violence', 'Dystopia', 'Moral Corruption'] },
      { year: 1974, title: 'Watergate Scandal', category: 'political', themes: ['Moral Corruption', 'Social Control', 'Surveillance'] },
      { year: 1989, title: 'Fall of Berlin Wall', category: 'political', themes: ['Free Will', 'Social Control', 'Dystopia'] },
      { year: 1991, title: 'Soviet Union Collapses', category: 'political', themes: ['Dystopia', 'Social Control', 'Free Will'] },
      { year: 2001, title: '9/11 Attacks', category: 'political', themes: ['Violence', 'Social Control', 'Surveillance'] },
      { year: 2003, title: 'Iraq War', category: 'political', themes: ['Violence', 'Moral Corruption', 'Dystopia'] },
      { year: 2013, title: 'Snowden NSA Leaks', category: 'political', themes: ['Surveillance', 'Social Control', 'Technology'] },

      // Social Events
      { year: 1954, title: 'Brown v. Board of Education', category: 'social', themes: ['Social Control', 'Free Will', 'Dehumanization'] },
      { year: 1963, title: 'Civil Rights March', category: 'social', themes: ['Free Will', 'Social Control', 'Identity'] },
      { year: 1969, title: 'Stonewall Riots', category: 'social', themes: ['Identity', 'Free Will', 'Social Control'] },
      { year: 1973, title: 'Roe v. Wade', category: 'social', themes: ['Free Will', 'Social Control', 'Identity'] },
      { year: 1981, title: 'AIDS Epidemic', category: 'social', themes: ['Dehumanization', 'Moral Corruption', 'Social Control'] },
      { year: 1992, title: 'LA Riots', category: 'social', themes: ['Violence', 'Social Control', 'Dystopia'] },
      { year: 2008, title: 'Social Media Explosion', category: 'social', themes: ['Technology', 'Social Control', 'Identity'] },
      { year: 2011, title: 'Occupy Wall Street', category: 'social', themes: ['Social Control', 'Dystopia', 'Free Will'] },
      { year: 2013, title: 'Black Lives Matter Founded', category: 'social', themes: ['Social Control', 'Violence', 'Identity'] },
      { year: 2017, title: '#MeToo Movement', category: 'social', themes: ['Social Control', 'Identity', 'Free Will'] },

      // Economic Events
      { year: 1929, title: 'Great Depression', category: 'economic', themes: ['Dystopia', 'Social Control', 'Dehumanization'] },
      { year: 1971, title: 'Dollar Off Gold Standard', category: 'economic', themes: ['Social Control', 'Dystopia'] },
      { year: 1973, title: 'Oil Crisis', category: 'economic', themes: ['Dystopia', 'Survival', 'Social Control'] },
      { year: 1987, title: 'Black Monday Crash', category: 'economic', themes: ['Dystopia', 'Technology', 'Moral Corruption'] },
      { year: 2000, title: 'Dot-com Bubble Burst', category: 'economic', themes: ['Technology', 'Dystopia', 'Moral Corruption'] },
      { year: 2008, title: 'Financial Crisis', category: 'economic', themes: ['Dystopia', 'Moral Corruption', 'Social Control'] },
      { year: 2009, title: 'Bitcoin Created', category: 'economic', themes: ['Technology', 'Free Will', 'Dystopia'] },
      { year: 2020, title: 'COVID-19 Economic Impact', category: 'economic', themes: ['Dystopia', 'Social Control', 'Survival'] }
    ];
  }

  /**
   * Render the timeline
   */
  render(options = {}) {
    const minYear = 1925;
    const maxYear = 2025;

    // Calculate width based on year range (more pixels per year for better spacing)
    const pixelsPerYear = 100; // Increased to 100 for maximum horizontal space
    this.width = (maxYear - minYear) * pixelsPerYear;

    // Clear previous content
    this.container.html('');

    // Create theme selector
    this.createThemeSelector();

    // Create scrollable container
    const scrollContainer = this.container
      .append('div')
      .attr('class', 'timeline-scroll-container')
      .style('width', '100%')
      .style('height', `${this.height}px`)
      .style('overflow-x', 'auto')
      .style('overflow-y', 'auto')
      .style('border', '1px solid #e5e7eb')
      .style('border-radius', '8px')
      .style('background', '#ffffff');

    // Create SVG
    this.svg = scrollContainer
      .append('svg')
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr('height', this.height)
      .style('display', 'block');

    const g = this.svg.append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    // Create year scale
    this.yearScale = d3.scaleLinear()
      .domain([minYear, maxYear])
      .range([0, this.width]);

    // Draw timeline axis
    this.drawAxis(g);

    // Draw track backgrounds and labels
    this.drawTracks(g);

    // Draw events
    this.drawEvents(g);

    // Draw movies
    this.drawMovies(g);

    // Add legend
    this.drawLegend();
  }

  /**
   * Create theme selector buttons
   */
  createThemeSelector() {
    const allThemes = new Set();
    this.movies.forEach(m => m.themes.forEach(t => allThemes.add(t)));
    const sortedThemes = Array.from(allThemes).sort();

    const selectorDiv = this.container
      .insert('div', ':first-child')
      .attr('class', 'theme-selector')
      .style('margin-bottom', '20px')
      .style('padding', '20px')
      .style('background', '#f8f9fa')
      .style('border-radius', '8px');

    selectorDiv.append('div')
      .style('font-family', "'Space Mono', monospace")
      .style('font-size', '14px')
      .style('font-weight', '700')
      .style('margin-bottom', '12px')
      .style('color', '#1a1a1a')
      .text('Filter by Theme:');

    const buttonContainer = selectorDiv.append('div')
      .style('display', 'flex')
      .style('flex-wrap', 'wrap')
      .style('gap', '8px');

    // Add "All" button
    buttonContainer.append('button')
      .attr('class', 'theme-btn')
      .style('padding', '8px 16px')
      .style('font-family', "'Space Mono', monospace")
      .style('font-size', '11px')
      .style('background', '#e5e7eb')
      .style('border', '2px solid #e5e7eb')
      .style('border-radius', '4px')
      .style('cursor', 'pointer')
      .style('transition', 'all 0.2s')
      .text('All')
      .on('click', () => {
        this.selectedThemes.clear();
        this.updateHighlighting();
        this.updateButtonStates();
      });

    // Add theme buttons
    sortedThemes.forEach(theme => {
      buttonContainer.append('button')
        .attr('class', 'theme-btn')
        .attr('data-theme', theme)
        .style('padding', '8px 16px')
        .style('font-family', "'Space Mono', monospace")
        .style('font-size', '11px')
        .style('background', 'white')
        .style('border', '2px solid #e5e7eb')
        .style('border-radius', '4px')
        .style('cursor', 'pointer')
        .style('transition', 'all 0.2s')
        .text(theme)
        .on('click', () => {
          if (this.selectedThemes.has(theme)) {
            this.selectedThemes.delete(theme);
          } else {
            this.selectedThemes.add(theme);
          }
          this.updateHighlighting();
          this.updateButtonStates();
        })
        .on('mouseover', function() {
          d3.select(this).style('background', '#f3f4f6');
        })
        .on('mouseout', function() {
          const isSelected = d3.select(this).style('background-color') === 'rgb(30, 58, 138)';
          if (!isSelected) {
            d3.select(this).style('background', 'white');
          }
        });
    });
  }

  /**
   * Update button visual states
   */
  updateButtonStates() {
    const selectedThemes = this.selectedThemes;

    d3.selectAll('.theme-btn').each(function() {
      const btn = d3.select(this);
      const theme = btn.attr('data-theme');

      if (!theme) return; // Skip "All" button

      if (selectedThemes.has(theme)) {
        btn.style('background', '#1e3a8a')
           .style('color', 'white')
           .style('border-color', '#1e3a8a');
      } else {
        btn.style('background', 'white')
           .style('color', '#1a1a1a')
           .style('border-color', '#e5e7eb');
      }
    });
  }

  /**
   * Draw timeline axis
   */
  drawAxis(g) {
    const axis = d3.axisBottom(this.yearScale)
      .tickFormat(d => d)
      .ticks(50); // More ticks for better readability with wider timeline

    g.append('g')
      .attr('class', 'timeline-axis')
      .call(axis)
      .style('font-family', "'Space Mono', monospace")
      .style('font-size', '16px')
      .style('font-weight', '700');

    // Draw main timeline line
    g.append('line')
      .attr('x1', 0)
      .attr('x2', this.width)
      .attr('y1', 0)
      .attr('y2', 0)
      .attr('stroke', '#1a1a1a')
      .attr('stroke-width', 3);

    // Add separator text
    g.append('text')
      .attr('x', -10)
      .attr('y', 15)
      .attr('text-anchor', 'end')
      .style('font-family', "'Space Mono', monospace")
      .style('font-size', '14px')
      .style('font-weight', '700')
      .style('fill', '#1a1a1a')
      .text('TIMELINE');

    g.append('text')
      .attr('x', -10)
      .attr('y', this.tracks.movies.y + this.tracks.movies.height / 2)
      .attr('text-anchor', 'end')
      .style('font-family', "'Space Mono', monospace")
      .style('font-size', '14px')
      .style('font-weight', '700')
      .style('fill', '#1a1a1a')
      .text('MOVIES');

    // Add visual separator line between movies and timeline
    g.append('line')
      .attr('x1', 0)
      .attr('x2', this.width)
      .attr('y1', -50)
      .attr('y2', -50)
      .attr('stroke', '#e5e7eb')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5');
  }

  /**
   * Draw track backgrounds and labels
   */
  drawTracks(g) {
    Object.entries(this.tracks).forEach(([key, track]) => {
      // Background
      g.append('rect')
        .attr('class', `track-bg track-${key}`)
        .attr('x', 0)
        .attr('y', track.y - 10)
        .attr('width', this.width)
        .attr('height', track.height)
        .attr('fill', key === 'movies' ? '#f8f9fa' : '#ffffff')
        .attr('stroke', '#e5e7eb')
        .attr('stroke-width', 1);

      // Label (skip for movies track, it has a separate MOVIES label)
      if (key !== 'movies') {
        g.append('text')
          .attr('x', -10)
          .attr('y', track.y + track.height / 2)
          .attr('text-anchor', 'end')
          .attr('dominant-baseline', 'middle')
          .style('font-family', "'Space Mono', monospace")
          .style('font-size', '12px')
          .style('font-weight', '700')
          .style('fill', '#1a1a1a')
          .text(track.label);
      }
    });
  }

  /**
   * Draw historical events
   */
  drawEvents(g) {
    const categoryColors = {
      technology: '#3b82f6',
      political: '#ef4444',
      social: '#10b981',
      economic: '#f59e0b'
    };

    this.events.forEach(event => {
      const track = this.tracks[event.category];
      if (!track) return;

      const x = this.yearScale(event.year);
      const y = track.y + track.height / 2;

      // Event marker (circle) - larger and more visible
      const marker = g.append('circle')
        .attr('class', 'event-marker')
        .attr('data-themes', event.themes.join(','))
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', 10)
        .attr('fill', categoryColors[event.category])
        .attr('stroke', 'white')
        .attr('stroke-width', 3)
        .style('cursor', 'pointer')
        .style('transition', 'all 0.2s');

      // Event line to axis - thicker
      g.append('line')
        .attr('class', 'event-line')
        .attr('data-themes', event.themes.join(','))
        .attr('x1', x)
        .attr('x2', x)
        .attr('y1', 0)
        .attr('y2', y - 15)
        .attr('stroke', categoryColors[event.category])
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '3,3')
        .attr('opacity', 0.4);

      // Event label text
      const label = g.append('text')
        .attr('class', 'event-label')
        .attr('data-themes', event.themes.join(','))
        .attr('x', x)
        .attr('y', y + 28)
        .attr('text-anchor', 'middle')
        .style('font-family', "'Space Mono', monospace")
        .style('font-size', '13px')
        .style('font-weight', '700')
        .style('fill', categoryColors[event.category])
        .style('pointer-events', 'none')
        .text(event.title.length > 20 ? event.title.substring(0, 20) + '...' : event.title);

      // Add background to label for readability
      const bbox = label.node().getBBox();
      g.insert('rect', '.event-label')
        .attr('class', 'event-label-bg')
        .attr('data-themes', event.themes.join(','))
        .attr('x', bbox.x - 2)
        .attr('y', bbox.y - 1)
        .attr('width', bbox.width + 4)
        .attr('height', bbox.height + 2)
        .attr('fill', 'white')
        .attr('opacity', 0.85)
        .attr('rx', 2);

      // Tooltip
      marker.on('mouseover', (mouseEvent) => {
        this.showTooltip(mouseEvent, {
          title: event.title,
          year: event.year,
          category: event.category,
          themes: event.themes
        });
        marker.attr('r', 14).attr('stroke-width', 4);
      }).on('mouseout', () => {
        this.hideTooltip();
        marker.attr('r', 10).attr('stroke-width', 3);
      });
    });
  }

  /**
   * Draw movies
   */
  drawMovies(g) {
    const track = this.tracks.movies;
    const movieHeight = 80;
    const movieWidth = 50;
    const movieSpacing = 5;
    const rowHeight = movieHeight + movieSpacing;
    const columnWidth = movieWidth + movieSpacing;

    // Group movies by year first
    const moviesByYear = {};
    this.movies.forEach(movie => {
      if (!moviesByYear[movie.year]) {
        moviesByYear[movie.year] = [];
      }
      moviesByYear[movie.year].push(movie);
    });

    // Calculate positions with vertical stacking per year
    const moviePositions = [];
    Object.entries(moviesByYear).forEach(([year, moviesInYear]) => {
      const baseX = this.yearScale(parseInt(year));
      const yearInt = parseInt(year);

      // Special case for 2014: use 2 columns
      if (yearInt === 2014) {
        moviesInYear.forEach((movie, index) => {
          const col = index % 2; // Alternate between column 0 and 1
          const row = Math.floor(index / 2); // Row increases every 2 movies
          const x = baseX + (col * columnWidth);
          const y = track.y + 10 + (row * rowHeight);
          moviePositions.push({ movie, x, y, row, col });
        });
      } else if (yearInt === 2015) {
        // Special case for 2015: shift right to center between 2014 and 2016
        moviesInYear.forEach((movie, index) => {
          const x = baseX + (columnWidth * 0.5); // Offset by half a column width
          const row = index;
          const y = track.y + 10 + (row * rowHeight);
          moviePositions.push({ movie, x, y, row });
        });
      } else {
        // All other years: single vertical column
        moviesInYear.forEach((movie, index) => {
          const x = baseX;
          const row = index;
          const y = track.y + 10 + (row * rowHeight);
          moviePositions.push({ movie, x, y, row });
        });
      }
    });

    // Draw movies at calculated positions
    moviePositions.forEach(({ movie, x, y }) => {

      // Movie rectangle (placeholder for cover)
      const rect = g.append('rect')
        .attr('class', 'movie-rect')
        .attr('data-themes', movie.themes.join(','))
        .attr('x', x - movieWidth / 2)
        .attr('y', y)
        .attr('width', movieWidth)
        .attr('height', movieHeight)
        .attr('fill', '#60a5fa')
        .attr('stroke', '#1e3a8a')
        .attr('stroke-width', 2)
        .attr('rx', 3)
        .style('cursor', 'pointer')
        .style('transition', 'all 0.2s');

      // Movie year label
      g.append('text')
        .attr('class', 'movie-year')
        .attr('data-themes', movie.themes.join(','))
        .attr('x', x)
        .attr('y', y + movieHeight / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .style('font-family', "'Space Mono', monospace")
        .style('font-size', '10px')
        .style('font-weight', '700')
        .style('fill', 'white')
        .style('pointer-events', 'none')
        .text(movie.year);

      // Tooltip and click
      rect.on('mouseover', (mouseEvent) => {
        this.showTooltip(mouseEvent, {
          title: movie.title,
          year: movie.year,
          themes: movie.themes,
          rating: movie.rating,
          description: movie.description
        });
        rect.attr('stroke-width', 4);
      }).on('mouseout', () => {
        this.hideTooltip();
        rect.attr('stroke-width', 2);
      }).on('click', () => {
        // Navigate to index.html with movie parameter
        window.location.href = `/index.html?movie=${encodeURIComponent(movie.title)}`;
      });
    });
  }

  /**
   * Draw legend
   */
  drawLegend() {
    const legendDiv = this.container
      .append('div')
      .attr('class', 'timeline-legend')
      .style('margin-top', '20px')
      .style('padding', '15px')
      .style('background', '#f8f9fa')
      .style('border-radius', '8px')
      .style('display', 'flex')
      .style('gap', '30px')
      .style('flex-wrap', 'wrap')
      .style('font-family', "'Space Mono', monospace")
      .style('font-size', '11px');

    const categories = [
      { name: 'Technology', color: '#3b82f6' },
      { name: 'Political', color: '#ef4444' },
      { name: 'Social', color: '#10b981' },
      { name: 'Economic', color: '#f59e0b' },
      { name: 'Movies', color: '#60a5fa' }
    ];

    categories.forEach(cat => {
      const item = legendDiv.append('div')
        .style('display', 'flex')
        .style('align-items', 'center')
        .style('gap', '8px');

      item.append('div')
        .style('width', '16px')
        .style('height', '16px')
        .style('background', cat.color)
        .style('border-radius', '3px')
        .style('border', '2px solid white');

      item.append('span')
        .text(cat.name);
    });
  }

  /**
   * Update highlighting based on selected themes
   */
  updateHighlighting() {
    const selectedThemes = this.selectedThemes;

    console.log('Updating highlighting, selected themes:', Array.from(selectedThemes));

    if (selectedThemes.size === 0) {
      // Show all
      d3.selectAll('.movie-rect')
        .transition()
        .duration(300)
        .attr('opacity', 1)
        .attr('fill', '#60a5fa');
      d3.selectAll('.movie-year')
        .transition()
        .duration(300)
        .attr('opacity', 1);
      d3.selectAll('.event-marker')
        .transition()
        .duration(300)
        .attr('opacity', 1);
      d3.selectAll('.event-line')
        .transition()
        .duration(300)
        .attr('opacity', 0.4);
      d3.selectAll('.event-label')
        .transition()
        .duration(300)
        .attr('opacity', 1);
      d3.selectAll('.event-label-bg')
        .transition()
        .duration(300)
        .attr('opacity', 0.85);
    } else {
      // Dim non-matching items
      let matchedMovies = 0;
      let matchedEvents = 0;

      d3.selectAll('.movie-rect').each(function() {
        const themes = d3.select(this).attr('data-themes').split(',');
        const matches = themes.some(t => selectedThemes.has(t));
        if (matches) matchedMovies++;
        d3.select(this)
          .transition()
          .duration(300)
          .attr('opacity', matches ? 1 : 0.2)
          .attr('fill', matches ? '#93c5fd' : '#60a5fa');
      });

      d3.selectAll('.movie-year').each(function() {
        const themes = d3.select(this).attr('data-themes').split(',');
        const matches = themes.some(t => selectedThemes.has(t));
        d3.select(this)
          .transition()
          .duration(300)
          .attr('opacity', matches ? 1 : 0.2);
      });

      d3.selectAll('.event-marker').each(function() {
        const themes = d3.select(this).attr('data-themes').split(',');
        const matches = themes.some(t => selectedThemes.has(t));
        if (matches) matchedEvents++;
        d3.select(this)
          .transition()
          .duration(300)
          .attr('opacity', matches ? 1 : 0.15);
      });

      d3.selectAll('.event-line').each(function() {
        const themes = d3.select(this).attr('data-themes').split(',');
        const matches = themes.some(t => selectedThemes.has(t));
        d3.select(this)
          .transition()
          .duration(300)
          .attr('opacity', matches ? 0.6 : 0.1);
      });

      d3.selectAll('.event-label').each(function() {
        const themes = d3.select(this).attr('data-themes').split(',');
        const matches = themes.some(t => selectedThemes.has(t));
        d3.select(this)
          .transition()
          .duration(300)
          .attr('opacity', matches ? 1 : 0.2);
      });

      d3.selectAll('.event-label-bg').each(function() {
        const themes = d3.select(this).attr('data-themes').split(',');
        const matches = themes.some(t => selectedThemes.has(t));
        d3.select(this)
          .transition()
          .duration(300)
          .attr('opacity', matches ? 0.85 : 0.15);
      });

      console.log(`Matched ${matchedMovies} movies and ${matchedEvents} events`);
    }
  }

  /**
   * Show tooltip
   */
  showTooltip(event, data) {
    const tooltip = d3.select('body').select('.timeline-tooltip').empty() ?
      d3.select('body').append('div').attr('class', 'timeline-tooltip') :
      d3.select('body').select('.timeline-tooltip');

    tooltip
      .style('position', 'fixed')
      .style('background', 'rgba(0, 0, 0, 0.95)')
      .style('color', 'white')
      .style('padding', '18px 22px')
      .style('border-radius', '8px')
      .style('font-family', "'Space Mono', monospace")
      .style('font-size', '14px')
      .style('line-height', '1.6')
      .style('pointer-events', 'none')
      .style('z-index', '10000')
      .style('max-width', '400px')
      .style('box-shadow', '0 6px 20px rgba(0,0,0,0.5)');

    let html = `<strong style="color: #93c5fd; font-size: 16px;">${data.title}</strong><br/><br/>`;
    html += `<strong>Year:</strong> ${data.year}<br/>`;
    if (data.rating) html += `<strong>Rating:</strong> ${data.rating}<br/>`;
    if (data.category) html += `<strong>Category:</strong> ${data.category}<br/>`;
    html += `<br/><strong>Themes:</strong><br/>${data.themes.slice(0, 5).join(', ')}`;

    tooltip.html(html)
      .style('left', (event.pageX + 15) + 'px')
      .style('top', (event.pageY - 200) + 'px')
      .style('opacity', 1);
  }

  /**
   * Hide tooltip
   */
  hideTooltip() {
    d3.select('.timeline-tooltip').style('opacity', 0);
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Timeline;
}
