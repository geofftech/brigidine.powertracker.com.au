var serial = "id26191";

function clickButton(range) {
  $(".getdatabtn").removeClass("btn-primary");
  $("#getdata" + range).addClass("btn-primary");
  getConsumption(range);
  getLastYear(range);
  drawChart(range);
}

function getLivePower() {
  var url =
    "https://www.powertracker.com.au/query/sys/sensor/" +
    serial +
    "/power/public";
  console.log("getLivePower", url);
  $.ajax({
    url: url,
    dataType: "json",
    success: function(data) {
      console.log("getLivePower", data);
      eng = engineeringNotation(data.power.value, "W");
      $("#livepowervalue").text(eng.value);
      $("#livepowerunits").text(eng.units);
    }
  });
}

function getConsumption(range) {
  var url =
    "https://www.powertracker.com.au/query/sys/range/" +
    serial +
    "/power/" +
    range +
    "/now/public";
  console.log("getConsumption", range, url);
  $.ajax({
    url: url,
    dataType: "json",
    success: function(data) {
      console.log("getConsumption", data);
      var eng;

      // Consumption
      eng = engineeringNotation(data.power.hourly, "Wh");
      console.log("Consumption", eng);
      $("#consumptionvalue").text(eng.value);
      $("#consumptionunits").text(eng.units);

      // Green House
      eng = engineeringWeight(data.power.hourly * 1.444, "CO<sub>2</sub>");
      console.log("Green house", eng);
      $("#greenhousevalue").text(eng.value);
      $("#greenhouseunits").html(eng.units);
      $("#money").text(Math.round(data.power.hourly / 4000, 2));

      // Target
      var targetarr = {
        day: 6160,
        week: 43270,
        monthto: 187500,
        year: 2250000
      };
      var target = targetarr[range];
      var portion = data.power.hourly / target;
      $("#target").text(portion.toFixed(0) + "%");

      // Chart
      if (portion > 100) portion = 100;
      var ctx = document.getElementById("chart");
      var data = {
        datasets: [
          {
            data: [100 - portion, portion],
            backgroundColor: ["#000000", "#50864D"],
            label: "Monthly Target" // for legend
          }
        ],
        labels: ["Shortfall", "Achieved"]
      };
      var options = {
        responsive: true,
        maintainAspectRatio: false,
        legend: {
          display: false
        }
      };
      var myDoughnutChart = new Chart(ctx, {
        type: "doughnut",
        data: data,
        options: options
      });
    }
  });
}

function getLastYear(range) {
  var url =
    "https://www.powertracker.com.au/query/sys/range/" +
    serial +
    "/power/" +
    range +
    "/-1 year/public";
  console.log("getLastYear", range, url);
  $.ajax({
    url: url,
    dataType: "json",
    success: function(data) {
      console.log("getLastYear", data);
      var eng;

      // Green House
      eng = engineeringWeight(data.power.hourly * 1.444, "CO<sub>2</sub>");
      console.log("Green house", eng);
      $("#lastyearvalue").text(eng.value);
      $("#lastyearunits").html(eng.units);
    }
  });
}

function drawChart(range) {
  var url =
    "https://www.powertracker.com.au/query/sys/chart/" +
    serial +
    "/power/hourly/" +
    range +
    "/now/public";
  console.log("drawChart", url);
  $.ajax({
    url: url,
    dataType: "json",
    success: function(response) {
      // remove null values as they cause a chart error
      for (var i in response.values) {
        //console.log('loop', i, response.values[i]);
        if (response.values[i] == null) response.values[i] = 0;
      }

      console.log("drawChart", response);
      $("#mainChart").replaceWith(
        '<canvas id="mainChart" height="400"></canvas>'
      );
      var ctx = document.getElementById("mainChart");
      var data = {
        labels: response["labels"],
        datasets: [
          {
            label: "# of Values",
            data: response["values"],
            backgroundColor: "rgba(102,161,101,0.4)",
            borderColor: "rgba(1102,161,101,1)",
            borderWidth: 1
          }
        ]
      };
      var options = {
        responsive: true,
        maintainAspectRatio: false,
        legend: {
          display: false,
          position: "right",
          labels: {
            fontColor: "#FFFFFF"
          }
        },
        scales: {
          yAxes: [
            {
              ticks: {
                beginAtZero: true
              },
              scaleLabel: {
                display: true,
                labelString: "Energy (Wh)"
              }
            }
          ]
        }
      };
      var myChart = new Chart(ctx, {
        type: "line",
        data: data,
        options: options
      });
    }
  });
}

function engineeringNotation(number, units) {
  if (number == null) {
    return {
      value: "-",
      units: ""
    };
  }
  var exp = 0;
  while (number > 1000) {
    exp++;
    number = number / 1000;
  }
  if (number > 100) {
    number = number.toFixed(0);
  } else if (number > 10) {
    number = number.toFixed(1);
  } else {
    number = number.toFixed(2);
  }
  var prefixes = { 0: "", 1: "k", 2: "M", 3: "G" };
  return {
    value: number,
    units: prefixes[exp] + units
  };
}

function engineeringWeight(grams, units) {
  if (grams == null) {
    return {
      value: "-",
      units: ""
    };
  }
  var exp = 0;
  while (grams > 1000) {
    exp++;
    grams = grams / 1000;
  }
  if (grams > 100) {
    grams = grams.toFixed(0);
  } else if (grams > 10) {
    grams = grams.toFixed(1);
  } else {
    grams = grams.toFixed(2);
  }
  var prefixes = { 0: "g", 1: "kg", 2: "T", 3: "kT" };
  return {
    value: grams,
    units: prefixes[exp] + units
  };
}

$(document).ready(function() {
  getLivePower();
  clickButton("day");
});
