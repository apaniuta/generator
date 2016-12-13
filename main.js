var sockjs_url = 'http://localhost:9999/generator';
var sockjs = new SockJS(sockjs_url);

var svg, data = [];

function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

// Set the dimensions of the canvas / graph
var	margin = {top: 30, right: 20, bottom: 30, left: 50},
    width = 600 - margin.left - margin.right,
    height = 270 - margin.top - margin.bottom;

var fromEvent = Rx.Observable.fromEvent;

var openStream = fromEvent(sockjs, 'open');
var closeStream = fromEvent(sockjs,'close');

var messageStream = fromEvent(sockjs, 'message')
    .delaySubscription(openStream)
    .takeUntil(closeStream);

openStream.subscribe(function () {
    console.log("Connection opened");
});

closeStream.subscribe(function () {
    console.log("Connection is closed...");
});

messageStream.subscribe(function (e) {
    if (isNumber(e.data)) {
        var obj = {
            value: parseFloat(e.data),
            date: Date.now()
        };

        if (data.length < 10) {
            data.push(obj);
        }

        data.shift();
        data.push(obj);

        x.domain(d3.extent(data, function(d) { return d.date; }));
        y.domain([0, d3.max(data, function(d) { return d.value; })]);

        svg.select("g.x.axis").call(xAxis);
        svg.select("g.y.axis").call(yAxis);
        svg.selectAll("path")
            .data([data])
            .attr("d", valueline(data));
    }
});

// Set the ranges
var	x = d3.time.scale().range([0, width])
    .domain([new Date(), new Date()]);
var	y = d3.scale.linear().range([height, 0])
    .domain([0, 0]);

//Define the axes
var	xAxis = d3.svg.axis().scale(x)
    .orient("bottom").ticks(5);

var	yAxis = d3.svg.axis().scale(y)
    .orient("left").ticks(5);

// Define the line
var	valueline = d3.svg.line()
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.value); });

var addBtn = document.getElementById('add_button'),
    stopBtn = document.getElementById('stop_button');

var handleAdd = function() {
    var DOMsvg = document.querySelector('svg');

    if (!DOMsvg) {
        sockjs.send('add');

        // Adds the svg canvas
        svg = d3.select("#root")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // Add the valueline path.
        svg.append("path")
            .data([data])
            .attr("class", "line")
            .attr("d", valueline(data));

        // Add the X Axis
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        // Add the Y Axis
        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis);
    }
};

addBtn.addEventListener('click', handleAdd);

var handleStop = function() {
    sockjs.send('stop');
};

stopBtn.addEventListener('click', handleStop);

