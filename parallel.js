/*  Parallel Coordinates — YEAR granularity (Setting Year ↔ Release Year)
    - Two horizontal time axes (top: Setting Year, bottom: Release Year)
    - Each record draws a curved link from (setting, top) to (release, bottom)
    - Pan & zoom horizontally; white/light theme to match parallel.html
    - Color & width encode Year Difference (release - setting)
*/

// If you have an external dataset, you can import it like this:
// import data_raw from "./settingdataraw.js"; // default export should be an array
// const raw = data_raw;

// --- Demo data (YEAR ONLY). Replace with your own -------------
// Accepts year either as number or string (e.g., "2016")
import data_raw from "./settingdataraw.js"; // default export should be an array
const raw = data_raw;

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
    startYear: s,
    endYear: e,
    startDate: new Date(s, 0, 1),  // Jan 1 of start year
    endDate:   new Date(e, 0, 1),  // Jan 1 of end year
    yearDiff:  (e - s)
  };
});

// Current filtered dataset (toggled by UI)
let hideEqualYears = false;
let currentData = data;

// ---------- Scales ----------
const minYear = d3.min(data, d => Math.min(d.startYear, d.endYear));
const maxYear = d3.max(data, d => Math.max(d.startYear, d.endYear));
const padYears = 1; // breathing room

const domain = [
  new Date(minYear - padYears, 0, 1),
  new Date(maxYear + padYears, 0, 1)
];

let x = d3.scaleTime().domain(domain).range([0, width]);
const x0 = x.copy(); // original for rescaling
let xCurrent = x;    // last-used scale (kept in sync by update())

const yTop = 30;
const yBot = height - 30;

// Encodings for Year Difference
const diffExtent = d3.extent(data, d => d.yearDiff);
const color = d3.scaleSequential()
  .domain(diffExtent)
  .interpolator(d3.interpolateRgbBasis(["#5ee6a8", "#ffd166", "#ff7a9a"]));

const widthScale = d3.scaleSqrt()
  .domain(diffExtent)
  .range([1.5, 5]);

// ---------- Defs & clipping ----------
const defs = svg.append("defs");
defs.append("clipPath")
  .attr("id", "clip")
  .append("rect")
  .attr("x", 0)
  .attr("y", margin.top - 10)
  .attr("width", width)
  .attr("height", height + 20);

// ---------- Grid ----------
const gridGroup = g.append("g").attr("class", "grid").attr("clip-path", "url(#clip)");
function drawGrid(scaleX) {
  const ticks = scaleX.ticks(d3.timeYear.every(1));
  const lines = gridGroup.selectAll("line").data(ticks, d => d.getFullYear());
  lines.enter().append("line")
      .attr("y1", 0).attr("y2", height)
      .attr("x1", d => scaleX(d)).attr("x2", d => scaleX(d))
    .merge(lines)
      .attr("x1", d => scaleX(d)).attr("x2", d => scaleX(d));
  lines.exit().remove();
}

// ---------- Axes ----------
const topAxisG = g.append("g").attr("class", "axis").attr("transform", `translate(0,${yTop})`);
const botAxisG = g.append("g").attr("class", "axis").attr("transform", `translate(0,${yBot})`);

// Yearly ticks (integers), adaptive density
function yearTicks(scaleX, maxCount = 10) {
  const [d0, d1] = scaleX.domain();
  const y0 = d0.getFullYear();
  const y1 = d1.getFullYear();
  const step = Math.max(1, Math.ceil((y1 - y0) / maxCount));
  const years = d3.range(y0, y1 + 1, step).map(y => new Date(y, 0, 1));
  return years;
}

function renderAxes(scaleX) {
  const ticks = yearTicks(scaleX, 10);
  const fmt = d3.timeFormat("%Y");
  const axisTop = d3.axisTop(scaleX).tickValues(ticks).tickFormat(fmt).tickSizeOuter(0);
  const axisBottom = d3.axisBottom(scaleX).tickValues(ticks).tickFormat(fmt).tickSizeOuter(0);
  topAxisG.call(axisTop);
  botAxisG.call(axisBottom);
}

g.append("text")
  .attr("class", "axis-title")
  .attr("x", 0).attr("y", yTop - 18)
  .text("Setting Year");

g.append("text")
  .attr("class", "axis-title")
  .attr("x", 0).attr("y", yBot + 30)
  .text("Release Year");

// ---------- Straight link generator ----------
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

// ---------- Draw layer & data join (supports filtering) ----------
const drawLayer = g.append("g").attr("clip-path", "url(#clip)");
let halosSel = drawLayer.selectAll(".halo");
let linksSel = drawLayer.selectAll(".link");

// attach interaction handlers to new link elements
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
    .on("mouseout", function (event, d) {
      if (!pinnedId) hideTip();
      d3.select(this).attr("stroke-width", widthScale(d.yearDiff));
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

document.body.addEventListener("click", () => {
  pinnedId = null;
  hideTip();
});

// (Re)join data to paths and position them
function rejoinAndPosition(scaleX) {
  // Halos
  halosSel = halosSel.data(currentData, d => d.id);
  halosSel.exit().remove();
  const halosEnter = halosSel.enter()
    .append("path")
    .attr("class", "halo");
  halosSel = halosEnter.merge(halosSel);
  halosSel.attr("d", d => straightLink(scaleX(d.startDate), yTop, scaleX(d.endDate), yBot));

  // Links
  linksSel = linksSel.data(currentData, d => d.id);
  linksSel.exit().remove();
  const linksEnter = linksSel.enter()
    .append("path")
    .attr("class", "link")
    .attr("stroke", d => color(d.yearDiff))
    .attr("stroke-width", d => widthScale(d.yearDiff));
  attachLinkHandlers(linksEnter); // handlers for new elements
  linksSel = linksEnter.merge(linksSel);
  linksSel.attr("d", d => straightLink(scaleX(d.startDate), yTop, scaleX(d.endDate), yBot));
}

// ---------- Zoom / Pan ----------
const zoom = d3.zoom()
  .scaleExtent([0.5, 24])
  .on("zoom", (event) => {
    const zx = event.transform.rescaleX(x0);
    update(zx);
  });

svg.call(zoom).on("dblclick.zoom", null);

// Reset with "R"
window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "r") {
    svg.transition().duration(450).call(zoom.transform, d3.zoomIdentity);
  }
});

// ---------- Update (axes, grid, paths) ----------
function update(scaleX) {
  xCurrent = scaleX; // remember last-used scale for re-joins
  renderAxes(scaleX);
  drawGrid(scaleX);
  // Positions only (fast path) if selections already exist
  halosSel.attr("d", d => straightLink(scaleX(d.startDate), yTop, scaleX(d.endDate), yBot));
  linksSel.attr("d", d => straightLink(scaleX(d.startDate), yTop, scaleX(d.endDate), yBot));
}

// ---------- UI: Add a toggle to hide equal-year items ----------
(function addToggle() {
  const toolbarLeft = document.querySelector(".toolbar .left") || document.querySelector(".toolbar") || document.body;

  const wrap = document.createElement("label");
  wrap.style.display = "inline-flex";
  wrap.style.alignItems = "center";
  wrap.style.gap = "8px";
  wrap.style.marginLeft = "8px";
  wrap.className = "badge"; // reuse badge style

  const input = document.createElement("input");
  input.type = "checkbox";
  input.id = "toggleEqualYears";
  input.style.accentColor = "#2a9dff";

  const text = document.createElement("span");
  text.textContent = "Hide Setting<=Release (ie show only movies taking place in future)";

  wrap.appendChild(input);
  wrap.appendChild(text);
  toolbarLeft.appendChild(wrap);

  input.addEventListener("change", () => {
    hideEqualYears = input.checked;
    currentData = hideEqualYears ? data.filter(d => d.yearDiff < 0) : data;
    // Re-join to reflect new dataset and position with the current scale
    rejoinAndPosition(xCurrent);
  });
})();

// ---------- Initial render ----------
renderAxes(x);
drawGrid(x);
rejoinAndPosition(x);
update(x);






