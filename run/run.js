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
var auth = new iggieGithubAuth("ddd03fe93afa0b9612aa", "fe7bba0464c06e72d02a417af28b1f9dbc744b6e");

var historian = new iggie(username, repository, auth);
setLoadingString("🗃 Getting ready to dance...");

/// 

var iggieHistory = [];
var iggieRefHistory = [];
var selectedHistory = 0;

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
	var historyRef = iggieRefHistory[selectedHistory];
	historian.getHistoryFilesHTML(filename, historyRef, historyFiles, function(url, html) {
		updateHistoryUI(url, html);
	});
}

//

setLoadingString("⬇ Connecting to Github...");

var historyError;
historian.getHistoryOfAllFiles(function(commitRefs, commitFiles, error) {
	if (error != null) {
		historyError = error;
		$("#current-alert").removeClass("alert-primary");
		$("#current-alert").addClass("alert-danger");

		$("#current-alert").html(error);
	} else if (commitRefs == null || commitFiles == null) {
		historyError = "🙅‍ Github rejected our request!";
		$("#current-alert").removeClass("alert-primary");
		$("#current-alert").addClass("alert-danger");

		$("#current-alert").html(historyError);
	} else {
		$("#current-alert").removeClass("alert-danger");
		$("#current-alert").addClass("alert-primary");

		iggieRefHistory = commitRefs;
		iggieHistory = commitFiles;
		$("#go").removeClass("disabled");

		setHistory(0);
		console.log("🎉 Loaded and set history!");
	}
});


//

$("body").on("click", "#error-alert",  function(e) {
		e.preventDefault();
		alert(historyError);
})

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
