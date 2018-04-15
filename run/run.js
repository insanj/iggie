function param(name) { // https://stackoverflow.com/a/39768285
	return (location.search.split(name + '=')[1] || '').split('&')[0];
}

var loadingDivString = '<div class="sk-wave"><div class="sk-rect sk-rect1"></div><div class="sk-rect sk-rect2"></div><div class="sk-rect sk-rect3"></div><div class="sk-rect sk-rect4"></div><div class="sk-rect sk-rect5"></div></div>';
function setLoadingString(str) {
	$("#current-alert").html(loadingDivString + str);
}

var username = param("username");
var repository = param("repository");
var filename = param("filename");

var iggieHistory = [];
var historian = new iggie(username, repository);

var selectedHistory = 0;
setLoadingString("🗃 Getting ready to dance...");
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

	/*
	 Step one: grab and download index.html file
	 Step two: create a source url array by looping through all paths/urs found in the index.html 
	 Step three: loop through all files in the file array and check for the following:
	 	If 1: if the file path is found in source url array, 
		Then 2:	replace the urls in the index.html for the file's download_url
		If 2: if the file is a directory, and it is a part of a url in the source array,
		Then 2: pull the contents of the directory from Github, recursively searching to resolve the full path
		Finally 2: replace the urls in the index.html with the resolved download_url
	*/
	setLoadingString("🎩 Danced with Github! Resolving website files...");

	var historyFiles = iggieHistory[selectedHistory];
	var historyHTMLFile;
	var historyCSSFile;
	for (var i = 0; i < historyFiles.length; i++) {
		var file = historyFiles[i];
		if (file.name == filename) {
			historyHTMLFile = file;
		} else if (file.name.substring(file.name.length-3) == "css") {
			historyCSSFile = file;
		}
	}

	var updateHistoryUI = function(displayURL, html) {
		$("#current-alert").html("<a class='text-primary' href='" + displayURL + "'>" + displayURL + "</a>");
		$("#go-link").attr("href", displayURL);

		$("#site").html("");
		$('<iframe id="site-iframe"/>').appendTo('#site');
		$("#site-iframe").contents().find('html').html(html);
	}

	var loadHistoryiFrame = function(htmlFile, cssFile, callback) {
		$.ajax({
			type: 'GET',
			url: htmlFile.download_url,
			success: function (htmlResult) {
				if (cssFile != null) {
					setLoadingString("🎉 Finished up homepage search, downloading additional resources...");
					$.ajax({
						type: 'GET',
						url: cssFile.download_url,
						success: function (cssResult) {
							htmlResult.replace("<head>", "<head><style>" + cssFile + "</style>");
							setLoadingString("🤖 We did it, iggie! Sending website your way...");
							callback(htmlFile.html_url, htmlResult);
						}
					});
				} else {
					setLoadingString("🤖 We did it, iggie! Sending website your way...");
					callback(htmlFile.html_url, htmlResult);
				}
			}
		});
	}

	loadHistoryiFrame(historyHTMLFile, historyCSSFile, function(url, data) {
		updateHistoryUI(url, data);
	});
}

setLoadingString("⬇ Connecting to Github...");
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