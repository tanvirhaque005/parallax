import * as THREE from 'https://unpkg.com/three@0.164.0/build/three.module.js';

// ! NOTE: I refer to "movies" as "books" since it's basically a bookshelf

const baseCanvas = document.getElementById('bookCanvas');
const overlayCanvas = document.getElementById('activeBookCanvas');
let currentIndex = -1;  // which book is currently shown in card view (overlay)

/* ---------- Book metadata (matching FILMS data) ---------- */
const booksMeta = [
  { id: 1, title: '2001 A Space Odyssey', director: 'Stanley Kubrick', year: 1968, depicted: 2001, rating: 8.3, tags: ['AI', 'Space'], location: 'Los Angeles, CA, USA', plot: 'After discovering a mysterious artifact buried beneath the Lunar surface, humanity sets off on a quest to Saturn with the sentient computer HAL to uncover the artifact\'s origins.' },
  { id: 2, title: 'Blade Runner', director: 'Ridley Scott', year: 1982, depicted: 2019, rating: 8.1, tags: ['Dystopia', 'AI'], location: 'Los Angeles, CA, USA', plot: 'In a dystopian future, a blade runner must pursue and terminate four replicants who stole a ship in space and returned to Earth to find their creator.' },
  { id: 3, title: 'Minority Report', director: 'Steven Spielberg', year: 2002, depicted: 2054, rating: 7.6, tags: ['Dystopia', 'Surveillance Capitalism'], location: 'Los Angeles, CA, USA', plot: 'In a future where a special police unit can arrest people before they commit their crimes, an officer is accused of a future murder. In 2054, the federal government plans to nationally [See more].' },
  { id: 4, title: 'Gattaca', director: 'Andrew Niccol', year: 1997, depicted: 2150, rating: 7.8, tags: ['Genetic Engineering', 'Dystopia'], location: 'Los Angeles, CA, USA', plot: 'A genetically inferior man assumes the identity of a superior one in order to pursue his lifelong dream of space travel.' },
  { id: 5, title: 'Total Recall', director: 'Paul Verhoeven', year: 1990, depicted: 2084, rating: 7.5, tags: ['Memory', 'Mars'], location: 'Los Angeles, CA, USA', plot: 'When a man goes in to have virtual vacation memories of the planet Mars implanted in his mind, an unexpected and harrowing series of events forces him to go to the planet for real - or is he?' },
  { id: 6, title: 'Metropolis', director: 'Fritz Lang', year: 1927, depicted: 2026, rating: 8.3, tags: ['Robots', 'Dystopia'], location: 'Berlin, Germany', plot: 'In a futuristic city sharply divided between the working class and the city planners, the son of the city\'s mastermind falls in love with a working-class prophet who predicts the coming of a savior to mediate their differences.' },
  { id: 7, title: 'The Matrix', director: 'The Wachowskis', year: 1999, depicted: 2199, rating: 8.7, tags: ['Virtual Reality', 'Free Will'], location: 'Sydney, Australia', plot: 'When a beautiful stranger leads computer hacker Neo to a forbidding underworld, he discovers the shocking truth--the life he knows is the elaborate deception of an evil cyber-intelligence.' },
];

/* ---------- Base scene (shelf) ---------- */
if (!baseCanvas) {
  console.error('Canvas element not found!');
}

const scene = new THREE.Scene();
scene.background = null;

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0.6, 8);

const renderer = new THREE.WebGLRenderer({ canvas: baseCanvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

console.log('Three.js renderer created, canvas:', baseCanvas);
console.log('Books to render:', booksMeta.length);

scene.add(new THREE.AmbientLight(0xffffff, 0.75));
const dir = new THREE.DirectionalLight(0xffffff, 1.2);
dir.position.set(3, 5, 6);
scene.add(dir);

/* ---------- Overlay scene (active book above full-screen card) ---------- */
const overlayScene = new THREE.Scene();
overlayScene.background = null;

const overlayCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
overlayCamera.position.set(-1.1, 0.5, 7.5);

const overlayRenderer = new THREE.WebGLRenderer({ canvas: overlayCanvas, antialias: true, alpha: true });
overlayRenderer.setSize(window.innerWidth, window.innerHeight);
overlayRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

overlayScene.add(new THREE.AmbientLight(0xffffff, 0.8));
const overlayDir = new THREE.DirectionalLight(0xffffff, 1.2);
overlayDir.position.set(3, 5, 6);
overlayScene.add(overlayDir);

/* ---------- Geometry / materials ---------- */
const BOOK_W = 2;
const BOOK_H = 3;
const BOOK_D = 0.9;
const geometry = new THREE.BoxGeometry(BOOK_W, BOOK_H, BOOK_D);

const palette = [
  { front: 0x0ea5e9, back: 0x0f172a }, // bk-1
  { front: 0xf59e0b, back: 0x78350f }, // bk-2
  { front: 0x10b981, back: 0x064e3b }, // bk-3
  { front: 0x8b5cf6, back: 0x3b0764 }, // bk-4
  { front: 0xef4444, back: 0x7f1d1d }, // bk-5
  { front: 0x22d3ee, back: 0x083344 }, // bk-6
  { front: 0xf472b6, back: 0x831843 }, // bk-7
];

function makeMaterials(coverHex, backHex) {
  const spineHex = 0x1e293b;
  const edgeHex  = 0x334155;
  return [
    new THREE.MeshStandardMaterial({ color: spineHex }), // +X
    new THREE.MeshStandardMaterial({ color: spineHex }), // -X (spine)
    new THREE.MeshStandardMaterial({ color: edgeHex  }), // +Y
    new THREE.MeshStandardMaterial({ color: edgeHex  }), // -Y
    new THREE.MeshStandardMaterial({ color: coverHex }), // +Z (front cover)
    new THREE.MeshStandardMaterial({ color: backHex  })  // -Z (back cover)
  ];
}

function createBook(x, colors, meta) {
  const mesh = new THREE.Mesh(geometry, makeMaterials(colors.front, colors.back));
  mesh.position.set(x, 0, 0);
  mesh.rotation.y = Math.PI / 2; // spine toward viewer
  mesh.userData.meta = meta;
  mesh.userData.colors = colors;
  return {
    mesh,
    isPresented: false,
    targetRotY: Math.PI / 2,
    targetPosZ: 0,
    tiltX: 0,
    tiltY: 0,
  };
}

// Position books based on their release year (1960-2020 timeline)
const minYear = 1960;
const maxYear = 2020;
const yearRange = maxYear - minYear;
const shelfRange = 30; // Total 3D space (-15 to +15)

// Sort books by year
booksMeta.sort((a, b) => a.year - b.year);

const books = booksMeta.map((meta, i) => {
  const colors = palette[i % palette.length];
  // Calculate position based on year
  const normalizedYear = (meta.year - minYear) / yearRange;
  const xPos = (normalizedYear * shelfRange) - (shelfRange / 2); // Map to -15 to +15
  return createBook(xPos, colors, meta);
});

/* Group for shelf scrolling */
const shelfGroup = new THREE.Group();
books.forEach(b => shelfGroup.add(b.mesh));
scene.add(shelfGroup);

console.log('Books created:', books.length);
console.log('Shelf group added to scene. Books in scene:', shelfGroup.children.length);

// Initial render to make sure books appear
renderer.render(scene, camera);

/* ---------- Overlay UI references ---------- */
const bookinfo = document.getElementById('bookinfo');
const closeInfo = document.getElementById('closeInfo');
const backToShelf = document.getElementById('backToShelf');
const titleEl = document.getElementById('bookTitle');
const ratingBadge = document.getElementById('ratingBadge');
const blurbEl = document.getElementById('bookBlurb');
const directorEl = document.getElementById('director');
const releasedEl = document.getElementById('released');
const depictedEl = document.getElementById('depicted');
const pillContainer = document.getElementById('pillContainer');
const motifsContainer = document.getElementById('motifsContainer');

/* Scroll buttons and state management */
let shelfOffset = 0;
let targetShelfOffset = 0;
const maxShelfOffset = 15; // Limit scrolling range
const minShelfOffset = -15;

// Current navigation state
let currentSection = 'library';
let selectedFilmId = null;
let selectedMotif = null;

// Scroll controls
const scrollLeftBtn = document.getElementById('scrollLeft');
const scrollRightBtn = document.getElementById('scrollRight');

if (scrollLeftBtn) {
  scrollLeftBtn.addEventListener('click', () => { 
    targetShelfOffset = Math.min(targetShelfOffset + 2.5, maxShelfOffset); 
  });
}

if (scrollRightBtn) {
  scrollRightBtn.addEventListener('click', () => { 
    targetShelfOffset = Math.max(targetShelfOffset - 2.5, minShelfOffset); 
  });
}

// Mouse wheel scrolling (horizontal)
let isScrolling = false;
window.addEventListener('wheel', (e) => {
  if (currentSection !== 'library' || bookinfo.classList.contains('open')) return;
  
  e.preventDefault();
  const delta = e.deltaY > 0 ? 2.5 : -2.5;
  targetShelfOffset = Math.max(minShelfOffset, Math.min(maxShelfOffset, targetShelfOffset + delta));
}, { passive: false });

// Keyboard arrow key scrolling
window.addEventListener('keydown', (e) => {
  if (currentSection !== 'library' || bookinfo.classList.contains('open')) return;
  
  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    targetShelfOffset = Math.min(targetShelfOffset + 2.5, maxShelfOffset);
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    targetShelfOffset = Math.max(targetShelfOffset - 2.5, minShelfOffset);
  }
});

/* Parallax background gradient */
const parallaxBg = document.getElementById('parallaxBackground');
const parallaxLayer = document.getElementById('parallaxLayer');
const gradientColors = [
  { from: '#1a0033', to: '#330066' },
  { from: '#330066', to: '#4d0099' },
  { from: '#4d0099', to: '#6600cc' },
  { from: '#6600cc', to: '#8000ff' },
  { from: '#8000ff', to: '#0066cc' },
];

function updateParallaxBackground(offset) {
  // Normalize offset to 0-1 range
  const normalized = (offset - minShelfOffset) / (maxShelfOffset - minShelfOffset);
  const progress = Math.max(0, Math.min(normalized, 1));
  const gradientIndex = Math.floor(progress * (gradientColors.length - 1));
  const gradient = gradientColors[Math.min(gradientIndex, gradientColors.length - 1)];
  
  parallaxBg.style.background = `linear-gradient(to right, ${gradient.from}, ${gradient.to})`;
  
  // Update parallax layer with moving effect
  const parallaxX = offset * 20; // Parallax movement
  const radialX = 50 + progress * 20;
  const radialY = 30 + progress * 10;
  parallaxLayer.style.background = `radial-gradient(circle at ${radialX}% ${radialY}%, rgba(255,255,255,0.3), transparent 70%)`;
  parallaxLayer.style.transform = `translateX(${parallaxX}px)`;
}

/* Timeline setup */
const timelineEl = document.getElementById('timeline');
// minYear, maxYear, yearRange already defined above

// Create year labels (5-year intervals)
for (let year = minYear; year <= maxYear; year += 5) {
  const yearEl = document.createElement('div');
  yearEl.className = 'timeline-year';
  yearEl.textContent = year;
  
  // Position based on shelf offset mapping
  // Map shelf offset (-15 to 15) to timeline position (0% to 100%)
  const normalizedYear = (year - minYear) / yearRange;
  yearEl.style.left = `${normalizedYear * 100}%`;
  yearEl.style.transform = 'translateX(-50%)';
  
  timelineEl.appendChild(yearEl);
}

// Initialize parallax background
updateParallaxBackground(0);

/* Browser History Management */
// Initialize history state
if (!window.history.state) {
  window.history.replaceState({ section: 'library', filmId: null, motif: null }, '', '/');
}

// Listen for browser back/forward buttons
window.addEventListener('popstate', (e) => {
  const state = e.state || { section: 'library', filmId: null, motif: null };
  
  if (state.section === 'library') {
    closeAllSections();
    closeOverlay();
    currentSection = 'library';
    selectedFilmId = null;
    selectedMotif = null;
  } else if (state.section === 'film' && state.filmId) {
    const filmIndex = booksMeta.findIndex(f => f.id === state.filmId);
    if (filmIndex !== -1) {
      currentIndex = filmIndex;
      openOverlayForIndex(filmIndex);
      currentSection = 'film';
      selectedFilmId = state.filmId;
    }
  } else if (state.section === 'motif' && state.motif) {
    closeOverlay();
    if (state.filmId) {
      const filmIndex = booksMeta.findIndex(f => f.id === state.filmId);
      if (filmIndex !== -1) {
        selectedFilmId = state.filmId;
      }
    }
    showMotifSection(state.motif);
    currentSection = 'motif';
    selectedMotif = state.motif;
  } else if (state.section === 'fiction') {
    closeOverlay();
    closeMotifSection();
    showFictionSection();
    currentSection = 'fiction';
  } else if (state.section === 'reimagine') {
    closeFictionSection();
    showReimagineSection();
    currentSection = 'reimagine';
  } else if (state.section === 'conclusion') {
    closeReimagineSection();
    showConclusionSection();
    currentSection = 'conclusion';
  }
});

// Helper function to update history
function updateHistory(section, filmId = null, motif = null) {
  const state = { section, filmId, motif };
  const url = section === 'library' ? '/' : `/${section}`;
  window.history.pushState(state, '', url);
}

/* Raycasting (woahhh) */
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let activeBook = null;   // book object in base scene
let overlayBook = null;  // mesh in overlay scene

function setMouseFromEvent(e) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
}

/* Mouse tilt for overlay book (kinda buggy) */
let targetTiltX = 0;
let targetTiltY = 0;
const MAX_TILT_X = 0.12;
const MAX_TILT_Y = 0.18;

window.addEventListener('mousemove', (e) => {
  if (!bookinfo.classList.contains('open')) return;
  const x = (e.clientX / window.innerWidth) * 1 - 1;
  const y = (e.clientY / window.innerHeight) * 1 - 1;
  targetTiltY = x * MAX_TILT_Y;
  targetTiltX = y * MAX_TILT_X;
}, { passive: true });

/* Open overlay and render active book above everything */
function openOverlayForIndex(i) {
  setActiveBookByIndex(i);
  rebuildOverlayForIndex();

  overlayCanvas.style.display = 'block';
  bookinfo.classList.add('open');
  bookinfo.setAttribute('aria-hidden', 'false');
  
  // Update history
  currentSection = 'film';
  selectedFilmId = booksMeta[i].id;
  updateHistory('film', selectedFilmId, null);
}

// function openOverlay(meta, colors) {
//   titleEl.textContent = meta.title;
//   metaEl.textContent  = `${meta.author} · ${meta.year}`;
//   blurbEl.textContent = meta.blurb;
//   swFront.style.background = `#${colors.front.toString(16).padStart(6,'0')}`;
//   swBack.style.background  = `#${colors.back.toString(16).padStart(6,'0')}`;

//   if (activeBook) activeBook.mesh.visible = false;

//   if (overlayBook) {
//     overlayScene.remove(overlayBook);
//     overlayBook = null;
//   }
//   overlayBook = new THREE.Mesh(geometry, makeMaterials(colors.front, colors.back));
//   overlayBook.rotation.y = Math.PI / 2;
//   overlayBook.position.set(1.6, 1.2, 0.4);
//   overlayScene.add(overlayBook);

//   overlayCanvas.style.display = 'block';
//   bookinfo.classList.add('open');
//   bookinfo.setAttribute('aria-hidden', 'false');
// }

/* Close overlay; restore base scene */
function closeOverlay() {
  bookinfo.classList.remove('open');
  bookinfo.setAttribute('aria-hidden', 'true');

  overlayCanvas.style.display = 'none';
  if (overlayBook) {
    overlayScene.remove(overlayBook);
    overlayBook = null;
  }
  if (activeBook) activeBook.mesh.visible = true;
  
  // Update history
  currentSection = 'library';
  selectedFilmId = null;
  updateHistory('library', null, null);
}

/* Click: present & open overlay */
// renderer.domElement.addEventListener('click', (e) => {
//   setMouseFromEvent(e);
//   raycaster.setFromCamera(mouse, camera);
//   const intersects = raycaster.intersectObjects(books.map(b => b.mesh));
//   if (!intersects.length) return;

//   const clicked = books.find(b => b.mesh === intersects[0].object);

//   books.forEach(b => {
//     if (b === clicked) {
//       b.isPresented = true;
//       b.targetRotY = 0;
//       b.targetPosZ = 1.2;
//       activeBook = b;
//       targetTiltX = 0;
//       targetTiltY = 0;
//     } else {
//       b.isPresented = false;
//       b.targetRotY = Math.PI / 2;
//       b.targetPosZ = 0;
//       b.tiltX = 0;
//       b.tiltY = 0;
//     }
//   });

//   openOverlay(clicked.mesh.userData.meta, clicked.mesh.userData.colors);
// });
renderer.domElement.addEventListener('click', (e) => {
  setMouseFromEvent(e);
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(books.map(b => b.mesh));
  if (!intersects.length) return;

  const clicked = books.find(b => b.mesh === intersects[0].object);
  const idx = books.indexOf(clicked);

  targetTiltX = 0; // reset tilt targets for fresh open
  targetTiltY = 0;

  openOverlayForIndex(idx);
});

/* Card nav buttons  (in overlay mode) */
const cardPrev = document.getElementById('cardPrev');
const cardNext = document.getElementById('cardNext');

if (cardPrev) {
  cardPrev.addEventListener('click', (e) => {
    e.stopPropagation();
    openOverlayForIndex(currentIndex - 1); // left
  });
}

if (cardNext) {
  cardNext.addEventListener('click', (e) => {
    e.stopPropagation();
    openOverlayForIndex(currentIndex + 1); // right
  });
}


/* Overlay actions */
if (closeInfo) {
  closeInfo.addEventListener('click', () => {
    window.history.back();
  });
}

if (backToShelf) {
  backToShelf.addEventListener('click', () => {
    if (activeBook) {
      activeBook.isPresented = false;
      activeBook.targetRotY = Math.PI / 2;
      activeBook.targetPosZ = 0;
      activeBook.tiltX = 0;
      activeBook.tiltY = 0;
    }
    window.history.back();
  });
}

/* Resize: both scenes/canvases */
window.addEventListener('resize', () => {
  const w = window.innerWidth, h = window.innerHeight;

  camera.aspect = w / h;       camera.updateProjectionMatrix();
  renderer.setSize(w, h);

  overlayCamera.aspect = w / h; overlayCamera.updateProjectionMatrix();
  overlayRenderer.setSize(w, h);
});

function setActiveBookByIndex(i) {
  // wrap around
  currentIndex = (i + books.length) % books.length;

  // restore visibility of previously hidden base mesh
  if (activeBook) activeBook.mesh.visible = true;

  // present the selected book in the base scene (but keep its mesh hidden)
  books.forEach((b, idx) => {
    const isTarget = idx === currentIndex;
    b.isPresented = isTarget;
    b.targetRotY  = isTarget ? 0 : Math.PI / 2;
    b.targetPosZ  = isTarget ? 1.2 : 0;
    b.tiltX = 0; b.tiltY = 0;
  });

  activeBook = books[currentIndex];
  activeBook.mesh.visible = false; // avoid seeing two copies under overlay
}

function rebuildOverlayForIndex() {
  const b = books[currentIndex];
  const meta   = b.mesh.userData.meta;
  const colors = b.mesh.userData.colors;

  // Update film details
  titleEl.textContent = meta.title;
  ratingBadge.textContent = `${meta.rating}/10`;
  blurbEl.textContent = meta.plot || meta.blurb || 'No description available.';
  directorEl.textContent = meta.director || 'Unknown';
  releasedEl.textContent = `${meta.year}, ${meta.location || 'Unknown'}`;
  depictedEl.textContent = `${meta.depicted || 'N/A'}, Washington DC, USA`;
  
  // Update tags
  const tags = meta.tags || meta.tropes || [];
  pillContainer.innerHTML = tags.map(tag => {
    return `<span class="tag-pill">${tag}</span>`;
  }).join('');
  
  // Update motifs - use default motifs if film doesn't have enough
  const defaultMotifs = ['Surveillance', 'Free Will', 'Artificial Intelligence', 'Crime'];
  const displayMotifs = tags.length >= 4 ? tags.slice(0, 4) : defaultMotifs;
  
  motifsContainer.innerHTML = displayMotifs.map((motif, i) => {
    const isHighlighted = i === 0;
    return `<div class="motif-circle ${isHighlighted ? 'highlighted' : ''}" data-motif="${motif}">
              ${motif}
            </div>`;
  }).join('');
  
  // Add click handlers to motif circles
  motifsContainer.querySelectorAll('.motif-circle').forEach(circle => {
    circle.addEventListener('click', () => {
      const motifName = circle.dataset.motif;
      handleMotifClick(motifName);
    });
  });

  // Rebuild the overlay book mesh
  if (overlayBook) {
    overlayScene.remove(overlayBook);
    overlayBook = null;
  }
  overlayBook = new THREE.Mesh(geometry, makeMaterials(colors.front, colors.back));

  // Default pose in card view (edit to taste)
  overlayBook.rotation.set(0, 0.90, 0); // X (pitch), Y (yaw), Z (roll) in radians
  overlayBook.position.set(1.6, 1.2, 0.4);

  overlayScene.add(overlayBook);
}

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

// Handle motif click (navigate to Motif section)
function handleMotifClick(motifName) {
  // Find motif key (handle variations)
  const motifKey = Object.keys(MOTIFS).find(key => 
    key.toLowerCase() === motifName.toLowerCase()
  ) || "Surveillance";
  
  // Update history before closing overlay
  selectedMotif = motifKey;
  currentSection = 'motif';
  updateHistory('motif', selectedFilmId, motifKey);
  
  // Close film overlay
  closeOverlay();
  
  showMotifSection(motifKey);
}

// Show Motif section
function showMotifSection(motifName) {
  const motifSection = document.getElementById('motifSection');
  const motifTitle = document.getElementById('motifTitle');
  const motifNetwork = document.getElementById('motifNetwork');
  
  const motifData = MOTIFS[motifName] || MOTIFS["Surveillance"];
  
  motifTitle.textContent = motifName;
  
  // Create network graph SVG
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.style.width = '100%';
  svg.style.height = '100%';
  
  const centerX = 50, centerY = 50;
  const nodeCount = motifData.connections.length;
  const angleStep = (2 * Math.PI) / nodeCount;
  const radius = 22;
  
  // Create connections
  motifData.connections.forEach((name, i) => {
    const angle = i * angleStep;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', centerX);
    line.setAttribute('y1', centerY);
    line.setAttribute('x2', x);
    line.setAttribute('y2', y);
    line.setAttribute('stroke', 'rgba(147, 197, 253, 0.5)');
    line.setAttribute('stroke-width', '0.4');
    svg.appendChild(line);
  });
  
  // Create nodes
  motifData.connections.forEach((name, i) => {
    const angle = i * angleStep;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', x);
    circle.setAttribute('cy', y);
    circle.setAttribute('r', '2.5');
    circle.setAttribute('fill', '#94a3b8');
    circle.setAttribute('stroke', '#64748b');
    circle.setAttribute('stroke-width', '0.3');
    svg.appendChild(circle);
    
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', x);
    text.setAttribute('y', y - 4);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', '#475569');
    text.setAttribute('font-size', '1.8');
    text.textContent = name;
    svg.appendChild(text);
  });
  
  // Center node
  const centerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  centerCircle.setAttribute('cx', centerX);
  centerCircle.setAttribute('cy', centerY);
  centerCircle.setAttribute('r', '5');
  centerCircle.setAttribute('fill', '#3b82f6');
  centerCircle.setAttribute('stroke', '#1e40af');
  centerCircle.setAttribute('stroke-width', '0.5');
  svg.appendChild(centerCircle);
  
  const centerText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  centerText.setAttribute('x', centerX);
  centerText.setAttribute('y', centerY - 8);
  centerText.setAttribute('text-anchor', 'middle');
  centerText.setAttribute('fill', '#1e3a8a');
  centerText.setAttribute('font-size', '3.5');
  centerText.setAttribute('font-weight', 'bold');
  centerText.textContent = `${motifData.movies} Movies`;
  svg.appendChild(centerText);
  
  motifNetwork.innerHTML = '';
  motifNetwork.appendChild(svg);
  
  motifSection.classList.add('open');
  motifSection.setAttribute('aria-hidden', 'false');
}

function closeMotifSection() {
  const motifSection = document.getElementById('motifSection');
  motifSection.classList.remove('open');
  motifSection.setAttribute('aria-hidden', 'true');
  
  // Navigate back to film or library
  if (selectedFilmId) {
    const filmIndex = booksMeta.findIndex(f => f.id === selectedFilmId);
    if (filmIndex !== -1) {
      openOverlayForIndex(filmIndex);
    }
  } else {
    currentSection = 'library';
    updateHistory('library', null, null);
  }
}

// Fiction vs Reality section
function showFictionSection() {
  // Close motif section but don't navigate back
  const motifSection = document.getElementById('motifSection');
  if (motifSection) {
    motifSection.classList.remove('open');
    motifSection.setAttribute('aria-hidden', 'true');
  }
  
  currentSection = 'fiction';
  updateHistory('fiction', selectedFilmId, selectedMotif);
  
  const fictionSection = document.getElementById('fictionSection');
  const fictionChart = document.getElementById('fictionChart');
  
  // Create bar chart
  const bars = [
    { year: 1970, arrived: false, height: 80 },
    { year: 1980, arrived: true, height: 120 },
    { year: 1990, arrived: true, height: 100 },
    { year: 2000, arrived: true, height: 140 },
    { year: 2100, arrived: false, height: 90 },
    { year: 2200, arrived: false, height: 110 },
    { year: 2300, arrived: false, height: 130 },
  ];
  
  const years = [1970, 1980, 1990, 2000, 2100, 2200, 2300];
  const minYear = 1970, maxYear = 2300;
  const todayYear = 2023;
  const todayPos = ((todayYear - minYear) / (maxYear - minYear)) * 100;
  
  fictionChart.innerHTML = `
    <div style="position: absolute; left: 24px; top: 24px; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 8px; padding: 12px;">
      <div style="color: #374151; font-size: 14px; font-weight: 500; margin-bottom: 8px;">80% Accurate</div>
      <div style="height: 12px; width: 96px; background: #9333ea; border-radius: 9999px;"></div>
    </div>
    
    <div style="position: relative; width: 100%; height: calc(100% - 80px); margin-top: 80px;">
      <!-- Today marker -->
      <div style="position: absolute; left: ${todayPos}%; top: 0; bottom: 64px; width: 2px; background: #111827;">
        <div style="position: absolute; top: -24px; left: 50%; transform: translateX(-50%); color: #374151; font-size: 14px; font-weight: 500; white-space: nowrap;">Today (2023)</div>
      </div>
      
      <!-- X-axis -->
      <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 64px; display: flex; justify-content: space-between; padding: 0 16px;">
        ${years.map(year => {
          const pos = ((year - minYear) / (maxYear - minYear)) * 100;
          return `<div style="position: absolute; left: ${pos}%; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center;">
            <div style="height: 8px; width: 1px; background: #9ca3af; margin-bottom: 4px;"></div>
            <div style="color: #6b7280; font-size: 14px; font-weight: 500;">${year}</div>
          </div>`;
        }).join('')}
      </div>
      
      <!-- Bars -->
      <div style="position: absolute; bottom: 64px; left: 0; right: 0; top: 0;">
        ${bars.map((bar, i) => {
          const pos = ((bar.year - minYear) / (maxYear - minYear)) * 100;
          return `<div style="position: absolute; left: ${pos}%; transform: translateX(-50%); bottom: 0; cursor: pointer;" onclick="showReimagineSection()">
            <div style="width: 64px; height: ${bar.height}px; background: ${bar.arrived ? '#3b82f6' : '#d1d5db'}; border: 2px solid ${bar.arrived ? '#2563eb' : '#9ca3af'}; border-radius: 4px 4px 0 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'"></div>
          </div>`;
        }).join('')}
      </div>
    </div>
  `;
  
  fictionSection.classList.add('open');
  fictionSection.setAttribute('aria-hidden', 'false');
}

function closeFictionSection() {
  const fictionSection = document.getElementById('fictionSection');
  if (!fictionSection) return;
  
  fictionSection.classList.remove('open');
  fictionSection.setAttribute('aria-hidden', 'true');
}

// Reimagine section
let currentQuestion = 0;
const questions = [
  "When will humans establish a permanent colony on Mars?",
  "When will artificial general intelligence be achieved?",
  "When will teleportation become a reality?",
];

function showReimagineSection() {
  closeFictionSection();
  currentSection = 'reimagine';
  updateHistory('reimagine', selectedFilmId, selectedMotif);
  
  const reimagineSection = document.getElementById('reimagineSection');
  const reimagineContent = document.getElementById('reimagineContent');
  
  currentQuestion = 0;
  
  reimagineContent.innerHTML = `
    <div style="text-align: center; max-width: 600px; margin: 0 auto;">
      <h1 class="section-title">Reimagine</h1>
      <p class="section-desc">You've seen how filmmakers across decades predicted the future. Now, we want to understand how you see tomorrow. Over the next few questions, you'll make predictions about emerging technologies. There are no right or wrong answers here.</p>
      <button class="btn primary-btn" style="margin-top: 32px;" onclick="startReimagineQuiz()">Begin Predictions →</button>
    </div>
  `;
  
  reimagineSection.classList.add('open');
  reimagineSection.setAttribute('aria-hidden', 'false');
}

function startReimagineQuiz() {
  const reimagineContent = document.getElementById('reimagineContent');
  let selectedYear = 2050;
  
  function renderQuestion() {
    reimagineContent.innerHTML = `
      <div style="text-align: center; max-width: 600px; margin: 0 auto;">
        <h1 class="section-title" style="font-size: 2rem;">Reimagine</h1>
        <h2 style="font-size: 1.5rem; color: #111827; margin-bottom: 32px;">${questions[currentQuestion]}</h2>
        
        <div style="font-size: 4rem; font-weight: 700; color: #9333ea; margin-bottom: 32px;" id="selectedYear">${selectedYear}</div>
        
        <input type="range" min="2025" max="2300" value="${selectedYear}" 
          oninput="updateYear(this.value)"
          style="width: 100%; height: 8px; background: linear-gradient(to right, #9333ea 0%, #9333ea ${((selectedYear - 2025) / (2300 - 2025)) * 100}%, rgba(209, 213, 219, 0.2) ${((selectedYear - 2025) / (2300 - 2025)) * 100}%, rgba(209, 213, 219, 0.2) 100%); border-radius: 4px; appearance: none; cursor: pointer;" />
        
        <button class="btn primary-btn" style="margin-top: 32px; width: 100%;" onclick="nextReimagineQuestion()">
          ${currentQuestion < questions.length - 1 ? 'Next →' : 'See Results →'}
        </button>
      </div>
    `;
  }
  
  window.updateYear = (year) => {
    selectedYear = parseInt(year);
    document.getElementById('selectedYear').textContent = selectedYear;
    const slider = document.querySelector('input[type="range"]');
    if (slider) {
      const progress = ((selectedYear - 2025) / (2300 - 2025)) * 100;
      slider.style.background = `linear-gradient(to right, #9333ea 0%, #9333ea ${progress}%, rgba(209, 213, 219, 0.2) ${progress}%, rgba(209, 213, 219, 0.2) 100%)`;
    }
  };
  
  window.nextReimagineQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      currentQuestion++;
      selectedYear = 2050;
      renderQuestion();
    } else {
      showConclusionSection();
    }
  };
  
  renderQuestion();
}

function closeReimagineSection() {
  const reimagineSection = document.getElementById('reimagineSection');
  if (!reimagineSection) return;
  
  reimagineSection.classList.remove('open');
  reimagineSection.setAttribute('aria-hidden', 'true');
}

// Conclusion section
function showConclusionSection() {
  closeReimagineSection();
  currentSection = 'conclusion';
  updateHistory('conclusion', selectedFilmId, selectedMotif);
  
  const conclusionSection = document.getElementById('conclusionSection');
  const conclusionContent = document.getElementById('conclusionContent');
  
  const userDistance = 15;
  const directorDistance = 54;
  
  conclusionContent.innerHTML = `
    <h2 style="color: #6b7280; margin-bottom: 24px;">Your Imagination Distance</h2>
    
    <div style="margin-bottom: 32px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="color: #111827; font-weight: 600;">You</span>
        <span style="color: #9333ea; font-weight: 700; font-size: 1.25rem;">${userDistance} Years</span>
      </div>
      <div style="height: 16px; background: #9333ea; border-radius: 9999px; width: ${(userDistance / directorDistance) * 100}%;"></div>
    </div>
    
    <div style="margin-bottom: 32px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="color: #111827; font-weight: 600;">Sci-Fi Directors</span>
        <span style="color: #9333ea; font-weight: 700; font-size: 1.25rem;">${directorDistance} Years</span>
      </div>
      <div style="color: #6b7280; font-size: 14px; margin-bottom: 8px;">Future average (1940-2000)</div>
      <div style="height: 16px; background: #9333ea; border-radius: 9999px; width: 100%; opacity: 0.6;"></div>
    </div>
    
    <p style="font-size: 18px; line-height: 1.8; color: #374151; margin-top: 32px;">
      Do we think there's a decline in innovation today, or are we simply living through it? What causes creators to imagine shorter futures? Faster technology? Greater fear? Or clearer vision? What does this reveal about our collective optimism and fear of technology?
    </p>
  `;
  
  conclusionSection.classList.add('open');
  conclusionSection.setAttribute('aria-hidden', 'false');
}

function closeConclusionSection() {
  const conclusionSection = document.getElementById('conclusionSection');
  conclusionSection.classList.remove('open');
  conclusionSection.setAttribute('aria-hidden', 'true');
  
  // Navigate back to reimagine or library
  if (currentSection === 'conclusion') {
    showReimagineSection();
  } else {
    currentSection = 'library';
    updateHistory('library', null, null);
  }
}

function closeAllSections() {
  const conclusionSection = document.getElementById('conclusionSection');
  const reimagineSection = document.getElementById('reimagineSection');
  const fictionSection = document.getElementById('fictionSection');
  const motifSection = document.getElementById('motifSection');
  
  if (conclusionSection) {
    conclusionSection.classList.remove('open');
    conclusionSection.setAttribute('aria-hidden', 'true');
  }
  if (reimagineSection) {
    reimagineSection.classList.remove('open');
    reimagineSection.setAttribute('aria-hidden', 'true');
  }
  if (fictionSection) {
    fictionSection.classList.remove('open');
    fictionSection.setAttribute('aria-hidden', 'true');
  }
  if (motifSection) {
    motifSection.classList.remove('open');
    motifSection.setAttribute('aria-hidden', 'true');
  }
  closeOverlay();
  
  currentSection = 'library';
  selectedFilmId = null;
  selectedMotif = null;
  updateHistory('library', null, null);
}


/* Animate both scenes */
function animate() {
  requestAnimationFrame(animate);

  // Shelf slide
  shelfOffset += (targetShelfOffset - shelfOffset) * 0.1;
  shelfGroup.position.x = shelfOffset;
  
  // Update parallax background
  updateParallaxBackground(shelfOffset);

  const t = performance.now() * 0.0015;
  shelfGroup.position.y = Math.sin(t) * 0.03;

  books.forEach((b, idx) => {
    b.mesh.rotation.y += (b.targetRotY - b.mesh.rotation.y) * 0.1;
    b.mesh.position.z += (b.targetPosZ - b.mesh.position.z) * 0.1;
    if (!b.isPresented) {
      b.mesh.rotation.z = Math.sin(t + idx) * 0.02;
    } else {
      b.mesh.rotation.z = 0;
    }
  });

  renderer.render(scene, camera);

  if (bookinfo.classList.contains('open') && overlayBook) {
    overlayBook.rotation.x += (targetTiltX - overlayBook.rotation.x) * 0.1;
    const yawTarget = targetTiltY * 0.65;
    overlayBook.rotation.y += (yawTarget - overlayBook.rotation.y) * 0.1;

    overlayRenderer.render(overlayScene, overlayCamera);
  }
}
animate();
