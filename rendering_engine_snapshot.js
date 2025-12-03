/* ================================================================
   PARALLEL TIMELINE — NEW ARCHITECTURE (FULL WORLD RENDER)
   CHUNK 1 — GLOBALS, SVG SETUP, WORLD CREATION, SCROLL ENGINE
================================================================ */

// -----------------------------
//  GLOBAL CONFIG (EDITABLE)
// -----------------------------

// ACTUAL WORLD SCROLL LIMITS (editable)
const WORLD_START = 0;
const WORLD_END   = 9999;

// RENDERED YEARS ONLY (do NOT draw anything outside this)
const START_YEAR = 1925;
const END_YEAR   = 2020;



const PX_PER_YEAR   = 60;        // → 60 px per year (Option C)
const LEFT_PADDING  = 300;       // → safe visual padding
const WINDOW_SIZE   = 5;
const VIEW_SPAN     = 30;        // visible span used for centering windows

// Total years including inclusive bounds:
const TOTAL_YEARS = WORLD_END - WORLD_START + 1;

// Full world width:
const WORLD_WIDTH = LEFT_PADDING + TOTAL_YEARS * PX_PER_YEAR;

// -----------------------------
//  IMPORT RAW DATA
// -----------------------------
import rawData from "./settingdataraw.js";

// -----------------------------
//  SVG + WORLD GROUPS
// -----------------------------
const svg = document.getElementById("parallel");
const worldViewport = document.getElementById("worldViewport");
const worldG = document.getElementById("worldG");

// convenience creator
function S(tag) {
    return document.createElementNS("http://www.w3.org/2000/svg", tag);
}

const W = window.innerWidth;
const H = window.innerHeight;

// Vertical placement
const yTop = 100;
const yBot = H - 160;


// -----------------------------
//  POSITIONING HELPERS
// -----------------------------
function yearToX(year) {
    return LEFT_PADDING + (year - WORLD_START) * PX_PER_YEAR;
}


function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
}


// -----------------------------
//  DATA PREP (unchanged)
// -----------------------------
const data = rawData.map(d => ({
    ...d,
    startYear : +d.start,
    endYear   : +d.end,
    diff      : (+d.end) - (+d.start)
}));

const minRelease = Math.min(...data.map(d => d.endYear));
const maxRelease = Math.max(...data.map(d => d.endYear));


// -----------------------------
//  WORLD CAMERA STATE
// -----------------------------
// Start the view at the beginning of the rendered range (1920)
const initialYear = START_YEAR;               // 1920
const initialX = yearToX(initialYear);        // X position of 1920
const screenCenter = window.innerWidth / 2;

// Compute the camera offset so that 1920 starts at left or center:
let worldX = initialX - screenCenter;
if (worldX < 0) worldX = 0; // clamp


function applyWorldTransform() {
    worldViewport.setAttribute("transform", `translate(${-worldX}, 0)`);
}
applyWorldTransform();


// -----------------------------
//  CONTINUOUS SCROLL
// -----------------------------
window.addEventListener("wheel", (e) => {
    // Prevent scroll on intro page
    if (document.querySelector(".intro-page.active")) return;

    e.preventDefault();

    const delta = e.deltaY * 1.15;  // scroll sensitivity (editable)

    worldX += delta;

    // clamp camera so world edges never show blank space
    const minX = 0;
    const maxX = WORLD_WIDTH - W;

    if (worldX < minX) worldX = minX;
    if (worldX > maxX) worldX = maxX;

    applyWorldTransform();
}, { passive: false });


// -----------------------------
//  WORLD GENERATION ENTRYPOINT
//  (Filled in by Chunk 2 / 3)
// -----------------------------
// function buildWorld() {
//     // Chunk 2 will fill: gridlines + ticks + movie lines
//     // Chunk 3 will fill: events, highlight windows, bars, card updates
// }


// -----------------------------
//  UPDATE LOOP (Chunk 2/3 will add content inside worldG)
// -----------------------------
function updateEverything() {
    // This now only updates elements that change with window selection.
    // The world itself does NOT get cleared anymore.
    updateWindowHighlight();
    updateLeftCard();
    updateActiveBookBar();
}


// immediately apply initial camera transform:
applyWorldTransform();


/* ================================================================
   CHUNK 2 — FULL WORLD RENDERING ENGINE
   (grid, ticks, all movie lines)
================================================================ */


// -----------------------------
//  FULL GRIDLINE RENDER (1-year spacing)
// -----------------------------
function buildGrid() {
    // Use WORLD_START → WORLD_END for the full scrollable area
    for (let y = WORLD_START; y <= WORLD_END; y++) {
        const x = yearToX(y);

        const line = S("line");
        line.setAttribute("x1", x);
        line.setAttribute("y1", yTop);
        line.setAttribute("x2", x);
        line.setAttribute("y2", yBot);
        line.setAttribute("stroke", "rgba(255,255,255,0.10)"); // slightly dimmer
        worldG.appendChild(line);
    }
}



// -----------------------------
//  FULL TICK MARKS (5-year spacing)
// -----------------------------
function buildTicks() {
    // Use WORLD_START → WORLD_END for ticks
    for (let y = WORLD_START; y <= WORLD_END; y++) {

        // Only draw every 5 years
        if ((y - WORLD_START) % 5 !== 0) continue;

        const x = yearToX(y);

        // Top tick
        const t1 = S("line");
        t1.setAttribute("x1", x);
        t1.setAttribute("y1", yTop);
        t1.setAttribute("x2", x);
        t1.setAttribute("y2", yTop - 6);
        t1.setAttribute("stroke", "rgba(255,255,255,0.45)");
        worldG.appendChild(t1);

        const lbl1 = S("text");
        lbl1.textContent = y;
        lbl1.setAttribute("x", x + 4);
        lbl1.setAttribute("y", yTop - 12);
        lbl1.setAttribute("fill", "white");
        lbl1.setAttribute("font-size", 12);
        lbl1.setAttribute("font-family", "Courier New");
        worldG.appendChild(lbl1);

        // Bottom tick
        const t2 = S("line");
        t2.setAttribute("x1", x);
        t2.setAttribute("y1", yBot);
        t2.setAttribute("x2", x);
        t2.setAttribute("y2", yBot + 6);
        t2.setAttribute("stroke", "rgba(255,255,255,0.45)");
        worldG.appendChild(t2);

        const lbl2 = S("text");
        lbl2.textContent = y;
        lbl2.setAttribute("x", x + 4);
        lbl2.setAttribute("y", yBot + 20);
        lbl2.setAttribute("fill", "white");
        lbl2.setAttribute("font-size", 12);
        lbl2.setAttribute("font-family", "Courier New");
        worldG.appendChild(lbl2);
    }
}



// -----------------------------
//  SLOPE COLOR (same as before)
// -----------------------------
function slopeColor(d) {
    const x1 = yearToX(d.startYear);
    const x2 = yearToX(d.endYear);

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


// -----------------------------
//  DRAW ALL MOVIE LINES ONCE
//  (halo + main line)
// -----------------------------
function buildMovieLines() {
    data.forEach(d => {
        const x1 = yearToX(d.startYear);
        const x2 = yearToX(d.endYear);

        // --- halo (background) ---
        const halo = S("line");
        halo.setAttribute("x1", x1);
        halo.setAttribute("y1", yTop);
        halo.setAttribute("x2", x2);
        halo.setAttribute("y2", yBot);
        halo.setAttribute("stroke", slopeColor(d));
        halo.setAttribute("stroke-width", 8);
        halo.setAttribute("stroke-opacity", 0.03);
        halo.classList.add("movieHalo");
        halo.dataset.id = d.id;
        worldG.appendChild(halo);

        // --- main line (foreground) ---
        const line = S("line");
        line.setAttribute("x1", x1);
        line.setAttribute("y1", yTop);
        line.setAttribute("x2", x2);
        line.setAttribute("y2", yBot);
        line.setAttribute("stroke", slopeColor(d));
        line.setAttribute("stroke-width", 2.2);
        line.setAttribute("stroke-opacity", 0.0); // hidden until highlighted
        line.style.pointerEvents = "none";
        line.classList.add("movieLine");
        line.dataset.id = d.id;
        worldG.appendChild(line);
    });
}


// -----------------------------
//  BUILD WORLD (entire static scene)
// -----------------------------
function buildWorld() {
    clear(worldG);

    buildGrid();
    buildTicks();
    buildMovieLines();

    // events + interactive bars handled in later chunks
}

// buildWorld(); // build once at startup

/* ================================================================
   CHUNK 3 — WINDOW HIGHLIGHT + LEFT CARD + EVENTS
================================================================ */

// -----------------------------
//  Build list of 5-year window starts
// -----------------------------
const windowStarts = [];
for (let y = START_YEAR; y <= END_YEAR; y += WINDOW_SIZE) {
    windowStarts.push(y);
}

// active window start (initial = earliest)
let currentWindowStart = windowStarts[0];


// -----------------------------
//  Check if movie belongs to active window
// -----------------------------
function isInWindow(d) {
    return (
        d.endYear >= currentWindowStart &&
        d.endYear < currentWindowStart + WINDOW_SIZE
    );
}


// -----------------------------
//  Update highlight of movie lines (fg + halo)
// -----------------------------
function updateWindowHighlight() {
    const halos = worldG.querySelectorAll(".movieHalo");
    const lines = worldG.querySelectorAll(".movieLine");

    halos.forEach(h => {
        const d = data.find(m => m.id == h.dataset.id);
        const highlighted = isInWindow(d);
        h.setAttribute("stroke-opacity", highlighted ? 0.18 : 0.03);
    });

    lines.forEach(l => {
        const d = data.find(m => m.id == l.dataset.id);
        const highlighted = isInWindow(d);
        l.setAttribute("stroke-opacity", highlighted ? 1.0 : 0.0);
    });

    updateWindowLabel();
}


// -----------------------------
//  WINDOW LABEL (bottom-right)
// -----------------------------
function updateWindowLabel() {
    const el = document.getElementById("window-label");
    const start = currentWindowStart;
    const end   = currentWindowStart + WINDOW_SIZE - 1;

    el.textContent = `Window: ${start}–${end}`;
    el.style.display = "block";
}


// -----------------------------
//  LEFT CARD LOGIC (your real content goes here)
//  Replace this with your actual leftCardContent mapping.
// -----------------------------
const leftCardContent = {
    // Example:
    // 1920: { title:"", tag:"", desc:"", images:[...] }
};

function updateLeftCard() {
    const card = document.querySelector(".left-card");
    if (!card) return;

    const content = leftCardContent[currentWindowStart];
    if (!content) return;

    card.querySelector("h2").textContent     = content.title;
    card.querySelector(".tag").textContent   = content.tag;
    card.querySelector(".desc").textContent  = content.desc;

    const imgs = card.querySelector(".img-boxes").children;
    if (content.images && content.images.length >= 2) {
        imgs[0].style.backgroundImage = `url(${content.images[0]})`;
        imgs[1].style.backgroundImage = `url(${content.images[1]})`;
    } else {
        imgs[0].style.backgroundImage = "";
        imgs[1].style.backgroundImage = "";
    }
}


// -----------------------------
//  TIMELINE EVENTS (static render)
// -----------------------------
const timelineEvents = [
    // Add your events here:
    // { year: 1969, label: "Moon Landing" }
];

function buildEvents() {
    timelineEvents.forEach(ev => {
        const x = yearToX(ev.year);

        // vertical line
        const v = S("line");
        v.setAttribute("x1", x);
        v.setAttribute("y1", yTop);
        v.setAttribute("x2", x);
        v.setAttribute("y2", yBot);
        v.setAttribute("stroke", "#6b7280");
        v.setAttribute("stroke-opacity", 0.28);
        v.classList.add("timelineEvent");
        worldG.appendChild(v);

        // label
        const label = S("text");
        label.textContent = ev.label || ev.year;
        label.setAttribute("x", x + 4);
        label.setAttribute("y", yTop + 20);
        label.setAttribute("fill", "#aaa");
        label.setAttribute("font-size", 11);
        label.setAttribute("font-weight", 700);
        label.classList.add("timelineEventLabel");
        worldG.appendChild(label);
    });
}


// -----------------------------
//  Modify buildWorld to include events
// -----------------------------
const __originalBuildWorld = buildWorld;
buildWorld = function() {
    __originalBuildWorld();
    buildEvents();
    updateWindowHighlight();
    updateLeftCard();
};

buildWorld();  // rebuild world including events


/* ================================================================
   CHUNK 4 — WAVE SELECTOR + L/R ARROWS + WINDOW SLIDE ANIMATION
================================================================ */



// ------------------------------------------------------------
//  Build bars in #bookBars
// ------------------------------------------------------------
const bookBarsContainer = document.getElementById("bookBars");

function buildBookBars() {
    bookBarsContainer.innerHTML = "";
    windowStarts.forEach((yr, i) => {
        const bar = document.createElement("div");
        bar.classList.add("book-bar");
        bar.dataset.index = i;
        bookBarsContainer.appendChild(bar);
    });
}

buildBookBars();


// ------------------------------------------------------------
//  Active bar highlight
// ------------------------------------------------------------
function updateActiveBookBar() {
    const idx = windowStarts.indexOf(currentWindowStart);
    const bars = document.querySelectorAll(".book-bar");

    bars.forEach((b, i) => {
        b.classList.toggle("active", i === idx);
    });

    // also update active label position
    const activeLabel = document.getElementById("activeBarDate");
    const bar = bars[idx];
    if (bar) positionLabelOverBar(activeLabel, bar, windowStarts[idx]);
}


// ------------------------------------------------------------
//  Wave animation
// ------------------------------------------------------------
const BASE_HEIGHT = 12;
const PEAK_HEIGHT = 70;

function applyWaveEffect(centerIndex) {
    const bars = document.querySelectorAll(".book-bar");
    const total = bars.length;

    bars.forEach((bar, i) => {
        const dist = Math.abs(i - centerIndex);
        const t = dist / (total - 1);

        const wave = Math.cos(1.5 * t * Math.PI) * 0.35 / (1 + t**2) + 0.2;
        const height = BASE_HEIGHT + wave * (PEAK_HEIGHT - BASE_HEIGHT);

        bar.style.height = `${height}px`;
        bar.classList.toggle("hovered", i === centerIndex);
    });
}

function resetWave() {
    const bars = document.querySelectorAll(".book-bar");
    bars.forEach(bar => {
        bar.style.height = `${BASE_HEIGHT}px`;
        bar.classList.remove("hovered");
    });
}


// ------------------------------------------------------------
//  Hover labels
// ------------------------------------------------------------
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

let hoveredIndex = null;
let hoveringBars = false;

bookBarsContainer.addEventListener("mousemove", (e) => {
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
    hoveringBars = true;

    applyWaveEffect(best);

    positionLabelOverBar(hoverLabel, bars[best], windowStarts[best]);

    // handle active label too
    const activeIdx = windowStarts.indexOf(currentWindowStart);
    if (activeIdx !== -1) {
        positionLabelOverBar(activeLabel, bars[activeIdx], windowStarts[activeIdx]);
    }
});

bookBarsContainer.addEventListener("mouseleave", () => {
    hoveredIndex = null;
    hoveringBars = false;

    resetWave();
    hoverLabel.style.opacity = 0;
    activeLabel.style.opacity = 0;
});


// ------------------------------------------------------------
//  Smooth animate camera to center a window
// ------------------------------------------------------------
function slideToWindow(yr) {
    // compute x target (center of window)
    const centerYear = yr + WINDOW_SIZE / 2;
    const xTarget = yearToX(centerYear);

    const screenCenter = window.innerWidth / 2;
    const desiredWorldX = xTarget - screenCenter;

    // clamp
    const minX = 0;
    const maxX = WORLD_WIDTH - window.innerWidth;

    const finalX = Math.max(minX, Math.min(maxX, desiredWorldX));

    const startX = worldX;
    const deltaX = finalX - startX;
    const duration = 350;
    const startTime = performance.now();

    function animate(t) {
        const p = Math.min(1, (t - startTime) / duration);
        const ease = 1 - Math.pow(1 - p, 3); // cubic ease-out

        worldX = startX + deltaX * ease;
        applyWorldTransform();

        if (p < 1) requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
}


// ------------------------------------------------------------
//  Handle bar click to jump to window
// ------------------------------------------------------------
bookBarsContainer.addEventListener("click", (e) => {
    const bars = Array.from(document.querySelectorAll(".book-bar"));
    const containerRect = bookBarsContainer.getBoundingClientRect();
    const mouseX = e.clientX - containerRect.left;

    // find nearest bar
    let best = 0;
    let bestDist = Infinity;
    bars.forEach((bar, i) => {
        const b = bar.getBoundingClientRect();
        const center = b.left - containerRect.left + b.width / 2;
        const d = Math.abs(mouseX - center);
        if (d < bestDist) { bestDist = d; best = i; }
    });

    const yr = windowStarts[best];
    currentWindowStart = yr;

    updateWindowHighlight();
    updateActiveBookBar();

    slideToWindow(yr);
});


// ------------------------------------------------------------
//  Arrow cursor logic
// ------------------------------------------------------------
const cursorCircle = document.getElementById("cursorCircle");

window.addEventListener("mousemove", (e) => {

    if (hoveringBars) {
        cursorCircle.classList.remove("arrow-left","arrow-right");
        return;
    }

    const x = e.clientX;
    const w = window.innerWidth;
    const zone = 800; // editable

    const atFirst = currentWindowStart <= windowStarts[0];
    const atLast  = currentWindowStart >= windowStarts[windowStarts.length - 1];

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


// ------------------------------------------------------------
//  Arrow click behavior
// ------------------------------------------------------------
window.addEventListener("mousedown", (e) => {
    if (hoveringBars) return;

    const idx = windowStarts.indexOf(currentWindowStart);

    if (cursorCircle.classList.contains("arrow-right")) {
        if (idx < windowStarts.length - 1) {
            const yr = windowStarts[idx + 1];
            currentWindowStart = yr;
            updateWindowHighlight();
            updateActiveBookBar();
            slideToWindow(yr);
        }
    }

    if (cursorCircle.classList.contains("arrow-left")) {
        if (idx > 0) {
            const yr = windowStarts[idx - 1];
            currentWindowStart = yr;
            updateWindowHighlight();
            updateActiveBookBar();
            slideToWindow(yr);
        }
    }
});

