import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

// ==========================================================
// RENDERER + CAMERA
// ==========================================================
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("scene") });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor("#000");

// CSS2D Renderer for labels
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.pointerEvents = 'none';
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


// ==========================================================
// EARTH GEOMETRIES
// ==========================================================
const widthSegments = 100, heightSegments = 50;
const planeGeometry = new THREE.PlaneGeometry(2, 1, widthSegments, heightSegments);
const sphereGeometry = new THREE.SphereGeometry(1, widthSegments, heightSegments);

const mapCanvas = document.getElementById('mapCanvas');
const mapContext = mapCanvas.getContext('2d');
mapCanvas.width = 2048;
mapCanvas.height = 1024;

const texture = new THREE.CanvasTexture(mapCanvas);
const material = new THREE.MeshBasicMaterial({ map: texture });

const geometry = planeGeometry.clone();
const earthMesh = new THREE.Mesh(geometry, material);
scene.add(earthMesh);

// ==========================================================
// D3 MAP
// ==========================================================
async function renderD3Map() {
  const world = await d3.json(
    'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson'
  );

  const proj = d3.geoEquirectangular()
    .scale(mapCanvas.width / (2 * Math.PI))
    .translate([mapCanvas.width / 2, mapCanvas.height / 2]);

  const path = d3.geoPath(proj, mapContext);

  mapContext.fillStyle = "#000";
  mapContext.fillRect(0, 0, mapCanvas.width, mapCanvas.height);

  mapContext.strokeStyle = "#ffffff";
  mapContext.fillStyle = "#2c3e50";

  world.features.forEach(f => {
    mapContext.beginPath();
    path(f);
    mapContext.fill();
    mapContext.stroke();
  });

  texture.needsUpdate = true;
}

renderD3Map();

// ==========================================================
// FLIGHT PATHS
// ==========================================================
const flightPathGroup = new THREE.Group();
scene.add(flightPathGroup);

const flowVertexShader = `
  varying vec2 vUv;
  void main(){
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const flowFragmentShader = `
  uniform float time;
  uniform vec3 color;
  uniform float opacity;
  varying vec2 vUv;

  void main(){
    float t = fract((vUv.x*8.0) - time*0.5);
    float soft = smoothstep(0.55,0.65,t) + (1.0 - smoothstep(0.0,0.1,t));
    gl_FragColor = vec4(color*(0.4 + soft*0.6), opacity);
  }
`;

let animationTime = 0;

function latLonToPlane(lat, lon) {
  return { x: lon/180, y: (lat/90)*0.5 };
}

function createArc(a,b,h){
  const mid = { x:(a.x+b.x)/2, y:(a.y+b.y)/2 };
  return new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(a.x,a.y,0),
    new THREE.Vector3(mid.x,mid.y,h),
    new THREE.Vector3(b.x,b.y,0)
  );
}

async function loadPaths(){
  const res = await fetch('./movie-coordinates.json');
  const data = await res.json();

  const { coordinates, connections } = data;
  const paths = connections.filter(c => c.type === "filming-to-depicted");

  paths.forEach((c,i)=>{
    const A = coordinates[c.from];
    const B = coordinates[c.to];
    if(!A || !B) return;

    const p1 = latLonToPlane(A.lat,A.lon);
    const p2 = latLonToPlane(B.lat,B.lon);

    const dist = Math.hypot(p2.x-p1.x, p2.y-p1.y);
    const curve = createArc(p1,p2, dist*0.15);

    const tube = new THREE.TubeGeometry(curve,50,0.0015,8,false);

    const mat = new THREE.ShaderMaterial({
      uniforms:{ time:{value:0}, color:{value:new THREE.Color(0x1e40af)}, opacity:{value:0.7} },
      vertexShader:flowVertexShader,
      fragmentShader:flowFragmentShader,
      transparent:true
    });

    const mesh = new THREE.Mesh(tube,mat);
    // Parse year to integer for filtering
    const yearInt = parseInt(c.year) || 0;
    mesh.userData = { movie:c.movie, year:yearInt, from:c.from, to:c.to };
    flightPathGroup.add(mesh);
  });
}

loadPaths();

// ==========================================================
// TIMELINE DECADE FILTER
// ==========================================================
const minYear = 1950;
const maxYear = 2020;
const yearStep = 10; // Decade steps
let currentDecade = null; // null means "All"

const decades = [];
for (let y = minYear; y <= maxYear; y += yearStep) {
  decades.push(y);
}

function updateFlightPathVisibility() {
  // Update map flight paths
  flightPathGroup.children.forEach(path => {
    if (!currentDecade) {
      // Show all
      path.visible = true;
    } else {
      const year = path.userData.year;
      if (year >= currentDecade && year < currentDecade + yearStep) {
        path.visible = true;
      } else {
        path.visible = false;
      }
    }
  });

  // Update solar flight paths
  solarFlightPathsGroup.children.forEach(path => {
    if (!currentDecade) {
      // Show all
      path.visible = true;
    } else {
      const year = path.userData.year;
      if (year >= currentDecade && year < currentDecade + yearStep) {
        path.visible = true;
      } else {
        path.visible = false;
      }
    }
  });
}

function updateDecadeDisplay(decade) {
  const decadeValue = document.getElementById('decadeValue');
  if (!decade) {
    decadeValue.textContent = 'All';
  } else {
    decadeValue.textContent = `${decade}s`;
  }
}

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
  sun:      new THREE.Vector3(0, 0, 0),    // Center the sun
  mercury:  new THREE.Vector3(2, 1, 0),
  venus:    new THREE.Vector3(3, -1, 0),
  earth:    new THREE.Vector3(-2.5, -1.3, 0),  // Further away from sun
  mars:     new THREE.Vector3(-4, 1, 0),
  jupiter:  new THREE.Vector3(6, 0, -7),
  saturn:   new THREE.Vector3(8, 2, 0),
  uranus:   new THREE.Vector3(-7, 2, -2),
  neptune:  new THREE.Vector3(-9, -2, 1)
};

// ==========================================================
// CREATE SOLAR SYSTEM OBJECTS
// ==========================================================
const planetGroup = new THREE.Group();
scene.add(planetGroup);
planetGroup.visible = false;

const planetColors = {
  sun: 0xffcc33,
  mercury: 0xb1b1b1,
  venus: 0xe6b800,
  earth: 0x4ea5d5,
  mars: 0xc1440e,
  jupiter: 0xd9a066,
  saturn: 0xdcc58a,
  uranus: 0x7fdbff,
  neptune: 0x4169e1
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
  neptune: 0.4     // Bigger Neptune
};

Object.keys(planetColors).forEach((name)=>{
  // Skip creating a separate Earth planet - we'll use earthMesh instead
  if (name === 'earth') return;

  const radius = radii[name];
  const geo = new THREE.SphereGeometry(radius,32,32);
  const mat = new THREE.MeshBasicMaterial({ color: planetColors[name] });
  const p = new THREE.Mesh(geo,mat);

  p.userData = { name };
  p.position.set(0,0,-20); // start far away

  // Create label
  const labelDiv = document.createElement('div');
  labelDiv.className = 'planet-label';
  labelDiv.textContent = name.charAt(0).toUpperCase() + name.slice(1);
  const label = new CSS2DObject(labelDiv);
  label.position.set(0, radius + 0.3, 0); // Position above planet
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
scene.add(moonsGroup);
moonsGroup.visible = false;

// Earth's Moon
const moonGeometry = new THREE.SphereGeometry(0.02, 16, 16);
const moonMaterial = new THREE.MeshBasicMaterial({ color: 0xaaaaaa });
const earthMoon = new THREE.Mesh(moonGeometry, moonMaterial);
earthMoon.userData = { parent: 'earth', name: 'Moon', offset: new THREE.Vector3(0.5, 0.5, 0.15) };

const earthMoonLabel = document.createElement('div');
earthMoonLabel.className = 'planet-label';
earthMoonLabel.textContent = 'Moon';
earthMoonLabel.style.fontSize = '11px';
const earthMoonLabelObj = new CSS2DObject(earthMoonLabel);
earthMoonLabelObj.position.set(0, 0.08, 0);
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
  const jMoonMat = new THREE.MeshBasicMaterial({ color: 0xcccccc });
  const jMoon = new THREE.Mesh(jMoonGeo, jMoonMat);
  jMoon.userData = { parent: 'jupiter', name: name, offset: jupiterMoonOffsets[i] };

  const jMoonLabel = document.createElement('div');
  jMoonLabel.className = 'planet-label';
  jMoonLabel.textContent = name;
  jMoonLabel.style.fontSize = '10px';
  const jMoonLabelObj = new CSS2DObject(jMoonLabel);
  jMoonLabelObj.position.set(0, 0.06, 0);
  jMoon.add(jMoonLabelObj);

  moonsGroup.add(jMoon);
});

let planetZoomInProgress = false;

// ==========================================================
// SOLAR SYSTEM FLIGHT PATHS
// ==========================================================
const solarFlightPathsGroup = new THREE.Group();
scene.add(solarFlightPathsGroup);
solarFlightPathsGroup.visible = false;

// Valid solar system destinations
const solarDestinations = ['Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Io', 'Europa', 'Ganymede', 'Callisto'];

async function loadSolarFlightPaths(){
  try {
    const response = await fetch('./movie-coordinates.json');
    const data = await response.json();
    const { connections } = data;

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

    // Create flight paths between Earth and destinations
    solarConnections.forEach((conn) => {
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

      if (!matchedLocation) return;

      // Get destination position
      let destPos;
      const lowerMatch = matchedLocation.toLowerCase();

      // Check if it's a planet or moon
      if (customPositions[lowerMatch]) {
        destPos = customPositions[lowerMatch];
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

      if (!destPos) return;

      // Create arc from Earth to destination
      const earthPos = customPositions.earth;
      const start = new THREE.Vector3(earthPos.x, earthPos.y, earthPos.z);
      const end = new THREE.Vector3(destPos.x, destPos.y, destPos.z);

      // Calculate control point for arc
      const mid = start.clone().lerp(end, 0.5);
      const dist = start.distanceTo(end);
      mid.y += dist * 0.3; // Arc upward

      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const tubeGeometry = new THREE.TubeGeometry(curve, 50, 0.012, 8, false);

      const lineMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          color: { value: new THREE.Color(0xffa500) }, // Orange for solar paths
          opacity: { value: 0.6 }
        },
        vertexShader: flowVertexShader,
        fragmentShader: flowFragmentShader,
        transparent: true,
        side: THREE.DoubleSide
      });

      const pathMesh = new THREE.Mesh(tubeGeometry, lineMaterial);
      // Parse year to integer for filtering
      const yearInt = parseInt(conn.year) || 0;
      pathMesh.userData = {
        movie: conn.movie,
        year: yearInt,
        from: 'Earth',
        to: matchedLocation
      };

      solarFlightPathsGroup.add(pathMesh);
    });

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
let morphSpeed = 1;

let zoomMin = 1.2;
let zoomMax = 20.0;

let scaleStart = 1.0;
let scaleEnd = 0.4;

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

  animationTime += 0.01;

  // ZOOM OUT
  if(autoZoomingOut){
    camera.position.z += 0.18;
    if(camera.position.z >= zoomMax){
      camera.position.z = zoomMax;
      autoZoomingOut = false;
    }
    updateMorphFromZoom();
  }

  // MORPH EARTH
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

  earthMesh.scale.set(
    THREE.MathUtils.lerp(scaleStart, scaleEnd, eased),
    THREE.MathUtils.lerp(scaleStart, scaleEnd, eased),
    THREE.MathUtils.lerp(scaleStart, scaleEnd, eased)
  );

  // Fade-out flight paths
  const fade = Math.max(0, 1 - morphProgress*5);
  flightPathGroup.children.forEach(line=>{
    line.material.uniforms.time.value = animationTime;
    line.material.uniforms.opacity.value = fade;
  });

  // Update solar flight path animations
  solarFlightPathsGroup.children.forEach(path => {
    if (path.material && path.material.uniforms) {
      path.material.uniforms.time.value = animationTime;
    }
  });

  // SHOW SOLAR SYSTEM
  if(
    !planetGroup.visible &&
    morphProgress > 0.98 &&
    camera.position.z >= zoomMax - 0.1
  ){
    planetGroup.visible = true;
    moonsGroup.visible = true;
    solarFlightPathsGroup.visible = true;
    planetZoomInProgress = true;

    // Show all planet and moon labels
    earthLabel.visible = true;
    planetGroup.children.forEach(planet => {
      planet.children.forEach(child => {
        if (child.isCSS2DObject) child.visible = true;
      });
    });
    moonsGroup.children.forEach(moon => {
      moon.children.forEach(child => {
        if (child.isCSS2DObject) child.visible = true;
      });
    });
  }

  // PLANETS ZOOM TO CUSTOM POSITIONS
  if(planetZoomInProgress && !secondZoomOut){
    // Move Earth mesh to its solar system position
    earthMesh.position.lerp(customPositions.earth, 0.06);

    // Scale Earth to match other planets (0.08 radius)
    const targetEarthScale = 0.08;
    earthMesh.scale.lerp(
      new THREE.Vector3(targetEarthScale, targetEarthScale, targetEarthScale),
      0.06
    );

    // Move other planets
    planetGroup.children.forEach((planet)=>{
      const name = planet.userData.name;
      planet.position.lerp(customPositions[name], 0.06);
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
        moon.position.lerp(targetPos, 0.06);
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
    planetZoomInProgress = false;

    // Hide all labels
    earthLabel.visible = false;
    planetGroup.children.forEach(planet => {
      planet.children.forEach(child => {
        if (child.isCSS2DObject) child.visible = false;
      });
    });
    moonsGroup.children.forEach(moon => {
      moon.children.forEach(child => {
        if (child.isCSS2DObject) child.visible = false;
      });
    });

    // Reset planets and moons to start positions
    planetGroup.children.forEach(p => {
      p.position.set(0, 0, -20);
    });
    moonsGroup.children.forEach(m => {
      m.position.set(0, 0, -20);
    });
  }

  // Return Earth to center as we zoom in
  // The globe will morph back to map automatically via updateMorphFromZoom
  if(!planetGroup.visible && camera.position.z > zoomMin){
    // Calculate how much we should return to center based on zoom
    const returnProgress = 1 - ((camera.position.z - zoomMin) / (zoomMax - zoomMin));

    // Return Earth to center
    earthMesh.position.lerp(new THREE.Vector3(0, 0, 0), returnProgress * 0.15);

    // Return Earth to normal scale (globe size matching scaleEnd at first, then growing)
    // When at max zoom, Earth should be at scaleEnd (0.4)
    // When at min zoom, Earth should be at scaleStart (1.0)
    const currentTargetScale = THREE.MathUtils.lerp(scaleEnd, scaleStart, returnProgress);
    earthMesh.scale.lerp(
      new THREE.Vector3(currentTargetScale, currentTargetScale, currentTargetScale),
      0.15
    );
  }

  // ==========================================================
  // SECOND CLICK → COLLAPSE EVERYTHING TO (0,0,0)
  // ==========================================================
  // ==========================================================
// SECOND CLICK → COLLAPSE EVERYTHING
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
  const n = (camera.position.z - zoomMin)/(zoomMax - zoomMin);
  targetMorphProgress = Math.max(0, Math.min(1, n));
}

// ==========================================================
// TOOLTIP
// ==========================================================
const tooltip = document.getElementById('flightPathTooltip');
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedLine = null;

window.addEventListener('click', evt=>{
  mouse.x = (evt.clientX/window.innerWidth)*2 - 1;
  mouse.y = -(evt.clientY/window.innerHeight)*2 + 1;

  raycaster.setFromCamera(mouse,camera);

  // Check map flight paths
  const mapHits = raycaster.intersectObjects(flightPathGroup.children,false);

  // Check solar flight paths
  const solarHits = raycaster.intersectObjects(solarFlightPathsGroup.children,false);

  // Combine hits and get the closest one
  const allHits = [...mapHits, ...solarHits];

  if(allHits.length>0){
    const obj = allHits[0].object;

    // Reset previous selection
    if(selectedLine && selectedLine !== obj){
      // Determine original color based on which group it belongs to
      if(flightPathGroup.children.includes(selectedLine)){
        selectedLine.material.uniforms.color.value.setHex(0x1e40af); // Map path blue
      } else {
        selectedLine.material.uniforms.color.value.setHex(0xffa500); // Solar path orange
      }
    }

    // Highlight selected path with lighter color
    if(flightPathGroup.children.includes(obj)){
      obj.material.uniforms.color.value.setHex(0x60a5fa); // Lighter blue for map
    } else {
      obj.material.uniforms.color.value.setHex(0xffcc66); // Lighter orange for solar
    }
    selectedLine = obj;

    const d = obj.userData;
    tooltip.innerHTML = `<strong>${d.movie}</strong> (${d.year})<br>From: ${d.from}<br>To: ${d.to}`;
    tooltip.style.left = (evt.clientX + 12) + "px";
    tooltip.style.top = (evt.clientY - 20) + "px";
    tooltip.style.opacity = 1;

  } else {
    if(selectedLine){
      // Reset to original color
      if(flightPathGroup.children.includes(selectedLine)){
        selectedLine.material.uniforms.color.value.setHex(0x1e40af); // Map path blue
      } else {
        selectedLine.material.uniforms.color.value.setHex(0xffa500); // Solar path orange
      }
      selectedLine = null;
    }
    tooltip.style.opacity = 0;
  }
});

// ==========================================================
// SCROLL & TOUCH ZOOM CONTROLS
// ==========================================================
// Mouse wheel zoom control
window.addEventListener('wheel', (event) => {
  event.preventDefault();

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
      const distanceChange = currentDistance - lastTouchDistance;

      // Pinch in (fingers closer) = zoom out (globe)
      // Expand (fingers apart) = zoom in (map)
      const touchZoomSpeed = 0.85;
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

// ==========================================================
// RESIZE
// ==========================================================
window.addEventListener('resize',()=>{
  renderer.setSize(window.innerWidth,window.innerHeight);
  labelRenderer.setSize(window.innerWidth,window.innerHeight);
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
});
