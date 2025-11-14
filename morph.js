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
camera.position.z = 1.2; // Start closer for larger map view
camera.lookAt(0, 0, 0);

// --- Geometries ---
const widthSegments = 100, heightSegments = 50;
// Match plane aspect ratio to canvas (2048x1024 = 2:1)
const imageAspect = 2.0; // 2:1 for equirectangular projection
const planeGeometry = new THREE.PlaneGeometry(imageAspect, 1, widthSegments, heightSegments);
const sphereGeometry = new THREE.SphereGeometry(1, widthSegments, heightSegments);

// --- D3 Map Rendering ---
const mapCanvas = document.getElementById('mapCanvas');
const mapContext = mapCanvas.getContext('2d');

// Set canvas size for high quality
const canvasWidth = 2048;
const canvasHeight = 1024;
mapCanvas.width = canvasWidth;
mapCanvas.height = canvasHeight;

// Create texture from canvas
const texture = new THREE.CanvasTexture(mapCanvas);
texture.needsUpdate = true;

const material = new THREE.MeshBasicMaterial({ map: texture });
const geometry = planeGeometry.clone(); // start flat
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

// Function to render D3 map to canvas
async function renderD3Map() {
  try {
    console.log('🌍 Loading world map data...');
    const worldData = await d3.json('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson');

    // Create D3 projection
    const projection = d3.geoEquirectangular()
      .scale(canvasWidth / (2 * Math.PI))
      .translate([canvasWidth / 2, canvasHeight / 2]);

    const path = d3.geoPath(projection, mapContext);

    // Clear canvas
    mapContext.fillStyle = '#000000';
    mapContext.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw countries
    mapContext.strokeStyle = '#ffffff';
    mapContext.lineWidth = 1;
    mapContext.fillStyle = '#2c3e50'; // Dark blue-gray for land

    worldData.features.forEach(feature => {
      mapContext.beginPath();
      path(feature);
      mapContext.fill();
      mapContext.stroke();
    });

    // Update texture
    texture.needsUpdate = true;
    console.log('✅ World map rendered');

  } catch (error) {
    console.error('❌ Error loading world map:', error);
  }
}

// Render the D3 map
renderD3Map();

// --- Flight Paths ---
const flightPathGroup = new THREE.Group();
scene.add(flightPathGroup);

// Shader for animated gradient flow effect
const flowVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const flowFragmentShader = `
  uniform float time;
  uniform vec3 color;
  uniform float opacity;
  varying vec2 vUv;

  void main() {
    // Create moving dashes pattern
    float dashPattern = fract((vUv.x * 8.0) - time * 0.5);

    // Create dash effect: on for first 60%, off for last 40%
    float dash = step(dashPattern, 0.6);

    // Add soft edges to dashes for smoother appearance
    float softDash = smoothstep(0.55, 0.65, dashPattern) + (1.0 - smoothstep(0.0, 0.1, dashPattern));
    softDash = clamp(softDash, 0.0, 1.0);

    // Combine: always show base line, brighten where dashes are
    float brightness = 0.4 + softDash * 0.6;

    gl_FragColor = vec4(color * brightness, opacity);
  }
  `;

  let animationTime = 0;
  
// Convert lat/lon to x,y position on flat map
function latLonToPlanePosition(lat, lon) {
  // Map projection: equirectangular (plate carrée)
  // Plane is 2:1 aspect ratio (standard equirectangular)
  const imageAspect = 2.0;

  // Longitude -180° to 180° → x: -1 to 1
  const x = lon / 180;

  // Latitude -90° to 90° → y: -0.5 to 0.5
  const y = (lat / 90) * 0.5;

  return { x, y };
}

// Create arc curve between two points
function createArcCurve(startPos, endPos, arcHeight = 0.1) {
  const midX = (startPos.x + endPos.x) / 2;
  const midY = (startPos.y + endPos.y) / 2;

  // Control point for the arc (raised above the midpoint)
  const controlPoint = new THREE.Vector3(midX, midY, arcHeight);

  const curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(startPos.x, startPos.y, 0),
    controlPoint,
    new THREE.Vector3(endPos.x, endPos.y, 0)
  );

  return curve;
}

// Load flight path data and create visualizations
async function loadFlightPaths() {
  try {
    const response = await fetch('./movie-coordinates.json');
    const data = await response.json();

    const { coordinates, connections } = data;

    // Filter for filming-to-depicted connections only
    const filmingConnections = connections.filter(conn =>
      conn.type === 'filming-to-depicted'
    );

    console.log(`✅ Loaded ${filmingConnections.length} flight paths`);

    // Create flight path lines
    filmingConnections.forEach(conn => {
      const fromCoord = coordinates[conn.from];
      const toCoord = coordinates[conn.to];

      if (!fromCoord || !toCoord) return;

      const startPos = latLonToPlanePosition(fromCoord.lat, fromCoord.lon);
      const endPos = latLonToPlanePosition(toCoord.lat, toCoord.lon);

      // Calculate arc height based on distance
      const distance = Math.sqrt(
        Math.pow(endPos.x - startPos.x, 2) +
        Math.pow(endPos.y - startPos.y, 2)
      );
      const arcHeight = distance * 0.15; // Arc height proportional to distance

      const curve = createArcCurve(startPos, endPos, arcHeight);
      const points = curve.getPoints(50);

      // Create tube geometry for better shader support
      const tubeGeometry = new THREE.TubeGeometry(curve, 50, 0.0015, 8, false);

      // Create shader material with flow animation
      const lineMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          color: { value: new THREE.Color(0x1e40af) },
          opacity: { value: 0.7 }
        },
        vertexShader: flowVertexShader,
        fragmentShader: flowFragmentShader,
        transparent: true,
        side: THREE.DoubleSide
      });

      const line = new THREE.Mesh(tubeGeometry, lineMaterial);

      // Store connection data for click interaction
      line.userData = {
        movie: conn.movie,
        year: conn.year,
        from: conn.from,
        to: conn.to
      };

      flightPathGroup.add(line);
    });

  } catch (error) {
    console.error('❌ Error loading flight paths:', error);
  }
}

// Load flight paths when script runs
loadFlightPaths();

// --- Morph Data ---
const spherePos = sphereGeometry.attributes.position;
const planePos = planeGeometry.attributes.position;
let morphProgress = 0;
let targetMorphProgress = 0;

// --- Adjustable parameters ---
let morphSpeed = 0.05;  // how fast the morph catches up to target
let zoomMin = 1.2;      // closest zoom (map view - fills screen)
let zoomMax = 15.0;     // farthest zoom (globe view)
let scaleStart = 1.0;   // map scale
let scaleEnd = 0.8;     // globe scale

// --- Easing: ease-in-out cubic ---
function easeInOutCubic(t) {
  return t < 0.5
    ? 4 * t * t * t     // accelerate first half
    : 1 - Math.pow(-2 * t + 2, 3) / 2; // decelerate second half
}

// --- Animation Loop ---
function animate() {
  requestAnimationFrame(animate);

  // Update animation time for flow effect
  animationTime += 0.01;

  // Smoothly interpolate morphProgress toward target
  morphProgress += (targetMorphProgress - morphProgress) * morphSpeed;

  // Apply easing for smooth visual transition
  const eased = easeInOutCubic(Math.max(0, Math.min(1, morphProgress)));

  // --- Vertex morphing (flat ↔ sphere) ---
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

  // 🌍 Globe shrinks slightly as it morphs
  const scaleVal = THREE.MathUtils.lerp(scaleStart, scaleEnd, eased);
  mesh.scale.set(scaleVal, scaleVal, scaleVal);

  // 🛫 Update flight paths animation and fade out as warping begins
  const flightPathOpacity = THREE.MathUtils.clamp(1 - (morphProgress * 5), 0, 1);
  flightPathGroup.children.forEach(line => {
    if (line.material && line.material.uniforms) {
      // Update time uniform for flow animation
      line.material.uniforms.time.value = animationTime;

      // Check if this line is selected (highlighted)
      const isSelected = selectedLine === line;
      line.material.uniforms.opacity.value = flightPathOpacity * (isSelected ? 0.95 : 0.7);
    }
  });

  // Hide tooltip if zooming out (morphProgress > 0)
  if (morphProgress > 0.01) {
    hideTooltip();
    // Reset selected line
    if (selectedLine) {
      selectedLine.material.uniforms.color.value.setHex(0x1e40af);
      selectedLine.material.uniforms.opacity.value = 0.7;
      selectedLine = null;
    }
  }

  renderer.render(scene, camera);
}
animate();

// --- Zoom-based morphing ---
// Map camera zoom to morph progress: closer = map (0), farther = globe (1)
function updateMorphFromZoom() {
  const zoomDistance = camera.position.z;
  // Clamp between min and max, then normalize to 0-1
  const normalizedZoom = (zoomDistance - zoomMin) / (zoomMax - zoomMin);
  targetMorphProgress = Math.max(0, Math.min(1, normalizedZoom));
}

// Mouse wheel zoom control
window.addEventListener('wheel', (event) => {
  event.preventDefault();

  // Adjust zoom based on wheel delta
  const zoomSpeed = 0.1;
  camera.position.z += event.deltaY * zoomSpeed * 0.01;

  // Clamp camera position
  camera.position.z = Math.max(zoomMin, Math.min(zoomMax, camera.position.z));

  // Update morph target based on new zoom
  updateMorphFromZoom();
}, { passive: false });

// Touch pinch/expand gesture support
let lastTouchDistance = null;

function getTouchDistance(touch1, touch2) {
  const dx = touch2.clientX - touch1.clientX;
  const dy = touch2.clientY - touch1.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

window.addEventListener('touchstart', (event) => {
  if (event.touches.length === 2) {
    lastTouchDistance = getTouchDistance(event.touches[0], event.touches[1]);
  }
}, { passive: true });

window.addEventListener('touchmove', (event) => {
  if (event.touches.length === 2) {
    event.preventDefault();

    const currentDistance = getTouchDistance(event.touches[0], event.touches[1]);

    if (lastTouchDistance !== null) {
      // Calculate distance change
      const distanceChange = currentDistance - lastTouchDistance;

      // Pinch in (fingers closer) = zoom out (globe)
      // Expand (fingers apart) = zoom in (map)
      const touchZoomSpeed = 0.85; // Higher sensitivity for faster zoom response
      camera.position.z -= distanceChange * touchZoomSpeed;

      // Clamp camera position
      camera.position.z = Math.max(zoomMin, Math.min(zoomMax, camera.position.z));

      // Update morph target based on new zoom
      updateMorphFromZoom();
    }

    lastTouchDistance = currentDistance;
  }
}, { passive: false });

window.addEventListener('touchend', (event) => {
  if (event.touches.length < 2) {
    lastTouchDistance = null;
  }
}, { passive: true });

// --- Tooltip functions ---
function showTooltip(x, y, data) {
  const tooltip = document.getElementById('flightPathTooltip');
  tooltip.innerHTML = `
    <strong>${data.movie}</strong> ${data.year ? `(${data.year})` : ''}<br/>
    <span style="color: #f87171;">Filmed:</span> ${data.from}<br/>
    <span style="color: #60a5fa;">Depicted:</span> ${data.to}
  `;
  tooltip.style.left = (x + 15) + 'px';
  tooltip.style.top = (y - 28) + 'px';
  tooltip.style.opacity = '1';
  tooltip.style.pointerEvents = 'none';
}

function hideTooltip() {
  const tooltip = document.getElementById('flightPathTooltip');
  tooltip.style.opacity = '0';
}

// --- Raycaster for click interaction ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedLine = null;

// Click handler for flight paths
window.addEventListener('click', (event) => {
  // Calculate mouse position in normalized device coordinates (-1 to +1)
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Update raycaster
  raycaster.setFromCamera(mouse, camera);

  // Check for intersections with flight paths
  const intersects = raycaster.intersectObjects(flightPathGroup.children, false);

  if (intersects.length > 0) {
    const clickedLine = intersects[0].object;
    const data = clickedLine.userData;

    // Reset previous selection
    if (selectedLine && selectedLine !== clickedLine) {
      selectedLine.material.uniforms.color.value.setHex(0x1e40af); // Reset to darker blue
      selectedLine.material.uniforms.opacity.value = 0.7;
    }

    // Highlight current selection with lighter blue
    clickedLine.material.uniforms.color.value.setHex(0x60a5fa); // Lighter blue
    clickedLine.material.uniforms.opacity.value = 0.9;
    selectedLine = clickedLine;

    // Show tooltip
    showTooltip(event.clientX, event.clientY, data);
  } else {
    // Reset all lines if clicking elsewhere
    if (selectedLine) {
      selectedLine.material.uniforms.color.value.setHex(0x1e40af);
      selectedLine.material.uniforms.opacity.value = 0.7;
      selectedLine = null;
    }

    // Hide tooltip if clicking elsewhere
    hideTooltip();
  }
});

// --- Resize handler ---
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});
