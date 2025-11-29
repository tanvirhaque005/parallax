const svg = document.getElementById("chart");
const W = window.innerWidth;
const H = window.innerHeight;

// ======== BASIC LINEAR FLOAT SCALE ========
let domainMin = 0;       // left edge of the visible range
let domainMax = 100;     // right edge
const RANGE = domainMax - domainMin;

// maps float → pixel
function xScale(v) {
  return (v - domainMin) / (domainMax - domainMin) * W;
}

// ======== SVG GROUPS ========
const ticksG = create("g");
const linesG = create("g");

svg.appendChild(ticksG);
svg.appendChild(linesG);

function create(tag) {
  return document.createElementNS("http://www.w3.org/2000/svg", tag);
}

// ======== DRAW TWO SIMPLE LINES ========
function drawLines() {
  linesG.innerHTML = "";

  const line1 = create("line");
  line1.setAttribute("x1", xScale(0));
  line1.setAttribute("y1", 100);
  line1.setAttribute("x2", xScale(50));
  line1.setAttribute("y2", 300);
  line1.setAttribute("stroke", "cyan");
  linesG.appendChild(line1);

  const line2 = create("line");
  line2.setAttribute("x1", xScale(20));
  line2.setAttribute("y1", 400);
  line2.setAttribute("x2", xScale(80));
  line2.setAttribute("y2", 200);
  line2.setAttribute("stroke", "yellow");
  linesG.appendChild(line2);
}

// ======== DRAW CONTINUOUSLY-MOVING TICKS ========
function drawTicks() {
  ticksG.innerHTML = "";

  const spacing = 10;          // tick spacing in domain units
  const labelSpacing = 50;     // label spacing

  // find first tick >= domainMin
  let t = Math.ceil(domainMin / spacing) * spacing;

  while (t <= domainMax) {
    const px = xScale(t);

    // tick line
    const tick = create("line");
    tick.setAttribute("x1", px);
    tick.setAttribute("x2", px);
    tick.setAttribute("y1", 0);
    tick.setAttribute("y2", H);
    ticksG.appendChild(tick);

    // only show label sometimes
    if (t % labelSpacing === 0) {
      const label = create("text");
      label.textContent = t.toFixed(1);
      label.setAttribute("x", px + 4);
      label.setAttribute("y", 20);
      ticksG.appendChild(label);
    }

    t += spacing;
  }
}

// ======== UPDATE EVERYTHING ========
function update() {
  drawTicks();
  drawLines();
}

// ======== SCROLL HANDLER — CONTINUOUS PAN ========
window.addEventListener("wheel", (e) => {
  e.preventDefault();

  const delta = e.deltaY * 0.02;
  domainMin += delta;
  domainMax += delta;

  update();
}, { passive: false });

update();
