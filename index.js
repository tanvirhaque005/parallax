import * as THREE from 'https://unpkg.com/three@0.164.0/build/three.module.js';

// ! NOTE: I refer to "movies" as "books" since it's basically a bookshelf

const baseCanvas = document.getElementById('bookCanvas');
const overlayCanvas = document.getElementById('activeBookCanvas');
let currentIndex = -1;  // which book is currently shown in card view (overlay)

/* ---------- Book metadata ---------- */
const booksMeta = [
  { id: 'bk-1', title: 'Minority Report', author: 'director name', year: 2021, blurb: 'blurb....', tropes: ['AI', 'Surveillance'] },
  { id: 'bk-2', title: '2001 A Space Odyssey', author: 'director name', year: 2024, blurb: 'blurb....', tropes: ['Space', 'AI'] },
  { id: 'bk-3', title: 'Science movie A', author: 'director name', year: 2020, blurb: 'blurb....', tropes: ['Science', 'Fiction'] },
  { id: 'bk-4', title: 'Science movie B', author: 'director name', year: 2013, blurb: 'blurb....', tropes: ['Science', 'Adventure'] },
  { id: 'bk-5', title: 'Science movie C', author: 'director name', year: 2019, blurb: 'blurb....', tropes: ['Science', 'Drama'] },
  { id: 'bk-6', title: 'Science movie D', author: 'director name', year: 2022, blurb: 'blurb....', tropes: ['Science', 'Thriller'] },
  { id: 'bk-7', title: 'Science movie E', author: 'director name', year: 2018, blurb: 'blurb....', tropes: ['Science', 'Mystery'] },
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

const spacing = BOOK_W + 0.75;
const startX = -((palette.length - 1) * spacing) / 2;
const books = palette.map((colors, i) => createBook(startX + i * spacing, colors, booksMeta[i]));

/* Group for shelf scrolling */
const shelfGroup = new THREE.Group();
books.forEach(b => shelfGroup.add(b.mesh));
scene.add(shelfGroup);

/* ---------- Overlay UI references ---------- */
const bookinfo = document.getElementById('bookinfo');
const closeInfo = document.getElementById('closeInfo');
const backToShelf = document.getElementById('backToShelf');
const titleEl = document.getElementById('bookTitle');
const metaEl  = document.getElementById('bookMeta');
const blurbEl = document.getElementById('bookBlurb');
const swFront = document.getElementById('swatchFront');
const swBack  = document.getElementById('swatchBack');
const tropeDiv = document.getElementById('tropeDiv');
const pillContainer = document.getElementById('pillContainer');

/* Scroll buttons */
let shelfOffset = 0;
let targetShelfOffset = 0;
document.getElementById('scrollLeft').addEventListener('click', () => { targetShelfOffset += 2.5; });
document.getElementById('scrollRight').addEventListener('click', () => { targetShelfOffset -= 2.5; });

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
  metaEl.textContent  = `${meta.author} · ${meta.year}`;
  blurbEl.textContent = meta.blurb;
  // swFront.style.background = `#${colors.front.toString(16).padStart(6,'0')}`;
  // swBack.style.background  = `#${colors.back.toString(16).padStart(6,'0')}`;
  // Placeholder: All movies currently show 2001: A Space Odyssey chord graph
  tropeDiv.innerHTML = `<button class="btn" onclick="location.href='/infoPage.html?movie=${encodeURIComponent('2001: A Space Odyssey')}'">
              View Theme Analysis (Placeholder: 2001: A Space Odyssey)
            </button>`;
  
  pillContainer.innerHTML = meta.tropes.map(trope => {
    return `<span class="pill">
            <span class="colorSwatch" id="swatchFront"></span>${trope}
      </span>`;
  }).join('');

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
