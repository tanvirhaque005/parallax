/* ================================================================
   PARALLEL TIMELINE (CONTINUOUS SCROLL VERSION)
   PART 1 — SVG SETUP, CORE SCALE, SCROLLING, UPDATE LOOP
================================================================ */

import rawData from "./settingdataraw.js";

/* ------------------------------------------------
   GLOBAL CONSTANTS
------------------------------------------------- */
const VIEW_SPAN = 30;       // years displayed at once
const WINDOW_SIZE = 5;      // 5-year windows
const CENTER_OFFSET = VIEW_SPAN / 2;   // 15
const leftCardContent = {
  1952: {
    title: "1952",
    tag: "CONSERVATIVE FUTURES",
    desc: "Early filmmakers imagined futures only a few years ahead—reflecting caution, reconstruction, and postwar unease.",
    images: ["img/1950_a.png", "img/1950_b.png"]
  },

  1957: {
    title: "1975–1980s",
    tag: "TECHNO-OPTIMISM",
    desc: "The late Cold War era introduced stronger confidence in computing and megastructures.",
    images: ["img/1975_a.png", "img/1975_b.png"]
  },

  // add more windows…
};
/* ------------------------------------------------
   SVG + GROUP SETUP
------------------------------------------------- */
const svg = document.getElementById("parallel");
const W = window.innerWidth;
const H = window.innerHeight;

function S(tag) {
  return document.createElementNS("http://www.w3.org/2000/svg", tag);
}

const root = S("g");
root.setAttribute("transform", "translate(60,60)");
svg.appendChild(root);

const gridG   = S("g");
const linesBG = S("g"); // halos
const linesFG = S("g"); // main lines
const ticksTopG = S("g");
const ticksBotG = S("g");
const eventsG = S("g");

root.appendChild(gridG);
root.appendChild(linesBG);
root.appendChild(linesFG);
root.appendChild(eventsG);
root.appendChild(ticksTopG);
root.appendChild(ticksBotG);

const yTop = 100;
const yBot = H - 160;

function clear(node) { node.innerHTML = ""; }

/* ------------------------------------------------
   DATA PREP
------------------------------------------------- */
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
    endYear:   end,
    diff: end - start
  };
});

const minRelease = Math.min(...data.map(d => d.endYear));
const maxRelease = Math.max(...data.map(d => d.endYear));

/* ------------------------------------------------
   CONTINUOUS FLOATING DOMAIN
------------------------------------------------- */
let domainMin = minRelease - 5;
let domainMax = domainMin + VIEW_SPAN;

function xScale(yearF) {
  return (yearF - domainMin) / (domainMax - domainMin) * (W - 120);
}

/* ------------------------------------------------
   CONTINUOUS SCROLLING — FREE, DOES NOT CHANGE WINDOW
------------------------------------------------- */

window.addEventListener("wheel", (e) => {
  if (document.querySelector(".intro-page.active")) return;

  e.preventDefault();

  const delta = e.deltaY * 0.02;  
  domainMin += delta;
  domainMax += delta;

  // optional clamp with slack
  const slack = 50;
  const span = domainMax - domainMin;

  if (domainMin < ABS_MIN_YEAR - slack) {
    domainMin = ABS_MIN_YEAR - slack;
    domainMax = domainMin + span;
  }
  if (domainMax > ABS_MAX_YEAR + slack) {
    domainMax = ABS_MAX_YEAR + slack;
    domainMin = domainMax - span;
  }

  update();
}, { passive: false });

/* ------------------------------------------------
   UPDATE LOOP (filled in by later chunks)
------------------------------------------------- */
function update() {
  drawGrid();
  drawTicks();
  drawLines();
  drawEvents();
  updateActiveBookBar();
  updateLeftCard();
  updateWindowLabel();
}

/* ================================================================
   PART 2 — LINES, HALOS, AND FIVE-YEAR HIGHLIGHT LOGIC
================================================================ */

/* ------------------------------------------------
   ACTIVE 5-YEAR WINDOW (unchanged until user selects)
------------------------------------------------- */

function roundToWindow(y) {
  return Math.floor(y / WINDOW_SIZE) * WINDOW_SIZE;
}

let currentWindowStart = roundToWindow(minRelease);

/* ------------------------------------------------
   WHICH MOVIES FALL IN THE ACTIVE WINDOW?
------------------------------------------------- */

function isInWindow(d) {
  return (
    d.endYear >= currentWindowStart &&
    d.endYear < currentWindowStart + WINDOW_SIZE
  );
}

/* ------------------------------------------------
   SLOPE COLOR (unchanged)
------------------------------------------------- */
function slopeColor(d) {
  const x1 = xScale(d.startYear);
  const x2 = xScale(d.endYear);

  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(yBot - yTop);

  let flatness = dx / (dy + 0.0001);
  flatness = Math.pow(flatness, 0.65);

  const t = Math.min(1, flatness / 4.0);

  const r = Math.round(255 * (1 - t) + 0x46 * t);
  const g = Math.round(255 * (1 - t) + 0xAA * t);
  const b = Math.round(255 * (1 - t) + 0xCB * t);

  return `rgb(${r},${g},${b})`;
}

/* ------------------------------------------------
   DRAW LINES — FULLY CONTINUOUS + WINDOW HIGHLIGHT
------------------------------------------------- */
function drawLines() {
  clear(linesBG);
  clear(linesFG);

  data.forEach(d => {
    const highlighted = isInWindow(d);

    /* --- halo (always drawn) --- */
    const halo = S("line");
    halo.setAttribute("x1", xScale(d.startYear));
    halo.setAttribute("y1", yTop);
    halo.setAttribute("x2", xScale(d.endYear));
    halo.setAttribute("y2", yBot);
    halo.setAttribute("stroke", slopeColor(d));
    halo.setAttribute("stroke-width", 8);
    halo.setAttribute("stroke-opacity", highlighted ? 0.18 : 0.03);
    linesBG.appendChild(halo);

    /* --- main line (only visible if highlighted) --- */
    const line = S("line");
    line.setAttribute("x1", xScale(d.startYear));
    line.setAttribute("y1", yTop);
    line.setAttribute("x2", xScale(d.endYear));
    line.setAttribute("y2", yBot);
    line.setAttribute("stroke", slopeColor(d));
    line.setAttribute("stroke-width", 2.2);
    line.setAttribute("stroke-opacity", highlighted ? 1.0 : 0.0);
    line.setAttribute("pointer-events", highlighted ? "stroke" : "none");
    linesFG.appendChild(line);
  });
}

/* ------------------------------------------------
   WINDOW LABEL UPDATE (bottom right)
------------------------------------------------- */
function updateWindowLabel() {
  const el = document.getElementById("window-label");
  const start = currentWindowStart;
  const end = currentWindowStart + WINDOW_SIZE - 1;
  el.textContent = `Window: ${start}–${end}`;
  el.style.display = "block";
}

/* ------------------------------------------------
   LEFT CARD UPDATE (uses your existing mapping)
------------------------------------------------- */

function updateLeftCard() {
  const card = document.querySelector(".left-card");
  if (!card) return;

  const content = leftCardContent[currentWindowStart];
  if (!content) return;

  card.querySelector("h2").textContent = content.title;
  card.querySelector(".tag").textContent = content.tag;
  card.querySelector(".desc").textContent = content.desc;

  const imgs = card.querySelector(".img-boxes").children;
  if (content.images && content.images.length >= 2) {
    imgs[0].style.backgroundImage = `url(${content.images[0]})`;
    imgs[1].style.backgroundImage = `url(${content.images[1]})`;
  } else {
    imgs[0].style.backgroundImage = "";
    imgs[1].style.backgroundImage = "";
  }
}


/* ================================================================
   PART 3 — TICKS, GRIDLINES, AND TIMELINE EVENTS
================================================================ */

/* ------------------------------------------------
   CONTINUOUS TICKS (TOP + BOTTOM)
   Every tick is placed by floating-year scale.
   No snapping, no replacing — pure drift.
------------------------------------------------- */
function drawTicks() {
  clear(ticksTopG);
  clear(ticksBotG);

  const spacing = 5;  // 5-year ticks
  const minY = domainMin;
  const maxY = domainMax;

  // first tick ≥ minY
  let t = Math.ceil(minY / spacing) * spacing;

  while (t <= maxY) {
    const px = xScale(t);

    /* --- Top Axis Tick --- */
    {
      const tick = S("line");
      tick.setAttribute("x1", px);
      tick.setAttribute("x2", px);
      tick.setAttribute("y1", yTop);
      tick.setAttribute("y2", yTop - 6);
      tick.setAttribute("stroke", "rgba(255,255,255,0.45)");
      ticksTopG.appendChild(tick);

      const label = S("text");
      label.textContent = t;
      label.setAttribute("x", px + 4);
      label.setAttribute("y", yTop - 12);
      label.setAttribute("fill", "white");
      label.setAttribute("font-size", 12);
      label.setAttribute("font-family", "Courier New");
      ticksTopG.appendChild(label);
    }

    /* --- Bottom Axis Tick --- */
    {
      const tick = S("line");
      tick.setAttribute("x1", px);
      tick.setAttribute("x2", px);
      tick.setAttribute("y1", yBot);
      tick.setAttribute("y2", yBot + 6);
      tick.setAttribute("stroke", "rgba(255,255,255,0.45)");
      ticksBotG.appendChild(tick);

      const label = S("text");
      label.textContent = t;
      label.setAttribute("x", px + 4);
      label.setAttribute("y", yBot + 20);
      label.setAttribute("fill", "white");
      label.setAttribute("font-size", 12);
      label.setAttribute("font-family", "Courier New");
      ticksBotG.appendChild(label);
    }

    t += spacing;
  }
}

/* ------------------------------------------------
   CONTINUOUS GRIDLINES (1-year spacing)
   These drift smoothly with scrolling, same as demo.
------------------------------------------------- */
function drawGrid() {
  clear(gridG);

  const spacing = 1;   // per-year grid
  let t = Math.ceil(domainMin / spacing) * spacing;

  while (t <= domainMax) {
    const px = xScale(t);

    const line = S("line");
    line.setAttribute("x1", px);
    line.setAttribute("x2", px);
    line.setAttribute("y1", yTop);
    line.setAttribute("y2", yBot);
    line.setAttribute("stroke", "rgba(255,255,255,0.12)");
    gridG.appendChild(line);

    t += spacing;
  }
}

/* ------------------------------------------------
   TIMELINE EVENTS (SCROLL-CONTINUOUS)
------------------------------------------------- */

const timelineEvents = [
  // Example:
  // { year: 2001, label: "Dot-Com Bust" }
  // Add your events here.
];

function drawEvents() {
  clear(eventsG);

  timelineEvents.forEach(ev => {
    const px = xScale(ev.year);

    // event vertical line
    const v = S("line");
    v.setAttribute("x1", px);
    v.setAttribute("x2", px);
    v.setAttribute("y1", yTop);
    v.setAttribute("y2", yBot);
    v.setAttribute("stroke", "#6b7280");
    v.setAttribute("stroke-opacity", 0.28);
    eventsG.appendChild(v);

    // label
    const label = S("text");
    label.textContent = ev.label || ev.year;
    label.setAttribute("x", px + 4);
    label.setAttribute("y", yTop + 20);
    label.setAttribute("fill", "#aaa");
    label.setAttribute("font-size", 11);
    label.setAttribute("font-weight", 700);
    eventsG.appendChild(label);
  });
}


/* ================================================================
   PART 4 — WAVE SELECTOR, BAR CLICK-JUMP,
            ARROW CURSOR NAVIGATION, WINDOW CENTERING
================================================================ */

/* ------------------------------------------------
   BUILD 5-YEAR WINDOW LIST
   (Matches your prior “years[]” list)
-------------------------------------------------- */

const years = [];
for (let y = minRelease; y <= maxRelease; y += WINDOW_SIZE) {
  years.push(y);
}

/* ------------------------------------------------
   BUILD BARS IN DOM
-------------------------------------------------- */

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

/* ------------------------------------------------
   ACTIVE BAR HIGHLIGHT
-------------------------------------------------- */

function updateActiveBookBar() {
  const idx = years.indexOf(currentWindowStart);
  const bars = document.querySelectorAll(".book-bar");
  bars.forEach((b, i) => {
    b.classList.toggle("active", i === idx);
  });
}

/* ------------------------------------------------
   LABELS ABOVE BARS
-------------------------------------------------- */

const hoverLabel = document.getElementById("hoverBarDate");
const activeLabel = document.getElementById("activeBarDate");

function positionLabelOverBar(labelEl, barEl, yearText) {
  if (!barEl) { labelEl.style.opacity = 0; return; }

  const rect = barEl.getBoundingClientRect();

  labelEl.textContent = yearText;
  labelEl.style.left = rect.left + rect.width / 2 + "px";
  labelEl.style.top  = rect.top - 12 + "px";
  labelEl.style.opacity = 0.9;
}

/* ------------------------------------------------
   CLICK SUPPRESSION FOR WAVE (just like before)
-------------------------------------------------- */
let suppressWaveUntil = 0;
window.addEventListener("mousedown", () => {
  suppressWaveUntil = performance.now() + 120;
});

/* ------------------------------------------------
   WAVE ANIMATION (full cosine wave)
-------------------------------------------------- */

const BASE_HEIGHT  = 12;
const PEAK_HEIGHT  = 70;

function applyWaveEffect(centerIndex) {
  const bars = document.querySelectorAll(".book-bar");
  const total = bars.length;

  for (let i = 0; i < total; i++) {
    const dist = Math.abs(i - centerIndex);
    const t = dist / (total - 1);

    const wave = Math.cos(1.5 * t * Math.PI) * 0.35 / (1 + t**2) + 0.2;
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

/* ------------------------------------------------
   BAR HOVER LOGIC
-------------------------------------------------- */

let hoveredIndex = null;
let hoveringBars = false;

bookBarsContainer.addEventListener("mousemove", (e) => {
  if (performance.now() < suppressWaveUntil) return;

  const bars = Array.from(document.querySelectorAll(".book-bar"));
  const rect = bookBarsContainer.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;

  // find nearest bar
  let best = 0;
  let bestDist = Infinity;
  bars.forEach((bar, i) => {
    const b = bar.getBoundingClientRect();
    const center = b.left - rect.left + b.width / 2;
    const d = Math.abs(mouseX - center);
    if (d < bestDist) { bestDist = d; best = i; }
  });

  hoveredIndex = best;
  applyWaveEffect(best);

  // highlight hovered bar
  bars.forEach((bar, i) =>
    bar.classList.toggle("hovered", i === best)
  );

  // update hover label
  positionLabelOverBar(
    hoverLabel,
    bars[best],
    years[best]
  );

  // update active label
  const activeIdx = years.indexOf(currentWindowStart);
  if (activeIdx !== -1) {
    positionLabelOverBar(
      activeLabel,
      bars[activeIdx],
      years[activeIdx]
    );
  }
});

bookBarsContainer.addEventListener("mouseenter", () => {
  hoveringBars = true;
});
bookBarsContainer.addEventListener("mouseleave", () => {
  hoveringBars = false;
  hoveredIndex = null;
  resetWave();
  hoverLabel.style.opacity = 0;
  activeLabel.style.opacity = 0;
});

/* ------------------------------------------------
   CENTERING ANIMATION (jump to window)
   USING OPTION B (center 5-year window)
-------------------------------------------------- */

function animateToWindow(windowStart) {
  // --- 1. Compute desired domain target ----
  const targetCenter = windowStart + WINDOW_SIZE / 2;
  const targetMin = targetCenter - VIEW_SPAN / 2;
  const targetMax = targetCenter + VIEW_SPAN / 2;

  // --- 2. Save old domain BEFORE changing ---
  const oldMin = domainMin;
  const oldMax = domainMax;

  // --- 3. Compute how far the CENTER should move in old coords ---
  const screenCenter = window.innerWidth / 2;

  // position of new center *using old domain*
  const oldCenterPx = xScale(windowStart + WINDOW_SIZE / 2);

  const cameraStartX = 0;
  const cameraEndX   = screenCenter - oldCenterPx;

  // --- 4. Set up wrapper for visual slide ---
  const wrapper = document.getElementById("viewportSlideWrapper");
  wrapper.style.transition = "none";
  wrapper.style.transform = `translateX(${cameraStartX}px)`;

  // --- 5. Animate for 400ms ---
  const DURATION = 400;
  const startTime = performance.now();

  function tick() {
    const t = (performance.now() - startTime) / DURATION;
    const e = t < 1 ? (0.5 - 0.5*Math.cos(Math.PI*t)) : 1;   // smooth easing

    // --- interpolate domain ---
    domainMin = oldMin + (targetMin - oldMin) * e;
    domainMax = oldMax + (targetMax - oldMax) * e;

    // --- interpolate camera slide ---
    const slideX = cameraStartX + (cameraEndX - cameraStartX) * e;
    wrapper.style.transform = `translateX(${slideX}px)`;

    // redraw frame
    update();

    if (t < 1) requestAnimationFrame(tick);
    else {
      // cleanup: reset wrapper to 0 since domain now matches new center
      wrapper.style.transition = "none";
      wrapper.style.transform = "translateX(0px)";
    }
  }

  requestAnimationFrame(tick);
}



/* ------------------------------------------------
   BAR CLICK — SELECT WINDOW
-------------------------------------------------- */

bookBarsContainer.addEventListener("click", (e) => {
  const bars = Array.from(document.querySelectorAll(".book-bar"));
  const containerRect = bookBarsContainer.getBoundingClientRect();
  const mouseX = e.clientX - containerRect.left;

  // nearest bar
  let best = 0;
  let bestDist = Infinity;
  bars.forEach((bar, i) => {
    const b = bar.getBoundingClientRect();
    const center = b.left - containerRect.left + b.width/2;
    const d = Math.abs(mouseX - center);
    if (d < bestDist) { bestDist = d; best = i; }
  });

  const yr = years[best];
  currentWindowStart = yr;
  updateActiveBookBar();
  animateToWindow(yr);
});

/* ------------------------------------------------
   ARROW CURSOR LOGIC (L/R edges of screen)
-------------------------------------------------- */

const cursorCircle = document.getElementById("cursorCircle");

window.addEventListener("mousemove", (e) => {

  if (hoveringBars) {
    cursorCircle.classList.remove("arrow-left","arrow-right");
    return;
  }

  const x = e.clientX;
  const w = window.innerWidth;
  const zone = 800;

  const atFirst = currentWindowStart <= years[0];
  const atLast  = currentWindowStart >= years[years.length - 1];

  if (x < zone && !atFirst) {
    cursorCircle.classList.add("arrow-left");
    cursorCircle.classList.remove("arrow-right");
  }
  else if (x > w - zone && !atLast) {
    cursorCircle.classList.add("arrow-right");
    cursorCircle.classList.remove("arrow-left");
  }
  else {
    cursorCircle.classList.remove("arrow-left", "arrow-right");
  }
});

/* ------------------------------------------------
   ARROW CLICK — PREV/NEXT 5-YEAR WINDOW
-------------------------------------------------- */

window.addEventListener("mousedown", (e) => {
  if (hoveringBars) return;

  if (cursorCircle.classList.contains("arrow-right")) {
    const idx = years.indexOf(currentWindowStart);
    if (idx < years.length - 1) {
      const yr = years[idx + 1];
      currentWindowStart = yr;
      updateActiveBookBar();
      animateToWindow(yr);
    }
  }

  if (cursorCircle.classList.contains("arrow-left")) {
    const idx = years.indexOf(currentWindowStart);
    if (idx > 0) {
      const yr = years[idx - 1];
      currentWindowStart = yr;
      updateActiveBookBar();
      animateToWindow(yr);
    }
  }
});

/* ================================================================
   OPTIONAL CAMERA SLIDE — Makes the viewer glide horizontally
================================================================ */

function slideViewerToWindow(targetYear) {
  const wrapper = document.getElementById("viewportSlideWrapper");
  if (!wrapper) return;

  // convert year → pixel
  const xTarget = xScale(targetYear + WINDOW_SIZE / 2);

  // slide camera so center of window appears centered in viewport
  const screenCenter = window.innerWidth / 2;
  const delta = screenCenter - xTarget;

  wrapper.style.transition = "transform 0.35s cubic-bezier(0.16,1,0.3,1)";
  wrapper.style.transform  = `translateX(${delta}px)`;

  // after animation finishes, reset transform and shift domain permanently
  setTimeout(() => {
    wrapper.style.transition = "none";
    wrapper.style.transform  = "translateX(0)";
  }, 350);
}
