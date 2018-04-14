function param(name) { // https://stackoverflow.com/a/39768285
	return (location.search.split(name + '=')[1] || '').split('&')[0];
}

var username = param("username");
var repository = param("repository");
var filename = param("filename");

var iggieHistory = [];
var historian = new iggie(username, repository);

var selectedHistory = 0;
function setHistory(delta) {
	var historyIndex = selectedHistory + delta;
	if (historyIndex < 0 || historyIndex >= iggieHistory.length) {
		console.log("bad");
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

	var historyFiles = iggieHistory[selectedHistory];
	var historyURL;
	var historyHTMLURL;
	var historyCSSURL;
	for (var i = 0; i < historyFiles.length; i++) {
		var file = historyFiles[i];
		if (file.name == filename) {
			historyURL = file.html_url;
			historyHTMLURL = file.download_url;
		}

		else if (file.name.substring(file.name.length-3) == "css") {
			historyCSSURL = file.download_url;
		}
	}

	$("#site").html("");
	$('<iframe id="site-iframe"/>').appendTo('#site');

	$("#current-alert").html("<a class='text-primary' href='" + historyURL + "'>" + historyURL + "</a>");
	$("#go-link").attr("href", historyURL);

	$.ajax({
		type: 'GET',
		url: historyHTMLURL,
		success: function (htmlResult) {
			$("#site-iframe").contents().find('html').html(htmlResult);

			$.ajax({
				type: 'GET',
				url: historyCSSURL,
				success: function (cssResult) {
					$("#site-iframe").contents().find('head').append(cssResult);
				}
			});
		}
	});
}

historian.getHistoryOfAllFiles(function(commitFiles) {
	iggieHistory = commitFiles;
	$("#go").removeClass("disabled");

	setHistory(0);
	console.log("🎉 Loaded and set history!");
});

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