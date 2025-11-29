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
let hoverShifted = false;
let hoverOriginalTop = "";
let currentlyHoveredID = null;
let hoveredLineID = null;



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
const yTop = 190;
const yBot = H - 190;


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
// NOTE: start = depicted year, end = release year
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
//  WHITE HORIZONTAL AXIS LINES
// -----------------------------
function buildAxisLines() {
    // Top horizontal axis
    const lineTop = S("line");
    lineTop.setAttribute("x1", 0);
    lineTop.setAttribute("x2", WORLD_WIDTH);
    lineTop.setAttribute("y1", yTop);
    lineTop.setAttribute("y2", yTop);
    lineTop.setAttribute("stroke", "white");
    lineTop.setAttribute("stroke-width", 2);
    lineTop.setAttribute("stroke-opacity", 0.9);
    worldG.appendChild(lineTop);

    // Bottom horizontal axis
    const lineBot = S("line");
    lineBot.setAttribute("x1", 0);
    lineBot.setAttribute("x2", WORLD_WIDTH);
    lineBot.setAttribute("y1", yBot);
    lineBot.setAttribute("y2", yBot);
    lineBot.setAttribute("stroke", "white");
    lineBot.setAttribute("stroke-width", 2);
    lineBot.setAttribute("stroke-opacity", 0.9);
    worldG.appendChild(lineBot);

    // -------- AXIS LABELS --------
    const labelStyle = {
        fill: "white",
        "font-size": 16,
        "font-family": "Inter, sans-serif",
        "font-weight": 600,
        "letter-spacing": "1px",
    };

    // Depicted Year label
    const topLabel = S("text");
    topLabel.textContent = "Depicted Year";
    topLabel.setAttribute("x", 40);                  // left side offset
    topLabel.setAttribute("y", yTop - 16);           // slightly above top axis
    for (const [k,v] of Object.entries(labelStyle)) topLabel.setAttribute(k, v);
    worldG.appendChild(topLabel);

    // Release Year label
    const bottomLabel = S("text");
    bottomLabel.textContent = "Release Year";
    bottomLabel.setAttribute("x", 40);               // same offset
    bottomLabel.setAttribute("y", yBot - 10);        // slightly above bottom axis
    for (const [k,v] of Object.entries(labelStyle)) bottomLabel.setAttribute(k, v);
    worldG.appendChild(bottomLabel);
}

// For the Release Year / Depicted Year labels
function buildFixedAxisLabels() {
    const overlay = document.getElementById("fixedOverlay");

    // Clear old
    while (overlay.firstChild) overlay.removeChild(overlay.firstChild);

    // --- SVG DEFINITIONS ---
    const defs = S("defs");

    // === GLOW FILTER ===
    const filter = S("filter");
    filter.setAttribute("id", "axisGlow");
    filter.setAttribute("x", "-20%");
    filter.setAttribute("y", "-20%");
    filter.setAttribute("width", "200%");
    filter.setAttribute("height", "200%");

    const gaussian = S("feGaussianBlur");
    gaussian.setAttribute("stdDeviation", "2.5");
    gaussian.setAttribute("result", "blur");
    filter.appendChild(gaussian);

    const merge = S("feMerge");
    merge.appendChild(S("feMergeNode"));
    const m2 = S("feMergeNode");
    m2.setAttribute("in", "SourceGraphic");
    merge.appendChild(m2);

    filter.appendChild(merge);
    defs.appendChild(filter);

    // === GRADIENT BACKGROUND ===
    const grad = S("linearGradient");
    grad.setAttribute("id", "axisFadeBg");
    grad.setAttribute("x1", "0%");
    grad.setAttribute("y1", "0%");
    grad.setAttribute("x2", "100%");
    grad.setAttribute("y2", "0%");

    const stop1 = S("stop");
    stop1.setAttribute("offset", "0%");
    stop1.setAttribute("stop-color", "rgba(0,0,0,1)");

    const stop2 = S("stop");
    stop2.setAttribute("offset", "100%");
    stop2.setAttribute("stop-color", "rgba(0,0,0,0.3)");

    
    grad.appendChild(stop1);
    grad.appendChild(stop2);

    defs.appendChild(grad);
    overlay.appendChild(defs);

    // --- Common text style ---
    const labelStyle = {
        fill: "white",
        "font-size": 18,
        "font-family": "IBM Plex Sans, sans-serif",
        "font-weight": 300,
        "letter-spacing": "1.5px",
        "pointer-events": "none",
        filter: "url(#axisGlow)"
    };

    // Helper to create label + background
    function makeLabel(text, x, y) {
        // Text
        const label = S("text");
        label.textContent = text;
        label.setAttribute("x", x);
        label.setAttribute("y", y);

        for (const [k, v] of Object.entries(labelStyle))
            label.setAttribute(k, v);

        overlay.appendChild(label);

        // Measure text size AFTER adding it
        const bb = label.getBBox();

        const padding = 10;

        // Background rect
        const bg = S("rect");
        bg.setAttribute("x", bb.x - padding*4);
        bg.setAttribute("y", bb.y - padding / 2);
        bg.setAttribute("width", bb.width + padding * 10);
        bg.setAttribute("height", bb.height);
        bg.setAttribute("rx", 6);
        bg.setAttribute("fill", "url(#axisFadeBg)");
        bg.setAttribute("opacity", 1);

        // Insert *before* the text node
        overlay.insertBefore(bg, label);
    }

    // DEPicted Year (top)
    makeLabel("DEPICTED YEAR", 40, yTop - 12);

    // RELEASE Year (bottom)
    makeLabel("RELEASE YEAR", 40, yBot + 26);
}

function buildSlopeExamples() {

    const SLOPE_SCALE = 0.55;   // << master size control (0.5 = half size, 1 = original)

    const slopeGroup = S("g");
    slopeGroup.setAttribute(
        "transform",
        `translate(500,80) scale(${SLOPE_SCALE})`
    );
    slopeGroup.setAttribute("id", "svgSlopeExamples");

    // ---- Steep Line ----
    const steepLine = S("line");
    steepLine.setAttribute("x1", 0);
    steepLine.setAttribute("y1", 0);
    steepLine.setAttribute("x2", 32);
    steepLine.setAttribute("y2", -38);
    steepLine.setAttribute("stroke", "#7EC3E3");
    steepLine.setAttribute("stroke-width", 6);
    // steepLine.setAttribute("stroke-linecap", "round");
    slopeGroup.appendChild(steepLine);

    const steepLabel = S("text");
    steepLabel.setAttribute("x", 55);
    steepLabel.setAttribute("y", -10);
    steepLabel.setAttribute("fill", "rgba(255,255,255,0.7)");
    steepLabel.setAttribute("font-family", "Inter");
    steepLabel.setAttribute("font-size", "20");
    steepLabel.textContent = "Steeper Slope = Low Ambition";
    slopeGroup.appendChild(steepLabel);

    // ---- Flat Line ----
    const flatLine = S("line");
    flatLine.setAttribute("x1", 420);
    flatLine.setAttribute("y1", -10);
    flatLine.setAttribute("x2", 455);
    flatLine.setAttribute("y2", -17);
    flatLine.setAttribute("stroke", "#7EC3E3");
    flatLine.setAttribute("stroke-width", 6);
    // flatLine.setAttribute("stroke-linecap", "round");
    slopeGroup.appendChild(flatLine);

    const flatLabel = S("text");
    flatLabel.setAttribute("x", 480);
    flatLabel.setAttribute("y", -10);
    flatLabel.setAttribute("fill", "rgba(255,255,255,0.7)");
    flatLabel.setAttribute("font-family", "Inter");
    flatLabel.setAttribute("font-size", "20");
    flatLabel.textContent = "Flatter Slope = High Ambition";
    slopeGroup.appendChild(flatLabel);

    svg.appendChild(slopeGroup);
}



buildSlopeExamples();


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

        // Store DOM refs on the data object
        d.dom = {};

        // --- Huge hit-line (hover only) ---
        const hit = S("line");
        hit.setAttribute("x1", x1);
        hit.setAttribute("y1", yTop);
        hit.setAttribute("x2", x2);
        hit.setAttribute("y2", yBot);
        hit.setAttribute("stroke", "transparent");
        hit.setAttribute("stroke-width", 42);
        hit.setAttribute("pointer-events", "stroke");
        hit.classList.add("movieHit");
        hit.dataset.id = d.id;
        worldG.appendChild(hit);
        d.dom.hit = hit;

        // --- halo line (background glow) ---
        const halo = S("line");
        halo.setAttribute("x1", x1);
        halo.setAttribute("y1", yTop);
        halo.setAttribute("x2", x2);
        halo.setAttribute("y2", yBot);
        halo.setAttribute("stroke", slopeColor(d));
        halo.setAttribute("stroke-width", 8);
        halo.setAttribute("stroke-opacity", 0.0);   // default: hidden
        halo.style.pointerEvents = "none";
        halo.classList.add("movieHalo");
        halo.dataset.id = d.id;
        worldG.appendChild(halo);
        d.dom.halo = halo;

        // --- main line (foreground) ---
        const line = S("line");
        line.setAttribute("x1", x1);
        line.setAttribute("y1", yTop);
        line.setAttribute("x2", x2);
        line.setAttribute("y2", yBot);
        line.setAttribute("stroke", slopeColor(d));
        line.setAttribute("stroke-width", 2.2);
        line.setAttribute("stroke-opacity", 0.0);
        line.style.pointerEvents = "none";
        line.classList.add("movieLine");
        line.dataset.id = d.id;
        worldG.appendChild(line);
        d.dom.line = line;
    });
}



// -----------------------------
//  BUILD WORLD (entire static scene)
// -----------------------------
function buildWorld() {
    clear(worldG);

    buildGrid();
    buildTicks();
    buildAxisLines();  // <-- white horizontal axes
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
    data.forEach(d => {
        const inwin = isInWindow(d);

        // non-window = fully hidden
        if (!inwin) {
            d.dom.line.style.strokeOpacity = 0;
            d.dom.halo.style.strokeOpacity = 0;
            d.dom.hit.style.pointerEvents = "none";
        } else {
            // window = grey by default (0.55 opacity)
            d.dom.line.style.stroke = "#A9A9A9";   // grey-ish
            d.dom.line.style.strokeOpacity = 0.55;
            d.dom.halo.style.strokeOpacity = 0.06;
            d.dom.hit.style.pointerEvents = "stroke";
        }
    });
}

// -----------------------------
//  WINDOW LABEL (bottom-right) DEBUGGING ONLY
// -----------------------------
// function updateWindowLabel() {
//     const el = document.getElementById("window-label");
//     const start = currentWindowStart;
//     const end   = currentWindowStart + WINDOW_SIZE - 1;

//     el.textContent = `Window: ${start}–${end}`;
//     el.style.display = "block";
// }


// -----------------------------
//  LEFT CARD LOGIC (your real content goes here)
//  Replace this with your actual leftCardContent mapping.
// -----------------------------
const leftCardContent = {
    1925: {
      title: "1925–1930s",
      tags: [
        "10–30 YEAR SLOPE",
        "CONSERVATIVE FUTURES",
        "POSTWAR UNCERTAINTY"
      ],
      desc: "After WWII, filmmakers projected futures only a few years ahead—reflecting global anxiety, nuclear fear, and uncertain political stability. The Space Race added curiosity but also caution; imagination wasn’t yet ready to leap centuries forward. Futures feel like slightly altered versions of the present and technologies are incremental, not radical."
    },
    1945: {
        title: "1940–1950s",
        tags: [
          "10–30 YEAR SLOPE",
          "CONSERVATIVE FUTURES",
          "POSTWAR UNCERTAINTY"
        ],
        desc: "After WWII, filmmakers projected futures only a few years ahead—reflecting global anxiety, nuclear fear, and uncertain political stability. The Space Race added curiosity but also caution; imagination wasn’t yet ready to leap centuries forward. Futures feel like slightly altered versions of the present and technologies are incremental, not radical."
      },
      1955: {
        title: "1955–1960s",
        tags: [
          "10–30 YEAR SLOPE",
          "CONSERVATIVE FUTURES",
          "POSTWAR UNCERTAINTY"
        ],
        desc: "After WWII, filmmakers projected futures only a few years ahead—reflecting global anxiety, nuclear fear, and uncertain political stability. The Space Race added curiosity but also caution; imagination wasn’t yet ready to leap centuries forward. Futures feel like slightly altered versions of the present and technologies are incremental, not radical."
      },
  }
  

  function updateLeftCard() {
    const card = document.querySelector(".left-card");
    if (!card) return;

    const content = leftCardContent[currentWindowStart];
    if (!content) return;

    // Title
    document.getElementById("leftCardTitle").textContent = content.title;

    // Tags
    const tagRow = document.getElementById("leftCardTags");
    tagRow.innerHTML = "";
    if (content.tags) {
        content.tags.forEach(t => {
            const el = document.createElement("div");
            el.className = "tag";
            el.textContent = t;
            tagRow.appendChild(el);
        });
    }

    // Description
    document.getElementById("leftCardDesc").textContent = content.desc;
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
buildFixedAxisLabels(); // builds fixed labels

window.addEventListener("resize", () => {
    buildFixedAxisLabels();    // recreate at new yTop/yBot
});


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
    if (bar) {
        positionLabelOverBar(activeLabel, bar, windowStarts[idx]);
    }
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

function separateLabelsIfNeeded(hoverIndex, activeIndex) {
    const RADIUS = 3;

    // Outside radius → restore original position
    if (Math.abs(hoverIndex - activeIndex) > RADIUS) {
        if (hoverShifted && hoverOriginalTop) {
            hoverShifted = false;
            hoverLabel.style.top = hoverOriginalTop;
        }
        return;
    }

    const hRect = hoverLabel.getBoundingClientRect();
    const aRect = activeLabel.getBoundingClientRect();

    if (hoverLabel.style.opacity === "0" ||
        activeLabel.style.opacity === "0") return;

    const overlapX = !(hRect.right < aRect.left || hRect.left > aRect.right);
    const closeY = Math.abs(hRect.top - aRect.top) < 18;

    if (overlapX && closeY) {
        // apply upward shift once
        if (!hoverShifted) {
            hoverShifted = true;
            const currentTop = parseFloat(hoverLabel.style.top);
            hoverLabel.style.top = (currentTop - 20) + "px";
        }
    } else {
        // restore to safe original
        if (hoverShifted && hoverOriginalTop) {
            hoverShifted = false;
            hoverLabel.style.top = hoverOriginalTop;
        }
    }
}




function positionLabelOverBar(labelEl, barEl, yearText) {
    if (!barEl) {
        labelEl.style.opacity = 0;
        return;
    }

    const rect = barEl.getBoundingClientRect();

    yearText = `${yearText}-${yearText+4}`
    labelEl.textContent = yearText;

    // Set the horizontal position (always safe)
    labelEl.style.left = rect.left + rect.width / 2 + "px";

    // Compute intended top
    const intendedTop = rect.top - 12 + "px";

    // If label is NOT shifted, update originalTop + apply it
    if (!hoverShifted) {
        hoverOriginalTop = intendedTop;
        labelEl.style.top = intendedTop;
    }

    // If label IS shifted, do not overwrite its shifted position
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
    separateLabelsIfNeeded(activeIdx);

});

bookBarsContainer.addEventListener("mouseleave", () => {
    hoveredIndex = null;
    hoveringBars = false;

    resetWave();
    hoverLabel.style.opacity = 0;
    activeLabel.style.opacity = 0;
    hoverShifted = false;
    hoverOriginalTop = "";


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
    updateLeftCard();
    slideToWindow(yr);
});


// ------------------------------------------------------------
//  Arrow cursor logic
// ------------------------------------------------------------

let currentPage = 0;
    const pages = document.querySelectorAll('.page-slide');
    const firstDecadeBtn = document.getElementById('firstDecadeBtn');
    const navMenu = document.getElementById('navigationMenu');

    function updatePages() {
      pages.forEach((page, index) => {
        page.classList.remove('active', 'next', 'prev');
        if (index === currentPage) {
          page.classList.add('active');
          // Show navigation menu only on chart page
          if (index === 1) {
            if (navMenu) navMenu.style.display = '';
            // Show intro message text after chart is revealed
            setTimeout(() => {
              if (typeof showDefaultIntro === 'function') {
                showDefaultIntro(true);
              }
            }, 500);
            // Show arrow button after 3 seconds
            setTimeout(() => {
              const arrowButton = document.querySelector('.arrow-button-wrapper');
              if (arrowButton) {
                arrowButton.style.opacity = "1";
                arrowButton.style.pointerEvents = "auto";
              }
            }, 3000);
          } else {
            if (navMenu) navMenu.style.display = 'none';
          }
        } else if (index > currentPage) {
          page.classList.add('next');
        } else {
          page.classList.add('prev');
        }
      });
    }

   /* ---------------------------------------------------------
   DISCRETE SCROLL DETECTOR (1 scroll = 1 gesture)
--------------------------------------------------------- */
let scrollLocked = false;

window.addEventListener("wheel", (e) => {
    if (scrollLocked) return;

    scrollLocked = true;

    const direction = e.deltaY > 0 ? "down" : "up";

    // scroll down from INTRO → go to chart
    if (direction === "down" && currentPage === 0) {
        currentPage = 1;
        updatePages();
    }

    // unlock after gesture completes
    setTimeout(() => {
        scrollLocked = false;
    }, 350);
});



    firstDecadeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (currentPage < pages.length - 1) {
        currentPage++;
        updatePages();
      }
    });

    // Initialize
    updatePages();


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
    // 1. If on INTRO PAGE and RIGHT ARROW is shown → advance to main viz
    if (currentPage === 0 && cursorCircle.classList.contains("arrow-right")) {
        currentPage = 1;
        updatePages();
        return;   // IMPORTANT: prevent timeline window-changing logic from running
    }

    // If hovering bars, no arrow behavior
    if (hoveringBars) return;

    const idx = windowStarts.indexOf(currentWindowStart);

    // 2. Normal RIGHT ARROW behavior (timeline windows)
    if (cursorCircle.classList.contains("arrow-right")) {
        if (idx < windowStarts.length - 1) {
            const yr = windowStarts[idx + 1];
            currentWindowStart = yr;

            updateWindowHighlight();
            updateActiveBookBar();
            updateLeftCard();
            slideToWindow(yr);
        }
    }

    // 3. Normal LEFT ARROW behavior (timeline windows)
    if (cursorCircle.classList.contains("arrow-left")) {
        if (idx > 0) {
            const yr = windowStarts[idx - 1];
            currentWindowStart = yr;

            updateWindowHighlight();
            updateActiveBookBar();
            updateLeftCard();
            slideToWindow(yr);
        }
    }
});


/* ============================================================
   MOVIE HOVER CARD
============================================================ */

const hoverCard      = document.getElementById("movieHoverCard");
const hoverTitle     = document.getElementById("movieHoverTitle");
const hoverPoster    = document.getElementById("movieHoverPoster");
const hoverInfo      = document.getElementById("movieHoverInfo");

let hoverFadeTimer = null;

// Helper: compute imaginative leap text
function computeLeap(d) {
    const leap = d.startYear - d.endYear;  // depicted - release

    if (d.startYear === 9999) {
        return `>${9999 - d.endYear} years in the future`;
    }
    if (d.startYear === 0) {
        return `>${d.endYear} years in the past`;
    }

    if (leap >= 0) return `${leap} years in the future`;
    return `${leap} years in the past`;
}

function showHoverCard(d, x, y) {
    // Title shows RELEASE YEAR
    hoverTitle.textContent = `${d.label} (${d.endYear})`;

    // Poster image
    hoverPoster.src = `postersID/${d.id}.jpg`;

    // Info block
    const leap = computeLeap(d);
    let settingYear = d.startYear
    if (settingYear == 0) {
        settingYear = "<0"
    } else if (settingYear == 9999) {
        settingYear = ">9999"
    }
    hoverInfo.innerHTML =
        `Depicted Year: ${settingYear}<br><br>` +
        `Imaginative Leap: ${leap}`;

    // Show immediately so we can measure its size
    hoverCard.style.opacity = 1;

    // Slight cursor offset by default
    let cardX = x + 20;
    let cardY = y + 20;

    const cardRect = hoverCard.getBoundingClientRect();
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    // -----------------------------------------
    // 1. Prevent RIGHT overflow → move left
    // -----------------------------------------
    if (cardX + cardRect.width > screenW - 10) {
        cardX = x - cardRect.width - 20;
    }

    // -----------------------------------------
    // 2. Prevent BOTTOM overflow → move above
    // -----------------------------------------
    if (cardY + cardRect.height > screenH - 10) {
        cardY = y - cardRect.height - 20;
    }

    // -----------------------------------------
    // 3. Clamp positions just in case
    // -----------------------------------------
    cardX = Math.max(10, Math.min(cardX, screenW - cardRect.width - 10));
    cardY = Math.max(10, Math.min(cardY, screenH - cardRect.height - 10));

    // Apply final position
    hoverCard.style.left = `${cardX}px`;
    hoverCard.style.top  = `${cardY}px`;

    clearTimeout(hoverFadeTimer);
}


// fade-out helper
function hideHoverCard() {
    hoverFadeTimer = setTimeout(() => {
        hoverCard.style.opacity = 0;
    }, 120);
}
function restoreNormalLine(id) {
    const d = data.find(m => m.id == id);
    if (!d) return;

    const inWindow = isInWindow(d);

    const line = worldG.querySelector(`.movieLine[data-id="${id}"]`);
    const halo = worldG.querySelector(`.movieHalo[data-id="${id}"]`);

    if (line) {
        line.style.transition = "stroke 0.25s ease-out, stroke-opacity 0.25s ease-out";
        line.setAttribute("stroke", "#e0e0e0");
        line.setAttribute("stroke-opacity", inWindow ? 0.55 : 0.0);
    }

    if (halo) {
        halo.style.transition = "stroke-opacity 0.25s ease-out";
        halo.setAttribute("stroke", slopeColor(d));
        halo.setAttribute("stroke-opacity", inWindow ? 0.12 : 0.0);
    }
}


/* Attach hover listeners to all movie lines + halos */
function enableMovieHover() {
    const hits = worldG.querySelectorAll(".movieHit");

    hits.forEach(hit => {

        hit.addEventListener("mousemove", e => {
            const d = data.find(m => m.id == hit.dataset.id);
            if (!d) return;

            // Only window-visible lines can hover
            if (!isInWindow(d)) return;

            // --- make both halo + line blue ---
            d.dom.line.style.transition = "stroke 0.18s ease, stroke-opacity 0.18s ease";
            d.dom.halo.style.transition = "stroke-opacity 0.18s ease";

            d.dom.line.style.stroke = "#7EC3E3";       // bright blue
            d.dom.line.style.strokeOpacity = 1.0;

            d.dom.halo.style.strokeOpacity = 0.28;      // glowing blue halo

            showHoverCard(d, e.clientX, e.clientY);
        });

        hit.addEventListener("mouseleave", e => {
            const d = data.find(m => m.id == hit.dataset.id);
            if (!d) return;

            hideHoverCard();

            if (!isInWindow(d)) return;

            // Reset to grey window style
            d.dom.line.style.stroke = "#A9A9A9";
            d.dom.line.style.strokeOpacity = 0.55;
            d.dom.halo.style.strokeOpacity = 0.06;
        });
    });
}

// Call after world is built
enableMovieHover();

