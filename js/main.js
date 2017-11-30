// Creates a bootstrap-slider element
$("#yearSlider").slider({
    tooltip: 'always',
    tooltip_position:'bottom'
});
// Listens to the on "change" event for the slider
$("#yearSlider").on('change', function(event){
    // Update the chart on the new value
    updateChart(event.value.newValue);
});
var nodes;
var width = document.getElementById('main').offsetWidth;
var height = width / 2;

var locData;
var locNodes;

var graticule = d3.geoGraticule();

var projection = d3.geoMercator()
    .translate([(width/2), (height/2)])
    .scale( width / 2 / Math.PI);

var path = d3.geoPath().projection(projection);

var svg = d3.select("#main").append("svg")
      .attr("width", width)
      .attr("height", height)
      .on("click", click)
      .append("g");

var g = svg.append("g");

d3.json("data/world-topo-min.json", function(error, world) {
    var countries = topojson.feature(world, world.objects.countries).features;
    setupMap(countries);
});

//additional dataset for location lat,long
d3.csv("data/World_Cities_Location.csv", function(err, dataset2) {
    locData = dataset2;
    locNodes = d3.nest().key(function(d){
        return d.City;
    })
    .entries(locData);
    // console.log(locNodes);
});

function setupMap(countries) {

    svg.append("path")
        .datum(graticule)
        .attr("class", "graticule")
        .attr("d", path);

    var country = g.selectAll(".country").data(countries);

    // Draw the world map
    country.enter().insert("path")
        .attr("class", "country")
        .attr("d", path)
        .attr("id", function(d,i) { return d.id; })
        .attr("title", function(d,i) { return d.properties.name; })
        .style("fill", function(d, i) { return d.properties.color; });


    // Project location of data points on the map
    d3.csv("data/aircraft_incidents_edit.csv", function(err, dataset) {

        // dataset.forEach(function(d){
        //     projectPoints(d.Longitude, d.Latitude, d.Location );
        // });

        allData = dataset;
        nodes = d3.nest()
            .key(function(d){
                return d.Event_Date;
            })
            .entries(allData);

        updateChart(1995);
    });

    // TODO: Filter data by years and update the map with year slider
    //updateChart(1952);
}

function updateChart(year) {
    var filteredValues = nodes.filter(function(d) { return d.key.includes(year); });
    var geo_point = g.selectAll('.geo_point')
        .data(filteredValues, function(d) {
            return d;
        });
    //var x = projection([lat,lon])[0];
    //var y = projection([lat,lon])[1];
    var radius = 3;
    var x = 0;
    var y = 0;

    var geo_enter = geo_point.enter()
        .append('g')
        .attr('class', 'geo_point');

    geo_point.merge(geo_enter);

    geo_enter.append("svg:circle")
        .attr("cx", function(d) {
            if (d.values[0].Latitude.length != 0) {
            	x = projection([d.values[0].Longitude,d.values[0].Latitude])[0];
                return x;
            } else {
                var locName = d.values[0].Location.split(',');
                
                var locFilteredValue = locNodes.filter(function(d) {
                    if (d.key.toLowerCase() == locName[0].toLowerCase()) {
                        return d.key;
                    };
                });
                if (typeof(locFilteredValue[0]) !== 'undefined') {
                    var lon2 = locFilteredValue[0].values[0].Longitude;
                    var lat2 = locFilteredValue[0].values[0].Latitude;
                    x = projection([lon2, lat2])[0];
                    //console.log(x);
                    return x;
                }
            }
        })
        .attr("cy", function(d) {
            if (d.values[0].Latitude.length != 0) {
            	y = projection([d.values[0].Longitude, d.values[0].Latitude])[1];
                return y;
            } else {
                var locName = d.values[0].Location.split(',');
                var locFilteredValue = locNodes.filter(function(d) {
                    if (d.key.toLowerCase() == locName[0].toLowerCase()) {
                        return d.key;
                    };
                });
                if (typeof(locFilteredValue[0]) !== 'undefined') {
                    var lon2 = locFilteredValue[0].values[0].Longitude;
                    var lat2 = locFilteredValue[0].values[0].Latitude;
                    y = projection([lon2, lat2])[1];
                    //console.log(y);
                    return y;
                }
            }
        })
        .attr("class","point")
        .attr("r", radius);
    // TODO: replace text by hover triggered tooltip window

    var div;
    if (x != 0) {
      console.log(x);
	    geo_point.on("mouseover", function() {
          console.log("something");
	        div = d3.select(this).append("text")
	          .text(loc)
	          .attr("x", x + 5)
	          .attr("y", y + 5)
	          .attr("class","text");
	        div.style("visibility", "visible"); })
	      .on("mouseout", function() {
	        div.style("visibility", "hidden"); });
	  }
    geo_point.exit().remove()

}

function click() {
    var latlon = projection.invert(d3.mouse(this));
}

function projectPoints(lat,lon,loc) {

    if (typeof(lat) !== 'undefined') {

      var geo_point = g.append("g").attr("class", "geo_point");
      var x = projection([lon,lat])[0];
      var y = projection([lon,lat])[1];
      var radius = 3

      geo_point.append("svg:circle")
          .attr("cx", x)
          .attr("cy", y)
          .attr("class","point")
          .attr("r", radius);

      var div;
      geo_point.on("mouseover", function() {
          div = d3.select(this).append("text")
            .text(loc)
            .attr("x", x + 5)
            .attr("y", y + 5)
            .attr("class","text");
          div.style("visibility", "visible"); })
        .on("mouseout", function() {
          div.style("visibility", "hidden"); });
  }

}
