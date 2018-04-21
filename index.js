
function scrubAwayWaveUI() {
  window.setTimeout(function () {
    $(".sidebar").remove();
    $("canvas").css({"position" : "fixed", "top" : 0, "left" : 0, "right" : 0, "bottom" : 0, "z-index" : 0 });
  }, 100);
}

function generateRandomNumber(min, max, nearMean) {
  var rand = function(randMin, randMax) {
    return Math.floor(Math.random() * randMax) + randMin;
  }

  if (nearMean == true) {
    var diff = Math.abs(max - min) / 2;
    var meanMax = max - (diff / 2);
    var meanMin = min + (diff / 2);
    return rand(meanMin, meanMax);
  } else {
    return rand(min, max);
  }
}

function simulateTouch(cooldown) {
  $canvas = document.getElementsByTagName('canvas')[0];
  var e = document.createEvent('UIEvent');
// var e = $.Event("mousedown", { pageX: randX, pageY:randY } );

  var randX = generateRandomNumber(1, $canvas.width, false);
  var randY = $canvas.height / 2.0; //generateRandomNumber(1, $canvas.height, true);

  var downEventName = 'mousedown';
  var moveEventName = 'mousemove';
  var upEventName = 'mouseup';
  if (!!('ontouchstart' in window)) {
    downEventName = 'touchstart';
    upEventName = 'touchend';
    moveEventName = 'touchmove';
  }

  e.initUIEvent(downEventName, true, true);
  e.pageX = randX;
  e.pageY = randY;
  e.touches = [{pageX: randX, pageY: randY}];
  $canvas.dispatchEvent(e);

  setTimeout(function () {
    e.initUIEvent(moveEventName, true, true);
    var diff = 200;
    e.pageX = randX+diff;
    e.pageY = randY;
    e.touches = [{pageX: randX+diff, pageY: randY}];
    $canvas.dispatchEvent(e);
  }, 100);

  setTimeout(function () {
    e.initUIEvent(upEventName, true, true);
    $canvas.dispatchEvent(e);
  }, 100);

  setTimeout(function() {
    simulateTouch(cooldown);
  }, 300 + cooldown);''
}

function showAlert(message) {
  $("#alert-main").remove();

  var alertDiv = '<div id="alert-main" class="alert alert-warning">';
  alertDiv = alertDiv + message;
  alertDiv = alertDiv + '</div>';

  $("main").append(alertDiv);
}

function run() {
  var username = $("#username").val();
  var repository = $("#repository").val();

  if (username == null || username.length <= 0) {
    showAlert("⚠ Sorry, you forgot to put in a Github username!");
  } else if (repository == null || repository.length <= 0) {
    showAlert("⚠ Sorry, you forgot to put in a Github repository!");
  } else {
    var filename = "index.html";
    var composedURL = "run/index.html?username=" + username + "&repository=" + repository + "&filename=" + filename;
    window.location.href = composedURL;
  }
}

window.onload = Wave.init
$(function () {
  scrubAwayWaveUI();
  simulateTouch(2000);
});

$("#run").on("click", function() {
  run();
});

$(document).keydown(function(e) {
  if (e.which == 13) { // right
    e.preventDefault();
    run();
  }
});