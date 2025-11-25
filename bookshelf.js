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
   GLOBAL DOM REFERENCES
----------------------------------------------------------- */
const baseCanvas = document.getElementById('bookCanvas');
const overlayCanvas = document.getElementById('activeBookCanvas');

let currentIndex = -1;
let activeBook = null;
let overlayBook = null;

/* -----------------------------------------------------------
   SCENE SETUP – BASE
----------------------------------------------------------- */
const scene = new THREE.Scene();
scene.background = null;

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0.6, 8);

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
const palette = [
  { front: 0x22d3ee, back: 0x083344 }, // 1927 Metropolis
  { front: 0x0ea5e9, back: 0x0f172a }, // 1968 2001
  { front: 0xf59e0b, back: 0x78350f }, // 1982 BR
  { front: 0xef4444, back: 0x7f1d1d }, // 1990 TR
  { front: 0x8b5cf6, back: 0x3b0764 }, // 1997 Gattaca
  { front: 0xf472b6, back: 0x831843 }, // 1999 Matrix
  { front: 0x10b981, back: 0x064e3b }, // 2002 MR
];

function makeMaterials(cover, back) {
  const spine = 0x1e293b;
  const edge = 0x334155;
  return [
    new THREE.MeshStandardMaterial({ color: spine }),
    new THREE.MeshStandardMaterial({ color: spine }),
    new THREE.MeshStandardMaterial({ color: edge }),
    new THREE.MeshStandardMaterial({ color: edge }),
    new THREE.MeshStandardMaterial({ color: cover }),
    new THREE.MeshStandardMaterial({ color: back }),
  ];
}

function createBook(x, colors, meta) {
  const mesh = new THREE.Mesh(geometry, makeMaterials(colors.front, colors.back));
  mesh.position.set(x, 0.2, 0);
  mesh.rotation.y = Math.PI / 2;
  mesh.userData.meta = meta;
  mesh.userData.colors = colors;

  return {
    mesh,
    isPresented: false,
    targetRotY: Math.PI / 2,
    targetPosZ: 0,
    targetRotZ: 0,
    targetRotX: 0,
    tiltX: 0,
    tiltY: 0,
  };
}

/* -----------------------------------------------------------
   POSITION BOOKS IN A CHRONOLOGICAL ROW
----------------------------------------------------------- */
const spacing = BOOK_W;
const startX = -((booksMeta.length - 1) * spacing) / 2;

const books = booksMeta.map((meta, i) =>
  createBook(startX + i * spacing, palette[i % 7], meta)
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
let shelfOffset = 0;
let targetShelfOffset = 0;

const MAX_SCROLL_LEFT = 95;
const MAX_SCROLL_RIGHT = -95;

const scrollLeftBtn = document.getElementById('scrollLeft');
const scrollRightBtn = document.getElementById('scrollRight');

function updateScrollButtons() {
  scrollRightBtn.style.display = targetShelfOffset <= MAX_SCROLL_RIGHT ? 'none' : 'block';
  scrollLeftBtn.style.display  = targetShelfOffset >= MAX_SCROLL_LEFT ? 'none' : 'block';
}

scrollLeftBtn.addEventListener('click', () => {
  if (targetShelfOffset < MAX_SCROLL_LEFT) {
    targetShelfOffset += 2.5;
    updateScrollButtons();
  }
});

scrollRightBtn.addEventListener('click', () => {
  if (targetShelfOffset > MAX_SCROLL_RIGHT) {
    targetShelfOffset -= 2.5;
    updateScrollButtons();
  }
});

window.addEventListener('wheel', (e) => {
  if (document.getElementById('bookinfo').classList.contains('open')) return;

  if (e.deltaY > 0 && targetShelfOffset < MAX_SCROLL_LEFT) {
    targetShelfOffset += 0.8;
  } else if (e.deltaY < 0 && targetShelfOffset > MAX_SCROLL_RIGHT) {
    targetShelfOffset -= 0.8;
  }

  updateScrollButtons();
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
const releasedEl = document.getElementById('released');
const depictedEl = document.getElementById('depicted');
const pillContainer = document.getElementById('pillContainer');
const motifsContainer = document.getElementById('motifsContainer');

let targetTiltX = 0;
let targetTiltY = 0;

window.addEventListener("mousemove", (e) => {
  if (!bookinfo.classList.contains('open')) {
    setMouseFromEvent(e);
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(books.map(b => b.mesh));

    // remove default cursor logic (you already did this)

    books.forEach(b => {
      b.targetRotY = Math.PI / 2;
    });

    if (hits.length) {
      const hovered = books.find(b => b.mesh === hits[0].object);
      hovered.targetRotY = Math.PI / 4;

      // ✨ enlarge cursor
      cursor.classList.add("hover");
    } else {
      // ✨ shrink cursor when not over a book
      cursor.classList.remove("hover");
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

  overlayCanvas.style.display = 'block';
  bookinfo.classList.add('open');
}

function closeOverlay() {
  bookinfo.classList.remove('open');
  overlayCanvas.style.display = 'none';

  // remove overlay 3D mesh
  if (overlayBook) overlayScene.remove(overlayBook);

  // restore base book state
  if (activeBook) {
    activeBook.isPresented = false;
    activeBook.targetRotY = Math.PI / 2;  // spine forward
    activeBook.targetPosZ = 0;            // move back
    activeBook.tiltX = 0;
    activeBook.tiltY = 0;
    activeBook.mesh.visible = true;
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

function rebuildOverlayForIndex() {
  const b = books[currentIndex];
  const meta = b.mesh.userData.meta;
  const colors = b.mesh.userData.colors;

  titleEl.textContent = meta.title;
  blurbEl.textContent = meta.blurb;
  directorEl.textContent = meta.director;
  releasedEl.textContent = `${meta.year}`;
  depictedEl.textContent = `${meta.depicted}, Washington DC, USA`;

  const tags = meta.tropes || [];
  pillContainer.innerHTML = tags.map(t => `<span class="tag-pill">${t}</span>`).join('');

  motifsContainer.innerHTML = tags.map(t => `
    <div class="motif-circle" data-motif="${t}"
         onclick="location.href='/chordGraph.html'">
      ${t}
    </div>
  `).join('');

  if (overlayBook) overlayScene.remove(overlayBook);

  overlayBook = new THREE.Mesh(geometry, makeMaterials(colors.front, colors.back));
  overlayBook.rotation.set(0, 0.9, 0);
  overlayBook.position.set(1.6, 0.6, 0.4);
  overlayScene.add(overlayBook);
}

renderer.domElement.addEventListener('click', (e) => {
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

document.getElementById('cardPrev').addEventListener('click', (e) => {
  e.stopPropagation();
  openOverlayForIndex(currentIndex - 1);
});

document.getElementById('cardNext').addEventListener('click', (e) => {
  e.stopPropagation();
  openOverlayForIndex(currentIndex + 1);
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
   ANIMATE
----------------------------------------------------------- */
function animate() {
  requestAnimationFrame(animate);

  shelfOffset += (targetShelfOffset - shelfOffset) * 0.1;
  shelfGroup.position.x = shelfOffset;

  updateBarForCenteredBook();


  const t = performance.now() * 0.0015;
  shelfGroup.position.y = Math.sin(t) * 0.03 + 0.7;

  books.forEach((b, idx) => {
    b.mesh.rotation.y += (b.targetRotY - b.mesh.rotation.y) * 0.1;
    b.mesh.position.z += (b.targetPosZ - b.mesh.position.z) * 0.1;

    if (!b.isPresented && b.targetRotY === Math.PI / 2) {
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

/* -----------------------------------------------------------
   AUTO-OPEN FROM URL
----------------------------------------------------------- */
window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const title = params.get('movie');

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
enableCursorHover("#scrollLeft, #scrollRight");  // arrows
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
  const x = e.clientX;
  const w = window.innerWidth;

  // Never show arrows when overlay OR menu is open
  if (overlayOpen || menuOpen || hoveringBars) {
    cursor.classList.remove("arrow-left", "arrow-right");
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

/* Click-to-scroll when in arrow mode */
window.addEventListener("mousedown", (e) => {

  // stop if overlay, menu, OR bars are hovered
  const navigationMenu = document.getElementById('navigationMenu');
  const menuOpen = navigationMenu && !navigationMenu.classList.contains('collapsed');
  
  if (bookinfo.classList.contains("open") ||
      menuOpen ||
      hoveringBars) return;

  // Don't scroll if clicking on navigation menu
  if (navigationMenu && navigationMenu.contains(e.target)) return;

  if (cursor.classList.contains("arrow-right")) {
    scrollRightBtn.click();
  } else if (cursor.classList.contains("arrow-left")) {
    scrollLeftBtn.click();
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
  const bookX = startX + index * spacing;
  
  // Center book: shelf must move by -bookX
  targetShelfOffset = -bookX;

  updateScrollButtons();
  updateActiveBookBar(index);
}

/* -----------------------------------------------------------
   CLICK HANDLER (works reliably)
----------------------------------------------------------- */
document.querySelectorAll(".book-bar").forEach(bar => {
  bar.addEventListener("click", (e) => {
    e.stopPropagation();
    e.preventDefault();

    const index = Number(bar.dataset.index);

    // Scroll to that book
    jumpToBook(index);

    // Highlight the selected bar
    updateActiveBookBar(index);

    // ❌ DO NOT reset the wave here
    // Wave should stay as long as the mouse is inside the container
  });
});


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

  // prevent wave logic briefly after clicking
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
  document.querySelectorAll(".book-bar").forEach((bar, i) => {
    bar.classList.toggle("hovered", i === hoveredBarIndex);
  });
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
