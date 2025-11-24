/* ============================================================
   PARALLEL COORDINATE TIMELINE (5-year release window)
   - windowStart based SOLELY on RELEASE YEARS
   - drag-to-pan timeline
   - scroll-to-shift window
   - bottom axis 5-year highlight
   - top-right window label
============================================================ */

import rawData from "./settingdataraw.js";

/* ----------------------------
    CONFIG CONSTANTS
-----------------------------*/
const WINDOW_SIZE_YEARS = 5;
const WINDOW_STEP_YEARS = 5;
const INITIAL_VIEW_YEARS = 30;  // number of years visible initially

let ABS_MIN_YEAR = Infinity;
let ABS_MAX_YEAR = -Infinity;

/* ----------------------------
    PREP DATA
-----------------------------*/
const data = rawData.map(d => {
  const start = +d.start;
  const end   = +d.end;

  ABS_MIN_YEAR = Math.min(ABS_MIN_YEAR, start, end);
  ABS_MAX_YEAR = Math.max(ABS_MAX_YEAR, start, end);

  return {
    ...d,
    id: d.id ?? `${d.label}-${start}-${end}`,
    startYear: start,
    endYear: end,
    startDate: new Date(start,0,1),
    endDate:   new Date(end,0,1),
    diff: end - start
  };
});

/* Slight padding so panning feels nicer */
ABS_MIN_YEAR -= 2;
ABS_MAX_YEAR += 2;

/* ----------------------------
    RELEASE-YEAR WINDOW START (FIXED)
-----------------------------*/
const minRelease = d3.min(data, d => d.endYear);
const maxRelease = d3.max(data, d => d.endYear);

/* Start at earliest 5-year block */
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
    INITIAL X-SCALE DOMAIN 
    >>> MUST begin at windowStart
-----------------------------*/
const x = d3.scaleTime()
  .domain([
    new Date(windowStart, 0, 1),
    new Date(windowStart + INITIAL_VIEW_YEARS, 0, 1)
  ])
  .range([0, W]);

/* ----------------------------
    AXES + GRID
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
  const years = x.ticks(d3.timeYear.every(1));
  const lines = gridG.selectAll("line").data(years, d => d);

  lines.enter().append("line")
    .merge(lines)
    .attr("x1", d => x(d))
    .attr("x2", d => x(d))
    .attr("y1", yTop)
    .attr("y2", yBot);

  lines.exit().remove();
}

/* ----------------------------
    FILTER BY 5-YEAR RELEASE WINDOW
-----------------------------*/
function getFilteredData() {
  return data.filter(d =>
    d.endYear >= windowStart &&
    d.endYear <  windowStart + WINDOW_SIZE_YEARS
  );
}

/* ----------------------------
    LINKS & HALOS
-----------------------------*/
const linkLayer = g.append("g");
let links  = linkLayer.selectAll("path.link");
let halos  = linkLayer.selectAll("path.halo");

function drawLines(filtered) {
  // HALOS
  halos = halos.data(filtered, d => d.id);
  halos.exit().remove();
  halos = halos.enter()
    .append("path")
    .attr("class","halo")
    .merge(halos)
    .attr("d", d => `M${x(d.startDate)},${yTop} L${x(d.endDate)},${yBot}`);

  // LINKS
  links = links.data(filtered, d => d.id);
  links.exit().remove();
  const enter = links.enter().append("path")
    .attr("class","link")
    .attr("stroke-width", d => 1.5 + Math.sqrt(Math.abs(d.diff)));

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
  const tgt = d3.select(event.target).datum();
  if (!tgt) return;
  const [mx, my] = d3.pointer(event, document.body);

  showTip(`
    <div class="title">${tgt.label}</div>
    <div class="sub">Setting: ${tgt.startYear}</div>
    <div class="sub">Release: ${tgt.endYear}</div>
    <div class="sub">Δ: ${tgt.diff}</div>
  `, mx, my);
});

linkLayer.on("mouseout", hideTip);

/* ----------------------------
    TIMELINE EVENTS
-----------------------------*/
const timelineEvents = [
  { year: 2001, label:"Dot-Com Bust", desc:"Tech bubble deflates" },
  { year: 2008, label:"Financial Crisis", desc:"Global credit crunch" },
  { year: 2015, label:"Streaming Boom", desc:"OTT platforms surge" },
  { year: 2020, label:"COVID-19", desc:"Theatrical shutdowns" }
];
timelineEvents.forEach(e => e.date = new Date(e.year,0,1));

const eventsLayer = g.append("g");
let events = eventsLayer.selectAll("g.event");

function drawEvents() {
  events = events.data(timelineEvents, d=>d.year);
  events.exit().remove();

  const enter = events.enter()
    .append("g")
    .attr("class","event");

  enter.append("line").attr("class","evline");
  enter.append("text")
    .attr("class","evyear")
    .attr("text-anchor","middle")
    .attr("font-size",11)
    .attr("font-weight",700)
    .attr("fill","#aaa");

  events = enter.merge(events);

  events.attr("transform", d => `translate(${x(d.date)},0)`);

  events.select(".evline")
    .attr("y1", yTop)
    .attr("y2", yBot)
    .attr("stroke","#6b7280")
    .attr("stroke-opacity",0.25)
    .attr("stroke-width",2);

  events.select(".evyear")
    .attr("y", yTop+20)
    .text(d => d.year);
}

/* ----------------------------
    HIGHLIGHT AXIS TICKS FOR WINDOW
-----------------------------*/
function highlightWindowOnAxis() {
  const start = windowStart;
  const end = windowStart + WINDOW_SIZE_YEARS - 1;

  botAxisG.selectAll("text")
    .style("fill", d => {
      const y = d.getFullYear();
      return (y >= start && y <= end) ? "#ffffff" : "rgba(255,255,255,0.35)";
    })
    .style("opacity", d => {
      const y = d.getFullYear();
      return (y >= start && y <= end) ? 1 : 0.25;
    })
    .style("font-weight", d => {
      const y = d.getFullYear();
      return (y >= start && y <= end) ? 700 : 400;
    });

  botAxisG.selectAll("line")
    .style("stroke", d => {
      const y = d.getFullYear();
      return (y >= start && y <= end) ? "#ffffff" : "rgba(255,255,255,0.25)";
    })
    .style("stroke-width", d => {
      const y = d.getFullYear();
      return (y >= start && y <= end) ? 2 : 1;
    })
    .style("opacity", d => {
      const y = d.getFullYear();
      return (y >= start && y <= end) ? 0.9 : 0.25;
    });
}

/* ----------------------------
    WINDOW LABEL
-----------------------------*/
function updateWindowLabel() {
  const end = windowStart + WINDOW_SIZE_YEARS - 1;
  document.getElementById("window-label").textContent =
    `Window: ${windowStart}–${end}`;
}

/* ----------------------------
    DRAG-TO-PAN DOMAIN
-----------------------------*/
let dragActive = false;
let dragStartX = 0;
let dragStartDomainYears = null;

svg.on("mousedown", (e) => {
  dragActive = true;
  dragStartX = e.clientX;
  dragStartDomainYears = x.domain().map(d => d.getFullYear());
});

svg.on("mousemove", (e) => {
  if (!dragActive) return;

  const dx = e.clientX - dragStartX;
  const domainSpan = dragStartDomainYears[1] - dragStartDomainYears[0];
  const yearsMoved = (dx / W) * domainSpan;

  let newMin = dragStartDomainYears[0] - yearsMoved;
  let newMax = dragStartDomainYears[1] - yearsMoved;

  // clamp to absolute min/max dataset
  if (newMin < ABS_MIN_YEAR) {
    newMin = ABS_MIN_YEAR;
    newMax = newMin + domainSpan;
  }
  if (newMax > ABS_MAX_YEAR) {
    newMax = ABS_MAX_YEAR;
    newMin = newMax - domainSpan;
  }

  x.domain([new Date(newMin,0,1), new Date(newMax,0,1)]);
  update();
});

svg.on("mouseup", () => dragActive = false);
svg.on("mouseleave", () => dragActive = false);

/* ----------------------------
    SCROLL-TO-MOVE WINDOW
-----------------------------*/
let scrollAccumulator = 0;
const SCROLL_THRESHOLD = 90;

svg.on("wheel", (e) => {
  e.preventDefault();
  scrollAccumulator += e.deltaY;

  if (scrollAccumulator > SCROLL_THRESHOLD) {
    windowStart = Math.min(
      windowStart + WINDOW_STEP_YEARS,
      maxRelease - WINDOW_SIZE_YEARS + 1
    );
    scrollAccumulator = 0;
    update();
  }
  else if (scrollAccumulator < -SCROLL_THRESHOLD) {
    windowStart = Math.max(
      windowStart - WINDOW_STEP_YEARS,
      minRelease
    );
    scrollAccumulator = 0;
    update();
  }
});

/* ----------------------------
    FULL UPDATE PIPELINE
-----------------------------*/
function update() {
  renderAxes();
  renderGrid();
  drawLines(getFilteredData());
  drawEvents();
  highlightWindowOnAxis();
  updateWindowLabel();
}

/* ----------------------------
    INITIAL RENDER
-----------------------------*/
update();
