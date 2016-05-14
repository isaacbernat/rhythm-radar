// init data
const svg = d3.select("#rhythm-radar"),
    width = +svg.attr("width"),
    height = +svg.attr("height"),
    radius = Math.min(width, height) / 1.9,
    ri = {"inner": 0.2, "outer": 0.6} // radiusIntervals
    bodyRadius = radius / 23,
    dotRadius = bodyRadius - 8,
    pi = Math.PI,
    instrumentNames = {},
    instruments = [{"name": "metronome"},
                   {"name": "hi-hat"},
                   {"name": "snare"},
                   {"name": "kick"},
                   {"name": "tom"}],
    timeInfo = getTimeInfo(),
    color = d3.scaleWarm().domain([0, instruments.length]);

instruments.forEach(function(d, i) {
  instrumentNames[d.name] = i;
});
instruments.forEach(function(d, i) {
  const scale = i * (ri.outer - ri.inner)/(instruments.length - 1);
  d.radius = (ri.inner + scale) * radius;

});
updateAngleConstants();

// init svg
svg.append("defs");
instruments.forEach(function(d, i) {
  calculateGradient(i);
});

const arcBody = d3.arc()
    .startAngle(0)
    .endAngle(function(d) { return 0.25 * -pi })
    .innerRadius(function(d) { return d.radius - bodyRadius; })
    .outerRadius(function(d) { return d.radius + bodyRadius; });

const g = svg.append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

const body = g.append("g")
    .attr("class", "bodies")
  .selectAll("g")
    .data(instruments)
  .enter().append("g");

body.append("path")
    .attr("d", function(d) {
      return arcBody(d);
    });

// set up callbacks
d3.timer(tick);
myGrooveWriter.myGrooveUtils.noteCallback = beat;

function updateTimeSignature() {  // callback from timeSigPopupClose
  timeInfo.signature = getTimeInfo().signature;
  updateAngleConstants();
}

function tick(elapsed) {
  var now = d3.now();
  instruments.forEach(function(d) {
    const start = d3.timeMinute(now),
          end = d3.timeMinute.offset(start, 1);
    d.angle = (now - start) / (end - start) * d.angleConstant % 360;
  });
  body
      .style("fill", function(d, i) { return "url(#gradient" + i + ")"; })
      .attr("transform", function(d) { return "rotate(" + d.angle + ")"; });
}

function beat(note_type) {
  const i = instrumentNames[note_type];
  if (timeInfo.BPM != this.getTempo()) {
    timeInfo.BPM = this.getTempo();
    updateAngleConstants();
  }
  const id = "id" + d3.now().toString().replace(".", "");
  var ss = ri.inner + (2 + i) * (ri.outer - ri.inner)/(instruments.length -1) * radius;
  const dot = d3.select("g").append("circle")
    .attr("cy", -ss)
    .attr("cx", 0)
    .attr("r", dotRadius)
    .attr("id", id)
    .style("fill", d3.color(color(i)))
    .attr("transform", function(d) { return "rotate(" + instruments[i].angle + ")"; });
  const fadeoutTime = (60000/timeInfo.BPM * timeInfo.signature[0]/timeInfo.signature[1] * 4 * 1.5);
  dot.style("opacity", 1)
    .transition().duration(fadeoutTime).style("opacity", 0).remove();
}

// utils
function calculateGradient(i) {
  const gradient = svg.select("defs")
  .append("linearGradient")
    .attr("id", "gradient" + i)
    .attr("x1", "0%").attr("y1", "0%")
    .attr("x2", "100%").attr("y2", "0%")

  gradient.append("stop")
    .attr("offset", "0%")
    .attr("stop-opacity", 0)

  gradient.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", d3.color(color(i)))
    .attr("stop-opacity", 0.5);
}

function getTimeInfo() {
  const tsRegexp = new RegExp("TimeSig=([0-9]+/[0-9]+)");
  const bpmRegexp = new RegExp("Tempo=([0-9]+)");
  const newTS = tsRegexp.exec(window.location.search);
  const newBPM = bpmRegexp.exec(window.location.search);
  return {"signature": newTS? newTS[1].split("/"):[4, 4],
          "BPM": newBPM? newBPM[1]:80};
}

function updateAngleConstants() {
  instruments.forEach(function(d){
    d.angleConstant = (timeInfo.BPM/(timeInfo.signature[0]/timeInfo.signature[1] * 4) * 360.0);
  });
}
