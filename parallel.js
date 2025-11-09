/*  Parallel Coordinates — YEAR granularity (Setting Year ↔ Release Year)
    - Two horizontal time axes (top: Setting Year, bottom: Release Year)
    - Each record draws a straight link from (setting, top) → (release, bottom)
    - Pan & zoom horizontally
    - Color & width encode Year Difference (release - setting)
    - Timeline events are vertical grey lines spanning yTop..yBot with hover tooltip
*/

import data_raw from "./settingdataraw.js";
const raw = data_raw;

// ---- TIMELINE EVENTS (edit these) ---------------------------------------
const timelineEvents = [
  { id: "ev-2001",  label: "Dot-Com Bust",     year: 2001, desc: "Tech bubble deflates" },
  { id: "ev-2008",  label: "Financial Crisis", year: 2008, desc: "Global credit crunch" },
  { id: "ev-2015",  label: "Streaming Boom",   year: 2015, desc: "OTT platforms surge" },
  { id: "ev-2020",  label: "COVID-19",         year: 2020, desc: "Theatrical shutdowns" },
];
timelineEvents.forEach(e => e.date = new Date(+e.year, 0, 1));


// ---------- SVG & layout ----------
const svg = d3.select("#parallel");
const { width: svgW, height: svgH } = svg.node().getBoundingClientRect();
const margin = { top: 70, right: 30, bottom: 70, left: 30 };
const width = svgW - margin.left - margin.right;
const height = svgH - margin.top - margin.bottom;

const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

// ---------- Data prep (YEAR granularity) ----------
const data = raw.map(d => {
  const s = +d.start;
  const e = +d.end;
  return {
    ...d,
    id: d.id ?? `${d.label ?? `${s}-${e}`}-${s}-${e}`,
    startYear: s,
    endYear: e,
    startDate: new Date(s, 0, 1),
    endDate:   new Date(e, 0, 1),
    yearDiff:  e - s
  };
});

let hideEqualYears = false;
let currentData = data;

// ---------- Scales ----------
const minYear = d3.min([
  d3.min(data, d => Math.min(d.startYear, d.endYear)),
  d3.min(timelineEvents, d => d.year)
]);
const maxYear = d3.max([
  d3.max(data, d => Math.max(d.endYear, d.startYear)),
  d3.max(timelineEvents, d => d.year)
]);
const padYears = 1;

const domain = [
  new Date(minYear - padYears, 0, 1),
  new Date(maxYear + padYears, 0, 1)
];

let x = d3.scaleTime().domain(domain).range([0, width]);
const x0 = x.copy();
let xCurrent = x;

const yTop = 30;
const yBot = height - 30;

// Color + size encodings for links
const diffExtent = d3.extent(data, d => d.yearDiff);
const color = d3.scaleSequential()
  .domain(diffExtent)
  .interpolator(d3.interpolateRgbBasis(["#5ee6a8", "#ffd166", "#ff7a9a"]));

const widthScale = d3.scaleSqrt()
  .domain(diffExtent)
  .range([1.5, 5]);

// ---------- Defs & clipping (clip to plot area between axes) ----------
const defs = svg.append("defs");
defs.append("clipPath")
  .attr("id", "clip")
  .append("rect")
  .attr("x", 0)
  .attr("y", margin.top)
  .attr("width", width)
  .attr("height", height);

// ---------- Grid ----------
const gridGroup = g.append("g").attr("class", "grid").attr("clip-path", "url(#clip)");
function drawGrid(scaleX) {
  const ticks = scaleX.ticks(d3.timeYear.every(1));
  const lines = gridGroup.selectAll("line").data(ticks, d => d.getFullYear());
  lines.enter().append("line")
    .attr("y1", yTop).attr("y2", yBot)
    .merge(lines)
    .attr("x1", d => scaleX(d))
    .attr("x2", d => scaleX(d));
  lines.exit().remove();
}

// ---------- Axes ----------
const topAxisG = g.append("g").attr("class", "axis").attr("transform", `translate(0,${yTop})`);
const botAxisG = g.append("g").attr("class", "axis").attr("transform", `translate(0,${yBot})`);

function yearTicks(scaleX, maxCount = 10) {
  const [d0, d1] = scaleX.domain();
  const y0 = d0.getFullYear();
  const y1 = d1.getFullYear();
  const step = Math.max(1, Math.ceil((y1 - y0) / maxCount));
  return d3.range(y0, y1 + 1, step).map(y => new Date(y, 0, 1));
}

function renderAxes(scaleX) {
  const ticks = yearTicks(scaleX);
  const fmt = d3.timeFormat("%Y");
  topAxisG.call(d3.axisTop(scaleX).tickValues(ticks).tickFormat(fmt).tickSizeOuter(0));
  botAxisG.call(d3.axisBottom(scaleX).tickValues(ticks).tickFormat(fmt).tickSizeOuter(0));
}

g.append("text")
  .attr("class", "axis-title")
  .attr("x", 0).attr("y", yTop - 18)
  .text("Setting Year");

g.append("text")
  .attr("class", "axis-title")
  .attr("x", 0).attr("y", yBot + 30)
  .text("Release Year");

// ---------- Link generator ----------
function straightLink(x1, y1, x2, y2) {
  return `M ${x1},${y1} L ${x2},${y2}`;
}

// ---------- Tooltip ----------
const tip = document.getElementById("tooltip");
let pinnedId = null;

function showTip(html, px, py) {
  tip.innerHTML = html;
  tip.style.display = "block";
  tip.style.left = `${px}px`;
  tip.style.top = `${py}px`;
}
function hideTip() {
  if (!pinnedId) tip.style.display = "none";
}
document.body.addEventListener("click", () => {
  pinnedId = null;
  hideTip();
});

// ---------- Draw layer (links) ----------
const drawLayer = g.append("g").attr("clip-path", "url(#clip)");
let halosSel = drawLayer.selectAll(".halo");
let linksSel = drawLayer.selectAll(".link");

// link interactions
function attachLinkHandlers(selection) {
  selection
    .on("mousemove", function (event, d) {
      const [cx, cy] = d3.pointer(event, document.body);
      const html = `
        <div class="title">${d.label}</div>
        <div class="sub">Setting: <b>${d.startYear}</b></div>
        <div class="sub">Release: <b>${d.endYear}</b></div>
        <div class="sub">Year Difference: <b>${d.yearDiff}</b></div>`;
      showTip(html, cx, cy);
      d3.select(this).raise().attr("stroke-width", widthScale(d.yearDiff) + 1.5);
    })
    .on("mouseout", function () {
      if (!pinnedId) hideTip();
      d3.select(this).attr("stroke-width", d => widthScale(d.yearDiff));
    })
    .on("click", function (event, d) {
      pinnedId = (pinnedId === d.id) ? null : d.id;
      if (!pinnedId) hideTip();
      else {
        const [cx, cy] = d3.pointer(event, document.body);
        const html = `
          <div class="title">📌 ${d.label}</div>
          <div class="sub">Setting: <b>${d.startYear}</b></div>
          <div class="sub">Release: <b>${d.endYear}</b></div>
          <div class="sub">Year Difference: <b>${d.yearDiff}</b></div>`;
        showTip(html, cx, cy);
      }
      event.stopPropagation();
    });
}

// Draw data + halos
function rejoinAndPosition(scaleX) {
  halosSel = halosSel.data(currentData, d => d.id);
  halosSel.exit().remove();
  halosSel = halosSel.enter()
    .append("path")
    .attr("class", "halo")
    .merge(halosSel)
    .attr("d", d => straightLink(scaleX(d.startDate), yTop, scaleX(d.endDate), yBot));

  linksSel = linksSel.data(currentData, d => d.id);
  linksSel.exit().remove();
  const linksEnter = linksSel.enter()
    .append("path")
    .attr("class", "link")
    .attr("stroke", d => color(d.yearDiff))
    .attr("stroke-width", d => widthScale(d.yearDiff));
  attachLinkHandlers(linksEnter);
  linksSel = linksEnter.merge(linksSel);
  linksSel.attr("d", d => straightLink(scaleX(d.startDate), yTop, scaleX(d.endDate), yBot));

  drawEvents(scaleX);
}

// ---------- Timeline Event Layer (vertical lines yTop..yBot) ----------
const eventsLayer = g.append("g").attr("clip-path", "url(#clip)");
let eventsSel = eventsLayer.selectAll("g.event");

function drawEvents(scaleX) {
  eventsSel = eventsSel.data(timelineEvents, d => d.id);
  eventsSel.exit().remove();

  const enter = eventsSel.enter()
    .append("g")
    .attr("class", "event")
    .style("cursor", "default");

  // Visible, distinct vertical line
  enter.append("line")
    .attr("class", "event-vline")
    .attr("stroke", "#6b7280")        // darker grey
    .attr("stroke-width", 2.5)
    .attr("stroke-dasharray", "6,6")
    .attr("shape-rendering", "crispEdges");

  // Subtle halo to separate from data links
  enter.append("line")
    .attr("class", "event-halo")
    .attr("stroke", "#6b7280")
    .attr("stroke-width", 8)
    .attr("stroke-opacity", 0.15)
    .attr("shape-rendering", "crispEdges");

  // Big invisible hit area for easy hover
  enter.append("line")
    .attr("class", "event-hit")
    .attr("stroke", "transparent")
    .attr("stroke-width", 18);

  // Small top tick + small year label near the top axis (optional; keep or remove)
  enter.append("line")
    .attr("class", "event-top-tick")
    .attr("stroke", "#6b7280")
    .attr("stroke-width", 2)
    .attr("shape-rendering", "crispEdges");

  enter.append("text")
    .attr("class", "event-year")
    .attr("text-anchor", "middle")
    .attr("font-size", 11)
    .attr("font-weight", 700)
    .attr("fill", "#6b7280");

  // NEW: Rotated blurb that rests on the right side of the line
  enter.append("text")
    .attr("class", "event-desc")
    .attr("font-size", 10)
    .attr("font-weight", 600)
    .attr("fill", "#4b5563")   // slightly darker than grid
    .attr("opacity", 0.95);

  const merged = enter.merge(eventsSel);

  // Position groups by x; everything else is relative to y
  merged.attr("transform", d => `translate(${scaleX(d.date)},0)`);

  const midY = (yTop + yBot) / 2; // where the rotated blurb will “rest”
  const rightOffset = 6;          // small offset to the right of the line

  // Vertical extent (inside plot)
  merged.select("line.event-halo")
    .attr("x1", 0).attr("x2", 0)
    .attr("y1", yTop)
    .attr("y2", yBot);

  merged.select("line.event-vline")
    .attr("x1", 0).attr("x2", 0)
    .attr("y1", yTop)
    .attr("y2", yBot);

  merged.select("line.event-hit")
    .attr("x1", 0).attr("x2", 0)
    .attr("y1", yTop)
    .attr("y2", yBot);

  // Tiny top tick + year text
  merged.select("line.event-top-tick")
    .attr("x1", -4)
    .attr("x2", 4)
    .attr("y1", yTop)
    .attr("y2", yTop + 8);

  merged.select("text.event-year")
    .attr("x", 0)
    .attr("y", yTop + 20)
    .text(d => d.year);

  // Rotated blurb: rotate around its own anchor so it hugs the line on the right
  merged.select("text.event-desc")
    .attr("x", rightOffset)
    .attr("y", midY)
    .attr("transform", `rotate(-270, ${rightOffset}, ${midY})`)
    .attr("text-anchor", "start") // after rotation, "start" lands to the right of the line
    .text(d => d.desc ?? d.label);

  // Hover tooltip on visible + hit geometry
  merged.selectAll("line")
    .on("mousemove", (event, d) => {
      const [cx, cy] = d3.pointer(event, document.body);
      const html = `
        <div class="title">${d.label}</div>
        <div class="sub">Year: <b>${d.year}</b></div>
        ${d.desc ? `<div class="sub">${d.desc}</div>` : ""}`;
      showTip(html, cx, cy);
    })
    .on("mouseout", () => { if (!pinnedId) hideTip(); });
}



// ---------- Zoom / Pan ----------
const zoom = d3.zoom()
  .scaleExtent([0.5, 24])
  .on("zoom", (event) => {
    const zx = event.transform.rescaleX(x0);
    update(zx);
  });
svg.call(zoom).on("dblclick.zoom", null);

// Reset with R
window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "r") {
    svg.transition().duration(450).call(zoom.transform, d3.zoomIdentity);
  }
});

// ---------- Update ----------
function update(scaleX) {
  xCurrent = scaleX;
  renderAxes(scaleX);
  drawGrid(scaleX);

  halosSel.attr("d", d => straightLink(scaleX(d.startDate), yTop, scaleX(d.endDate), yBot));
  linksSel.attr("d", d => straightLink(scaleX(d.startDate), yTop, scaleX(d.endDate), yBot));

  eventsLayer.selectAll("g.event")
    .attr("transform", d => `translate(${scaleX(d.date)},0)`);
}

// ---------- Toggle (hide Setting ≤ Release) ----------
(function addToggle() {
  const toolbarLeft = document.querySelector(".toolbar .left") || document.querySelector(".toolbar");

  const wrap = document.createElement("label");
  wrap.style.display = "inline-flex";
  wrap.style.alignItems = "center";
  wrap.style.gap = "8px";
  wrap.style.marginLeft = "8px";
  wrap.className = "badge";

  const input = document.createElement("input");
  input.type = "checkbox";
  input.style.accentColor = "#2a9dff";

  const text = document.createElement("span");
  text.textContent = "Hide Setting ≤ Release";

  wrap.appendChild(input);
  wrap.appendChild(text);
  toolbarLeft.appendChild(wrap);

  input.addEventListener("change", () => {
    hideEqualYears = input.checked;
    currentData = hideEqualYears ? data.filter(d => d.yearDiff < 0) : data;
    rejoinAndPosition(xCurrent);
  });
})();

// ---------- Initial render ----------
renderAxes(x);
drawGrid(x);
rejoinAndPosition(x);
drawEvents(x);
update(x);
