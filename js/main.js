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

var width = document.getElementById('main').offsetWidth;
var height = width / 2;

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
    d3.csv("data/aircraft_incidents.csv", function(err, dataset) {

        dataset.forEach(function(d){
            projectPoints(d.Longitude, d.Latitude, d.Location );
        });

    });

    // TODO: Filter data by years and update the map with year slider
}

function click() {
    var latlon = projection.invert(d3.mouse(this));
    console.log(latlon);
}

function projectPoints(lat,lon,loc) {

    var geo_point = g.append("g").attr("class", "geo_point");
    var x = projection([lat,lon])[0];
    var y = projection([lat,lon])[1];

    geo_point.append("svg:circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("class","point")
        .attr("r", 3);
    // TODO: replace text by hover triggered tooltip window
/*
    var tooltip = d3.select("body").append("text")
                    .append("div")
                    .style("opacity", 0)
                    .text(loc)
                    .attr("x", x + 5)
                    .attr("y", y + 5);
                    //.attr("class","text");
    geo_point.on("mouseover", function() { console.log(loc);
      return tooltip.style("opacity", 1);})
    geo_point.on("mouseout", function() { return tooltip.style("opacity", 0);})
*/
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
          //.on("mouseout", );


    /*
    geo_point.on("mouseover", function() {
        //console.log(this);
        d3.select(this).append("text")
          .text(loc)
    //.append("text")
          .attr("x", x + 5)
          .attr("y", y + 5)
          .attr("class","text")
          .style("visibility", visible); });
          //.on("mouseout", );
        //.text(loc);
    */

}
