import * as THREE from 'https://unpkg.com/three@0.164.0/build/three.module.js';

/* -----------------------------------------------------------
   BOOK METADATA (now sorted by RELEASE YEAR)
----------------------------------------------------------- */
// let booksMeta = [
//   { id: 6, title: 'Metropolis', director: 'Fritz Lang', year: 1927, depicted: 2026, rating: 8.3, tropes: ['Robots', 'Dystopia'], location: 'Berlin, Germany', blurb: 'In a futuristic city sharply divided between the working class and the city planners, the son of the city\'s mastermind falls in love with a working-class prophet.' },

//   { id: 1, title: '2001 A Space Odyssey', director: 'Stanley Kubrick', year: 1968, depicted: 2001, rating: 8.3, tropes: ['AI', 'Space'], location: 'Los Angeles, CA, USA', blurb: 'After discovering a mysterious artifact buried beneath the Lunar surface, humanity sets off on a quest to Saturn with the sentient computer HAL to uncover its origins.' },

//   { id: 2, title: 'Blade Runner', director: 'Ridley Scott', year: 1982, depicted: 2019, rating: 8.1, tropes: ['Dystopia', 'AI'], location: 'Los Angeles, CA, USA', blurb: 'A blade runner must pursue and terminate four replicants who stole a ship and returned to Earth to find their creator.' },

//   { id: 5, title: 'Total Recall', director: 'Paul Verhoeven', year: 1990, depicted: 2084, rating: 7.5, tropes: ['Memory', 'Mars'], location: 'Los Angeles, CA, USA', blurb: 'A man goes to have virtual vacation memories of Mars implanted in his mind, but an unexpected series of events forces him to question reality.' },

//   { id: 4, title: 'Gattaca', director: 'Andrew Niccol', year: 1997, depicted: 2150, rating: 7.8, tropes: ['Genetic Engineering', 'Dystopia'], location: 'Los Angeles, CA, USA', blurb: 'A genetically inferior man assumes the identity of a superior one in order to pursue his lifelong dream of space travel.' },

//   { id: 7, title: 'The Matrix', director: 'The Wachowskis', year: 1999, depicted: 2199, rating: 8.7, tropes: ['Virtual Reality', 'Free Will'], location: 'Sydney, Australia', blurb: 'Neo discovers that his reality is a simulation created by an evil cyber-intelligence.' },

//   { id: 3, title: 'Minority Report', director: 'Steven Spielberg', year: 2002, depicted: 2054, rating: 7.6, tropes: ['Dystopia', 'Surveillance'], location: 'Los Angeles, CA, USA', blurb: 'In a future where a special police unit can arrest people before they commit crimes, an officer is accused of a future murder.' },
  
// ];

import booksMeta from "./movies_data_for_shelf.js"; // note this is sorted (id is sorted based on release yr)
console.log(booksMeta)

/* -----------------------------------------------------------
   GRID VIEW FUNCTIONALITY
----------------------------------------------------------- */
let currentView = 'list'; // 'list' or 'grid'

// Group books by decade
function groupBooksByDecade(books) {
  const grouped = {};
  books.forEach(book => {
    const year = parseInt(book.year);
    if (isNaN(year)) return;
    
    const decade = Math.floor(year / 10) * 10;
    const decadeKey = `${decade}s`;
    
    if (!grouped[decadeKey]) {
      grouped[decadeKey] = [];
    }
    grouped[decadeKey].push(book);
  });
  
  // Sort decades numerically
  const sortedDecades = Object.keys(grouped).sort((a, b) => {
    const decadeA = parseInt(a.replace('s', ''));
    const decadeB = parseInt(b.replace('s', ''));
    return decadeA - decadeB;
  });
  
  return { grouped, sortedDecades };
}

// Render grid view
function renderGridView() {
  const gridContent = document.getElementById('gridContent');
  if (!gridContent) return;
  
  const { grouped, sortedDecades } = groupBooksByDecade(booksMeta);
  
  gridContent.innerHTML = '';
  
  sortedDecades.forEach(decadeKey => {
    const decadeSection = document.createElement('div');
    decadeSection.className = 'decade-section';
    
    const decadeTitle = document.createElement('h2');
    decadeTitle.className = 'decade-title';
    // Format: "1900s", "2010s", etc.
    const decadeNum = parseInt(decadeKey);
    if (decadeNum >= 1900) {
      decadeTitle.textContent = `${decadeKey}`;
    } else {
      decadeTitle.textContent = `${decadeKey}`;
    }
    decadeSection.appendChild(decadeTitle);
    
    const moviesGrid = document.createElement('div');
    moviesGrid.className = 'movies-grid';
    
    grouped[decadeKey].forEach(book => {
      const movieCard = document.createElement('div');
      movieCard.className = 'movie-card';
      movieCard.dataset.bookId = book.id;
      
      const coverImg = document.createElement('img');
      coverImg.className = 'movie-cover';
      coverImg.src = `/postersID/${book.id}.jpg`;
      coverImg.alt = book.title;
      coverImg.loading = 'lazy';
      
      const titleOverlay = document.createElement('div');
      titleOverlay.className = 'movie-title-overlay';
      const titleText = document.createElement('p');
      titleText.className = 'movie-title-text';
      titleText.textContent = book.title.toUpperCase();
      titleOverlay.appendChild(titleText);
      
      movieCard.appendChild(coverImg);
      movieCard.appendChild(titleOverlay);
      
      // Click handler to open book details
      movieCard.addEventListener('click', () => {
        const bookIndex = booksMeta.findIndex(b => b.id === book.id);
        if (bookIndex !== -1) {
          // Switch back to list view and open the book
          switchView('list');
          // Wait a moment for the view to switch, then open the book
          setTimeout(() => {
            openOverlayForIndex(bookIndex);
          }, 100);
        }
      });
      
      moviesGrid.appendChild(movieCard);
    });
    
    decadeSection.appendChild(moviesGrid);
    gridContent.appendChild(decadeSection);
  });
}

// Switch between list and grid views
function switchView(view) {
  currentView = view;
  const gridView = document.getElementById('gridView');
  const listViewBtn = document.getElementById('listViewBtn');
  const gridViewBtn = document.getElementById('gridViewBtn');
  const bookinfo = document.getElementById('bookinfo');
  
  if (view === 'grid') {
    // Close any open book overlay
    if (bookinfo && bookinfo.classList.contains('open')) {
      closeOverlay();
    }
    
    // Hide 3D bookshelf
    baseCanvas.style.display = 'none';
    overlayCanvas.style.display = 'none';
    const bookBars = document.getElementById('bookBars');
    if (bookBars) bookBars.style.display = 'none';
    const introPanel = document.getElementById('introPanel');
    if (introPanel) introPanel.style.display = 'none';
    const introMessage = document.getElementById('introMessageDefault');
    if (introMessage) introMessage.style.display = 'none';
    
    // Show grid view and enable scrolling
    if (gridView) {
      gridView.style.display = 'block';
      document.body.style.overflow = 'hidden'; // Prevent body scroll
      renderGridView();
      
      // Trigger typing animation for grid view header
      setTimeout(() => {
        const headerIcon = document.querySelector('#gridViewHeader .intro-icon');
        const headerTitle = document.querySelector('#gridViewHeader .intro-text');
        if (headerIcon && headerTitle) {
          // Reset animation
          headerIcon.style.animation = 'none';
          setTimeout(() => {
            headerIcon.style.animation = '';
          }, 10);
          // Start typing animation
          setTimeout(() => {
            typeTextForGrid(headerTitle, 'Click on any movie cover to step inside its world.', 80);
          }, 600);
        }
      }, 100);
    }
    
    // Update button states
    if (listViewBtn) listViewBtn.classList.remove('active');
    if (gridViewBtn) gridViewBtn.classList.add('active');
  } else {
    // Close any open book overlay first
    if (bookinfo && bookinfo.classList.contains('open')) {
      closeOverlay();
    }
    
    // Reset book states - ensure no book is presented
    if (activeBook) {
      activeBook.isPresented = false;
      activeBook.targetRotY = Math.PI / 2;
      activeBook.targetPosZ = 0;
      activeBook.mesh.visible = true;
    }
    
    // Reset all books to default state
    books.forEach(b => {
      b.isPresented = false;
      b.targetRotY = Math.PI / 2;
      b.targetPosZ = 0;
      b.mesh.visible = true;
    });
    
    // Reset current index
    currentIndex = -1;
    activeBook = null;
    
    // Hide overlay canvas
    overlayCanvas.style.display = 'none';
    
    // Show 3D bookshelf
    baseCanvas.style.display = 'block';
    const bookBars = document.getElementById('bookBars');
    if (bookBars) bookBars.style.display = 'flex';
    const introPanel = document.getElementById('introPanel');
    if (introPanel) introPanel.style.display = 'block';
    const introMessage = document.getElementById('introMessageDefault');
    if (introMessage) introMessage.style.display = 'block';
    
    // Hide grid view and restore body scroll
    if (gridView) gridView.style.display = 'none';
    document.body.style.overflow = 'hidden'; // Keep body scroll hidden for 3D view
    
    // Update button states
    if (listViewBtn) listViewBtn.classList.add('active');
    if (gridViewBtn) gridViewBtn.classList.remove('active');
  }
}

// Initialize view toggle buttons (run after DOM is ready)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initViewToggle);
} else {
  initViewToggle();
}

function initViewToggle() {
  const listViewBtn = document.getElementById('listViewBtn');
  const gridViewBtn = document.getElementById('gridViewBtn');
  const backToListBtn = document.getElementById('backToListView');
  
  if (listViewBtn) {
    listViewBtn.addEventListener('click', () => switchView('list'));
    listViewBtn.classList.add('active');
  }
  
  if (gridViewBtn) {
    gridViewBtn.addEventListener('click', () => switchView('grid'));
  }
  
  if (backToListBtn) {
    backToListBtn.addEventListener('click', () => switchView('list'));
  }
}

/* -----------------------------------------------------------
   TYPING ANIMATION FUNCTION
----------------------------------------------------------- */
let currentTypingInterval = null;

function typeTextForGrid(element, text, speed = 100) {
  if (!element) {
    return;
  }
  
  // Clear any existing typing animation
  if (currentTypingInterval) {
    clearInterval(currentTypingInterval);
    currentTypingInterval = null;
  }
  
  const textToType = String(text || '').trim();
  
  // Clear element completely
  element.textContent = '';
  element.innerHTML = '';
  // Make text visible and remove uppercase
  element.style.opacity = '1';
  element.style.textTransform = 'none';
  element.classList.add('typing');
  
  let i = 0;
  currentTypingInterval = setInterval(() => {
    if (i < textToType.length) {
      element.textContent = textToType.substring(0, i + 1);
      i++;
    } else {
      clearInterval(currentTypingInterval);
      currentTypingInterval = null;
      element.classList.remove('typing');
    }
  }, speed);
}

/* -----------------------------------------------------------
   GLOBAL DOM REFERENCES
----------------------------------------------------------- */
const baseCanvas = document.getElementById('bookCanvas');
const overlayCanvas = document.getElementById('activeBookCanvas');

let currentIndex = -1;
let activeBook = null;
let overlayBook = null;

/* -----------------------------------------------------------
   INTRO PANEL STATE
----------------------------------------------------------- */
let introDismissed = false;
const INITIAL_CAMERA_OFFSET = 15; // How far right the shelf starts
let introPanelOffset = INITIAL_CAMERA_OFFSET; // Camera offset to position shelf off to the right initially

/* -----------------------------------------------------------
   SCENE SETUP – BASE
----------------------------------------------------------- */
const scene = new THREE.Scene();
scene.background = null;

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
// Initially position camera to the right so shelf appears off-screen
camera.position.set(introPanelOffset, 0.6, 8);

const renderer = new THREE.WebGLRenderer({ canvas: baseCanvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

scene.add(new THREE.AmbientLight(0xffffff, 0.75));
const dir = new THREE.DirectionalLight(0xffffff, 1.2);
dir.position.set(3, 5, 6);
scene.add(dir);

/* -----------------------------------------------------------
   SCENE SETUP – OVERLAY
----------------------------------------------------------- */
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

/* -----------------------------------------------------------
   GEOMETRY – SLIM BOOKS
----------------------------------------------------------- */
const BOOK_W = 2;
const BOOK_H = 3;
const BOOK_D = 0.4;   // <--- SLIMMER!

const geometry = new THREE.BoxGeometry(BOOK_W, BOOK_H, BOOK_D);

/* Palette reordered to match release-year order */

const textureLoader = new THREE.TextureLoader();

function makeMaterials(spineColorHex, coverFile) {

  // allow both '#rrggbb' and numeric hex
  const spineColor = new THREE.Color(spineColorHex);
  const edgeColor  = spineColor.clone().multiplyScalar(0.6); // darker edge
  const coverTexture = textureLoader.load(coverFile);
  return [
    new THREE.MeshStandardMaterial({ color: spineColor }), // right side
    new THREE.MeshStandardMaterial({ color: spineColor }), // left side
    new THREE.MeshStandardMaterial({ color: edgeColor }),  // top
    new THREE.MeshStandardMaterial({ color: edgeColor }),  // bottom
    new THREE.MeshStandardMaterial({ map: coverTexture }), // FRONT COVER
    new THREE.MeshStandardMaterial({ map: coverTexture }),   // back (can change to texture too)
  ];
}


function createBook(x, meta) {
  const color = meta.color || "#ffffff";  // fallback just in case
  const coverFile = `/postersID/${meta.id}.jpg`;
  const mesh = new THREE.Mesh(geometry, makeMaterials(color, coverFile));
  mesh.position.set(x, 0.2, 0);
  mesh.rotation.y = Math.PI / 2;
  mesh.userData.meta = meta;
  mesh.userData.color = color;

  return {
    mesh,
    isPresented: false,
    targetRotY: Math.PI / 2,
    targetPosZ: 0,
    targetRotZ: 0,
    targetRotX: 0,
  
    // NEW
    hoverTiltX: 0,   // lean toward viewer
    hoverTiltY: 0,   // yaw left/right
    hoverWobble: 0,  // playful Z-wobble
    hoverTiltZ: 0
    

  };
  
}



/* -----------------------------------------------------------
   POSITION BOOKS IN A CHRONOLOGICAL ROW
----------------------------------------------------------- */
const spacing = BOOK_W;
const startX = -((booksMeta.length - 1) * spacing) / 2;

const books = booksMeta.map((meta, i) =>
  createBook(startX + i * spacing, meta)
);

/* -----------------------------------------------------------
   TIMELINE BELOW BOOKS (closer spacing)
----------------------------------------------------------- */
const timelineGroup = new THREE.Group();
const timelineMaterial = new THREE.LineBasicMaterial({
  color: 0xffffff,
  opacity: 0.2,
  transparent: true
});

// Move timeline closer to books
const timelineGeometry = new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(startX - 1, -1.6, 0),
  new THREE.Vector3(-startX + 1, -1.6, 0)
]);

timelineGroup.add(new THREE.Line(timelineGeometry, timelineMaterial));

booksMeta.forEach((book, i) => {

  // Tick marks (also moved up)
  const tickGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(startX + i * spacing, -1.6, 0),
    new THREE.Vector3(startX + i * spacing, -1.65, 0)
  ]);
  timelineGroup.add(new THREE.Line(tickGeometry, timelineMaterial));

  // Year text canvas
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 64;
  const ctx = c.getContext('2d');

  ctx.font = '300 32px Courier New';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.fillText(book.year.toString(), c.width / 2, c.height);

  const tex = new THREE.CanvasTexture(c);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: tex,
    opacity: 0.5
  }));

  sprite.scale.set(0.55, 0.25, 1);

  // Year labels moved upward
  sprite.position.set(startX + i * spacing, -1.65, 0);
  timelineGroup.add(sprite);
});


/* -----------------------------------------------------------
   SHELF GROUP
----------------------------------------------------------- */
const shelfGroup = new THREE.Group();
books.forEach(b => shelfGroup.add(b.mesh));
shelfGroup.add(timelineGroup);
scene.add(shelfGroup);

/* -----------------------------------------------------------
   SCROLLING
----------------------------------------------------------- */

let lastOverlayScrollTime = 0;
const OVERLAY_SCROLL_COOLDOWN = 300;  // ms

let lastShelfScrollTime = 0;
const SHELF_SCROLL_COOLDOWN = 80;     // ms (tweak this)

let scrollVelocity = 0;
let lastWheelTime = 0;
const FRICTION = 0.92;       // how fast momentum decays (0.90–0.96 recommended)
const WHEEL_PUSH = 0.0004;   // how strongly scroll pushes the shelf


let shelfOffset = 0;
let targetShelfOffset = 0;

const MAX_SCROLL_LEFT = 95;
const MAX_SCROLL_RIGHT = -95;

const scrollLeftBtn = document.getElementById('scrollLeft');
const scrollRightBtn = document.getElementById('scrollRight');

function updateScrollButtons() {
  // Scroll buttons removed - function kept for compatibility but does nothing
  if (scrollRightBtn) {
    scrollRightBtn.style.display = 'block';
  }
  if (scrollLeftBtn) {
    scrollLeftBtn.style.display = 'block';
  }
}

if (scrollLeftBtn) {
  scrollLeftBtn.addEventListener('click', () => {
    if (!introDismissed) {
      dismissIntroPanel();
    }
    if (targetShelfOffset < MAX_SCROLL_LEFT) {
      targetShelfOffset += 2.5;
      updateScrollButtons();
    }
  });
}

if (scrollRightBtn) {
  scrollRightBtn.addEventListener('click', () => {
    if (!introDismissed) {
      dismissIntroPanel();
    }
    if (targetShelfOffset > MAX_SCROLL_RIGHT) {
      targetShelfOffset -= 2.5;
      updateScrollButtons();
    }
  });
}

window.addEventListener("wheel", (e) => {
  // Allow normal scrolling in grid view
  const gridView = document.getElementById('gridView');
  if (gridView && gridView.style.display === 'block') {
    return; // Don't prevent default, allow normal scrolling
  }
  
  // disable shelf scrolling when overlay is open
  if (bookinfo.classList.contains("open")) return;

  // Dismiss intro panel on first scroll
  if (!introDismissed) {
    dismissIntroPanel();
  }

  // push the scroll velocity
  scrollVelocity += e.deltaY * WHEEL_PUSH;

  // also move the target immediately (for responsiveness)
  targetShelfOffset += e.deltaY * 0.01;

  // clamp within bounds
  targetShelfOffset = Math.min(MAX_SCROLL_LEFT, Math.max(MAX_SCROLL_RIGHT, targetShelfOffset));

  updateScrollButtons();

  lastWheelTime = performance.now();

  e.preventDefault();
}, { passive: false });


window.addEventListener("wheel", (e) => {
  // Only apply when overlay is open
  if (!bookinfo.classList.contains("open")) return;

  const now = performance.now();
  if (now - lastOverlayScrollTime < OVERLAY_SCROLL_COOLDOWN) {
    e.preventDefault();
    return;
  }
  lastOverlayScrollTime = now;

  if (e.deltaY > 0) {
    // scroll down → NEXT movie
    openOverlayForIndex(currentIndex + 1);
  } else if (e.deltaY < 0) {
    // scroll up → PREVIOUS movie
    openOverlayForIndex(currentIndex - 1);
  }

  e.preventDefault();
}, { passive: false });




/* -----------------------------------------------------------
   RAYCASTING
----------------------------------------------------------- */
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function setMouseFromEvent(e) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
}

/* -----------------------------------------------------------
   OVERLAY LOGIC
----------------------------------------------------------- */
const bookinfo = document.getElementById('bookinfo');
const closeInfo = document.getElementById('closeInfo');
const backToShelf = document.getElementById('backToShelf');
const titleEl = document.getElementById('bookTitle');
const blurbEl = document.getElementById('bookBlurb');
const directorEl = document.getElementById('director');
// const releasedEl = document.getElementById('released');
// const depictedEl = document.getElementById('depicted');
const pillContainer = document.getElementById('pillContainer');
const motifsContainer = document.getElementById('motifsContainer');

let targetTiltX = 0;
let targetTiltY = 0;

window.addEventListener("mousemove", (e) => {
  if (!bookinfo.classList.contains('open')) {
    setMouseFromEvent(e);
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(books.map(b => b.mesh));

    // RESET ALL BOOKS FIRST
    books.forEach(b => {
      b.targetRotY = Math.PI / 2;
      b.hoverTiltX = 0;
      b.hoverTiltY = 0;
      b.hoverWobble = 0;
      b.targetPosZ = 0;
      b.hoverTiltZ = 0;
    });

    if (hits.length) {
      const hovered = books.find(b => b.mesh === hits[0].object);

      hovered.hoverTiltY = -0.5;
      hovered.hoverTiltX = -0;
      hovered.hoverWobble = 0.08;
      hovered.targetPosZ = 1.25;
      hovered.hoverTiltZ = 0.1; 

      hovered.targetRotY = Math.PI / 6.5;

      cursor.classList.add("hover");
    } else {
      cursor.classList.remove("hover");

      // EXTRA safety reset (still good to keep)
      books.forEach(b => {
        b.hoverTiltX = 0;
        b.hoverTiltY = 0;
        b.hoverWobble = 0;
        b.targetPosZ = 0;
        b.hoverTiltZ = 0;

        // b.mesh.layers.disable(BLOOM_SCENE);
      });
    }

    return;
  }


  const x = (e.clientX / window.innerWidth) * 2 - 1;
  const y = (e.clientY / window.innerHeight) * 2 - 1;
  targetTiltY = x * 0.18;
  targetTiltX = y * 0.12;
}, { passive: true });

function openOverlayForIndex(i) {
  updateActiveBookBar(i);
  setActiveBookByIndex(i);
  rebuildOverlayForIndex();

  hideDefaultIntro();
  showOverlayIntro();

  const footer = document.getElementById('footer');
  if (footer) footer.style.display = 'none';

  overlayCanvas.style.display = 'block';
  bookinfo.classList.add('open');

  // 🚫 Disable header
  document.querySelector(".page-header")?.classList.add("disabled");
}


function closeOverlay() {
  hideOverlayIntro();
  bookinfo.classList.remove('open');
  overlayCanvas.style.display = 'none';

  // ✅ Re-enable header
  document.querySelector(".page-header")?.classList.remove("disabled");

  const footer = document.getElementById('footer');
  if (footer) footer.style.display = 'flex';

  if (overlayBook) overlayScene.remove(overlayBook);

  if (activeBook) {
    activeBook.isPresented = false;
    activeBook.targetRotY = Math.PI / 2;
    activeBook.targetPosZ = 0;
    activeBook.tiltX = 0;
    activeBook.tiltY = 0;
    activeBook.hoverTiltZ = 0;
    activeBook.mesh.visible = true;
  }

  if (introDismissed) {
    showDefaultIntro(true);
  } else {
    showDefaultIntro(false);
  }
}



function setActiveBookByIndex(i) {
  currentIndex = (i + books.length) % books.length;

  if (activeBook) activeBook.mesh.visible = true;

  books.forEach((b, idx) => {
    const isTarget = idx === currentIndex;
    b.isPresented = isTarget;
    b.targetRotY = isTarget ? 0 : Math.PI / 2;
    b.targetPosZ = isTarget ? 1.2 : 0;
  });

  activeBook = books[currentIndex];
  activeBook.mesh.visible = false;
}

function mutedColor(hex, factor = 0.25) {
  const c = new THREE.Color(hex);
  c.multiplyScalar(factor); // darken
  console.log(c.getHexString())
  return `#${c.getHexString()}`;
}


function rebuildOverlayForIndex() {
  const b = books[currentIndex];
  const meta = b.mesh.userData.meta;
  const colors = b.mesh.userData.colors;

  // NEW — change overlay background color
  const overlayBg = document.getElementById("bookinfo");
  overlayBg.style.background = mutedColor(meta.color);
  overlayBg.style.backgroundColor = mutedColor(meta.color);
  

  titleEl.textContent = `${meta.title} (${meta.year})`;
  blurbEl.textContent = meta.blurb;
  directorEl.textContent = `Director(s): ${meta.director}`;
  // releasedEl.textContent = `${meta.year}`;
  // depictedEl.textContent = `${meta.depicted}, Washington DC, USA`;

  const NUM_MOTIFS = 4;  // Change if u want
  const tags = meta.tropes.slice(0,NUM_MOTIFS) || [];
  pillContainer.innerHTML = tags.map(t => `<span class="tag-pill">${t}</span>`).join('');

  motifsContainer.innerHTML = tags.map(t => `
    <div class="motif-circle" data-motif="${t}"
         onclick="location.href='/chordGraph.html'">
      ${t}
    </div>
  `).join('');

  if (overlayBook) overlayScene.remove(overlayBook);
  const coverFile = `/postersID/${meta.id}.jpg`;
  overlayBook = new THREE.Mesh(geometry, makeMaterials(meta.color, coverFile));
  overlayBook.rotation.set(0, 0.9, 0.1);
  overlayBook.position.set(-4.1, 0.6, 0.4);
  overlayScene.add(overlayBook);
}

renderer.domElement.addEventListener('click', (e) => {
  if (!introDismissed) {
    dismissIntroPanel();
  }
  
  setMouseFromEvent(e);
  raycaster.setFromCamera(mouse, camera);

  const hits = raycaster.intersectObjects(books.map(b => b.mesh));
  if (!hits.length) return;

  const clicked = books.find(b => b.mesh === hits[0].object);
  const idx = books.indexOf(clicked);

  targetTiltX = 0;
  targetTiltY = 0;

  openOverlayForIndex(idx);
});

closeInfo.addEventListener('click', closeOverlay);
backToShelf.addEventListener('click', closeOverlay);

/* -----------------------------------------------------------
   RESIZE
----------------------------------------------------------- */
window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;

  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);

  overlayCamera.aspect = w / h;
  overlayCamera.updateProjectionMatrix();
  overlayRenderer.setSize(w, h);
});

/* -----------------------------------------------------------
   INTRO PANEL DISMISSAL
----------------------------------------------------------- */
function dismissIntroPanel() {
  if (introDismissed) return;
  introDismissed = true;
  
  const introPanel = document.getElementById('introPanel');
  if (introPanel) {
    introPanel.classList.add('hidden');
  }
  
  // Show arrow button after 3 seconds
  setTimeout(() => {
    const arrowButton = document.querySelector('.arrow-button-wrapper');
    if (arrowButton) {
      arrowButton.style.opacity = "1";
      arrowButton.style.pointerEvents = "auto";
    }
  }, 3000);
  
  // Show intro message text after a delay
  setTimeout(() => {
    if (typeof showDefaultIntro === 'function') {
      showDefaultIntro(true); // Show text now
    }
  }, 500);
}

/* -----------------------------------------------------------
   ANIMATE
----------------------------------------------------------- */
function animate() {
  requestAnimationFrame(animate);

  // Animate camera back to center when intro is dismissed
  if (introDismissed) {
    introPanelOffset += (0 - introPanelOffset) * 0.05;
    camera.position.x = introPanelOffset;
  }

  shelfOffset += (targetShelfOffset - shelfOffset) * 0.1;
  // --- MOMENTUM SCROLLING ---
if (!bookinfo.classList.contains("open")) {
  
  // apply momentum to target offset
  targetShelfOffset += scrollVelocity;

  // friction reduces velocity each frame
  scrollVelocity *= FRICTION;

  // clamp to bookshelf range
  if (targetShelfOffset > MAX_SCROLL_LEFT) {
    targetShelfOffset = MAX_SCROLL_LEFT;
    scrollVelocity = 0;
  }
  if (targetShelfOffset < MAX_SCROLL_RIGHT) {
    targetShelfOffset = MAX_SCROLL_RIGHT;
    scrollVelocity = 0;
  }
}

  shelfGroup.position.x = shelfOffset;

  updateBarForCenteredBook();


  const t = performance.now() * 0.0015;
  shelfGroup.position.y = Math.sin(t) * 0.03 + 0.7;

  books.forEach((b, idx) => {

  // Smoothly interpolate Y (yaw)
  b.mesh.rotation.y += (b.targetRotY + b.hoverTiltY - b.mesh.rotation.y) * 0.12;

  // Smoothly interpolate X (tilt toward viewer)
  b.mesh.rotation.x += (b.hoverTiltX - b.mesh.rotation.x) * 0.12;

  // Subtle wobble on hover
  const wobble = b.hoverWobble * 0.1*Math.sin(t * 2 + idx);
  const targetZ = wobble + b.hoverTiltZ;

  b.mesh.rotation.z += (targetZ - b.mesh.rotation.z) * 0.12;


  // Smooth position forward/back
  b.mesh.position.z += (b.targetPosZ - b.mesh.position.z) * 0.1;
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

/* -----------------------------------------------------------
   AUTO-OPEN FROM URL
----------------------------------------------------------- */
window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const title = params.get('movie');

  showDefaultIntro();


  if (title) {
    const movieIndex = booksMeta.findIndex(m => m.title === title);
    if (movieIndex !== -1) {
      setTimeout(() => openOverlayForIndex(movieIndex), 500);
    } else {
      window.location.href = `/infoPage.html?movie=${encodeURIComponent(title)}`;
    }
  }
});


/* --------------------------------------
    Custom Cursor Circle
-------------------------------------- */
const cursor = document.getElementById("cursorCircle");

// Update cursor position
window.addEventListener("mousemove", (e) => {
  cursor.style.top = `${e.clientY}px`;
  cursor.style.left = `${e.clientX}px`;
});

// Let certain elements "enlarge" the cursor
function enableCursorHover(selector) {
  document.querySelectorAll(selector).forEach(el => {
    el.addEventListener("mouseenter", () => cursor.classList.add("hover"));
    el.addEventListener("mouseleave", () => cursor.classList.remove("hover"));
  });
}


// Elements that should cause the cursor circle to expand
enableCursorHover("canvas");             // hovering the 3D shelf
enableCursorHover(".tag-pill");          // tropes/tags
enableCursorHover(".motif-circle");      // motif bubbles
enableCursorHover(".btn");               // overlay buttons
// Scroll buttons removed - cursor hover no longer needed
enableCursorHover(".menu-button, .menu-close");  // menu
enableCursorHover("#activeBookCanvas"); // overlay 3D book
enableCursorHover(".menu-button");
enableCursorHover(".menu-close");
enableCursorHover("#motifsContainer");
enableCursorHover(".motif-circle");



/* ------------------------------------------------------------------
   EDGE SCROLL CURSOR (Arrow cursor that triggers scrolling)
------------------------------------------------------------------ */

const EDGE_ZONE = 400;  // px from left/right side of screen

window.addEventListener("mousemove", (e) => {

  const overlayOpen = bookinfo.classList.contains("open");
  const navigationMenu = document.getElementById('navigationMenu');
  const menuOpen = navigationMenu && !navigationMenu.classList.contains('collapsed');
  const gridView = document.getElementById('gridView');
  const gridViewActive = gridView && gridView.style.display === 'block';
  const x = e.clientX;
  const w = window.innerWidth;

  // 🚫 DISABLE ARROW CURSORS IN GRID VIEW
  if (gridViewActive) {
    cursor.classList.remove("arrow-left", "arrow-right");
    return;
  }

    // 🚫 DISABLE ARROW CURSORS WHEN HOVERING OVER THE BAR SELECTOR
    if (hoveringBars) {
      cursor.classList.remove("arrow-left", "arrow-right");
      return;
    }
  

  // 🔥 NEW — overlay mode: enable arrows for prev/next navigation
if (overlayOpen) {
  const x = e.clientX;
  const w = window.innerWidth;

  // Block arrows if inside a button or motif, etc
  if (cursor.classList.contains("hover")) {
    cursor.classList.remove("arrow-left", "arrow-right");
    return;
  }

  if (x < EDGE_ZONE) {
    cursor.classList.add("arrow-left");
    cursor.classList.remove("arrow-right");
  } else if (x > w - EDGE_ZONE) {
    cursor.classList.add("arrow-right");
    cursor.classList.remove("arrow-left");
  } else {
    cursor.classList.remove("arrow-left", "arrow-right");
  }

  return;
}

  
  // If normal hover cursor is active → no arrows
  if (cursor.classList.contains("hover")) {
    cursor.classList.remove("arrow-left", "arrow-right");
    return;
  }

  // ---- RIGHT EDGE ----
  const canScrollRight = targetShelfOffset > MAX_SCROLL_RIGHT;
  const nearRight = x > w - EDGE_ZONE;

  if (nearRight && canScrollRight) {
    cursor.classList.add("arrow-right");
    cursor.classList.remove("arrow-left");
    return;
  }

  // ---- LEFT EDGE ----
  const canScrollLeft = targetShelfOffset < MAX_SCROLL_LEFT;
  const nearLeft = x < EDGE_ZONE;

  if (nearLeft && canScrollLeft) {
    cursor.classList.add("arrow-left");
    cursor.classList.remove("arrow-right");
    return;
  }

  // Otherwise remove arrows
  cursor.classList.remove("arrow-left", "arrow-right");
});

window.addEventListener("mousedown", (e) => {

  const navigationMenu = document.getElementById('navigationMenu');
  const menuOpen = navigationMenu && !navigationMenu.classList.contains('collapsed');

  // 🔥 NEW — overlay click arrow
  if (bookinfo.classList.contains("open")) {
    if (cursor.classList.contains("arrow-right")) {
      openOverlayForIndex(currentIndex + 1);
    } else if (cursor.classList.contains("arrow-left")) {
      openOverlayForIndex(currentIndex - 1);
    }
    return;  
  }

  // (existing non-overlay logic below)
  // Only block if hovering bars, not if menu is open
  if (hoveringBars) return;

  // Don't scroll if clicking on navigation menu
  if (navigationMenu && navigationMenu.contains(e.target)) return;

  if (cursor.classList.contains("arrow-right")) {
    if (scrollRightBtn) scrollRightBtn.click();
  } else if (cursor.classList.contains("arrow-left")) {
    if (scrollLeftBtn) scrollLeftBtn.click();
  }
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
  if (!introDismissed) {
    dismissIntroPanel();
  }
  
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

//     // Scroll to that book
//     jumpToBook(index);

//     // Highlight the selected bar
//     updateActiveBookBar(index);

//     // ❌ DO NOT reset the wave here
//     // Wave should stay as long as the mouse is inside the container
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

  positionLabelOverBar(hoverLabel, bars[closestIndex], booksMeta[closestIndex].year);

  const activeIndex = bars.findIndex(b => b.classList.contains("active"));
  if (activeIndex !== -1) {
    positionLabelOverBar(activeLabel, bars[activeIndex], booksMeta[activeIndex].year);
  }
});

/* -----------------------------------------------------------
   GLOBAL CLICK REGION — clicking anywhere selects nearest bar
----------------------------------------------------------- */
barsContainer.addEventListener("click", (e) => {
  const bars = Array.from(document.querySelectorAll(".book-bar"));
  const rect = barsContainer.getBoundingClientRect();
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

  // Jump to that book
  jumpToBook(closestIndex);

  // Update highlight
  updateActiveBookBar(closestIndex);
});


/* -----------------------------------------------------------
   ENTER / LEAVE (disable arrow cursor + reset wave)
----------------------------------------------------------- */

let hoveringBars = false;

barsContainer.addEventListener("mouseenter", () => {
  hoveringBars = true;
  cursor.classList.remove("arrow-left", "arrow-right");
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

const BASE_HEIGHT = 32;       // height at edges
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
