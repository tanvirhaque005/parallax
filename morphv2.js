import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';

// ==========================================================
// TEXT OVERLAY CONTENT - 20-YEAR PERIODS
// ==========================================================
// Text changes every 20 years, while filtering bars stay at 5-year intervals
const periodTexts = {
  'All': {
    title: '1950-2020',
    description: 'Most sci-fi futures originate from the same real cities—Los Angeles, Vancouver, London. Real landscapes anchor imagined ones.'
  },
  1950: {
    title: '1950-1970',
    description: 'The golden age of science fiction. Early films establish Los Angeles and London as primary filming hubs. Cold War anxieties and space race ambitions shape narratives, while the space age accelerates and cultural revolution meets cosmic speculation.'
  },
  1970: {
    title: '1970-1990',
    description: 'Dystopian futures and blockbuster spectacle. Environmental and social concerns reshape imagined tomorrows. Star Wars transforms science fiction into mainstream entertainment. Cyberpunk aesthetics emerge, and digital effects begin supplementing practical filmmaking.'
  },
  1990: {
    title: '1990-2010',
    description: 'Virtual reality and digital transformation. Films explore digital worlds as production techniques globalize. Millennium anxieties and internet culture reshape technological futures. Post-9/11 narratives grapple with surveillance and security, while climate crisis enters the frame.'
  },
  2010: {
    title: '2010-2030',
    description: 'Marvel universe expansion and streaming revolution. Interconnected narratives and superhero science fiction dominate global box offices. Streaming platforms transform production, with international co-productions multiplying. Pandemic impacts reshape storytelling with themes of isolation and contagion.'
  }
};

// Map 5-year periods to 20-year periods for text display
function getPeriodForDecade(decade) {
  if (decade === null) return 'All';
  
  // Map each 5-year period to its 20-year period
  if (decade >= 1950 && decade < 1970) return 1950;
  if (decade >= 1970 && decade < 1990) return 1970;
  if (decade >= 1990 && decade < 2010) return 1990;
  if (decade >= 2010) return 2010;
  
  return 'All';
}

// ==========================================================
// TEXT OVERLAY UPDATE FUNCTION
// ==========================================================
function updateTextOverlay() {
  const textElement = document.querySelector('.zoom-text[data-zoom="US"]');

  if (textElement) {
    // Map current 5-year decade to 20-year period for text display
    const period = getPeriodForDecade(currentDecade);
    const textData = periodTexts[period] || periodTexts['All'];

    textElement.querySelector('.main-title').textContent = textData.title;
    textElement.querySelector('.description').textContent = textData.description;
    textElement.classList.add('active');
  }
}

// ==========================================================
// RENDERER + CAMERA
// ==========================================================
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("scene"), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor("#0a1628"); // Deep navy background

// CSS2D Renderer for labels
const labelRenderer = new CSS2DRenderer();

// Get cursor element for hover effects - try multiple ways to get it
let cursor = document.getElementById("cursorCircle") || window.cursorElement;
if (!cursor) {
  // Retry after a delay
  setTimeout(() => {
    cursor = document.getElementById("cursorCircle") || window.cursorElement;
  }, 100);
}
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.pointerEvents = 'none';
labelRenderer.domElement.style.zIndex = '10'; // Below popup (999999)
document.body.appendChild(labelRenderer.domElement);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 1.2;
camera.lookAt(0, 0, 0);

// Basic scene lighting (always on for map views)
const sceneAmbientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(sceneAmbientLight);

const sceneDirectionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
sceneDirectionalLight.position.set(0, 0, 10);
scene.add(sceneDirectionalLight);

// ==========================================================
// EARTH GEOMETRIES
// ==========================================================
const widthSegments = 200, heightSegments = 100; // Higher resolution geometry
const planeGeometry = new THREE.PlaneGeometry(2, 1, widthSegments, heightSegments);
const sphereGeometry = new THREE.SphereGeometry(1, widthSegments, heightSegments);

// World Map Canvas (used for both US zoom and full world view)
const mapCanvas = document.getElementById('mapCanvas');
const mapContext = mapCanvas.getContext('2d');
mapCanvas.width = 4096;  // Higher resolution texture
mapCanvas.height = 2048;

const texture = new THREE.CanvasTexture(mapCanvas);
const material = new THREE.MeshStandardMaterial({
  map: texture,
  transparent: true,
  opacity: 0.35,  // More transparent so paths stand out
  roughness: 0.8,
  metalness: 0.1,
  emissive: 0x1a1a2e,  // Slight blue glow in non-solar views
  emissiveIntensity: 0.2
});

const geometry = planeGeometry.clone();
const earthMesh = new THREE.Mesh(geometry, material);
scene.add(earthMesh);

// ==========================================================
// LOAD WORLD MAP IMAGE (MORPHV2 - USING World Map.svg)
// ==========================================================
async function renderWorldMapImage() {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Draw the loaded SVG onto the canvas
      mapContext.drawImage(img, 0, 0, mapCanvas.width, mapCanvas.height);
      texture.needsUpdate = true;
      console.log('✅ World Map.svg loaded and rendered');
      resolve();
    };
    img.onerror = (error) => {
      console.error('❌ Failed to load World Map.svg:', error);
      reject(error);
    };
    img.src = './map_photos/World Map.svg';
  });
}

renderWorldMapImage();

// ==========================================================
// FLIGHT PATHS
// ==========================================================
const usFlightPathGroup = new THREE.Group(); // US domestic paths
const flightPathGroup = new THREE.Group();    // International paths
scene.add(usFlightPathGroup);
scene.add(flightPathGroup);

function latLonToPlane(lat, lon) {
  // Offset adjustments for World Map.png alignment
  const xOffset = -0.056;  // Negative = shift left, Positive = shift right
  const yOffset = -0.09;   // Negative = shift down, Positive = shift up (increased to show Philadelphia/NYC)

  return {
    x: (lon/180) + xOffset,
    y: ((lat/90)*0.5) + yOffset
  };
}

// Check if coordinates are within continental US bounds
function isInUS(lat, lon) {
  // Continental US approximate bounds:
  // Latitude: 25°N to 49°N
  // Longitude: -125°W to -66°W
  return lat >= 25 && lat <= 49 && lon >= -125 && lon <= -66;
}

// List of solar system bodies (should only appear in solar system view)
const SOLAR_SYSTEM_BODIES = [
  'Sun', 'Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune',
  'Moon', 'Io', 'Europa', 'Ganymede', 'Callisto'
];

// Check if a location name is a solar system body
function isSolarSystemBody(locationName) {
  return SOLAR_SYSTEM_BODIES.includes(locationName);
}

function createArc(a,b,h){
  const mid = { x:(a.x+b.x)/2, y:(a.y+b.y)/2 };
  return new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(a.x,a.y,0),
    new THREE.Vector3(mid.x,mid.y,h),
    new THREE.Vector3(b.x,b.y,0)
  );
}

// Create a gradient-filled circle for same-location movies
function createGradientCircle(position, size = 0.015) {
  const circleGroup = new THREE.Group();

  // Create canvas for gradient texture
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  // Create linear gradient from purple (left) to teal (right)
  const gradient = ctx.createLinearGradient(0, 32, 64, 32);
  gradient.addColorStop(0, '#9747FF');    // Purple left
  gradient.addColorStop(1, '#46AACB');     // Teal right

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(32, 32, 32, 0, Math.PI * 2);
  ctx.fill();

  // Create texture from canvas
  const texture = new THREE.CanvasTexture(canvas);

  // Create sprite with gradient texture
  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0.9,
    depthWrite: false
  });

  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(size, size, 1);
  sprite.position.set(position.x, position.y, position.z);

  return sprite;
}

async function loadPaths(){
  const res = await fetch('./movie-coordinates.json');
  const data = await res.json();

  const { coordinates, connections } = data;
  // Filter to only include Earth-to-Earth paths
  // Exclude: Fictional Locations, Solar System bodies
  const paths = connections.filter(c => {
    if (c.type !== "filming-to-depicted") return false;
    if (c.from === "Fictional Locations" || c.to === "Fictional Locations") return false;
    if (isSolarSystemBody(c.from) || isSolarSystemBody(c.to)) return false;
    return true;
  });

  console.log(`🌍 Loading ${paths.length} Earth-only map paths (space & fantasy excluded)`);

  paths.forEach((c,i)=>{
    const A = coordinates[c.from];
    const B = coordinates[c.to];
    if(!A || !B) return;

    const p1 = latLonToPlane(A.lat,A.lon);
    const p2 = latLonToPlane(B.lat,B.lon);

    // Parse year to integer for filtering
    const yearInt = parseInt(c.year) || 0;

    // Check if production and depicted locations are the same
    if (c.from === c.to) {
      // Create a gradient circle instead of a line (slightly smaller size)
      const circle = createGradientCircle(new THREE.Vector3(p1.x, p1.y, 0.01), 0.015);
      circle.userData = {
        movie: c.movie,
        year: yearInt,
        from: c.from,
        to: c.to,
        isSameLocation: true
      };

      // Check if location is in the US
      const isInUSLoc = isInUS(A.lat, A.lon);
      if (isInUSLoc) {
        usFlightPathGroup.add(circle);
      } else {
        flightPathGroup.add(circle);
      }
      return; // Skip line creation
    }

    const dist = Math.hypot(p2.x-p1.x, p2.y-p1.y);
    const curve = createArc(p1,p2, dist*0.15);

    // Get points from curve for line geometry - more points = smoother
    const points = curve.getPoints(200);

    // Create Line2 geometry with thick lines
    const positions = [];
    const colors = [];
    const purpleColor = new THREE.Color(0x9747FF);
    const tealColor = new THREE.Color(0x46AACB);

    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      positions.push(point.x, point.y, point.z);

      // Gradient from purple to teal
      const t = i / (points.length - 1);
      const color = new THREE.Color().lerpColors(purpleColor, tealColor, t);
      colors.push(color.r, color.g, color.b);
    }

    const geometry = new LineGeometry();
    geometry.setPositions(positions);
    geometry.setColors(colors);

    // Create thick line material with alpha for smoothness
    const mat = new LineMaterial({
      color: 0xffffff,
      linewidth: 3, // in pixels
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      alphaToCoverage: true // Enable for smoother edges
    });
    mat.resolution.set(window.innerWidth, window.innerHeight);

    const line = new Line2(geometry, mat);

    line.userData = {
      movie: c.movie,
      year: yearInt,
      from: c.from,
      to: c.to
    };

    // Check if both locations are in the US
    const isAInUS = isInUS(A.lat, A.lon);
    const isBInUS = isInUS(B.lat, B.lon);

    if (isAInUS && isBInUS) {
      // Both in US - add to US domestic paths
      usFlightPathGroup.add(line);
    } else {
      // At least one location outside US - add to international paths
      flightPathGroup.add(line);
    }
  });
}

loadPaths();

// ==========================================================
// TIMELINE DECADE FILTER
// ==========================================================
const minYear = 1950;
const maxYear = 2020;

const WINDOW_STEP = 5;
const EDGE_ZONE = 400; // px from left/right edge for arrow cursor

const booksMeta = [];
for (let y = minYear; y <= maxYear; y += WINDOW_STEP) {
  booksMeta.push({
    year: y,          // start year of window
    start: y,
    end: y + 4        // end of 5-year window
  });
}


// const yearStep = 10; // Decade steps
const yearStep = WINDOW_STEP; // now 5
let currentDecade = null; // null means "All"

const decades = [];
for (let y = minYear; y <= maxYear; y += WINDOW_STEP) {
  decades.push(y);
}

function updateFlightPathVisibility() {
  // Update US domestic flight paths
  usFlightPathGroup.children.forEach(path => {
    if (!currentDecade) {
      // Show all
      path.visible = true;
    } else {
      const year = path.userData.year;
      if (year >= currentDecade && year < currentDecade + WINDOW_STEP) {
        path.visible = true;
      } else {
        path.visible = false;
      }
    }
  });

  // Update international flight paths
  flightPathGroup.children.forEach(path => {
    if (!currentDecade) {
      // Show all
      path.visible = true;
    } else {
      const year = path.userData.year;
      if (year >= currentDecade && year < currentDecade + WINDOW_STEP) {
        path.visible = true;
      } else {
        path.visible = false;
      }
    }
  });

  // Update solar flight paths
  let fictionalPathsCount = 0;
  solarFlightPathsGroup.children.forEach(path => {
    // Special handling for Fictional Locations arc - check if any movies match the time period
    if (path.userData.isFictionalLocations) {
      if (!currentDecade) {
        // Show all when no decade filter
        path.visible = true;
        fictionalPathsCount++;
      } else {
        // Check if any movies in this arc match the current time period
        const hasMoviesInPeriod = path.userData.movies.some(m => {
          const year = parseInt(m.year);
          return year >= currentDecade && year < currentDecade + WINDOW_STEP;
        });

        path.visible = hasMoviesInPeriod;
        if (hasMoviesInPeriod) fictionalPathsCount++;
      }
    } else if (!currentDecade) {
      // Show all regular paths
      path.visible = true;
    } else {
      const year = path.userData.year;
      if (year >= currentDecade && year < currentDecade + WINDOW_STEP) {
        path.visible = true;
      } else {
        path.visible = false;
      }
    }
  });

  if (fictionalPathsCount > 0) {
    console.log(`✨ Fictional Location paths visible: ${fictionalPathsCount}`);
  }
}

function updateDecadeDisplay(decade) {
  const decadeValue = document.getElementById('decadeValue');
  if (!decadeValue) return; // Element might not exist yet
  
  if (!decade) {
    decadeValue.textContent = 'All Years';
  } else {
    // decadeValue.textContent = `${decade}s`;
    decadeValue.textContent = `${decade}–${decade + WINDOW_STEP - 1}`;

  }

  // Update text overlay when decade changes
  updateTextOverlay();
}

// Expose to window for page transition script
window.updateDecadeDisplay = updateDecadeDisplay;

// Make timeline handle draggable (horizontal)
(function enableTimelineDrag() {
  let dragging = false;
  const track = document.getElementById('timelineTrack');
  const handle = document.getElementById('timelineHandle');

  // Click on track to jump
  track.addEventListener('click', (e) => {
    if (e.target === handle) return;
    const rect = track.getBoundingClientRect();
    const x = e.clientX - rect.left;
    updateTimelineFromX(x, rect.width);
  });

  handle.addEventListener('pointerdown', (e) => {
    dragging = true;
    handle.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  window.addEventListener('pointerup', () => {
    dragging = false;
  });

  window.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const rect = track.getBoundingClientRect();
    let x = e.clientX - rect.left;
    updateTimelineFromX(x, rect.width);
  });

  function updateTimelineFromX(x, width) {
    if (x < 0) x = 0;
    if (x > width) x = width;
    const progress = x / width;

    // Map progress to decades (0 = "All", then 1950s, 1960s, etc.)
    const totalSteps = decades.length + 1; // +1 for "All"
    const stepIndex = Math.round(progress * (totalSteps - 1));

    if (stepIndex === 0) {
      currentDecade = null; // "All"
    } else {
      currentDecade = decades[stepIndex - 1];
    }

    // Update handle position
    const handleProgress = stepIndex / (totalSteps - 1);
    handle.style.left = (handleProgress * 100) + '%';

    // Update display and filter
    updateDecadeDisplay(currentDecade);
    updateFlightPathVisibility();
  }
})();

// ==========================================================
// CUSTOM PLANET POSITIONS
// ==========================================================
const customPositions = {
  sun:      new THREE.Vector3(0, 0, -3),    // Center the sun, behind flight paths
  mercury:  new THREE.Vector3(2, 1, 0),
  venus:    new THREE.Vector3(3, -1, 0),
  earth:    new THREE.Vector3(-2.5, -1.3, 0),  // Further away from sun
  mars:     new THREE.Vector3(-4, 1, 0),
  jupiter:  new THREE.Vector3(6, 0, -7),
  saturn:   new THREE.Vector3(8, 2, 0),
  uranus:   new THREE.Vector3(-7, 2, -2),
  neptune:  new THREE.Vector3(-9, -2, 1),
  "fictional locations": new THREE.Vector3(-5, -6, 2)  // Right side, lower to avoid text overlap
};

// ==========================================================
// CREATE SOLAR SYSTEM OBJECTS
// ==========================================================
const planetGroup = new THREE.Group();
scene.add(planetGroup);
planetGroup.visible = false;

const planetColors = {
  sun: 0xD4A520,  // Bronze/golden yellow
  mercury: 0xb1b1b1,
  venus: 0xe6b800,
  earth: 0x4ea5d5,
  mars: 0xc1440e,
  jupiter: 0xd9a066,
  saturn: 0xdcc58a,
  uranus: 0x7fdbff,
  neptune: 0x4169e1,
  "fictional locations": 0x9b59b6  // Purple for fictional/unknown
};

const radii = {
  sun: 1.5,        // Smaller sun
  mercury: 0.05,
  venus: 0.1,
  earth: 0.08,     // Smaller Earth
  mars: 0.25,      // Bigger Mars
  jupiter: 0.8,    // Smaller Jupiter
  saturn: 0.9,     // Smaller Saturn
  uranus: 0.4,     // Bigger Uranus
  neptune: 0.4,     // Bigger Neptune
  "fictional locations": 0.3  // Medium-sized sphere
};

Object.keys(planetColors).forEach((name)=>{
  // Skip creating a separate Earth planet - we'll use earthMesh instead
  if (name === 'earth') return;

  const radius = radii[name];
  const geo = new THREE.SphereGeometry(radius,32,32);

  // Use MeshStandardMaterial for realistic lighting and shadows
  let mat;
  if (name === 'sun') {
    // Sun should emit light - use emissive material
    // depthWrite: false so flight paths can render in front
    mat = new THREE.MeshStandardMaterial({
      color: planetColors[name],
      emissive: planetColors[name],
      emissiveIntensity: 2,  // Increased for brighter glow
      roughness: 1,
      metalness: 0,
      depthWrite: false  // Don't write to depth buffer so flight paths render in front
    });
  } else if (name === 'fictional locations') {
    // Fictional locations - mystical glowing purple sphere
    mat = new THREE.MeshStandardMaterial({
      color: planetColors[name],
      emissive: 0xaa44ff,  // Bright purple/magenta glow
      emissiveIntensity: 1.5,
      roughness: 0.3,
      metalness: 0.5,
      transparent: true,
      opacity: 0.95
    });
  } else {
    // Planets receive light and cast shadows
    mat = new THREE.MeshStandardMaterial({
      color: planetColors[name],
      roughness: 0.7,
      metalness: 0.2
    });
  }

  const p = new THREE.Mesh(geo, mat);

  p.userData = { name };
  p.position.set(0,0,-20); // start far away

  // Add glow halo around the sun with multiple layers for blur effect
  if (name === 'sun') {
    p.renderOrder = 0; // Render sun before flight paths

    const glowLayers = [
      { scale: 1.2, color: 0xFFD700, opacity: 0.4 },  // Innermost bright gold
      { scale: 1.4, color: 0xFFD700, opacity: 0.35 }, // Close bright gold
      { scale: 1.6, color: 0xFFCC66, opacity: 0.28 }, // Gold transition
      { scale: 1.8, color: 0xFFB84D, opacity: 0.22 }, // Gold-orange
      { scale: 2.0, color: 0xFFA500, opacity: 0.16 }, // Orange
      { scale: 2.2, color: 0xFF9933, opacity: 0.11 }, // Mid orange
      { scale: 2.4, color: 0xFF8C00, opacity: 0.06 }, // Far orange
      { scale: 2.6, color: 0xFF7722, opacity: 0.03 }  // Outer diffuse orange
    ];

    glowLayers.forEach((layer, index) => {
      const glowGeo = new THREE.SphereGeometry(radius * layer.scale, 32, 32);
      const glowMat = new THREE.MeshBasicMaterial({
        color: layer.color,
        transparent: true,
        opacity: layer.opacity,
        side: THREE.BackSide,
        depthWrite: false,  // Prevent z-fighting
        blending: THREE.AdditiveBlending  // Creates softer, more luminous blend
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.renderOrder = 0; // Render glow layers before flight paths
      glow.userData.animationPhase = index * 0.4; // Different phase for each layer
      glow.userData.baseOpacity = layer.opacity; // Store original opacity for animation
      glow.userData.isSunGlow = true; // Mark for animation
      p.add(glow);
    });
  }

  // Add mystical glow around fictional locations planet
  if (name === 'fictional locations') {
    p.renderOrder = 0; // Render before flight paths

    const mysticalGlowLayers = [
      { scale: 1.3, color: 0xdd66ff, opacity: 0.4 },  // Close bright purple
      { scale: 1.6, color: 0xcc55ee, opacity: 0.3 },  // Purple-pink
      { scale: 2.0, color: 0xaa44ff, opacity: 0.22 }, // Deep purple
      { scale: 2.5, color: 0x8844dd, opacity: 0.15 }, // Purple-blue
      { scale: 3.0, color: 0x6655cc, opacity: 0.1 },  // Dark purple
      { scale: 3.6, color: 0x5544bb, opacity: 0.06 }, // Very dark purple
      { scale: 4.2, color: 0x4433aa, opacity: 0.03 }  // Diffuse outer purple
    ];

    mysticalGlowLayers.forEach((layer, index) => {
      const glowGeo = new THREE.SphereGeometry(radius * layer.scale, 32, 32);
      const glowMat = new THREE.MeshBasicMaterial({
        color: layer.color,
        transparent: true,
        opacity: layer.opacity,
        side: THREE.BackSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.renderOrder = 0;
      glow.userData.animationPhase = index * 0.5; // Different phase for each layer
      glow.userData.baseOpacity = layer.opacity; // Store original opacity for animation
      glow.userData.isMysticalGlow = true; // Mark for animation
      p.add(glow);
    });
  }

  // Create label
  const labelDiv = document.createElement('div');
  labelDiv.className = 'planet-label';
  labelDiv.textContent = name.charAt(0).toUpperCase() + name.slice(1);
  const label = new CSS2DObject(labelDiv);
  label.position.set(0, radius + 0.3, 0); // Position above planet
  label.visible = false; // Hidden initially
  p.add(label);
  planetGroup.add(p);
});

// Add label to earthMesh
const earthLabelDiv = document.createElement('div');
earthLabelDiv.className = 'planet-label';
earthLabelDiv.textContent = 'Earth';
const earthLabel = new CSS2DObject(earthLabelDiv);
earthLabel.position.set(0, 0.5, 0); // Position above Earth
earthLabel.visible = false; // Hidden initially
earthMesh.add(earthLabel);

// ==========================================================
// MOONS
// ==========================================================
const moonsGroup = new THREE.Group();
moonsGroup.visible = false;
scene.add(moonsGroup);

// ==========================================================
// SPACE BACKGROUND (NASA HUBBLE IMAGE)
// ==========================================================
const starGroup = new THREE.Group();
starGroup.visible = false;
scene.add(starGroup);

// Load NASA Hubble space image as background
const textureLoader = new THREE.TextureLoader();
textureLoader.load('./map_photos/nasa-hubble-space-telescope-o1byzQYzMZA-unsplash.jpeg', (texture) => {
  // Preserve original image quality without smoothing/blurring
  texture.anisotropy = 1; // Minimal filtering for sharper appearance
  texture.minFilter = THREE.LinearMipmapLinearFilter; // Sharper at distance
  texture.magFilter = THREE.NearestFilter; // Crisp, no smoothing when close
  texture.generateMipmaps = true; // Generate mipmaps for better quality at distance
  texture.colorSpace = THREE.SRGBColorSpace; // Correct color space for accurate colors

  // Create a large sphere that surrounds the entire scene
  // Larger radius = less zoomed in appearance
  const spaceGeometry = new THREE.SphereGeometry(200, 256, 256); // Higher segments for more detail
  const spaceMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.BackSide, // Render on the inside of the sphere
    toneMapped: false // Disable tone mapping to preserve original colors and blacks
  });

  const spaceSphere = new THREE.Mesh(spaceGeometry, spaceMaterial);
  starGroup.add(spaceSphere);

  console.log('✅ NASA Hubble space background loaded');
}, undefined, (error) => {
  console.error('❌ Failed to load NASA Hubble image:', error);

  // Fallback: Create simple starfield if image fails to load
  const starGeometry = new THREE.BufferGeometry();
  const starCount = 2000;
  const starPositions = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    const radius = 50 + Math.random() * 50;

    starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    starPositions[i * 3 + 2] = radius * Math.cos(phi);
  }

  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));

  const starMaterial = new THREE.PointsMaterial({
    size: 0.15,
    color: 0xffffff,
    transparent: true,
    opacity: 0.8
  });

  const stars = new THREE.Points(starGeometry, starMaterial);
  starGroup.add(stars);
});

// Earth's Moon
const moonGeometry = new THREE.SphereGeometry(0.02, 16, 16);
const moonMaterial = new THREE.MeshStandardMaterial({
  color: 0xaaaaaa,
  roughness: 0.9,
  metalness: 0.1
});
const earthMoon = new THREE.Mesh(moonGeometry, moonMaterial);
earthMoon.userData = { parent: 'earth', name: 'Moon', offset: new THREE.Vector3(0.5, 0.5, 0.15) };

const earthMoonLabel = document.createElement('div');
earthMoonLabel.className = 'planet-label';
earthMoonLabel.textContent = 'Moon';
earthMoonLabel.style.fontSize = '11px';
const earthMoonLabelObj = new CSS2DObject(earthMoonLabel);
earthMoonLabelObj.position.set(0, 0.08, 0);
earthMoonLabelObj.visible = false; // Hidden initially
earthMoon.add(earthMoonLabelObj);

moonsGroup.add(earthMoon);

// Jupiter's Moons (Galilean moons)
const jupiterMoonNames = ['Io', 'Europa', 'Ganymede', 'Callisto'];
const jupiterMoonOffsets = [
  new THREE.Vector3(0.85, 0.2, 0.75),
  new THREE.Vector3(-1.5, -0.2, 0.5),
  new THREE.Vector3(1, 0.7, -0.5),
  new THREE.Vector3(-0.4, -1, -0.5)
];

jupiterMoonNames.forEach((name, i) => {
  const jMoonGeo = new THREE.SphereGeometry(0.015, 16, 16);
  const jMoonMat = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    roughness: 0.9,
    metalness: 0.1
  });
  const jMoon = new THREE.Mesh(jMoonGeo, jMoonMat);
  jMoon.userData = { parent: 'jupiter', name: name, offset: jupiterMoonOffsets[i] };

  const jMoonLabel = document.createElement('div');
  jMoonLabel.className = 'planet-label';
  jMoonLabel.textContent = name;
  jMoonLabel.style.fontSize = '10px';
  const jMoonLabelObj = new CSS2DObject(jMoonLabel);
  jMoonLabelObj.position.set(0, 0.06, 0);
  jMoonLabelObj.visible = false; // Hidden initially
  jMoon.add(jMoonLabelObj);

  moonsGroup.add(jMoon);
});

// ==========================================================
// SOLAR SYSTEM LIGHTING
// ==========================================================
const solarSystemLights = new THREE.Group();
solarSystemLights.visible = false;
scene.add(solarSystemLights);

// Ambient light for general illumination
const solarAmbientLight = new THREE.AmbientLight(0xffffff, 0.3);
solarSystemLights.add(solarAmbientLight);

// Point light from the sun's position
const sunLight = new THREE.PointLight(0xFFD700, 2.5, 100);  // Golden light to match sun color
sunLight.position.copy(customPositions.sun);
solarSystemLights.add(sunLight);

// Additional subtle directional light for definition
const solarDirectionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
solarDirectionalLight.position.set(5, 5, 5);
solarSystemLights.add(solarDirectionalLight);

let planetZoomInProgress = false;

// ==========================================================
// SOLAR SYSTEM FLIGHT PATHS
// ==========================================================
const solarFlightPathsGroup = new THREE.Group();
scene.add(solarFlightPathsGroup);
solarFlightPathsGroup.visible = false;

// Valid solar system destinations
const solarDestinations = ['Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Io', 'Europa', 'Ganymede', 'Callisto', 'Fictional Locations'];

async function loadSolarFlightPaths(){
  try {
    // Load both movie coordinates and the CSV data for fictional location names
    const response = await fetch('./movie-coordinates.json');
    const data = await response.json();
    const { connections } = data;

    // Load CSV data to get actual fictional location names
    const csvResponse = await fetch('./merged_movies_data.csv');
    const csvText = await csvResponse.text();

    // Proper CSV parser that handles quoted fields with commas
    function parseCSVLine(line) {
      const fields = [];
      let currentField = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            // Escaped quote
            currentField += '"';
            i++; // Skip next quote
          } else {
            // Toggle quote state
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          // Field separator
          fields.push(currentField);
          currentField = '';
        } else {
          currentField += char;
        }
      }
      fields.push(currentField); // Add last field
      return fields;
    }

    // Parse CSV with proper handling of quoted fields
    const csvLines = csvText.split('\n');
    const headers = parseCSVLine(csvLines[0]);
    const movieIndex = headers.findIndex(h => h.includes('Movie / TV Show Name'));
    const fantasyLocationIndex = headers.findIndex(h => h.includes('Depicted Location (Fantasy)'));

    console.log(`📊 CSV Headers - Movie Index: ${movieIndex}, Fantasy Location Index: ${fantasyLocationIndex}`);
    console.log(`📊 Total headers found: ${headers.length}`);

    // Create lookup map: movie name -> fictional location
    const fictionalLocationMap = {};
    for (let i = 1; i < csvLines.length; i++) {
      const line = csvLines[i];
      if (!line.trim()) continue;

      const fields = parseCSVLine(line);
      const movieName = fields[movieIndex]?.trim();
      const fantasyLocation = fields[fantasyLocationIndex]?.trim();

      if (movieName && fantasyLocation) {
        fictionalLocationMap[movieName] = fantasyLocation;
      }
    }

    console.log(`📍 Sample fictional locations:`, Object.entries(fictionalLocationMap).slice(0, 5));

    // Filter for connections that include any planet/moon
    const solarConnections = connections.filter(conn => {
      const fromLower = conn.from.toLowerCase();
      const toLower = conn.to.toLowerCase();

      // Check if either from or to contains a solar system destination
      const toIsSolarDest = solarDestinations.some(dest => toLower.includes(dest.toLowerCase()));
      const fromIsSolarDest = solarDestinations.some(dest => fromLower.includes(dest.toLowerCase()));

      // Include if either side has a planet/moon
      // (cities/countries on Earth will point to Earth's position)
      return toIsSolarDest || fromIsSolarDest;
    });

    console.log(`✅ Found ${solarConnections.length} solar system flight paths`);

    // Extract all Fictional Locations connections
    const fictionalConns = solarConnections.filter(c =>
      c.to === "Fictional Locations"
    );
    console.log(`📍 Fictional Locations connections: ${fictionalConns.length}`);

    // Create single arc to Fictional Locations with all movies
    if (fictionalConns.length > 0) {
      const earthPos = customPositions.earth;
      const fictionalPos = customPositions["fictional locations"];

      const start = new THREE.Vector3(earthPos.x, earthPos.y, earthPos.z);
      const end = new THREE.Vector3(fictionalPos.x, fictionalPos.y, fictionalPos.z);

      const mid = start.clone().lerp(end, 0.5);
      const dist = start.distanceTo(end);
      mid.y += dist * 0.3;

      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const points = curve.getPoints(200); // More points for smoother lines

      const positions = [];
      const colors = [];
      const purpleColor = new THREE.Color(0x9747FF);
      const tealColor = new THREE.Color(0x46AACB);

      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        positions.push(point.x, point.y, point.z);

        const t = i / (points.length - 1);
        const color = new THREE.Color().lerpColors(purpleColor, tealColor, t);
        colors.push(color.r, color.g, color.b);
      }

      const geometry = new LineGeometry();
      geometry.setPositions(positions);
      geometry.setColors(colors);

      const lineMaterial = new LineMaterial({
        color: 0xffffff,
        linewidth: 3,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        depthWrite: true,
        depthTest: true,
        alphaToCoverage: true // Enable for smoother edges
      });
      lineMaterial.resolution.set(window.innerWidth, window.innerHeight);

      const line = new Line2(geometry, lineMaterial);
      line.renderOrder = 100; // Render on top of sun and planets

      // Store all fictional location movies in userData with actual fictional location names
      line.userData = {
        to: "Fictional Locations",
        from: "Earth",
        isFictionalLocations: true,
        movies: fictionalConns.map(c => ({
          movie: c.movie,
          year: c.year,
          from: c.from,
          to: fictionalLocationMap[c.movie] || "Fictional Locations"
        }))
      };

      solarFlightPathsGroup.add(line);
      console.log(`✅ Created Fictional Locations arc with ${fictionalConns.length} movies`);
    }

    // Filter out Fictional Locations from regular solar connections
    const regularSolarConns = solarConnections.filter(c =>
      c.to !== "Fictional Locations" && c.from !== "Fictional Locations"
    );

    // Create flight paths between Earth and destinations (excluding Fictional Locations)
    regularSolarConns.forEach((conn) => {
      const fromLower = conn.from.toLowerCase();
      const toLower = conn.to.toLowerCase();

      // Find which side has the planet/moon
      let destName;
      if (solarDestinations.some(dest => toLower.includes(dest.toLowerCase()))) {
        destName = conn.to;
      } else {
        destName = conn.from;
      }

      // Find matching planet/moon name
      const matchedLocation = solarDestinations.find(loc =>
        destName.toLowerCase().includes(loc.toLowerCase())
      );

      if (!matchedLocation) {
        console.log(`⚠️ No match for: ${destName}`);
        return;
      }

      // Get destination position
      let destPos;
      const lowerMatch = matchedLocation.toLowerCase();

      // Debug logging for Fictional Locations
      if (matchedLocation === "Fictional Locations") {
        console.log(`🔍 Processing Fictional Locations path: ${conn.from} → ${conn.to}`);
        console.log(`🔍 Looking up: customPositions["${lowerMatch}"]`);
      }

      // Check if it's a planet or moon
      if (customPositions[lowerMatch]) {
        destPos = customPositions[lowerMatch];
        if (matchedLocation === "Fictional Locations") {
          console.log(`✅ Found position:`, destPos);
        }
      } else {
        // It's a moon - calculate position
        const moon = moonsGroup.children.find(m =>
          m.userData.name && m.userData.name.toLowerCase() === lowerMatch
        );
        if (moon) {
          destPos = moon.userData.offset.clone();
          if (moon.userData.parent === 'earth') {
            destPos.add(customPositions.earth);
          } else if (moon.userData.parent === 'jupiter') {
            destPos.add(customPositions.jupiter);
          }
        }
      }

      if (!destPos) {
        console.log(`❌ No position found for: ${matchedLocation} (lowerMatch: ${lowerMatch})`);
        return;
      }

      // Create arc from Earth to destination
      const earthPos = customPositions.earth;
      const start = new THREE.Vector3(earthPos.x, earthPos.y, earthPos.z);
      const end = new THREE.Vector3(destPos.x, destPos.y, destPos.z);

      // Calculate control point for arc
      const mid = start.clone().lerp(end, 0.5);
      const dist = start.distanceTo(end);
      mid.y += dist * 0.3; // Arc upward

      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);

      // Get points from curve for line geometry - more points = smoother
      const points = curve.getPoints(200);

      // Create Line2 geometry with thick lines
      const positions = [];
      const colors = [];
      const purpleColor = new THREE.Color(0x9747FF);
      const tealColor = new THREE.Color(0x46AACB);

      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        positions.push(point.x, point.y, point.z);

        // Gradient from purple to teal
        const t = i / (points.length - 1);
        const color = new THREE.Color().lerpColors(purpleColor, tealColor, t);
        colors.push(color.r, color.g, color.b);
      }

      const geometry = new LineGeometry();
      geometry.setPositions(positions);
      geometry.setColors(colors);

      // Create thick line material for solar paths with alpha for smoothness
      const lineMaterial = new LineMaterial({
        color: 0xffffff,
        linewidth: 3, // in pixels
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        depthWrite: true,
        depthTest: true,
        alphaToCoverage: true // Enable for smoother edges
      });
      lineMaterial.resolution.set(window.innerWidth, window.innerHeight);

      const line = new Line2(geometry, lineMaterial);
      line.renderOrder = 100; // Render on top of sun and planets

      // Parse year to integer for filtering
      const yearInt = parseInt(conn.year) || 0;
      line.userData = {
        movie: conn.movie,
        year: yearInt,
        from: 'Earth',
        to: matchedLocation
      };

      solarFlightPathsGroup.add(line);

      if (matchedLocation === "Fictional Locations") {
        console.log(`✅ Created path to Fictional Locations from ${conn.from}`);
      }
    });

    console.log(`📊 Total solar paths created: ${solarFlightPathsGroup.children.length}`);

  } catch (error) {
    console.error('❌ Error loading solar flight paths:', error);
  }
}

loadSolarFlightPaths();
// ==========================================================
// EARTH MORPH
// ==========================================================
const spherePos = sphereGeometry.attributes.position;
const planePos = planeGeometry.attributes.position;

let morphProgress = 0;
let targetMorphProgress = 0;
let morphSpeed = 0.15;

// Discrete zoom level structure:
// 1.2 (zoomMin) = US Map view
// 5.0 (usToWorldZoom) = World Map view
// 20.0 (zoomMax) = Globe/Solar System view
let zoomMin = 1.2;
let usToWorldZoom = 5.0;
let zoomMax = 20.0;

// Zoom state management
const ZOOM_STATES = {
  US: 0,
  WORLD: 1,
  SOLAR: 2
};

const ZOOM_POSITIONS = {
  [ZOOM_STATES.US]: 1.2,
  [ZOOM_STATES.WORLD]: 5.0,
  [ZOOM_STATES.SOLAR]: 20.0
};

let currentZoomState = ZOOM_STATES.US;
let targetCameraZ = ZOOM_POSITIONS[ZOOM_STATES.US];
let isTransitioning = false;

// Expose zoom state variables to window for HTML page script access
window.ZOOM_STATES = ZOOM_STATES;
window.ZOOM_POSITIONS = ZOOM_POSITIONS;
// Use getters/setters so changes are reflected
Object.defineProperty(window, 'currentZoomState', {
  get: () => currentZoomState,
  set: (value) => { currentZoomState = value; }
});
Object.defineProperty(window, 'targetCameraZ', {
  get: () => targetCameraZ,
  set: (value) => { targetCameraZ = value; }
});

let scaleStart = 1.0;
let scaleEnd = 0.4;
let worldScale = 3.8; // Fullscreen scale for world view

let autoZoomingOut = false;

// NEW: second-click collapse flag
let secondZoomOut = false;

function triggerFullZoomOut(){
  targetMorphProgress = 1;
  autoZoomingOut = true;
}

function ease(t){
  return t<0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
}

// ==========================================================
// MAIN ANIMATION LOOP
// ==========================================================
let collapseProgress = 0;
let newShapes = [];
let newShapesVisible = false;

function animate(){
  requestAnimationFrame(animate);

  // Animate mystical glow on fictional locations planet and sun
  const time = performance.now() * 0.001; // Convert to seconds
  planetGroup.children.forEach(planet => {
    // Animate fictional locations mystical glow
    if (planet.userData && planet.userData.name === 'fictional locations') {
      planet.children.forEach(child => {
        if (child.userData && child.userData.isMysticalGlow) {
          // Pulsing opacity effect with different phases for each layer
          const phase = child.userData.animationPhase || 0;
          const baseOpacity = child.userData.baseOpacity || child.material.opacity;
          const pulse = Math.sin(time * 2 + phase) * 0.2 + 0.8; // Oscillates between 0.6 and 1.0
          child.material.opacity = baseOpacity * pulse;

          // Subtle scale pulsing
          const scalePulse = Math.sin(time * 1.5 + phase) * 0.04 + 1.0; // Oscillates around 1.0
          child.scale.set(scalePulse, scalePulse, scalePulse);
        }
      });
    }

    // Animate sun's glow
    if (planet.userData && planet.userData.name === 'sun') {
      planet.children.forEach(child => {
        if (child.userData && child.userData.isSunGlow) {
          // Pulsing opacity effect with different phases for each layer
          const phase = child.userData.animationPhase || 0;
          const baseOpacity = child.userData.baseOpacity || child.material.opacity;
          const pulse = Math.sin(time * 1.5 + phase) * 0.15 + 0.85; // Oscillates between 0.7 and 1.0
          child.material.opacity = baseOpacity * pulse;

          // Subtle scale pulsing (less pronounced than fictional locations)
          const scalePulse = Math.sin(time * 1.2 + phase) * 0.025 + 1.0; // Oscillates around 1.0
          child.scale.set(scalePulse, scalePulse, scalePulse);
        }
      });
    }
  });

  // Hide all solar system elements when not on map page (page 1)
  if (typeof currentPage !== 'undefined' && currentPage !== 1) {
    planetGroup.visible = false;
    moonsGroup.visible = false;
    solarFlightPathsGroup.visible = false;
    solarSystemLights.visible = false;
    starGroup.visible = false;

    // Hide all labels
    if (earthLabel) earthLabel.visible = false;
    planetGroup.children.forEach(planet => {
      if (!planet.children) return;
      planet.children.forEach(child => {
        if (child.isCSS2DObject) child.visible = false;
      });
    });
    moonsGroup.children.forEach(moon => {
      moon.children.forEach(child => {
        if (child.isCSS2DObject) child.visible = false;
      });
    });
  }

  // SMOOTH CAMERA TRANSITIONS
  const cameraDiff = Math.abs(camera.position.z - targetCameraZ);
  if (cameraDiff > 0.01) {
    // Smooth interpolation to target position
    camera.position.z += (targetCameraZ - camera.position.z) * 0.08;
    isTransitioning = true;
    updateMorphFromZoom();
  } else {
    // Snap to exact position when close enough
    if (isTransitioning) {
      camera.position.z = targetCameraZ;
      isTransitioning = false;
      updateMorphFromZoom();
    }
  }

  // ZOOM OUT (legacy auto-zoom)
  if(autoZoomingOut){
    camera.position.z += 0.4;
    if(camera.position.z >= zoomMax){
      camera.position.z = zoomMax;
      autoZoomingOut = false;
    }
    updateMorphFromZoom();
  }

  // MAP TRANSITIONS (US zoom → World)
  // Calculate transition progress: 0 at zoomMin (US zoomed), 1 at usToWorldZoom (World full)
  const mapTransitionProgress = Math.max(0, Math.min(1,
    (camera.position.z - zoomMin) / (usToWorldZoom - zoomMin)
  ));

  // Apply zoom/pan for US view or transition to world view
  if (camera.position.z <= usToWorldZoom) {
    // US center coordinates: -95.5° lon, 37° lat
    // In plane coordinates: x = -95.5/180 = -0.53, y = (37/90)*0.5 = 0.206
    const usCenter = { x: -0.65, y: 0.15 };

    // Zoom scales
    const usZoomScale = 3.0;    // US view scale

    // Interpolate scale: 5.5x at zoomMin, worldScale at usToWorldZoom
    const currentScale = THREE.MathUtils.lerp(usZoomScale, worldScale, mapTransitionProgress);

    // Interpolate position: centered on US at zoomMin, centered at origin at usToWorldZoom
    const currentOffsetX = THREE.MathUtils.lerp(-usCenter.x, 0, mapTransitionProgress);
    const currentOffsetY = THREE.MathUtils.lerp(-usCenter.y, 0, mapTransitionProgress);

    // Apply scale (but don't override morph scale)
    const verticalScale = currentScale * 1.3
    earthMesh.scale.set(currentScale, verticalScale, currentScale);

    // Apply position offset
    earthMesh.position.x = currentOffsetX * currentScale;
    earthMesh.position.y = currentOffsetY * currentScale;
    earthMesh.position.z = 0;
  } else {
    // At world view and beyond, ensure map is centered at fullscreen scale
    // (unless morphing to globe, which is handled separately)
    if (camera.position.z < zoomMax - 1) {
      earthMesh.position.x = 0;
      earthMesh.position.y = 0;
      earthMesh.position.z = 0;
      earthMesh.scale.set(worldScale, worldScale, worldScale);
    }
  }

  // Update flight path group visibility and transformations
  // US paths visible when in US zoom state
  usFlightPathGroup.visible = currentZoomState === ZOOM_STATES.US;

  // Match US flight paths to map transformation
  if (currentZoomState === ZOOM_STATES.US) {
    const usCenter = { x: -0.65, y: 0.15 };
    const usZoomScale = 3.0;
    const currentScale = THREE.MathUtils.lerp(usZoomScale, worldScale, mapTransitionProgress);
    const currentOffsetX = THREE.MathUtils.lerp(-usCenter.x, 0, mapTransitionProgress);
    const currentOffsetY = THREE.MathUtils.lerp(-usCenter.y, 0, mapTransitionProgress);

    // Apply same transformation to US flight paths
    const verticalScale = currentScale * 1.3
    usFlightPathGroup.scale.set(currentScale, verticalScale, currentScale);
    usFlightPathGroup.position.x = currentOffsetX * currentScale;
    usFlightPathGroup.position.y = currentOffsetY * currentScale;
    usFlightPathGroup.position.z = 0;

    // Counter-scale circles (sprites) to maintain size and circular shape
    usFlightPathGroup.children.forEach(child => {
      if (child.isSprite) {
        // Inverse scale to maintain original size and circular shape
        const baseSize = 0.015; // Original circle size (slightly smaller)
        child.scale.set(
          baseSize / currentScale,      // Counter horizontal scale
          baseSize / verticalScale,     // Counter vertical scale (different due to 1.3x)
          1
        );
      }
    });
  }

  // International paths visible when in WORLD state
  flightPathGroup.visible = currentZoomState === ZOOM_STATES.WORLD;

  // Scale international flight paths to match fullscreen world map
  if (currentZoomState === ZOOM_STATES.WORLD) {
    flightPathGroup.scale.set(worldScale, worldScale, worldScale);
    flightPathGroup.position.set(0, 0, 0);

    // Counter-scale circles (sprites) to maintain size
    flightPathGroup.children.forEach(child => {
      if (child.isSprite) {
        const baseSize = 0.015; // Original circle size (slightly smaller)
        const worldCircleMultiplier = 2.5; // Make world map circles larger, but a bit smaller than before
        child.scale.set(
          (baseSize / worldScale) * worldCircleMultiplier,
          (baseSize / worldScale) * worldCircleMultiplier,
          1
        );
      }
    });
  }

  // MORPH EARTH (only when past usToWorldZoom)
  morphProgress += (targetMorphProgress - morphProgress) * morphSpeed;
  const eased = ease(Math.min(1, morphProgress));

  for(let i=0;i<geometry.attributes.position.count;i++){
    geometry.attributes.position.setXYZ(
      i,
      THREE.MathUtils.lerp(planePos.getX(i), spherePos.getX(i), eased),
      THREE.MathUtils.lerp(planePos.getY(i), spherePos.getY(i), eased),
      THREE.MathUtils.lerp(planePos.getZ(i), spherePos.getZ(i), eased)
    );
  }

  geometry.attributes.position.needsUpdate = true;

  // Only apply morph scale when zoomed out past world view
  if (camera.position.z >= usToWorldZoom) {
    // Morph from world fullscreen scale to globe scale
    earthMesh.scale.set(
      THREE.MathUtils.lerp(worldScale, scaleEnd, eased),
      THREE.MathUtils.lerp(worldScale, scaleEnd, eased),
      THREE.MathUtils.lerp(worldScale, scaleEnd, eased)
    );
  }

  // Fade-out flight paths as we morph to globe
  const fade = Math.max(0, 1 - morphProgress*5);
  flightPathGroup.children.forEach(line=>{
    line.material.opacity = fade * 0.9; // Fade from 0.9 to 0
  });

  // SHOW SOLAR SYSTEM
  if(
    !planetGroup.visible &&
    morphProgress > 0.98 &&
    camera.position.z >= zoomMax - 0.1
  ){
    console.log(`🌟 Showing solar system (camera.z = ${camera.position.z.toFixed(2)})`);
    planetGroup.visible = true;
    moonsGroup.visible = true;
    solarFlightPathsGroup.visible = true;
    solarSystemLights.visible = true;
    console.log(`📊 Solar paths visibility set to: ${solarFlightPathsGroup.visible}, children: ${solarFlightPathsGroup.children.length}`);
    starGroup.visible = true;
    planetZoomInProgress = true;

    // Keep all planet and moon labels hidden by default
    // They will be shown on hover in the mousemove handler
    earthLabel.visible = false;
    planetGroup.children.forEach(planet => {
      if (!planet.children) return;
      planet.children.forEach(child => {
        if (child.isCSS2DObject) child.visible = false;
      });
    });
    moonsGroup.children.forEach(moon => {
      moon.children.forEach(child => {
        if (child.isCSS2DObject) child.visible = false;
      });
    });
  }

  // PLANETS ZOOM TO CUSTOM POSITIONS
  if(planetZoomInProgress && !secondZoomOut){
    // Move Earth mesh to its solar system position
    earthMesh.position.lerp(customPositions.earth, 0.12);

    // Scale Earth to match other planets (0.08 radius)
    const targetEarthScale = 0.08;
    earthMesh.scale.lerp(
      new THREE.Vector3(targetEarthScale, targetEarthScale, targetEarthScale),
      0.12
    );

    // Move other planets (only meshes, not lights)
    planetGroup.children.forEach((planet)=>{
      if (!planet.userData || !planet.userData.name) return; // Skip non-planet objects
      const name = planet.userData.name;
      planet.position.lerp(customPositions[name], 0.12);
    });

    // Position moons relative to their parent planets
    moonsGroup.children.forEach(moon => {
      const parentName = moon.userData.parent;
      let parentPos;

      if (parentName === 'earth') {
        parentPos = earthMesh.position;
      } else if (parentName === 'jupiter') {
        const jupiterPlanet = planetGroup.children.find(p => p.userData.name === 'jupiter');
        parentPos = jupiterPlanet ? jupiterPlanet.position : new THREE.Vector3(0, 0, 0);
      }

      if (parentPos) {
        const targetPos = parentPos.clone().add(moon.userData.offset);
        moon.position.lerp(targetPos, 0.12);
      }
    });
  }

  // ZOOM BACK IN FROM SOLAR SYSTEM
  // When user starts zooming in, hide solar system and return Earth to center
  if(planetGroup.visible && camera.position.z < zoomMax - 2){
    // Hide solar system elements
    planetGroup.visible = false;
    moonsGroup.visible = false;
    solarFlightPathsGroup.visible = false;
    solarSystemLights.visible = false;
    starGroup.visible = false;
    planetZoomInProgress = false;

    // Hide all labels
    earthLabel.visible = false;
    planetGroup.children.forEach(planet => {
      if (!planet.children) return; // Skip if no children
      planet.children.forEach(child => {
        if (child.isCSS2DObject) child.visible = false;
      });
    });
    moonsGroup.children.forEach(moon => {
      moon.children.forEach(child => {
        if (child.isCSS2DObject) child.visible = false;
      });
    });

    // Reset planets and moons to start positions (only meshes with userData)
    planetGroup.children.forEach(p => {
      if (!p.userData || !p.userData.name) return; // Skip non-planet objects
      p.position.set(0, 0, -20);
    });
    moonsGroup.children.forEach(m => {
      m.position.set(0, 0, -20);
    });
  }

  // Return Earth to center as we zoom in from solar system to world map
  // Only apply when between usToWorldZoom and zoomMax (not in US zoom range)
  if(!planetGroup.visible && camera.position.z > usToWorldZoom){
    // Calculate how much we should return to center based on zoom
    const returnProgress = 1 - ((camera.position.z - usToWorldZoom) / (zoomMax - usToWorldZoom));

    // Return Earth to center
    earthMesh.position.lerp(new THREE.Vector3(0, 0, 0), returnProgress * 0.3);

    // Return Earth to world fullscreen scale
    // When at max zoom, Earth should be at scaleEnd (0.4)
    // When at usToWorldZoom, Earth should be at worldScale
    const currentTargetScale = THREE.MathUtils.lerp(scaleEnd, worldScale, returnProgress);
    earthMesh.scale.lerp(
      new THREE.Vector3(currentTargetScale, currentTargetScale, currentTargetScale),
      0.3
    );
  }

  // Snap Earth to world view center when at usToWorldZoom
  // Don't snap at zoomMin since we're showing US zoom there
  if(!planetGroup.visible && camera.position.z <= usToWorldZoom + 0.1 && camera.position.z >= usToWorldZoom - 0.1){
    earthMesh.position.set(0, 0, 0);
    earthMesh.scale.set(worldScale, worldScale, worldScale);
  }

  // ==========================================================
  // SECOND CLICK → COLLAPSE EVERYTHING TO (0,0,0)
  // ==========================================================
if (secondZoomOut) {

    // Accelerate collapse (0 → 1)
    collapseProgress += 0.002;
    if (collapseProgress > 1) collapseProgress = 1;

    const accel = collapseProgress * collapseProgress * collapseProgress;
    const collapseSpeed = 0.001 + accel * 0.02;

    const farAway = new THREE.Vector3(0, 0, -100000);

    // Earth collapses
    earthMesh.position.lerp(farAway, collapseSpeed);
    earthMesh.scale.lerp(new THREE.Vector3(0,0,0), collapseSpeed);

    // Planets collapse
    planetGroup.children.forEach(p => {
      p.position.lerp(farAway, collapseSpeed);
      p.scale.lerp(new THREE.Vector3(0,0,0), collapseSpeed);
    });

    // Flight paths collapse
    flightPathGroup.children.forEach(f => {
      f.position.lerp(farAway, collapseSpeed);
      f.scale.lerp(new THREE.Vector3(0,0,0), collapseSpeed);
    });


    // SPAWN IN NEW SHAPES
   if (!newShapesVisible) {
    console.log("CREATE NEW SHAPES");
    console.log(camera.position);
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(20, 20, 20);
    scene.add(light);

    const ambient = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambient);

    // Cube
    const cube = new THREE.Mesh(
        new THREE.BoxGeometry(2,2,2),
        new THREE.MeshStandardMaterial({ color: 0xff4444 })
    );
    cube.position.set(0,0,6000);              // start far behind camera
    cube.target = new THREE.Vector3(0,0,0);    // zoom toward center
    scene.add(cube);

    // Sphere
    const sph = new THREE.Mesh(
        new THREE.SphereGeometry(1.2,32,32),
        new THREE.MeshStandardMaterial({ color: 0x44ff44 })
    );
    sph.position.set(4,2,5000);
    sph.target = new THREE.Vector3(2,1,0);
    scene.add(sph);

    // Cone
    const cone = new THREE.Mesh(
        new THREE.ConeGeometry(1.2,2.5,32),
        new THREE.MeshStandardMaterial({ color: 0x4488ff })
    );
    cone.position.set(-4,-2,5000);
    cone.target = new THREE.Vector3(-2,-1,0);
    scene.add(cone);

    newShapes.push(cube, sph, cone);
    newShapesVisible = true;
}

}

// ==========================================================
// NEW SHAPES → SPIN + ZOOM IN
// ==========================================================
if (newShapesVisible) {
    newShapes.forEach(obj => {
        obj.rotation.x += 0.01;
        obj.rotation.y += 0.01;

        // zoom toward target
        obj.position.lerp(obj.target, 0.03);
    });
}



  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}

animate();

function updateMorphFromZoom(){
  // Morph should happen between world map (usToWorldZoom) and globe (zoomMax)
  const n = (camera.position.z - usToWorldZoom)/(zoomMax - usToWorldZoom);
  targetMorphProgress = Math.max(0, Math.min(1, n));
}

// ==========================================================
// MOVIE DATA MAPPING (Title → ID for posters)
// ==========================================================
let movieTitleToId = {};

async function loadMovieData() {
  try {
    const { default: moviesData } = await import('./movies_data_for_shelf.js');
    movieTitleToId = {};
    moviesData.forEach(movie => {
      movieTitleToId[movie.title] = movie.id;
    });
    console.log(`✅ Loaded ${Object.keys(movieTitleToId).length} movie poster mappings`);
  } catch (error) {
    console.error('❌ Failed to load movie data:', error);
  }
}

loadMovieData();

// ==========================================================
// MOVIE HOVER CARD
// ==========================================================
const hoverCard = document.getElementById('movieHoverCard');
const hoverTitle = document.getElementById('movieHoverTitle');
const hoverContent = document.getElementById('movieHoverContent');

// Track whether mouse is over the hover card or a flight path
let isMouseOverHoverCard = false;
let isMouseOverFlightPath = false;
let hideHoverCardTimeout = null;

// Function to show only relevant planet/moon labels based on flight path destination
function showRelevantLabel(destination) {
  // Hide all labels first
  hideAllSolarLabels();

  if (!destination) return;

  const destLower = destination.toLowerCase().trim();

  // Show Earth label if destination is Earth
  if (destLower === 'earth') {
    if (earthLabel) {
      earthLabel.visible = true;
      console.log('Showing Earth label');
    }
    return;
  }

  // Check if it's a planet label (including "fictional locations")
  let labelFound = false;
  planetGroup.children.forEach(planet => {
    if (planet.userData && planet.userData.name) {
      const planetNameLower = planet.userData.name.toLowerCase().trim();
      // Match exact name or partial match for "fictional locations"
      if (planetNameLower === destLower ||
          (destLower.includes('fictional') && planetNameLower.includes('fictional'))) {
        planet.children.forEach(child => {
          if (child.isCSS2DObject) {
            child.visible = true;
            labelFound = true;
            console.log(`Showing label for planet: ${planet.userData.name}`);
          }
        });
      }
    }
  });

  // Check if it's a moon label
  if (!labelFound) {
    moonsGroup.children.forEach(moon => {
      if (moon.userData && moon.userData.name && moon.userData.name.toLowerCase().trim() === destLower) {
        moon.children.forEach(child => {
          if (child.isCSS2DObject) {
            child.visible = true;
            console.log(`Showing label for moon: ${moon.userData.name}`);
          }
        });
      }
    });
  }
}

// Function to hide all solar system labels
function hideAllSolarLabels() {
  if (earthLabel) earthLabel.visible = false;

  planetGroup.children.forEach(planet => {
    if (!planet.children) return;
    planet.children.forEach(child => {
      if (child.isCSS2DObject) child.visible = false;
    });
  });

  moonsGroup.children.forEach(moon => {
    moon.children.forEach(child => {
      if (child.isCSS2DObject) child.visible = false;
    });
  });
}

function showMovieHoverCard(movies, x, y) {
  // Clear any pending hide timeout since we're showing the card
  if (hideHoverCardTimeout) {
    clearTimeout(hideHoverCardTimeout);
    hideHoverCardTimeout = null;
  }

  if (!Array.isArray(movies)) {
    movies = [movies];
  }

  // Set title - if single movie, show movie name with year
  // If multiple movies, show count
  if (movies.length === 1) {
    const movie = movies[0];
    hoverTitle.textContent = `${movie.movie} (${movie.year})`;
  } else {
    hoverTitle.textContent = `${movies.length} Movies`;
  }

  // Build content with poster + details for each movie
  hoverContent.innerHTML = '';

  movies.forEach(movie => {
    const row = document.createElement('div');
    row.className = 'movieHoverRow';

    // Poster image
    const posterId = movieTitleToId[movie.movie];
    const posterImg = document.createElement('img');
    posterImg.className = 'movieHoverPoster';
    posterImg.src = posterId !== undefined ? `./postersID/${posterId}.jpg` : './postersID/placeholder.jpg';
    posterImg.alt = movie.movie;
    posterImg.onerror = () => {
      posterImg.src = './postersID/0.jpg'; // Fallback to first image if missing
    };

    // Details text
    const details = document.createElement('div');
    details.className = 'movieHoverDetails';

    let detailsHTML = '';

    // For multi-movie hover cards, show the movie name
    if (movies.length > 1) {
      detailsHTML += `<strong>${movie.movie} (${movie.year})</strong><br><br>`;
    }

    detailsHTML += `<strong>Production:</strong> ${movie.from}<br><br>`;
    detailsHTML += `<strong>Depicted:</strong> ${movie.to}`;

    if (movie.isSameLocation) {
      detailsHTML += ` (same location)`;
    }

    details.innerHTML = detailsHTML;

    row.appendChild(posterImg);
    row.appendChild(details);
    hoverContent.appendChild(row);
  });

  // Show the card and enable pointer events for scrolling
  hoverCard.style.opacity = 1;
  hoverCard.style.pointerEvents = 'auto';

  // Position the card with smart overflow handling
  const cardRect = hoverCard.getBoundingClientRect();
  const screenW = window.innerWidth;
  const screenH = window.innerHeight;

  let cardX = x + 20;
  let cardY = y + 20;

  // Prevent right overflow
  if (cardX + cardRect.width > screenW - 10) {
    cardX = x - cardRect.width - 20;
  }

  // Prevent bottom overflow
  if (cardY + cardRect.height > screenH - 10) {
    cardY = y - cardRect.height - 20;
  }

  // Clamp positions
  cardX = Math.max(10, Math.min(cardX, screenW - cardRect.width - 10));
  cardY = Math.max(10, Math.min(cardY, screenH - cardRect.height - 10));

  hoverCard.style.left = `${cardX}px`;
  hoverCard.style.top = `${cardY}px`;
}

function hideMovieHoverCard() {
  // Clear any existing timeout
  if (hideHoverCardTimeout) {
    clearTimeout(hideHoverCardTimeout);
  }

  // Add a small delay before hiding (250ms) to give user time to move cursor to popup
  hideHoverCardTimeout = setTimeout(() => {
    // Only hide if mouse is not over the hover card
    if (!isMouseOverHoverCard && !isMouseOverFlightPath) {
      hoverCard.style.opacity = 0;
      hoverCard.style.pointerEvents = 'none';
    }
    hideHoverCardTimeout = null;
  }, 250);
}

// Add event listeners to track mouse over hover card
hoverCard.addEventListener('mouseenter', () => {
  isMouseOverHoverCard = true;
  // Clear any pending hide timeout when mouse enters the card
  if (hideHoverCardTimeout) {
    clearTimeout(hideHoverCardTimeout);
    hideHoverCardTimeout = null;
  }
});

hoverCard.addEventListener('mouseleave', () => {
  isMouseOverHoverCard = false;
  // Use delayed hide when mouse leaves
  hideMovieHoverCard();
});

// Prevent wheel events on the hover card from affecting the main view zoom
hoverCard.addEventListener('wheel', (e) => {
  e.stopPropagation();
}, { passive: true });

// ==========================================================
// TOOLTIP (HOVER) - UPDATED FOR HOVER CARD
// ==========================================================
const tooltip = document.getElementById('flightPathTooltip');
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener("mousemove", (evt) => {
  mouse.x = (evt.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(evt.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  // Adjust hover sensitivity based on zoom state
  // Higher values = more sensitive (easier to hover)
  if (currentZoomState === ZOOM_STATES.US) {
    raycaster.params.Line.threshold = 0.015; // Very sensitive for US map
  } else if (currentZoomState === ZOOM_STATES.WORLD) {
    raycaster.params.Line.threshold = 0.025; // Less sensitive for world view
  } else if (currentZoomState === ZOOM_STATES.SOLAR) {
    raycaster.params.Line.threshold = 0.075; // Least sensitive for solar view
  }

  // Only check the currently visible flight path group based on zoom state
  let allHits = [];
  let planetHits = [];

  if (currentZoomState === ZOOM_STATES.US && usFlightPathGroup.visible) {
    // US view: only check US domestic paths that are visible
    const visiblePaths = usFlightPathGroup.children.filter(child => child.visible);
    allHits = raycaster.intersectObjects(visiblePaths, false);
  } else if (currentZoomState === ZOOM_STATES.WORLD && flightPathGroup.visible) {
    // World view: only check international Earth paths that are visible
    const visiblePaths = flightPathGroup.children.filter(child => child.visible);
    allHits = raycaster.intersectObjects(visiblePaths, false);
  } else if (currentZoomState === ZOOM_STATES.SOLAR && solarFlightPathsGroup.visible) {
    // Solar system view: only check solar paths that are visible
    const visiblePaths = solarFlightPathsGroup.children.filter(child => child.visible);
    allHits = raycaster.intersectObjects(visiblePaths, false);

    // Also check for planet/moon hovers in solar view
    const allPlanets = [...planetGroup.children, ...moonsGroup.children, earthMesh];
    planetHits = raycaster.intersectObjects(allPlanets, true);
  }

  const hovering = allHits.length > 0;
  const hoveringPlanet = planetHits.length > 0 && currentZoomState === ZOOM_STATES.SOLAR;
  isMouseOverFlightPath = hovering;

  if (hovering) {
    if (cursor) cursor.classList.add("hover");

    // Show hover card for the closest hit
    const obj = allHits[0].object;
    const d = obj.userData;

    // Show relevant planet/moon label when hovering in solar view
    if (currentZoomState === ZOOM_STATES.SOLAR && d.to) {
      showRelevantLabel(d.to);
    }

    // Prepare movie data for hover card
    if (d.isFictionalLocations && d.movies) {
      // Special case: Fictional Locations - filter by current decade
      let filteredMovies = d.movies;

      if (currentDecade !== null) {
        // Filter to only show movies from the selected 5-year window
        filteredMovies = d.movies.filter(m => {
          const year = parseInt(m.year);
          return year >= currentDecade && year < currentDecade + WINDOW_STEP;
        });
      }

      if (filteredMovies.length > 0) {
        showMovieHoverCard(filteredMovies, evt.clientX, evt.clientY);
      } else {
        // No movies in this time period - show simple tooltip
        hideMovieHoverCard();
      }
    } else {
      // Single movie (regular path or same-location circle)
      const movieData = {
        movie: d.movie,
        year: d.year,
        from: d.from,
        to: d.to,
        isSameLocation: d.isSameLocation || false
      };
      showMovieHoverCard(movieData, evt.clientX, evt.clientY);
    }
  } else if (hoveringPlanet) {
    // Hovering over a planet/moon but not a flight path
    if (cursor) cursor.classList.add("hover");

    // Find which planet/moon is being hovered
    let planetName = null;

    // Check if it's Earth
    if (planetHits[0].object === earthMesh || planetHits[0].object.parent === earthMesh) {
      planetName = 'Earth';
    } else {
      // Check planets
      for (let planet of planetGroup.children) {
        if (planetHits[0].object === planet || planetHits[0].object.parent === planet) {
          planetName = planet.userData.name;
          break;
        }
      }

      // Check moons if not found in planets
      if (!planetName) {
        for (let moon of moonsGroup.children) {
          if (planetHits[0].object === moon || planetHits[0].object.parent === moon) {
            planetName = moon.userData.name;
            break;
          }
        }
      }
    }

    if (planetName) {
      showRelevantLabel(planetName);
    }
  } else {
    if (cursor) cursor.classList.remove("hover");
    hideMovieHoverCard();

    // Hide all solar labels when not hovering
    if (currentZoomState === ZOOM_STATES.SOLAR) {
      hideAllSolarLabels();
    }
  }

  // ==========================================================
  // ARROW CURSOR LOGIC (LEFT/RIGHT EDGE NAVIGATION)
  // ==========================================================
  // Only show arrow cursors when on the map page (page 1)
  if (typeof currentPage !== 'undefined' && currentPage === 1) {
    const x = evt.clientX;
    const w = window.innerWidth;

    // Get cursor element (in case it wasn't available at script load time)
    const cursorElement = document.getElementById("cursorCircle") || window.cursorElement;

    // Don't show arrows if hovering over interactive elements or timeline bars
    if (cursorElement && !cursorElement.classList.contains("hover") && !hoveringBars) {
      if (x < EDGE_ZONE) {
        // Left edge - show left arrow
        cursorElement.classList.add("arrow-left");
        cursorElement.classList.remove("arrow-right");
        // Set size directly with !important to override hover handlers
        cursorElement.style.setProperty('width', '80px', 'important');
        cursorElement.style.setProperty('height', '80px', 'important');
        cursorElement.style.setProperty('background', 'rgba(255, 255, 255, 0.18)', 'important');
        cursorElement.style.setProperty('opacity', '1', 'important');
      } else if (x > w - EDGE_ZONE) {
        // Right edge - show right arrow
        cursorElement.classList.add("arrow-right");
        cursorElement.classList.remove("arrow-left");
        // Set size directly with !important to override hover handlers
        cursorElement.style.setProperty('width', '80px', 'important');
        cursorElement.style.setProperty('height', '80px', 'important');
        cursorElement.style.setProperty('background', 'rgba(255, 255, 255, 0.18)', 'important');
        cursorElement.style.setProperty('opacity', '1', 'important');
      } else {
        // Middle - no arrows, reset to default
        cursorElement.classList.remove("arrow-left", "arrow-right");
        cursorElement.style.setProperty('width', '18px', 'important');
        cursorElement.style.setProperty('height', '18px', 'important');
        cursorElement.style.setProperty('background', 'rgba(95, 95, 95, 0.28)', 'important');
        cursorElement.style.setProperty('opacity', '1', 'important');
      }
    } else if (cursorElement) {
      // Remove arrows if hovering interactive elements
      cursorElement.classList.remove("arrow-left", "arrow-right");
    }
  }
});

// ==========================================================
// ARROW CURSOR CLICK HANDLER
// ==========================================================
window.addEventListener("mousedown", (e) => {
  // Only handle arrow clicks when on the map page (page 1)
  if (typeof currentPage !== 'undefined' && currentPage !== 1) {
    return;
  }

  // Get cursor element
  const cursorElement = document.getElementById("cursorCircle") || window.cursorElement;
  if (!cursorElement) return;

  if (cursorElement.classList.contains("arrow-right")) {
    // Navigate forward in time
    if (currentDecade === null) {
      // Currently on "All", move to first decade
      currentDecade = decades[0];
    } else {
      // Find current index in decades array
      const currentIndex = decades.indexOf(currentDecade);
      if (currentIndex < decades.length - 1) {
        // Move to next decade
        currentDecade = decades[currentIndex + 1];
      }
      // If already at the last decade, stay there
    }

    updateDecadeDisplay(currentDecade);
    updateFlightPathVisibility();

    // Update the visual timeline bar if it exists
    const currentIndexInMeta = booksMeta.findIndex(meta => meta.start === currentDecade);
    if (currentIndexInMeta !== -1) {
      updateActiveBookBar(currentIndexInMeta);
    }

  } else if (cursorElement.classList.contains("arrow-left")) {
    // Navigate backward in time
    if (currentDecade === null) {
      // Currently on "All", move to last decade
      currentDecade = decades[decades.length - 1];
    } else {
      // Find current index in decades array
      const currentIndex = decades.indexOf(currentDecade);
      if (currentIndex > 0) {
        // Move to previous decade
        currentDecade = decades[currentIndex - 1];
      } else {
        // If at first decade, go back to "All"
        currentDecade = null;
      }
    }

    updateDecadeDisplay(currentDecade);
    updateFlightPathVisibility();

    // Update the visual timeline bar if it exists
    if (currentDecade === null) {
      // Reset to "All" - no specific bar highlighted
      document.querySelectorAll(".book-bar").forEach(bar => {
        bar.classList.remove("active");
      });
    } else {
      const currentIndexInMeta = booksMeta.findIndex(meta => meta.start === currentDecade);
      if (currentIndexInMeta !== -1) {
        updateActiveBookBar(currentIndexInMeta);
      }
    }
  }
});

// ==========================================================
// SCROLL & TOUCH ZOOM CONTROLS
// ==========================================================
// Discrete zoom level transitions
let scrollCooldown = false;
const SCROLL_COOLDOWN_TIME = 1500; // ms to wait before allowing next scroll

// Expose scrollCooldown to window for page transition cooldown
window.setScrollCooldown = (enabled) => {
  scrollCooldown = enabled;
  if (enabled) {
    setTimeout(() => {
      scrollCooldown = false;
    }, SCROLL_COOLDOWN_TIME);
  }
};

// Momentum/coasting prevention
let lastWheelTime = 0;
const SCROLL_MOMENTUM_TIMEOUT = 500; // ms - ignore events that come too quickly after previous scroll
const MIN_SCROLL_DELTA = 3; // minimum deltaY to be considered intentional

window.addEventListener('wheel', (event) => {
  // Only allow zoom controls when on the map page (page 1)
  // currentPage is defined in the HTML page transition script
  if (typeof currentPage === 'undefined' || currentPage !== 1) {
    return; // Don't prevent default or handle zoom on intro page
  }

  event.preventDefault();

  // Ignore scroll during transitions or cooldown
  if (isTransitioning || scrollCooldown) {
    return;
  }

  // Get current time
  const now = performance.now();

  // Ignore momentum scrolling (events that come too quickly after the last one)
  if (lastWheelTime > 0 && now - lastWheelTime < SCROLL_MOMENTUM_TIMEOUT) {
    // Too close to last event, likely momentum - ignore
    return;
  }

  // Ignore very small deltas (likely momentum/coasting)
  if (Math.abs(event.deltaY) < MIN_SCROLL_DELTA) {
    return;
  }

  // Update last wheel time (only when we're about to process)
  lastWheelTime = now;

  // Determine scroll direction
  const scrollingOut = event.deltaY > 0; // Scrolling down = zoom out
  const scrollingIn = event.deltaY < 0;  // Scrolling up = zoom in

  // Transition to next/previous zoom state
  if (scrollingOut) {
    // Zoom out: US → World → Solar
    if (currentZoomState === ZOOM_STATES.US) {
      currentZoomState = ZOOM_STATES.WORLD;
      targetCameraZ = ZOOM_POSITIONS[ZOOM_STATES.WORLD];
    } else if (currentZoomState === ZOOM_STATES.WORLD) {
      currentZoomState = ZOOM_STATES.SOLAR;
      targetCameraZ = ZOOM_POSITIONS[ZOOM_STATES.SOLAR];
    }
  } else if (scrollingIn) {
    // Zoom in: Solar → World → US
    if (currentZoomState === ZOOM_STATES.SOLAR) {
      currentZoomState = ZOOM_STATES.WORLD;
      targetCameraZ = ZOOM_POSITIONS[ZOOM_STATES.WORLD];
    } else if (currentZoomState === ZOOM_STATES.WORLD) {
      currentZoomState = ZOOM_STATES.US;
      targetCameraZ = ZOOM_POSITIONS[ZOOM_STATES.US];
    }
  }

  // Set cooldown to prevent multiple rapid transitions
  scrollCooldown = true;
  setTimeout(() => {
    scrollCooldown = false;
  }, SCROLL_COOLDOWN_TIME);

}, { passive: false });

// Touch pinch/expand gesture support (discrete zoom levels)
let lastTouchDistance = null;
let touchDistanceAccumulator = 0;
const TOUCH_THRESHOLD = 100; // pixels of pinch/expand needed to trigger zoom change

function getTouchDistance(touch1, touch2) {
  const dx = touch2.clientX - touch1.clientX;
  const dy = touch2.clientY - touch1.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

window.addEventListener('touchstart', (event) => {
  if (event.touches.length === 2) {
    lastTouchDistance = getTouchDistance(event.touches[0], event.touches[1]);
    touchDistanceAccumulator = 0;
  }
}, { passive: true });

window.addEventListener('touchmove', (event) => {
  if (event.touches.length === 2) {
    // Only allow zoom controls when on the map page (page 1)
    if (typeof currentPage === 'undefined' || currentPage !== 1) {
      return; // Don't handle zoom on intro page
    }

    event.preventDefault();

    const currentDistance = getTouchDistance(event.touches[0], event.touches[1]);

    if (lastTouchDistance !== null && !isTransitioning && !scrollCooldown) {
      const distanceChange = currentDistance - lastTouchDistance;
      touchDistanceAccumulator += distanceChange;

      // Check if accumulated distance exceeds threshold
      if (Math.abs(touchDistanceAccumulator) >= TOUCH_THRESHOLD) {
        if (touchDistanceAccumulator > 0) {
          // Expand (fingers apart) = zoom in (map)
          if (currentZoomState === ZOOM_STATES.SOLAR) {
            currentZoomState = ZOOM_STATES.WORLD;
            targetCameraZ = ZOOM_POSITIONS[ZOOM_STATES.WORLD];
          } else if (currentZoomState === ZOOM_STATES.WORLD) {
            currentZoomState = ZOOM_STATES.US;
            targetCameraZ = ZOOM_POSITIONS[ZOOM_STATES.US];
          }
        } else {
          // Pinch in (fingers closer) = zoom out (globe)
          if (currentZoomState === ZOOM_STATES.US) {
            currentZoomState = ZOOM_STATES.WORLD;
            targetCameraZ = ZOOM_POSITIONS[ZOOM_STATES.WORLD];
          } else if (currentZoomState === ZOOM_STATES.WORLD) {
            currentZoomState = ZOOM_STATES.SOLAR;
            targetCameraZ = ZOOM_POSITIONS[ZOOM_STATES.SOLAR];
          }
        }

        // Reset accumulator and set cooldown
        touchDistanceAccumulator = 0;
        scrollCooldown = true;
        setTimeout(() => {
          scrollCooldown = false;
        }, SCROLL_COOLDOWN_TIME);
      }
    }

    lastTouchDistance = currentDistance;
  }
}, { passive: false });

window.addEventListener('touchend', (event) => {
  if (event.touches.length < 2) {
    lastTouchDistance = null;
    touchDistanceAccumulator = 0;
  }
}, { passive: true });

// ==========================================================
// RESIZE
// ==========================================================
window.addEventListener('resize',()=>{
  renderer.setSize(window.innerWidth,window.innerHeight);
  labelRenderer.setSize(window.innerWidth,window.innerHeight);
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();

  // Update Line2 material resolutions
  const updateLineMaterials = (group) => {
    group.children.forEach(line => {
      if (line.material && line.material.resolution) {
        line.material.resolution.set(window.innerWidth, window.innerHeight);
      }
    });
  };

  updateLineMaterials(usFlightPathGroup);
  updateLineMaterials(flightPathGroup);
  updateLineMaterials(solarFlightPathsGroup);
});



/* -----------------------------------------------------------
   TOP-LEFT BOOK BARS (one per book)
----------------------------------------------------------- */

const bookBarsContainer = document.getElementById("bookBars");

function buildBookBars() {
  bookBarsContainer.innerHTML = "";
  booksMeta.forEach((b, i) => {
    const bar = document.createElement("div");
    bar.classList.add("book-bar");
    bar.dataset.index = i;
    bookBarsContainer.appendChild(bar);
  });
}

buildBookBars();

/* -----------------------------------------------------------
   Active bar highlight (centered book)
----------------------------------------------------------- */
function updateActiveBookBar(index) {
  document.querySelectorAll(".book-bar").forEach((bar, i) => {
    bar.classList.toggle("active", i === index);
  });
}

/* -----------------------------------------------------------
   Click → jump to book
----------------------------------------------------------- */
function jumpToBook(index) {
  const bookX = startX + index * spacing;

  // Center book: shelf must move by -bookX
  targetShelfOffset = -bookX;

  updateScrollButtons();
  updateActiveBookBar(index);
}

/* -----------------------------------------------------------
   CLICK HANDLER (works reliably)
----------------------------------------------------------- */
// document.querySelectorAll(".book-bar").forEach(bar => {
//   bar.addEventListener("click", (e) => {
//     e.stopPropagation();
//     e.preventDefault();

//     const index = Number(bar.dataset.index);
//     const startYear = booksMeta[index].start;

//     // Update global filter
//     currentDecade = startYear;   // but now means 5-year start
//     updateDecadeDisplay(startYear);
//     updateFlightPathVisibility();

//     updateActiveBookBar(index);
//   });
// });



/* -----------------------------------------------------------
   CLICK-SAFE MOVEMENT SUPPRESSION
   (prevents wave logic from interfering with clicks)
----------------------------------------------------------- */
let suppressWaveUntil = 0;
window.addEventListener("mousedown", () => {
  suppressWaveUntil = performance.now() + 120;
});

/* -----------------------------------------------------------
   AREA-AWARE HOVER (sinusoidal wave)
----------------------------------------------------------- */
const barsContainer = document.getElementById("bookBars");
let hoveredBarIndex = null;
let lastMouseX = null;

barsContainer.addEventListener("mousemove", (e) => {

  if (performance.now() < suppressWaveUntil) return;

  const bars = Array.from(document.querySelectorAll(".book-bar"));
  const rect = barsContainer.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;

  let closestIndex = 0;
  let closestDist = Infinity;

  bars.forEach((bar, i) => {
    const barRect = bar.getBoundingClientRect();
    const barCenter = barRect.left - rect.left + barRect.width / 2;
    const dist = Math.abs(mouseX - barCenter);

    if (dist < closestDist) {
      closestDist = dist;
      closestIndex = i;
    }
  });

  hoveredBarIndex = closestIndex;
  applyWaveEffect(closestIndex);

  // highlight nearest bar
  bars.forEach((bar, i) =>
    bar.classList.toggle("hovered", i === hoveredBarIndex)
  );

  // NEW — position labels on the two highlighted bars
  const hoverLabel = document.getElementById("hoverBarDate");
  const activeLabel = document.getElementById("activeBarDate");

  const meta = booksMeta[closestIndex];
  positionLabelOverBar(hoverLabel, bars[closestIndex], `${meta.start}–${meta.end}`);

  const activeIndex = bars.findIndex(b => b.classList.contains("active"));
  if (activeIndex !== -1) {
    const metaActive = booksMeta[activeIndex];
    positionLabelOverBar(activeLabel, bars[activeIndex], `${metaActive.start}–${metaActive.end}`);
  }
});


/* -----------------------------------------------------------
   GLOBAL CLICK REGION — clicking anywhere selects nearest bar
----------------------------------------------------------- */
bookBarsContainer.addEventListener("click", (e) => {
  const bars = Array.from(document.querySelectorAll(".book-bar"));
  const rect = bookBarsContainer.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;

  // Find nearest bar center
  let closestIndex = 0;
  let closestDist = Infinity;

  bars.forEach((bar, i) => {
    const barRect = bar.getBoundingClientRect();
    const center = barRect.left - rect.left + barRect.width / 2;
    const dist = Math.abs(mouseX - center);
    if (dist < closestDist) {
      closestDist = dist;
      closestIndex = i;
    }
  });

  // Apply decade filter
  const startYear = booksMeta[closestIndex].start;
  currentDecade = startYear;
  updateDecadeDisplay(startYear);
  updateFlightPathVisibility();

  // Highlight + animate
  updateActiveBookBar(closestIndex);
});

/* -----------------------------------------------------------
   ENTER / LEAVE (disable arrow cursor + reset wave)
----------------------------------------------------------- */

let hoveringBars = false;

barsContainer.addEventListener("mouseenter", () => {
  hoveringBars = true;
  if (cursor) cursor.classList.remove("arrow-left", "arrow-right");
});

barsContainer.addEventListener("mouseleave", () => {
  hoveringBars = false;
  hoveredBarIndex = null;
  resetWave();

  document.querySelectorAll(".book-bar").forEach(bar =>
    bar.classList.remove("hovered")
  );

  document.getElementById("hoverBarDate").style.opacity = 0;
  document.getElementById("activeBarDate").style.opacity = 0;
});

/* -----------------------------------------------------------
   KEYBOARD ARROW NAVIGATION (LEFT/RIGHT ARROWS)
----------------------------------------------------------- */
window.addEventListener('keydown', (e) => {
  // Only handle arrow keys when on the map page (page 1)
  if (typeof currentPage !== 'undefined' && currentPage !== 1) {
    return;
  }

  if (e.key === 'ArrowRight') {
    // Move to next decade
    if (currentDecade === null) {
      // Currently on "All", move to first decade
      currentDecade = decades[0];
    } else {
      // Find current index in decades array
      const currentIndex = decades.indexOf(currentDecade);
      if (currentIndex < decades.length - 1) {
        // Move to next decade
        currentDecade = decades[currentIndex + 1];
      }
      // If already at the last decade, stay there
    }

    updateDecadeDisplay(currentDecade);
    updateFlightPathVisibility();

    // Update the visual timeline bar if it exists
    const currentIndexInMeta = booksMeta.findIndex(meta => meta.start === currentDecade);
    if (currentIndexInMeta !== -1) {
      updateActiveBookBar(currentIndexInMeta);
    }

  } else if (e.key === 'ArrowLeft') {
    // Move to previous decade
    if (currentDecade === null) {
      // Currently on "All", move to last decade
      currentDecade = decades[decades.length - 1];
    } else {
      // Find current index in decades array
      const currentIndex = decades.indexOf(currentDecade);
      if (currentIndex > 0) {
        // Move to previous decade
        currentDecade = decades[currentIndex - 1];
      } else {
        // If at first decade, go back to "All"
        currentDecade = null;
      }
    }

    updateDecadeDisplay(currentDecade);
    updateFlightPathVisibility();

    // Update the visual timeline bar if it exists
    if (currentDecade === null) {
      // Reset to "All" - no specific bar highlighted
      document.querySelectorAll(".book-bar").forEach(bar => {
        bar.classList.remove("active");
      });
    } else {
      const currentIndexInMeta = booksMeta.findIndex(meta => meta.start === currentDecade);
      if (currentIndexInMeta !== -1) {
        updateActiveBookBar(currentIndexInMeta);
      }
    }
  }
});



/* -----------------------------------------------------------
   UPDATE BAR FOR CENTERED BOOK (during scroll)
----------------------------------------------------------- */
function updateBarForCenteredBook() {
  let closestIndex = 0;
  let closestDist = Infinity;

  books.forEach((b, i) => {
    const dist = Math.abs(b.mesh.position.x + shelfOffset);
    if (dist < closestDist) {
      closestDist = dist;
      closestIndex = i;
    }
  });

  updateActiveBookBar(closestIndex);
}

/* -----------------------------------------------------------
   FULL-WIDTH SINUSOIDAL WAVE EFFECT
----------------------------------------------------------- */

const BASE_HEIGHT = 12;       // height at edges
const PEAK_HEIGHT = 70;       // tallest at hovered bar

function applyWaveEffect(centerIndex) {
  const bars = document.querySelectorAll(".book-bar");
  const total = bars.length;

  for (let i = 0; i < total; i++) {

    // absolute distance from hovered bar
    const dist = Math.abs(i - centerIndex);

    // normalize into [0, 1]
    const t = dist / (total - 1);

    // FULL-WIDTH cosine wave (peak in middle, edges low)
    // t = 0 → peak = 1
    // t = 1 → edge = 0
    const wave = Math.cos(1.5 * t * Math.PI) * 0.75  / (1+t**2) + 0.5;

    const height = BASE_HEIGHT + wave * (PEAK_HEIGHT - BASE_HEIGHT);

    bars[i].style.height = `${height}px`;
  }
}


function resetWave() {
  document.querySelectorAll(".book-bar").forEach(bar => {
    bar.style.height = BASE_HEIGHT + "px";
    bar.classList.remove("hovered");
  });
}

const barDateDisplay = document.getElementById("barDateDisplay");

function showBarDates(hoverIndex) {
  const activeIndex = [...document.querySelectorAll(".book-bar")]
    .findIndex(bar => bar.classList.contains("active"));

  const hoverYear  = booksMeta[hoverIndex]?.year;
  const activeYear = booksMeta[activeIndex]?.year;

  if (hoverYear === undefined || activeYear === undefined) return;

  barDateDisplay.textContent = `Selected: ${activeYear}    Hovering: ${hoverYear}`;
  barDateDisplay.style.opacity = 1;
}

function hideBarDates() {
  barDateDisplay.style.opacity = 0;
}

function positionLabelOverBar(labelEl, barEl, text) {
  if (!barEl) {
    labelEl.style.opacity = 0;
    return;
  }

  const rect = barEl.getBoundingClientRect();

  labelEl.textContent = text;
  labelEl.style.left = rect.left + rect.width / 2 + "px";
  labelEl.style.top  = rect.top - 12 + "px";
  labelEl.style.opacity = 0.9;
}

// ==========================================================
// INITIALIZE TEXT OVERLAY ON PAGE LOAD
// ==========================================================
window.addEventListener('DOMContentLoaded', () => {
  updateTextOverlay();
  // Note: mapIntroMessage is triggered by page transition, not on initial load
});
