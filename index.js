import * as THREE from 'https://unpkg.com/three@0.164.0/build/three.module.js';

// ! NOTE: I refer to "movies" as "books" since it's basically a bookshelf

const baseCanvas = document.getElementById('bookCanvas');
const overlayCanvas = document.getElementById('activeBookCanvas');
let currentIndex = -1;  // which book is currently shown in card view (overlay)

/* ---------- Book metadata ---------- */
const booksMeta = [
  { id: 1, title: '2001 A Space Odyssey', director: 'Stanley Kubrick', year: 1968, depicted: 2001, rating: 8.3, tropes: ['AI', 'Space'], location: 'Los Angeles, CA, USA', blurb: 'After discovering a mysterious artifact buried beneath the Lunar surface, humanity sets off on a quest to Saturn with the sentient computer HAL to uncover the artifact\'s origins.' },
  { id: 2, title: 'Blade Runner', director: 'Ridley Scott', year: 1982, depicted: 2019, rating: 8.1, tropes: ['Dystopia', 'AI'], location: 'Los Angeles, CA, USA', blurb: 'In a dystopian future, a blade runner must pursue and terminate four replicants who stole a ship in space and returned to Earth to find their creator.' },
  { id: 3, title: 'Minority Report', director: 'Steven Spielberg', year: 2002, depicted: 2054, rating: 7.6, tropes: ['Dystopia', 'Surveillance Capitalism'], location: 'Los Angeles, CA, USA', blurb: 'In a future where a special police unit can arrest people before they commit their crimes, an officer is accused of a future murder. In 2054, the federal government plans to nationally [See more].' },
  { id: 4, title: 'Gattaca', director: 'Andrew Niccol', year: 1997, depicted: 2150, rating: 7.8, tropes: ['Genetic Engineering', 'Dystopia'], location: 'Los Angeles, CA, USA', blurb: 'A genetically inferior man assumes the identity of a superior one in order to pursue his lifelong dream of space travel.' },
  { id: 5, title: 'Total Recall', director: 'Paul Verhoeven', year: 1990, depicted: 2084, rating: 7.5, tropes: ['Memory', 'Mars'], location: 'Los Angeles, CA, USA', blurb: 'When a man goes in to have virtual vacation memories of the planet Mars implanted in his mind, an unexpected and harrowing series of events forces him to go to the planet for real - or is he?' },
  { id: 6, title: 'Metropolis', director: 'Fritz Lang', year: 1927, depicted: 2026, rating: 8.3, tropes: ['Robots', 'Dystopia'], location: 'Berlin, Germany', blurb: 'In a futuristic city sharply divided between the working class and the city planners, the son of the city\'s mastermind falls in love with a working-class prophet who predicts the coming of a savior to mediate their differences.' },
  { id: 7, title: 'The Matrix', director: 'The Wachowskis', year: 1999, depicted: 2199, rating: 8.7, tropes: ['Virtual Reality', 'Free Will'], location: 'Sydney, Australia', blurb: 'When a beautiful stranger leads computer hacker Neo to a forbidding underworld, he discovers the shocking truth--the life he knows is the elaborate deception of an evil cyber-intelligence.' },
];

/* ---------- Base scene (shelf) ---------- */
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
  mesh.position.set(x, 0.2, 0);
  mesh.rotation.y = Math.PI / 2; // spine toward viewer
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

const spacing = BOOK_W + 0.75;
const startX = -((palette.length - 1) * spacing) / 2;
const books = palette.map((colors, i) => createBook(startX + i * spacing, colors, booksMeta[i]));

/* Create timeline */
const timelineGroup = new THREE.Group();

// Create the main timeline line
const timelineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.7, transparent: true });
const timelineGeometry = new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(-((palette.length - 1) * spacing) / 2 - 1, -1.8, 0),  // Extend slightly beyond books
  new THREE.Vector3(((palette.length - 1) * spacing) / 2 + 1, -1.8, 0)
]);
const timelineLine = new THREE.Line(timelineGeometry, timelineMaterial);
timelineGroup.add(timelineLine);

// Create tick marks and year labels
const sortedYears = [...new Set(booksMeta.map(b => b.year))].sort((a, b) => a - b);
const minYear = sortedYears[0];
const maxYear = sortedYears[sortedYears.length - 1];
const yearSpan = maxYear - minYear;

booksMeta.forEach((book, i) => {
  // Tick mark
  const tickGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(startX + i * spacing, -1.7, 0),
    new THREE.Vector3(startX + i * spacing, -1.9, 0)
  ]);
  const tick = new THREE.Line(tickGeometry, timelineMaterial);
  timelineGroup.add(tick);

  // Year label using sprite
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 128;
  canvas.height = 64;
  ctx.font = 'bold 48px Arial';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.fillText(book.year.toString(), canvas.width/2, canvas.height);
  
  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture, opacity: 0.7 });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(0.8, 0.4, 1);
  sprite.position.set(startX + i * spacing, -2, 0);
  timelineGroup.add(sprite);
});

/* Group for shelf scrolling */
const shelfGroup = new THREE.Group();
books.forEach(b => shelfGroup.add(b.mesh));
shelfGroup.add(timelineGroup); // Add timeline to shelf group so it moves with books
scene.add(shelfGroup);

/* ---------- Overlay UI references ---------- */
const bookinfo = document.getElementById('bookinfo');
const closeInfo = document.getElementById('closeInfo');
const backToShelf = document.getElementById('backToShelf');
const titleEl = document.getElementById('bookTitle');
const blurbEl = document.getElementById('bookBlurb');
const swFront = document.getElementById('swatchFront');
const swBack  = document.getElementById('swatchBack');
// const tropeDiv = document.getElementById('tropeDiv');
const pillContainer = document.getElementById('pillContainer');
const directorEl = document.getElementById('director');
const releasedEl = document.getElementById('released');
const depictedEl = document.getElementById('depicted');
const motifsContainer = document.getElementById('motifsContainer');

/* Scroll buttons and wheel */
let shelfOffset = 0;
let targetShelfOffset = 0;
const MAX_SCROLL_LEFT = 5;  // Maximum scroll to the left (positive)
const MAX_SCROLL_RIGHT = -5; // Maximum scroll to the right (negative)

const scrollLeftBtn = document.getElementById('scrollLeft');
const scrollRightBtn = document.getElementById('scrollRight');

function updateScrollButtons() {
    // Hide/show buttons based on scroll position
    scrollRightBtn.style.display = targetShelfOffset <= MAX_SCROLL_RIGHT ? 'none' : 'block';
    scrollLeftBtn.style.display = targetShelfOffset >= MAX_SCROLL_LEFT ? 'none' : 'block';
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

// Handle trackpad/mouse wheel scrolling
window.addEventListener('wheel', (e) => {
  if (bookinfo.classList.contains('open')) return; // Don't scroll shelf when overlay is open
  
  // deltaY is positive when scrolling down, negative when scrolling up
  if (e.deltaY > 0 && targetShelfOffset < MAX_SCROLL_LEFT) {
    targetShelfOffset += 0.8; // Scroll down = move left
  } else if (e.deltaY < 0 && targetShelfOffset > MAX_SCROLL_RIGHT) {
    targetShelfOffset -= 0.8; // Scroll up = move right
  }
  
  updateScrollButtons();
  e.preventDefault(); // Prevent page scrolling
}, { passive: false });

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
  if (!bookinfo.classList.contains('open')) {
    // Handle shelf book hover
    setMouseFromEvent(e);
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(books.map(b => b.mesh));
    
    // Update cursor style based on hover state
    baseCanvas.style.cursor = intersects.length ? 'pointer' : 'default';
    
    // Reset all books that aren't being hovered
    books.forEach(b => {
      if (!intersects.length || b.mesh !== intersects[0].object) {
        b.targetRotY = Math.PI/2; // Return to spine-out position
      }
    });

    // Apply tilt to hovered book
    if (intersects.length) {
      const hovered = books.find(b => b.mesh === intersects[0].object);
      // Rotate from spine (Math.PI/2) towards face (Math.PI/4)
      hovered.targetRotY = Math.PI/4; // Turn the face partially towards camera
    }
    return;
  }
  
  // Handle overlay book tilt
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
document.getElementById('cardPrev').addEventListener('click', (e) => {
  e.stopPropagation();
  openOverlayForIndex(currentIndex - 1); // left
});

document.getElementById('cardNext').addEventListener('click', (e) => {
  e.stopPropagation();
  openOverlayForIndex(currentIndex + 1); // right
});


/* Overlay actions */
closeInfo.addEventListener('click', closeOverlay);
backToShelf.addEventListener('click', () => {
  if (activeBook) {
    activeBook.isPresented = false;
    activeBook.targetRotY = Math.PI / 2;
    activeBook.targetPosZ = 0;
    activeBook.tiltX = 0;
    activeBook.tiltY = 0;
  }
  closeOverlay();
});

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

  // Update text/swatches
  titleEl.textContent = meta.title;
  blurbEl.textContent = meta.plot || meta.blurb || 'No description available.';
  directorEl.textContent = meta.director || 'Unknown';
  releasedEl.textContent = `${meta.year}, ${meta.location || 'Unknown'}`;
  depictedEl.textContent = `${meta.depicted || 'N/A'}, Washington DC, USA`;
  // swFront.style.background = `#${colors.front.toString(16).padStart(6,'0')}`;
  // swBack.style.background  = `#${colors.back.toString(16).padStart(6,'0')}`;
  // Placeholder: All movies currently show 2001: A Space Odyssey chord graph
  // ! Audrey's circle graph is visible if you set trope="2001: A Space Odyssey" 
  // tropeDiv.innerHTML = meta.tropes.map(trope => {
  //   return `<button class="btn" onclick="location.href='/infoPage.html?movie=${encodeURIComponent(trope)}'">
  //             View Theme Analysis (${trope})
  //           </button>`;;
  // }).join('');

  
  const tags = meta.tags || meta.tropes || [];
  pillContainer.innerHTML = tags.map(tag => {
    return `<span class="tag-pill">${tag}</span>`;
  }).join('');

  // Update motifs - use default motifs if film doesn't have enough
  const defaultMotifs = ['Surveillance', 'Free Will', 'Artificial Intelligence', 'Crime'];
  const displayMotifs = tags;
  
  motifsContainer.innerHTML = displayMotifs.map((motif, i) => {
    const isHighlighted = i === 0;
    // return `<div class="motif-circle ${isHighlighted ? 'highlighted' : ''}" data-motif="${motif}">
    //           ${motif}
    //         </div>`;
    return `<div class="motif-circle data-motif="${motif}">
              ${motif}
            </div>`;
  }).join('');
  
  // Add click handlers to motif circles
  motifsContainer.querySelectorAll('.motif-circle').forEach(circle => {
  circle.addEventListener('click', () => {
    const motifName = circle.dataset.motif;
    // Redirect to infoPage.html with the motif name encoded
    location.href = `/infoPage.html?trope=${encodeURIComponent(motifName)}`;
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


/* Animate both scenes */
function animate() {
  requestAnimationFrame(animate);

  // Shelf slide
  shelfOffset += (targetShelfOffset - shelfOffset) * 0.1;
  shelfGroup.position.x = shelfOffset;
  updateScrollButtons(); // Update button visibility during animation

  const t = performance.now() * 0.0015;
  shelfGroup.position.y = Math.sin(t) * 0.03;

  books.forEach((b, idx) => {
    b.mesh.rotation.y += (b.targetRotY - b.mesh.rotation.y) * 0.1;
    b.mesh.position.z += (b.targetPosZ - b.mesh.position.z) * 0.1;
    if (!b.isPresented) {
      // Apply hover rotation or gentle wave animation
      b.mesh.rotation.y += (b.targetRotY - b.mesh.rotation.y) * 0.1;
      if (!b.isPresented && b.targetRotY === Math.PI/2) { // Only wave if not hovered
        b.mesh.rotation.z = Math.sin(t + idx) * 0.02;
      } else {
        b.mesh.rotation.z = 0;
      }
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
