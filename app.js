

let filteredLetters = []; // To store the filtered letters

window.onload = function() {
  // Other initialization code if necessary

  document.getElementById('applyFilterBtn').addEventListener('click', function() {
    const filterValue = document.getElementById('filterLetter').value;
    filteredLetters = filterValue.toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
    updateFilterDisplay();
    updateCompanies();
  });

  document.getElementById('undoFilterBtn').addEventListener('click', function() {
    filteredLetters = [];
    updateFilterDisplay();
    updateCompanies();
  });

  updateCompanies();
};

function updateFilterDisplay() {
  const filterListElement = document.getElementById('filterList');
  if (filteredLetters.length > 0) {
    filterListElement.textContent = filteredLetters.join(', ');
  } else {
    filterListElement.textContent = 'None';
  }
}

// Set up size
var mapWidth = 620;
var mapHeight = 800;

// Set up projection
var projection = d3.geoConicConformal()
  .parallels([37 + 4 / 60, 38 + 26 / 60])
  .rotate([120 + 30 / 60], 0)
  .fitSize([mapWidth, mapHeight], { type: "LineString", coordinates: [[-122.546, 37.989], [-121.741, 37.193]] });

// Add SVG to the body
var svg = d3.select('body').append('svg')
  .attr('width', mapWidth)
  .attr('height', mapHeight);

// Add map image
svg.append('image')
  .attr('width', mapWidth)
  .attr('height', mapHeight)
  .attr('xlink:href', 'map.png');

function addLocation(x, y, id) {
  var locationGroup = svg.append('g')
    .attr('id', id)
    .attr('transform', 'translate(' + x + ',' + y + ')')
    .call(d3.drag().on("drag", function(event) {
      d3.select(this).attr("transform", "translate(" + event.x + "," + event.y + ")");
      updateCompanies();
    }));

  var circle = locationGroup.append('circle')
    .attr('cx', 0)
    .attr('cy', 0)
    .attr('r', 100) // Default radius
    .attr('fill', 'none')
    .attr('stroke', 'blue');

  var star = d3.symbol().type(d3.symbolStar).size(40); // size is arbitrary

  var center = locationGroup.append('path')
    .attr('d', star)
    .attr('fill', 'black')
    .attr('stroke', 'none')
    .attr('transform', 'translate(0,0)')
    .call(d3.drag().on("drag", function(event, d) {
      var dx = event.x;
      var dy = event.y;
      d3.select(this).attr("transform", "translate(" + dx + "," + dy + ")");
      circle.attr("cx", dx).attr("cy", dy);
      updateCompanies();
    }));

  return { group: locationGroup, circle: circle, center: center };
}

var locationA = addLocation(100, 100, "locationA");
var locationB = addLocation(200, 200, "locationB");



function updateCompanies() {
  svg.selectAll(".company")
    .style("fill", function(d) {
      // Get circle centers
      var centerA = [parseFloat(locationA.circle.attr("cx")) + locationA.group.node().getCTM().e, parseFloat(locationA.circle.attr("cy")) + locationA.group.node().getCTM().f];
      var centerB = [parseFloat(locationB.circle.attr("cx")) + locationB.group.node().getCTM().e, parseFloat(locationB.circle.attr("cy")) + locationB.group.node().getCTM().f];
      
      // Calculate distances to circle centers
      var distanceToA = Math.sqrt((d.x - centerA[0]) ** 2 + (d.y - centerA[1]) ** 2);
      var distanceToB = Math.sqrt((d.x - centerB[0]) ** 2 + (d.y - centerB[1]) ** 2);
      
      // Get radii of circles
      var radiusA = parseFloat(locationA.circle.attr("r"));
      var radiusB = parseFloat(locationB.circle.attr("r"));

      

      // Check if the company is within the intersection of the two circles
      if (distanceToA <= radiusA && distanceToB <= radiusB) {
        return "red"; // Inside both circles
      }
      return "gray"; // Outside one or both circles
    })
    .attr("opacity", function(d) {
      // Check if the company name starts with any of the filtered letters
      var startsWithFilteredLetter = filteredLetters.length > 0 ? filteredLetters.some(letter => d.name.toLowerCase().startsWith(letter.toLowerCase())) : false;

      // Set opacity based on conditions
      return !startsWithFilteredLetter ? 1 : 0.2;
    });
}

// Add functionality to sliders
d3.select("#sliderA").on("input", function() {
  locationA.circle.attr("r", this.value);
  updateCompanies();
});

d3.select("#sliderB").on("input", function() {
  locationB.circle.attr("r", this.value);
  updateCompanies();
});

// Load software companies data
d3.csv("data.csv").then(function(data) {
  // Convert latitude and longitude to pixel positions
  var companies = data.map(function(d) {
    var rating = parseFloat(d.Average_Rating);
    if (isNaN(rating)) rating = null; // Convert missing ratings to null
    var coords = projection([+d.Longitude, +d.Latitude]);
    return { x: coords[0], y: coords[1], name: d.Name, rating: rating };
  });

  var companyCircles = svg.selectAll(".company")
    .data(companies)
    .enter().append("circle")
    .attr("class", "company")
    .attr("cx", function(d) { return d.x; })
    .attr("cy", function(d) { return d.y; })
    .attr("r", 3)
    .attr("fill", "black") // default color
    .on("mouseover", function(event, d) {
      // Change color of the company circle
      d3.select(this).attr("fill", "green");

      // Update company information in the table
      d3.select("#company-name").text(d.name);
      d3.select("#average-rating").text(d.rating ? d.rating : "N/A");
    })
    .on("mouseout", function() {
      // Reset color of the company circle
      d3.select(this).attr("fill", "black");
      // Clear company information in the table
      d3.select("#company-name").text("N/A");
      d3.select("#average-rating").text("N/A");
    });

  // Initialize the companies' colors
  updateCompanies();
});

