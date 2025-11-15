import * as THREE from 'https://unpkg.com/three@0.164.0/build/three.module.js';

// ==========================================================
// RENDERER + CAMERA
// ==========================================================
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("scene") });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor("#000");

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 1.2;
camera.lookAt(0, 0, 0);

let zoomingIn = false;
let zoomInProgress = 0;


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
    mesh.userData = { movie:c.movie, year:c.year, from:c.from, to:c.to };
    flightPathGroup.add(mesh);
  });
}

loadPaths();

// ==========================================================
// CUSTOM PLANET POSITIONS
// ==========================================================
const customPositions = {
  sun:      new THREE.Vector3(-10, 8, 0),
  mercury:  new THREE.Vector3(2, 1, 0),
  venus:    new THREE.Vector3(3, -1, 0),
  earth:    new THREE.Vector3(-2, -1, 0),
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
  sun: 4.25,
  mercury: 0.05,
  venus: 0.1,
  earth: 0.1,
  mars: 0.18,
  jupiter: 1.5,
  saturn: 1.73,
  uranus: 0.11,
  neptune: 0.1
};

Object.keys(planetColors).forEach((name)=>{
  const radius = radii[name];
  const geo = new THREE.SphereGeometry(radius,32,32);
  const mat = new THREE.MeshBasicMaterial({ color: planetColors[name] });
  const p = new THREE.Mesh(geo,mat);

  p.userData = { name };
  p.position.set(0,0,-20); // start far away
  planetGroup.add(p);
});

let planetZoomInProgress = false;

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

document.getElementById("zoomInBtn").addEventListener("click", () => {
    zoomingIn = true;
    zoomInProgress = 0;

    // Reset collapse flag so things restore visibly
    secondZoomOut = false;

    // Immediately hide new shapes so they zoom back out
    newShapesVisible = false;
});


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

  // SHOW SOLAR SYSTEM
  if(
    !planetGroup.visible &&
    morphProgress > 0.98 &&
    camera.position.z >= zoomMax - 0.1
  ){
    planetGroup.visible = true;
    planetZoomInProgress = true;
  }

  // PLANETS ZOOM TO CUSTOM POSITIONS
  if(planetZoomInProgress && !secondZoomOut){
    planetGroup.children.forEach((planet)=>{
      const name = planet.userData.name;
      planet.position.lerp(customPositions[name], 0.06);
    });
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

// ==========================================================
// ZOOM IN ANIMATION (reverse all effects)
// ==========================================================
if (zoomingIn) {

    zoomInProgress += 0.02;
    if (zoomInProgress > 1) zoomInProgress = 1;

    const t = zoomInProgress;

    // CAMERA RETURNS
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, 1.2, 0.1);

    // EARTH RETURNS TO CENTER + FULL SIZE
    earthMesh.position.lerp(new THREE.Vector3(0,0,0), 0.1);
    earthMesh.scale.lerp(new THREE.Vector3(1,1,1), 0.1);

    // EARTH MORPH (sphere → plane)
    targetMorphProgress = 0;

    // HIDE SOLAR SYSTEM
    planetGroup.visible = false;

    planetGroup.children.forEach(p => {
        p.position.lerp(new THREE.Vector3(0,0,-20), 0.1);
        p.scale.lerp(new THREE.Vector3(1,1,1), 0.1);
    });

    // REMOVE NEW SHAPES (zoom them out & shrink them)
    newShapes.forEach(obj => {
        obj.position.lerp(new THREE.Vector3(0,0,-5000), 0.15);
        obj.scale.lerp(new THREE.Vector3(0,0,0), 0.15);
    });

    // CLEAN UP when zoom-in completes
    if (t >= 1) {
        zoomingIn = false;

        // Remove new shapes from scene entirely
        newShapes.forEach(obj => scene.remove(obj));
        newShapes = [];
    }
}



  renderer.render(scene, camera);
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
  const hits = raycaster.intersectObjects(flightPathGroup.children,false);

  if(hits.length>0){
    const obj = hits[0].object;

    if(selectedLine && selectedLine !== obj)
      selectedLine.material.uniforms.color.value.setHex(0x1e40af);

    obj.material.uniforms.color.value.setHex(0x60a5fa);
    selectedLine = obj;

    const d = obj.userData;
    tooltip.innerHTML = `<strong>${d.movie}</strong> (${d.year})<br>Filmed: ${d.from}<br>Depicted: ${d.to}`;
    tooltip.style.left = (evt.clientX + 12) + "px";
    tooltip.style.top = (evt.clientY - 20) + "px";
    tooltip.style.opacity = 1;

  } else {
    if(selectedLine){
      selectedLine.material.uniforms.color.value.setHex(0x1e40af);
      selectedLine = null;
    }
    tooltip.style.opacity = 0;
  }
});

// ==========================================================
// BUTTON HANDLER — first click morphs, second click collapses
// ==========================================================
document.getElementById("zoomOutBtn").addEventListener("click", () => {
  // First click → normal behavior
  if (!planetGroup.visible && !secondZoomOut) {
    triggerFullZoomOut();
    return;
  }

  // Second click → collapse universe
  if (!secondZoomOut) {
    secondZoomOut = true;
  }
});

// ==========================================================
// RESIZE
// ==========================================================
window.addEventListener('resize',()=>{
  renderer.setSize(window.innerWidth,window.innerHeight);
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
});
