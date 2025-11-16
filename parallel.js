/*  Parallel Coordinates — YEAR granularity (Setting Year ↔ Release Year)
    - No zoom/pan
    - Scroll wheel changes decade (Release Year filter)
    - Fade-in/out transitions for decade switch
    - Highlight active decade on axis; others fade
*/

import data_raw from "./settingdataraw.js";
const raw = data_raw;

// ---------------------------------------------------------
// TIMELINE EVENTS
// ---------------------------------------------------------
const timelineEvents = [
  { id: "ev-2001", label: "Dot-Com Bust", year: 2001, desc: "Tech bubble deflates" },
  { id: "ev-2008", label: "Financial Crisis", year: 2008, desc: "Global credit crunch" },
  { id: "ev-2015", label: "Streaming Boom", year: 2015, desc: "OTT platforms surge" },
  { id: "ev-2020", label: "COVID-19",      year: 2020, desc: "Theatrical shutdowns" }
];
timelineEvents.forEach(e => e.date = new Date(+e.year, 0, 1));


// ---------------------------------------------------------
// SVG SETUP
// ---------------------------------------------------------
const svg = d3.select("#parallel");
const { width: svgW, height: svgH } = svg.node().getBoundingClientRect();

const margin = { top: 60, right: 40, bottom: 60, left: 60 };
const width  = svgW - margin.left - margin.right;
const height = svgH - margin.top - margin.bottom;

const g = svg.append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);


// ---------------------------------------------------------
// DATA PREP
// ---------------------------------------------------------
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


// ---------------------------------------------------------
// INITIAL DECADE FILTER (latest decade in data)
// ---------------------------------------------------------
let currentDecade = Math.floor(d3.max(data, d => d.endYear) / 10) * 10;
let currentData = filterDecade(currentDecade);

function filterDecade(decade) {
  return data.filter(d => d.endYear >= decade && d.endYear <= decade + 9);
}


// ---------------------------------------------------------
// SCALES — domain snapped to decade boundaries
// ---------------------------------------------------------
const minYear = d3.min([
  d3.min(data, d => Math.min(d.startYear, d.endYear)),
  d3.min(timelineEvents, d => d.year)
]);

const maxYear = d3.max([
  d3.max(data, d => Math.max(d.startYear, d.endYear)),
  d3.max(timelineEvents, d => d.year)
]);

// ---------------------------------------------
// LIMIT THE DECADE RANGE SHOWN ON AXIS
// ---------------------------------------------

// auto-snap min to dataset (optional)
let snappedMin = 1930;

// HARD CAP the max decade by choosing a limit you want
// e.g. cap at 2030 or 2020 or whatever you want
let snappedMax = 2080;  

// Optional: also limit the minimum decade
// snappedMin = 1980;   // Uncomment to force lower bound

const domain = [
  new Date(snappedMin, 0, 1),
  new Date(snappedMax, 0, 1)
];

const x = d3.scaleTime()
  .domain(domain)
  .range([0, width]);

const xCurrent = x;

const yTop = 30;
const yBot = height - 30;


// ---------------------------------------------------------
// COLOR & WIDTH ENCODINGS
// ---------------------------------------------------------
const diffExtent = d3.extent(data, d => d.yearDiff);

const color = () => "#ffffff";  // pure white lines

const widthScale = d3.scaleSqrt()
  .domain(diffExtent)
  .range([1.5, 5]);


// ---------------------------------------------------------
// CLIP PATH
// ---------------------------------------------------------
const defs = svg.append("defs");
defs.append("clipPath")
  .attr("id", "clip")
  .append("rect")
  .attr("x", 0)
  .attr("y", 0)
  .attr("width", svgW)
  .attr("height", svgH);


// ---------------------------------------------------------
// GRIDLINES
// ---------------------------------------------------------
const gridGroup = g.append("g").attr("class", "grid").attr("clip-path", "url(#clip)");

function drawGrid(scaleX) {
  const ticks = scaleX.ticks(d3.timeYear.every(1));
  const lines = gridGroup.selectAll("line").data(ticks, d => d.getFullYear());

  lines.enter().append("line")
    .attr("y1", yTop)
    .attr("y2", yBot)
    .merge(lines)
    .attr("x1", d => scaleX(d))
    .attr("x2", d => scaleX(d));

  lines.exit().remove();
}


// ---------------------------------------------------------
// AXES
// ---------------------------------------------------------
const topAxisG = g.append("g")
  .attr("class", "axis")
  .attr("transform", `translate(0,${yTop})`);

const bottomAxisG = g.append("g")
  .attr("class", "axis")
  .attr("transform", `translate(0,${yBot})`);

function yearTicks(scaleX, maxCount = 12) {
  const [d0, d1] = scaleX.domain();
  const y0 = d0.getFullYear();
  const y1 = d1.getFullYear();
  const step = 10; // decades
  return d3.range(y0, y1 + 1, step).map(y => new Date(y, 0, 1));
}

function renderAxes(scaleX) {
  const ticks = yearTicks(scaleX);
  const fmt = d3.timeFormat("%Y");

  topAxisG.call(d3.axisTop(scaleX).tickValues(ticks).tickFormat(fmt).tickSizeOuter(0));
  bottomAxisG.call(d3.axisBottom(scaleX).tickValues(ticks).tickFormat(fmt).tickSizeOuter(0));
}

// titles
g.append("text")
  .attr("class", "axis-title")
  .attr("x", 0)
  .attr("y", yTop - 18)
  .text("Setting Year");

g.append("text")
  .attr("class", "axis-title")
  .attr("x", 0)
  .attr("y", yBot + 30)
  .text("Release Year");


// ---------------------------------------------------------
// AXIS HIGHLIGHT FUNCTION
// ---------------------------------------------------------
function highlightDecade(scaleX, decade) {

  d3.selectAll(".axis text").each(function(d) {
    if (!d) return;
    const year = d.getFullYear();
    const selected = year >= decade && year <= decade + 9;

    d3.select(this)
      .transition().duration(250)
      .style("opacity", selected ? 1 : 0.25)
      .style("font-weight", selected ? 800 : 500)
      .style("fill", selected ? "#000" : "#6b7280");
  });

  d3.selectAll(".axis .tick line").each(function(d) {
    if (!d) return;
    const year = d.getFullYear();
    const selected = year >= decade && year <= decade + 9;

    d3.select(this)
      .transition().duration(250)
      .style("stroke-opacity", selected ? 1 : 0.2)
      .style("stroke-width", selected ? 2 : 1);
  });
}


// ---------------------------------------------------------
// TOOLTIP
// ---------------------------------------------------------
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


// ---------------------------------------------------------
// LAYERS FOR LINKS
// ---------------------------------------------------------
const drawLayer = g.append("g").attr("clip-path", "url(#clip)");
let halosSel = drawLayer.selectAll(".halo");
let linksSel = drawLayer.selectAll(".link");


// ---------------------------------------------------------
// LINK INTERACTIONS
// ---------------------------------------------------------
function attachLinkHandlers(selection) {
  selection
    .on("mousemove", function(event, d) {
      const [cx, cy] = d3.pointer(event, document.body);
      showTip(`
        <div class="title">${d.label}</div>
        <div class="sub">Setting: <b>${d.startYear}</b></div>
        <div class="sub">Release: <b>${d.endYear}</b></div>
        <div class="sub">Difference: <b>${d.yearDiff}</b></div>
      `, cx, cy);

      d3.select(this)
        .raise()
        .attr("stroke-width", widthScale(d.yearDiff) + 1.5);
    })
    .on("mouseout", function() {
      if (!pinnedId) hideTip();
      d3.select(this).attr("stroke-width", d => widthScale(d.yearDiff));
    })
    .on("click", function(event, d) {
      pinnedId = pinnedId === d.id ? null : d.id;

      if (!pinnedId) hideTip();
      else {
        const [cx, cy] = d3.pointer(event, document.body);
        showTip(`
          <div class="title">📌 ${d.label}</div>
          <div class="sub">Setting: <b>${d.startYear}</b></div>
          <div class="sub">Release: <b>${d.endYear}</b></div>
          <div class="sub">Difference: <b>${d.yearDiff}</b></div>
        `, cx, cy);
      }

      event.stopPropagation();
    });
}


// ---------------------------------------------------------
// LINK + HALO GENERATOR WITH FADE
// ---------------------------------------------------------
function straightLink(x1, y1, x2, y2) {
  return `M ${x1},${y1} L ${x2},${y2}`;
}

function rejoinAndPosition(scaleX, animate = false) {

  // ----- HALOS -----
  halosSel = halosSel.data(currentData, d => d.id);

  halosSel.exit()
    .transition().duration(350)
    .style("opacity", 0)
    .remove();

  const halosEnter = halosSel.enter()
    .append("path")
    .attr("class", "halo")
    .style("opacity", 0)
    .attr("d", d =>
      straightLink(scaleX(d.startDate), yTop, scaleX(d.endDate), yBot)
    );

  halosSel = halosEnter.merge(halosSel);

  if (animate) {
    halosSel.transition().duration(350)
      .style("opacity", 1)
      .attr("d", d =>
        straightLink(scaleX(d.startDate), yTop, scaleX(d.endDate), yBot)
      );
  } else {
    halosSel.style("opacity", 1)
      .attr("d", d =>
        straightLink(scaleX(d.startDate), yTop, scaleX(d.endDate), yBot)
      );
  }


  // ----- LINKS -----
  linksSel = linksSel.data(currentData, d => d.id);

  linksSel.exit()
    .transition().duration(350)
    .style("opacity", 0)
    .remove();

  const linksEnter = linksSel.enter()
    .append("path")
    .attr("class", "link")
    .attr("stroke", d => color(d.yearDiff))
    .attr("stroke-width", d => widthScale(d.yearDiff))
    .style("opacity", 0);

  attachLinkHandlers(linksEnter);

  linksSel = linksEnter.merge(linksSel);

  if (animate) {
    linksSel.transition().duration(350)
      .style("opacity", 1)
      .attr("d", d =>
        straightLink(scaleX(d.startDate), yTop, scaleX(d.endDate), yBot)
      );
  } else {
    linksSel.style("opacity", 1)
      .attr("d", d =>
        straightLink(scaleX(d.startDate), yTop, scaleX(d.endDate), yBot)
      );
  }

  drawEvents(scaleX);
}


// ---------------------------------------------------------
// TIMELINE EVENTS
// ---------------------------------------------------------
const eventsLayer = g.append("g").attr("clip-path", "url(#clip)");
let eventsSel = eventsLayer.selectAll("g.event");

function drawEvents(scaleX) {
  eventsSel = eventsSel.data(timelineEvents, d => d.id);
  eventsSel.exit()
    .transition().duration(350)
    .style("opacity", 0)
    .remove();

  const enter = eventsSel.enter().append("g")
    .attr("class", "event")
    .style("opacity", 0);

  // Light/low-opacity vertical lines
  enter.append("line")
    .attr("class", "event-vline")
    .attr("stroke", "#6b7280")
    .attr("stroke-width", 2.5)
    .attr("stroke-opacity", 0.18)
    .attr("stroke-dasharray", "6,6");

  enter.append("line")
    .attr("class", "event-halo")
    .attr("stroke", "#6b7280")
    .attr("stroke-width", 8)
    .attr("stroke-opacity", 0.08);

  enter.append("line")
    .attr("class", "event-hit")
    .attr("stroke", "transparent")
    .attr("stroke-width", 18);

  enter.append("line")
    .attr("class", "event-top-tick")
    .attr("stroke", "#6b7280")
    .attr("stroke-width", 2);

  enter.append("text")
    .attr("class", "event-year")
    .attr("font-size", 11)
    .attr("font-weight", 700)
    .attr("text-anchor", "middle")
    .attr("fill", "#6b7280");

  enter.append("text")
    .attr("class", "event-desc")
    .attr("font-size", 10)
    .attr("font-weight", 600)
    .attr("fill", "#4b5563");

  const merged = enter.merge(eventsSel);

  merged.attr("transform", d => `translate(${scaleX(d.date)},0)`);

  merged.select("line.event-vline")
    .attr("y1", yTop)
    .attr("y2", yBot);

  merged.select("line.event-halo")
    .attr("y1", yTop)
    .attr("y2", yBot);

  merged.select("line.event-hit")
    .attr("y1", yTop)
    .attr("y2", yBot);

  merged.select("line.event-top-tick")
    .attr("x1", -4)
    .attr("x2", 4)
    .attr("y1", yTop)
    .attr("y2", yTop + 8);

  merged.select("text.event-year")
    .attr("y", yTop + 20)
    .text(d => d.year);

  const midY = (yTop + yBot) / 2;
  const rightOffset = 6;

  merged.select("text.event-desc")
    .attr("x", rightOffset)
    .attr("y", midY)
    .attr("transform", `rotate(-270, ${rightOffset}, ${midY})`)
    .attr("text-anchor", "start")
    .text(d => d.desc ?? d.label);

  merged.transition().duration(350).style("opacity", 1);

  merged.selectAll("line")
    .on("mousemove", (event, d) => {
      const [cx, cy] = d3.pointer(event, document.body);
      showTip(`
        <div class="title">${d.label}</div>
        <div class="sub">Year: <b>${d.year}</b></div>
        ${d.desc ? `<div class="sub">${d.desc}</div>` : ""}
      `, cx, cy);
    })
    .on("mouseout", () => { if (!pinnedId) hideTip(); });
}


// ---------------------------------------------------------
// SCROLL-TO-CHANGE-DECADE (low sensitivity + highlight)
// ---------------------------------------------------------
let scrollAccumulator = 0;
const SCROLL_THRESHOLD = 180;
// Limits
const MIN_DECADE = snappedMin;
const MAX_DECADE = snappedMax;   // because a decade spans 10 years

svg.on("wheel", (event) => {
  event.preventDefault();
  scrollAccumulator += event.deltaY;

  if (scrollAccumulator > SCROLL_THRESHOLD) {
    const nextDecade = currentDecade - 10;
    scrollAccumulator = 0;

    // PREVENT GOING BELOW MIN
    if (nextDecade < MIN_DECADE) return;

    currentDecade = nextDecade;
  } 
  else if (scrollAccumulator < -SCROLL_THRESHOLD) {
    const nextDecade = currentDecade + 10;
    scrollAccumulator = 0;

    // PREVENT GOING ABOVE MAX
    if (nextDecade > MAX_DECADE) return;

    currentDecade = nextDecade;
  } 
  else {
    return;
  }

  currentData = filterDecade(currentDecade);
  rejoinAndPosition(xCurrent, true);
  highlightDecade(xCurrent, currentDecade);
});


// ---------------------------------------------------------
// INITIAL RENDER
// ---------------------------------------------------------
renderAxes(xCurrent);
drawGrid(xCurrent);
rejoinAndPosition(xCurrent);
drawEvents(xCurrent);

// Immediately highlight the starting decade
highlightDecade(xCurrent, currentDecade);
