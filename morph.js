// import * as THREE from 'https://unpkg.com/three@0.164.0/build/three.module.js';

// // Renderer
// const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("scene") });
// renderer.setSize(window.innerWidth, window.innerHeight);
// renderer.setClearColor("#000");

// // Scene & camera
// const scene = new THREE.Scene();
// const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
// camera.position.z = 2.5;
// camera.lookAt(0, 0, 0);

// // Sphere geometry
// const widthSegments = 100, heightSegments = 50;
// const sphereGeometry = new THREE.SphereGeometry(1, widthSegments, heightSegments);

// // Plane geometry (same UVs, flattened)
// const planeGeometry = sphereGeometry.clone();
// for (let i = 0; i < planeGeometry.attributes.position.count; i++) {
//   const v = new THREE.Vector3().fromBufferAttribute(planeGeometry.attributes.position, i);
//   const lon = Math.atan2(v.z, v.x);
//   const lat = Math.asin(v.y);
//   const x = lon / Math.PI;      // -1 to 1
//   const y = lat / (Math.PI / 2); // -1 to 1
//   planeGeometry.attributes.position.setXYZ(i, x, y, 0);
// }
// planeGeometry.computeVertexNormals();

// // Use flattened plane initially
// const geometry = planeGeometry.clone();

// // Texture
// const texture = new THREE.TextureLoader().load(
//   './map-image.jpg',
//   () => console.log('✅ Texture loaded'),
//   undefined,
//   err => console.error('❌ Texture load error:', err)
// );

// // Material
// const material = new THREE.MeshBasicMaterial({ map: texture });
// const mesh = new THREE.Mesh(geometry, material);
// scene.add(mesh);

// // Scale the flat map so it fills the view (2:1 aspect)
// mesh.scale.set(1.6, 0.8, 1); // adjust if your map looks stretched
// mesh.position.z = 0; // ensure visible
// mesh.rotation.y = Math.PI;   // face camera correctly

// // Morph data
// const spherePos = sphereGeometry.attributes.position;
// const planePos = planeGeometry.attributes.position;
// let morphProgress = 0;
// let isMorphing = false;

// // Animate
// function animate() {
//   requestAnimationFrame(animate);

//   if (isMorphing && morphProgress < 1) {
//     morphProgress += 0.01;

//     for (let i = 0; i < geometry.attributes.position.count; i++) {
//       const sx = spherePos.getX(i), sy = spherePos.getY(i), sz = spherePos.getZ(i);
//       const px = planePos.getX(i), py = planePos.getY(i), pz = planePos.getZ(i);
//       geometry.attributes.position.setXYZ(
//         i,
//         THREE.MathUtils.lerp(px, sx, morphProgress),
//         THREE.MathUtils.lerp(py, sy, morphProgress),
//         THREE.MathUtils.lerp(pz, sz, morphProgress)
//       );
//     }
//     geometry.attributes.position.needsUpdate = true;

//     // Zoom out slightly as it morphs
//     camera.position.z = THREE.MathUtils.lerp(2.5, 3.2, morphProgress);

//     // Un-scale the plane as it becomes a sphere
//     mesh.scale.set(
//       THREE.MathUtils.lerp(1.6, 1.0, morphProgress),
//       THREE.MathUtils.lerp(0.8, 1.0, morphProgress),
//       1
//     );
//   }

//   renderer.render(scene, camera);
// }
// animate();

// // Button
// document.getElementById("warpBtn").onclick = () => {
//   isMorphing = true;
// };

// // Handle resize
// window.addEventListener('resize', () => {
//   renderer.setSize(window.innerWidth, window.innerHeight);
//   camera.aspect = window.innerWidth / window.innerHeight;
//   camera.updateProjectionMatrix();
// });
import * as THREE from 'https://unpkg.com/three@0.164.0/build/three.module.js';

// --- Renderer setup ---
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("scene") });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor("#000");

// --- Scene & Camera ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 2.8;
camera.lookAt(0, 0, 0);

// --- Geometries ---
const widthSegments = 100, heightSegments = 50;
const planeGeometry = new THREE.PlaneGeometry(2, 1, widthSegments, heightSegments);
const sphereGeometry = new THREE.SphereGeometry(1, widthSegments, heightSegments);

// --- Material ---
const texture = new THREE.TextureLoader().load(
  './map-image.jpg',
  () => console.log('✅ Texture loaded'),
  undefined,
  err => console.error('❌ Texture load error:', err)
);
const material = new THREE.MeshBasicMaterial({ map: texture });
const geometry = planeGeometry.clone(); // start flat
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

// --- Morph Data ---
const spherePos = sphereGeometry.attributes.position;
const planePos = planeGeometry.attributes.position;
let morphProgress = 0;
let isMorphing = false;

// --- Adjustable parameters ---
let morphSpeed = 0.01;  // base morphing rate
let zoomStart = 2.8;    // initial camera distance
let zoomEnd = 90.0;      // final zoom-out distance
let scaleStart = 1.0;   // globe start scale
let scaleEnd = 0.8;     // globe final scale

// --- Easing: ease-in-out cubic ---
function easeInOutCubic(t) {
  return t < 0.5
    ? 4 * t * t * t     // accelerate first half
    : 1 - Math.pow(-2 * t + 2, 3) / 2; // decelerate second half
}

// --- Animation Loop ---
function animate() {
  requestAnimationFrame(animate);

  if (isMorphing && morphProgress < 1) {
    // gradually increase morph progress (easing applied to both)
    morphProgress += morphSpeed;

    // Apply easing for synchronized morph+zoom acceleration
    const eased = easeInOutCubic(morphProgress);

    // --- Vertex morphing (flat → sphere) ---
    for (let i = 0; i < geometry.attributes.position.count; i++) {
      const sx = spherePos.getX(i);
      const sy = spherePos.getY(i);
      const sz = spherePos.getZ(i);
      const px = planePos.getX(i);
      const py = planePos.getY(i);
      const pz = planePos.getZ(i);

      geometry.attributes.position.setXYZ(
        i,
        THREE.MathUtils.lerp(px, sx, eased),
        THREE.MathUtils.lerp(py, sy, eased),
        THREE.MathUtils.lerp(pz, sz, eased)
      );
    }

    geometry.attributes.position.needsUpdate = true;

    // 🎥 Camera zooms out while warping, with same easing curve
    camera.position.z = THREE.MathUtils.lerp(zoomStart, zoomEnd, eased);

    // 🌍 Globe shrinks slightly at the same pace
    const scaleVal = THREE.MathUtils.lerp(scaleStart, scaleEnd, eased);
    mesh.scale.set(scaleVal, scaleVal, scaleVal);
  }

  renderer.render(scene, camera);
}
animate();

// --- Button trigger ---
document.getElementById('warpBtn').onclick = () => {
  isMorphing = true;
};

// --- Resize handler ---
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});
