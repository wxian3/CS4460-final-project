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
var airCarrierNodes;
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

        allData = dataset;
        nodes = d3.nest()
            .key(function(d){
                return d.Event_Date;
            })
            .entries(allData);

        // TODO: Add Legend for color: red: Fatal, yellow: Incident, green: Non-fatal
        // Filter data by years and update the map with year slider
        updateChart(1995);
    });
}

function updateChart(year) {
    var filteredValues = nodes.filter(function(d) {
        return d.key.includes(year);
    });
    //
    // making bar chart
    //
    var modelNodes = d3.nest()
        .key(function(d) {return d.values[0].Make;})
        .key(function(d) {return d.values[0].Model;})
        .rollup(function(leaves) {
            return leaves.length;
        })
        .entries(filteredValues);
    console.log(modelNodes);
    var xScale = d3.scaleBand().rangeRound([0, 100]).padding(0.1);
    var yScale = d3.scaleLinear().range([100, 0]);
    var xAxis = g.append('g')
        .attr('transform', 'translate(' + 100 + ',' + 200 + ')')
        .attr('class', 'x axis')
        .call(d3.axisBottom(xScale));
    var yAxis = g.append('g')
        .attr('class', 'y axis')
        .call(d3.axisLeft(yScale).ticks(10));

    var bar_chart = g.selectAll('.rect')
        .data(modelNodes);

    var bar_enter = bar_chart.enter()
        .append('rect')
        .attr('class', 'bar');

    bar_chart.merge(bar_enter);

    bar_enter.attr('x', function(d){
            // console.log(d.values[0].key);
            return xScale(d.values[0].key);
        })
        .attr('y', function(d){
            // console.log(d.values[0].value);
            return yScale(d.values[0].value);
        })
        .attr('width', xScale.bandwidth())
        .attr('height', function(d){return 100 - yScale(d.values[0].value);});

    ////
    //bar_end


    //
    // Making pie chart
    //
    airCarrierNodes = d3.nest()
        .key(function(d) {
            return d.values[0].Air_Carrier;
        })
        .sortKeys(d3.ascending)
        .rollup(function(leaves) {
            return leaves.length;
        })
        .entries(filteredValues);
        // console.log(airCarrierNodes);

    var pieWidth = 200,
        pieHeight = 200,
        pieRadius = Math.min(pieWidth, pieHeight) / 2;

    var color = d3.scaleOrdinal(d3.schemeCategory20);

    var arc = d3.arc()
        .outerRadius(pieRadius - 10)
        .innerRadius(0);

    var labelArc = d3.arc()
        .outerRadius(pieRadius - 40)
        .innerRadius(pieRadius - 40);

    var pie = d3.pie()
        .sort(null)
        .value(function(d) {
          // console.log(d.value);
          return d.value;});

    var pie_chart = g.selectAll('.arc')
        .data(pie(airCarrierNodes));

    var pie_enter = pie_chart.enter()
        .append('g')
        .attr('class', 'arc')
        .attr('transform', 'translate(' + 100 + ',' + 400 + ')');

    pie_chart.merge(pie_enter);

    pie_enter.append('path')
        .attr('d', arc)
        .style('fill', function(d) { return color(d.data.key);})
        .append('title')
        .text(function(d){
          if (d.data.key == '') {
              return 'Unknown';
          } else {
              return d.data.key;
          }
        });

    pie_enter.append('text')
        .attr("transform", function(d) { return "translate(" + labelArc.centroid(d) + ")"; })
        .attr("dy", ".35em")
        .style("font-size", "8px")
        .text(function(d) { return d.data.value; });
    //
    //pie_end

    var geo_point = g.selectAll('.geo_point')
        .data(filteredValues, function(d) {
            return d;
        });

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
            } else {
                // load location from extra dataset if not found in original dataset
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
                }
            }
            if (x == 0) {
                this.setAttribute('opacity', 0)
            }
            return x;
        })
        .attr("cy", function(d) {
            if (d.values[0].Latitude.length != 0) {
                y = projection([d.values[0].Longitude, d.values[0].Latitude])[1];
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
                }
            }
            if (y == 0) {
                this.setAttribute('opacity', 0)
            }
            return y;
        })
        .attr("class","point")
        .attr("r", function(d) {
            if (d.values[0].Injury_Severity == "Non-Fatal") {
                return 3
            } else if (d.values[0].Injury_Severity == "Incident") {
                return 5
            } else if (d.values[0].Injury_Severity.includes("Fatal")) {
                severity = d.values[0].Injury_Severity
                ind1 = severity.indexOf('(')
                ind2 = severity.indexOf(')')
                fatal_num = severity.substring(ind1 + 1, ind2)
                return 5 + parseInt(fatal_num) / 5
            } else {
                return 3
            }
        })
        .attr("fill", function(d) {
            if (d.values[0].Injury_Severity == "Non-Fatal") {
                return "green"
            } else if (d.values[0].Injury_Severity == "Incident") {
                return "yellow"
            } else if (d.values[0].Injury_Severity.includes("Fatal(")) {
                return "red"
            } else {
                return "white"
            }
        })
        .style('stroke', 'white')
        .attr("text", (function(d) {
            return d.values[0].Location;
        }))
        .on("mouseover", function() {
            // Display text information when mouse over the circle
            text = geo_enter.append("text")
                .attr("class", "text")
                .attr("x", parseInt(this.getAttribute('cx')) + 10)
                .attr("y", parseInt(this.getAttribute('cy')) - 5)
                .text(this.getAttribute('text'));
            text.transition()
                .duration(200)
                .style("opacity", 0.9);
        })
        .on("mouseout", function() {
            text.transition()
                .duration(500)
                .style("opacity", 0);
        });

    // TODO: replace text by hover triggered tooltip window

    bar_chart.exit().remove();
    pie_chart.exit().remove();
    geo_point.exit().remove();

}

function click() {
    var latlon = projection.invert(d3.mouse(this));
}
