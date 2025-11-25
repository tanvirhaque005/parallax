/* ============================================================
   PARALLEL TIMELINE — DRAGGING CHANGES WINDOW, SCROLLING PANS
============================================================ */

import rawData from "./settingdataraw.js";

/* ----------------------------
    CONSTANTS
-----------------------------*/
const WINDOW_SIZE_YEARS = 5;
const WINDOW_STEP_YEARS = 5;
const INITIAL_VIEW_YEARS = 30;

/* ----------------------------
    PREP DATA & BOUNDS
-----------------------------*/
let ABS_MIN_YEAR = Infinity;
let ABS_MAX_YEAR = -Infinity;

const data = rawData.map(d => {
  const start = +d.start;
  const end   = +d.end;

  ABS_MIN_YEAR = Math.min(ABS_MIN_YEAR, start, end);
  ABS_MAX_YEAR = Math.max(ABS_MAX_YEAR, start, end);

  return {
    ...d,
    startYear: start,
    endYear: end,
    startDate: new Date(start,0,1),
    endDate:   new Date(end,0,1),
    diff: end - start
  };
});

ABS_MIN_YEAR -= 2;
ABS_MAX_YEAR += 2;

/* RELEASE-YEAR RANGE */
const minRelease = d3.min(data, d => d.endYear);
const maxRelease = d3.max(data, d => d.endYear);
const years = [];
for (let y = minRelease; y <= maxRelease; y += WINDOW_SIZE_YEARS) {
    years.push(y);
}

/* ----------------------------
    RELEASE-WINDOW START
-----------------------------*/
let windowStart =
  Math.floor(minRelease / WINDOW_SIZE_YEARS) * WINDOW_SIZE_YEARS;

/* ----------------------------
    SVG SETUP
-----------------------------*/
const svg = d3.select("#parallel");
const rect = svg.node().getBoundingClientRect();

const margin = { top: 60, right: 40, bottom: 60, left: 60 };
const W = rect.width  - margin.left - margin.right;
const H = rect.height - margin.top  - margin.bottom;

const g = svg.append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const yTop = 40;
const yBot = H - 40;

/* ----------------------------
    X-SCALE — INITIAL VIEW
-----------------------------*/
const x = d3.scaleTime()
  .domain([
    new Date(windowStart,0,1),
    new Date(windowStart + INITIAL_VIEW_YEARS,0,1)
  ])
  .range([0, W]);

/* ----------------------------
    AXES, GRID, LAYERS
-----------------------------*/
const topAxisG = g.append("g")
  .attr("class","axis")
  .attr("transform",`translate(0,${yTop})`);

const botAxisG = g.append("g")
  .attr("class","axis")
  .attr("transform",`translate(0,${yBot})`);

g.append("text")
 .attr("class","axis-title")
 .attr("x",0)
 .attr("y",yTop-20)
 .text("Setting Year");

g.append("text")
 .attr("class","axis-title")
 .attr("x",0)
 .attr("y",yBot+35)
 .text("Release Year");

const gridG = g.append("g").attr("class","grid");

const linkLayer = g.append("g");
let links = linkLayer.selectAll("path.link");
let halos = linkLayer.selectAll("path.halo");

/* ----------------------------
    RENDER HELPERS
-----------------------------*/
function renderAxes() {
  topAxisG.call(
    d3.axisTop(x)
      .ticks(d3.timeYear.every(5))
      .tickSizeOuter(0)
  );
  botAxisG.call(
    d3.axisBottom(x)
      .ticks(d3.timeYear.every(5))
      .tickSizeOuter(0)
  );
}

function renderGrid() {
  const yrs = x.ticks(d3.timeYear.every(1));
  const lines = gridG.selectAll("line").data(yrs, d => d);

  lines.enter()
    .append("line")
    .merge(lines)
    .attr("x1", d => x(d))
    .attr("x2", d => x(d))
    .attr("y1", yTop)
    .attr("y2", yBot);

  lines.exit().remove();
}

function getFilteredData() {
  return data.filter(d =>
    d.endYear >= windowStart &&
    d.endYear <  windowStart + WINDOW_SIZE_YEARS
  );
}

function drawLines(filtered) {
  /** Halos */
  halos = halos.data(filtered, d => d.id);
  halos.exit().remove();

  halos = halos.enter()
    .append("path")
    .attr("class", "halo")
    .merge(halos)
    .attr("d", d => `M${x(d.startDate)},${yTop} L${x(d.endDate)},${yBot}`);

  /** Lines */
  links = links.data(filtered, d => d.id);
  links.exit().remove();

  const enter = links.enter().append("path")
    .attr("class","link")

  links = enter.merge(links)
    .attr("d", d => `M${x(d.startDate)},${yTop} L${x(d.endDate)},${yBot}`);
}

/* ----------------------------
    TOOLTIP
-----------------------------*/
const tip = document.getElementById("tooltip");

function showTip(html, x0, y0) {
  tip.innerHTML = html;
  tip.style.display = "block";
  tip.style.left = x0+"px";
  tip.style.top  = y0+"px";
}
function hideTip() { tip.style.display = "none"; }

linkLayer.on("mousemove", function(event) {
  const d = d3.select(event.target).datum();
  if (!d) return;

  const [mx, my] = d3.pointer(event, document.body);

  showTip(`
    <div class="title">${d.label}</div>
    <div class="sub">Setting: ${d.startYear}</div>
    <div class="sub">Release: ${d.endYear}</div>
    <div class="sub">Δ: ${d.diff}</div>
  `, mx, my);
});
linkLayer.on("mouseout", hideTip);

/* ----------------------------
    EVENTS
-----------------------------*/
const timelineEvents = [
  { year: 2001, label:"Dot-Com Bust" },
  { year: 2008, label:"Financial Crisis" },
  { year: 2015, label:"Streaming Boom" },
  { year: 2020, label:"COVID-19" }
];

timelineEvents.forEach(e => e.date = new Date(e.year,0,1));

const eventsLayer = g.append("g");
let events = eventsLayer.selectAll("g.event");

function drawEvents() {
  events = events.data(timelineEvents, d => d.year);
  events.exit().remove();

  const enter = events.enter()
    .append("g")
    .attr("class","event");

  enter.append("line").attr("class","evline");
  enter.append("text")
    .attr("class","evyear")
    .attr("font-size",11)
    .attr("font-weight",700)
    .attr("fill","#aaa")
    .attr("text-anchor","middle");

  events = enter.merge(events);

  events.attr("transform", d => `translate(${x(d.date)},0)`);

  events.select("line.evline")
    .attr("y1", yTop)
    .attr("y2", yBot)
    .attr("stroke","#6b7280")
    .attr("stroke-opacity",0.25);

  events.select("text.evyear")
    .attr("y", yTop+20)
    .text(d => d.year);
}

/* ----------------------------
    AXIS WINDOW HIGHLIGHT
-----------------------------*/
function highlightWindowOnAxis() {
  const start = windowStart;
  const end = windowStart + WINDOW_SIZE_YEARS - 1;

  botAxisG.selectAll("text")
    .style("fill", d => {
      const y = d.getFullYear();
      return (y >= start && y <= end) ? "#fff" : "rgba(255,255,255,0.35)";
    })
    .style("font-weight", d => {
      const y = d.getFullYear();
      return (y >= start && y <= end) ? 700 : 400;
    })
    .style("opacity", d => {
      const y = d.getFullYear();
      return (y >= start && y <= end) ? 1 : 0.25;
    });

  botAxisG.selectAll("line")
    .style("stroke-width", d => {
      const y = d.getFullYear();
      return (y >= start && y <= end) ? 2 : 1;
    });
}

/* ----------------------------
    WINDOW LABEL
-----------------------------*/
function updateWindowLabel() {
  const wEnd = windowStart + WINDOW_SIZE_YEARS - 1;
  document.getElementById("window-label").textContent =
    `Window: ${windowStart}–${wEnd}`;
}


/* -------------------------------------------------------
   ASYMMETRIC SCROLL SENSITIVITY
   Up = stronger, Down = weaker
-------------------------------------------------------- */
/* -------------------------------------------
   SUPER-SMOOTH MOMENTUM SCROLLING
   Uses easing toward target velocity
------------------------------------------- */

let scrollVelocity = 0;
let targetVelocity = 0;
let isScrolling = false;

svg.on("wheel", (e) => {
  e.preventDefault();

  const BASE_SCROLL = 0.0010;
  const UP_MULTIPLIER = 3;
  const DOWN_MULTIPLIER = 0.5;

  let delta = e.deltaY;

  // UP vs DOWN sensitivity
  delta = delta < 0 ? delta * DOWN_MULTIPLIER : delta * UP_MULTIPLIER;

  // Target velocity changes immediately
  targetVelocity += delta * BASE_SCROLL;

  // Start animation loop if needed
  if (!isScrolling) {
    isScrolling = true;
    requestAnimationFrame(smoothScrollStep);
  }
});

function smoothScrollStep() {

  /* Smoothly approach target velocity
     This is what creates ease-in / ease-out scrolling */
  const APPROACH_RATE = 0.12;   // smoother easing (instead of 0.5)
  const TARGET_DAMP   = 0.965;  // slower fade-out (instead of 0.90)
  
  scrollVelocity += (targetVelocity - scrollVelocity) * APPROACH_RATE;

  // direction-sensitive damping
  if (scrollVelocity > 0) {
      targetVelocity *= 0.9;   
  } else {
      targetVelocity *= 0;
  }
       
  /* Natural damping: slowly reduce target velocity */
  // const TARGET_DAMP = 0.9;
  // targetVelocity *= TARGET_DAMP;

  /* Stop when velocities get tiny */
  if (Math.abs(scrollVelocity) < 0.000001 && Math.abs(targetVelocity) < 0.000001) {
    scrollVelocity = 0;
    targetVelocity = 0;
    isScrolling = false;
    return;
  }

  // --- MOVE DOMAIN BASED ON VELOCITY ---
  const [d0, d1] = x.domain();
  const minYear = d0.getFullYear();
  const maxYear = d1.getFullYear();
  const span = maxYear - minYear;

  let movement = scrollVelocity * span;

  let newMin = minYear + movement;
  let newMax = maxYear + movement;

  // Clamp to bounds
  if (newMin < ABS_MIN_YEAR) {
    newMin = ABS_MIN_YEAR;
    newMax = ABS_MIN_YEAR + span;
    scrollVelocity = 0;
    targetVelocity = 0;
  }
  if (newMax > ABS_MAX_YEAR) {
    newMax = ABS_MAX_YEAR;
    newMin = ABS_MAX_YEAR - span;
    scrollVelocity = 0;
    targetVelocity = 0;
  }

  // Apply domain
  x.domain([new Date(newMin,0,1), new Date(newMax,0,1)]);

  update(); // <— redraw everything

  requestAnimationFrame(smoothScrollStep);
}


/* ----------------------------
    UPDATE PIPELINE
-----------------------------*/
function scrollToYear(year) {
  const span = x.domain()[1].getFullYear() - x.domain()[0].getFullYear();
  const newMin = Math.max(ABS_MIN_YEAR, year);
  const newMax = Math.min(ABS_MAX_YEAR, year + span);
  x.domain([new Date(newMin, 0, 1), new Date(newMax, 0, 1)])
 .interpolate(d3.interpolate)
 .range([0, W]);
}


function update() {
  renderAxes();
  renderGrid();
  drawLines(getFilteredData());
  drawEvents();
  highlightWindowOnAxis();
  updateWindowLabel();
  updateBarForCenteredBook();
}

/* ----------------------------
    INITIAL RENDER
-----------------------------*/
update();



/* -----------------------------------------------------------
   TOP-LEFT BOOK BARS (one per book)
----------------------------------------------------------- */

const bookBarsContainer = document.getElementById("bookBars");

function buildBookBars() {
  bookBarsContainer.innerHTML = "";
  years.forEach((yr, i) => {
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
function animateScrollToYear(targetYear, duration = 600) {
  const [d0, d1] = x.domain();
  const startMin = d0.getFullYear();
  const startMax = d1.getFullYear();
  const span = startMax - startMin;

  const newMin = Math.max(ABS_MIN_YEAR, targetYear);
  const newMax = Math.min(ABS_MAX_YEAR, targetYear + span);

  const interpolatorMin = d3.interpolateNumber(startMin, newMin);
  const interpolatorMax = d3.interpolateNumber(startMax, newMax);

  const startTime = performance.now();

  function tick() {
    const t = Math.min(1, (performance.now() - startTime) / duration);

    // Smooth easing (cosine)
    const eased = 0.5 - 0.5 * Math.cos(Math.PI * t);

    const currentMin = interpolatorMin(eased);
    const currentMax = interpolatorMax(eased);

    x.domain([new Date(currentMin, 0, 1), new Date(currentMax, 0, 1)]);

    update(); // redraw graph

    if (t < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

document.querySelectorAll(".book-bar").forEach(bar => {
  bar.addEventListener("click", (e) => {
    e.stopPropagation();
    e.preventDefault();

    const index = Number(bar.dataset.index);
    const yr = years[index];

    // 1. Update the filtering window
    windowStart = yr;

    // 2. Animate the scroll
    animateScrollToYear(yr);

    // 3. Update the active bar highlight
    updateActiveBookBar(index);
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

  positionLabelOverBar(hoverLabel, bars[closestIndex], years[closestIndex]);

  const activeIndex = bars.findIndex(b => b.classList.contains("active"));
  if (activeIndex !== -1) {
    positionLabelOverBar(activeLabel, bars[activeIndex], years[activeIndex]);
  }
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
  const idx = years.indexOf(windowStart);
  if (idx !== -1) updateActiveBookBar(idx);
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
