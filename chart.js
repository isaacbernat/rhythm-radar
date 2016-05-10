
var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height"),
    radius = Math.min(width, height) / 1.9,
    radiusIntervals = {"inner": 0.2, "outer": 0.6}
    bodyRadius = radius / 23,
    dotRadius = bodyRadius - 8;

var pi = Math.PI;

var numberOfInstruments = 5;
var instruments = [];
var ri = radiusIntervals;
for (i = 0; i < numberOfInstruments; i++) {
  var bar = [4, 4],
      bpm = 90;

    var scale = i * (ri["outer"] - ri["inner"])/(numberOfInstruments - 1);
    instruments.push({
      radius: (ri["inner"] + scale) * radius,
      text: "instrument " + i,
      bpm: bpm,
      bar: bar,
      angleConstant: bpm/bar[0] * 360.0});
}

var color = d3.scaleWarm()
    .domain([0, instruments.length]);
svg.append("defs");
instruments.forEach(function(d, i) { calculateGradient(i) });

var arcBody = d3.arc()
    .startAngle(0)
    .endAngle(function(d) { return 0.25 * -pi })
    .innerRadius(function(d) { return d.radius - bodyRadius; })
    .outerRadius(function(d) { return d.radius + bodyRadius; })

var arcTextPath = d3.arc()
    .startAngle(function(d) { return -bodyRadius / d.radius; })
    .endAngle(-pi)
    .innerRadius(function(d) { return d.radius; })
    .outerRadius(function(d) { return d.radius; });

var g = svg.append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

var body = g.append("g")
    .attr("class", "bodies")
  .selectAll("g")
    .data(instruments)
  .enter().append("g");

body.append("path")
    .attr("d", function(d) {
      return arcBody(d)
    });

body.append("path")
    .attr("class", "text-path")
    .attr("id", function(d, i) { return "body-text-path-" + i; })
    .attr("d", arcTextPath);

var bodyText = body.append("text")
    .attr("dy", ".35em")
  .append("textPath")
    .attr("xlink:href", function(d, i) { return "#body-text-path-" + i; });

d3.timer(tick);
for (i = 0; i < instruments.length; i++) {
  beat();
}

function tick(elapsed) {
  var now = d3.now();

  instruments.forEach(function(d) {
    var start = d3.timeMinute(now),
        end = d3.timeMinute.offset(start, 1);
    d.angle = (now - start) / (end - start) * d.angleConstant % 360;
  });
  body
      .style("fill", function(d, i) { return "url(#gradient" + i + ")"; })
      .attr("transform", function(d) { return "rotate(" + d.angle + ")"; });

  bodyText
      .attr("startOffset", function(d, i) { return d.angle <= 90 || d.angle > 270 ? "100%" : "0%"; })
      .attr("text-anchor", function(d, i) { return d.angle <= 90 || d.angle > 270 ? "end" : "start"; })
      .text(function(d) { return d.bpm + " BPM"; });
}

function calculateGradient(i) {
  var gradient = svg.select("defs")
  .append("linearGradient")
    .attr("id", "gradient" + i)
    .attr("x1", "0%").attr("y1", "0%")
    .attr("x2", "100%").attr("y2", "0%")

    gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-opacity", 0);

    gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", d3.color(color(i)).darker(2))
        .attr("stop-opacity", 1);
}

function beat() {
  var i = Math.floor(Math.random() * numberOfInstruments)
  var id = "id" + d3.now().toString().replace(".", "");

  var ss = ri["inner"] + (2 + i) * (ri["outer"] - ri["inner"])/(numberOfInstruments -1) * radius;
  var dot = d3.select("g").append("circle")
    .attr("cy", -ss)
    .attr("cx", 0)
    .attr("r", dotRadius)
    .attr("id", id)
    .style("fill", d3.color(color(i)).brighter(1))
    .attr("transform", function(d) { return "rotate(" + instruments[i].angle + ")"; });
  var fadeoutTime = 60000/instruments[i].bpm * instruments[i].bar[0];
  d3.timeout(beat, fadeoutTime/8 + Math.random() * fadeoutTime/4)
  dot.style("opacity", 1)
    .transition().duration(fadeoutTime).style("opacity", 0).remove();
}
