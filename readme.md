# Library of Futures

## Setup

Before you start, you may want to try out `npm install three`

After that, open `index.html` with live server. Try swiping up/down on each page!

## Libraries Used

### Three.js
- **Version**: 0.164.0 (bookshelf.js) / Latest (morph.js)
- **Usage**: 3D rendering for bookshelf visualization and world map/globe morphing
- **CDN**: `https://unpkg.com/three@0.164.0/build/three.module.js` (bookshelf.js)
- **NPM**: `three` (morph.js)

### Three.js Addons
- **CSS2DRenderer, CSS2DObject**: `three/addons/renderers/CSS2DRenderer.js`
- **Line2, LineMaterial, LineGeometry**: `three/addons/lines/`
- **Usage**: Text labels and advanced line rendering in morph.js

### D3.js
- **Version**: v7.9.0 / v7.min.js
- **Usage**: Data visualization for chord graph (chordGraph.html) and parallel timeline (parallel.html, timeline.html)
- **CDN**: 
  - `https://d3js.org/d3.v7.min.js` (chordGraph.html, timeline.html)
  - `https://unpkg.com/d3@7.9.0/dist/d3.min.js` (parallel.html)

### Google Fonts
- **IBM Plex Sans**: Used across all pages for consistent typography
- **CDN**: `https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap`

## File Documentation

### Core Components

#### `navigation-menu.js` / `navigation-menu.css`
**Purpose**: Global navigation menu component used across all pages
- **Features**:
  - Auto-collapse/expand on mouse hover
  - Progress line with blue dot indicator showing current page
  - Smooth animations with sequenced text fade and line slide
  - Page mapping for highlighting active menu item
- **Menu Items**: Introduction, Library, Trope Network, Depicted vs Reality, World Building, Reflection
- **Usage**: Included in all main HTML pages via `<script src="navigation-menu.js"></script>`

#### `cursor.js` / `cursor.css`
**Purpose**: Custom cursor replacement for enhanced UX
- **Features**:
  - Circular cursor that follows mouse movement
  - Hover effects (enlarges on interactive elements)
  - Arrow indicators for left/right navigation
  - Removes default browser cursor
- **Usage**: Included in pages that need custom cursor via `<script src="cursor.js" defer></script>`

#### `introMessage.js` / `introMessage.html`
**Purpose**: Reusable intro message component with typing animation
- **Features**:
  - Injects intro message HTML into specified containers
  - Typing animation effect for text
  - Icon box animation
  - Promise-based injection to prevent duplicates
- **Usage**: Called via `showDefaultIntro()` or `showOverlayIntro()` functions
- **Used in**: bookshelf.html, parallel.html, reflectionPage.html

#### `mapIntroMessage.js` / `mapIntroMessage.html`
**Purpose**: Specialized intro message for map/globe pages
- **Features**:
  - Similar to introMessage but tailored for map contexts
  - Contextual messaging for world building visualization
- **Usage**: Used in morph.html for map-specific introductions

#### `arrowButton.js` / `arrowButton.css`
**Purpose**: Floating arrow button component for navigation
- **Features**:
  - Fixed position button (typically right-center of screen)
  - Arrow circle with hover effects
  - Text label (e.g., "CLOSING")
  - Custom cursor integration
- **Usage**: Used in morph.html for navigation to next section

### Main Pages

#### `index.html`
**Purpose**: Landing/introduction page
- **Features**:
  - Entry point to the Library of Futures
  - Introduction to the project
  - Navigation to other sections
- **Dependencies**: navigation-menu.js, cursor.js

#### `bookshelf.js` / `bookshelf.html`
**Purpose**: 3D interactive bookshelf visualization of sci-fi movies
- **Technology**: Three.js
- **Features**:
  - 3D bookshelf with movie covers as book spines
  - Scrollable timeline (left/right navigation)
  - Book overlay with detailed movie information
  - Grid view and list view toggle
  - Timeline selector for filtering by 5-year periods
  - Trope filtering with image-based buttons
- **Data Source**: `movies_data_for_shelf.js`
- **Key Functions**:
  - `groupBooksByDecade()` - Organizes movies by decade
  - `renderGridView()` - Renders grid view of movies
  - `switchView()` - Toggles between 3D shelf and grid view
  - `openOverlayForIndex()` - Opens detailed movie overlay

#### `chordGraph.js` / `chordGraph.html`
**Purpose**: Circular network graph showing theme co-occurrences
- **Technology**: D3.js
- **Features**:
  - Circular layout with theme nodes around perimeter
  - Chord links showing co-occurrence strength
  - 5-year timeline selector (bottom-left)
  - Interactive hover popups showing movies for each theme
  - Link filtering by time period
  - Node hover areas for better interaction
- **Data Source**: `movies_data_for_shelf.js`
- **Key Class**: `ChordGraph` - Main visualization class
- **Key Methods**:
  - `loadData()` - Loads movie data and calculates co-occurrences
  - `setDecade()` - Filters visualization by 5-year window
  - `showMoviePopup()` - Displays theme information on hover

#### `parallel.js` / `parallel.html`
**Purpose**: Parallel timeline comparing release year vs. depicted future year
- **Technology**: D3.js, SVG
- **Features**:
  - Horizontal timeline with release year (bottom) and depicted year (top)
  - Lines connecting release to depicted year (slope = time leap)
  - Scrollable world view
  - 5-year window highlighting
  - Wave bar timeline selector (bottom-left)
  - Scroll-based window detection
  - Intro slide with slope legend
- **Data Source**: `settingdataraw.js`
- **Key Features**:
  - Slope visualization (steeper = small time leap, flatter = big time leap)
  - Window-based filtering
  - Click/arrow key navigation
  - Responsive design

#### `morph.js` / `morph.html`
**Purpose**: Interactive world map that morphs into 3D globe/solar system
- **Technology**: Three.js (with CSS2DRenderer, Line2 addons)
- **Features**:
  - 2D world map view with flight paths between locations
  - Zoom and morph to 3D globe
  - Further zoom to solar system view
  - Flight paths showing movie location connections
  - Earth-only paths and solar system paths
  - Fictional locations visualization
  - Text overlay with period descriptions (5-year periods)
  - Interactive planet/moon labels
- **Data Sources**: 
  - `movies_data_for_map.js` - Movie location data
  - CSV data for fantasy locations
- **Key Features**:
  - Smooth camera transitions
  - Path visibility based on zoom level
  - Custom positions for planets/moons
  - Gradient circles for same-location movies

#### `reflectionPage.html`
**Purpose**: Reflection and closing page
- **Features**:
  - Reflection boxes with numbered sections
  - Explore list of related works
  - Typing animation for headers
  - Scrollable content
- **Dependencies**: introMessage.js, navigation-menu.js, cursor.js

### Supporting Files

#### `movies_data_for_shelf.js`
**Purpose**: Movie metadata for bookshelf and chord graph
- **Format**: ES6 module export
- **Data**: Array of movie objects with properties:
  - `id`, `title`, `year`, `director`, `tropes`, `location`, etc.
- **Used by**: bookshelf.js, chordGraph.js

#### `movies_data_for_map.js`
**Purpose**: Movie location data for map visualization
- **Format**: ES6 module export
- **Data**: Movie location connections and coordinates
- **Used by**: morph.js

#### `settingdataraw.js`
**Purpose**: Raw data for parallel timeline
- **Format**: ES6 module export
- **Data**: Movies with release year and depicted year
- **Used by**: parallel.js

#### `generate-coordinates.js`
**Purpose**: Utility for generating coordinates (if needed)
- **Usage**: Helper script for data processing

### CSS Files

#### `styles.css`
**Purpose**: Global styles for bookshelf page
- **Features**: 
  - Bookshelf canvas styling
  - Overlay card styles
  - Grid view styles
  - Motif/trope button styles
  - Footer styles

#### `navigation-menu.css`
**Purpose**: Styles for navigation menu component
- **Features**:
  - Menu positioning and layout
  - Collapse/expand animations
  - Progress line and dot styling
  - Responsive design

#### `cursor.css`
**Purpose**: Styles for custom cursor
- **Features**:
  - Cursor circle base styles
  - Hover state styles
  - Arrow indicator styles

#### `introMessage.css` / `mapIntroMessage.css`
**Purpose**: Styles for intro message components
- **Features**:
  - Icon box animations
  - Typing text effects
  - Layout and positioning

#### `arrowButton.css`
**Purpose**: Styles for arrow button component
- **Features**:
  - Floating button positioning
  - Arrow circle styling
  - Hover effects
  - Gradient overlay

