/*
 	(c) 2018 Julian Weiss // insanj
	iggie // interactive github site history
	https://github.com/insanj/iggie
*/

function param(name) { // https://stackoverflow.com/a/39768285
	return (location.search.split(name + '=')[1] || '').split('&')[0];
}

var loadingDivString = '<div class="sk-wave"><div class="sk-rect sk-rect1"></div><div class="sk-rect sk-rect2"></div><div class="sk-rect sk-rect3"></div><div class="sk-rect sk-rect4"></div><div class="sk-rect sk-rect5"></div></div>';
function setLoadingString(str) {
	$("#current-alert").html(loadingDivString + str);
}

var updateHistoryUI = function(displayURL, html) {
	$("#current-alert").html("<a class='text-primary' href='" + displayURL + "'>" + displayURL + "</a>");
	$("#go-link").attr("href", displayURL);

	$("#site").html("");
	$('<iframe id="site-iframe"/>').appendTo('#site');
	$("#site-iframe").contents().find('html').html(html);
}

///

var username = param("username");
var repository = param("repository");
var filename = param("filename");

var iggieHistory = [];
var selectedHistory = 0;

var historian = new iggie(username, repository);
setLoadingString("🗃 Getting ready to dance...");

/// 

function setHistory(delta) {	
	var historyIndex = selectedHistory + delta;
	if (historyIndex < 0 || historyIndex >= iggieHistory.length) {
		selectedHistory = 0;
	} else {
		selectedHistory = historyIndex;
	}

	if (selectedHistory == 0) {
		$("#forward").addClass("disabled");
	} else {
		$("#forward").removeClass("disabled");
	}

	if (selectedHistory == iggieHistory.length-1) {
		$("#back").addClass("disabled");
	} else {
		$("#back").removeClass("disabled");
	}

	setLoadingString("🎩 Danced with Github! Resolving website files...");

	var historyFiles = iggieHistory[selectedHistory];
	historian.getHistoryFilesHTML(filename, historyFiles, function(url, html) {
		updateHistoryUI(url, html);
	})
}

//

setLoadingString("⬇ Connecting to Github...");

historian.getHistoryOfAllFiles(function(commitFiles) {
	iggieHistory = commitFiles;
	$("#go").removeClass("disabled");

	setHistory(0);
	console.log("🎉 Loaded and set history!");
});


//

$("#back").on("click", function(e) {
	e.preventDefault();
	if ($("#back").hasClass('disabled') == false) {
		setHistory(1);
	}
});

$("#forward").on("click", function(e) {
	e.preventDefault();
	if ($("#forward").hasClass('disabled') == false) {
		setHistory(-1);
	}
});

$(document).keydown(function(e) {
	e.preventDefault();
	if (e.which == 37) { // left 
		if ($("#back").hasClass('disabled') == false) {
				setHistory(1);
		}
	}

	else if (e.which == 39) { // right
		if ($("#forward").hasClass('disabled') == false) {
				setHistory(-1);
		}
	}
});
