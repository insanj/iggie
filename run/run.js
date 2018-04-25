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
	$("#current-alert").removeClass("alert-danger");
	$("#current-alert").removeClass("alert-success");
	$("#current-alert").addClass("alert-primary");

	$("#current-alert").html(loadingDivString + str);
}

function setErrorString(str) {
	$("#current-alert").removeClass("alert-danger");
	$("#current-alert").removeClass("alert-sucess");
	$("#current-alert").addClass("alert-danger");

	$("#current-alert").html("⚠" + str);
}

function setSuccessURL(url) {
	$("#current-alert").removeClass("alert-danger");
	$("#current-alert").removeClass("alert-primary");
	$("#current-alert").addClass("alert-primary");

	$("#current-alert").html("<a class='text-primary' href='" + url + "'>" + url + "</a>");
}

function setMessageString(str) {
	$("#current-alert").removeClass("alert-danger");
	$("#current-alert").removeClass("alert-primary");
	$("#current-alert").addClass("alert-primary");

	$("#current-alert").html(str);
}

var updateHistoryUI = function(displayURL, html, updateHistoryUICallback) {
	$("#go-link").attr("href", displayURL);

	$("#site").html("");
	$('<iframe id="site-iframe"/>').appendTo('#site');

	var headAgainstWallThreshold = 1;

	var finishDeployment = function(attempts) {
		var tries = headAgainstWallThreshold - attempts;
		console.log("😭 Gave up deployment after " + tries + " tries...");

		if (displayURL != null) {
			setSuccessURL(displayURL);
		}

        $.getScript('https://code.jquery.com/jquery-3.1.1.js');
        updateHistoryUICallback();
	}

	var deploySite = function(siteHTML, attempts) {
		if (attempts <= 0) {
			console.log("⚠ Giving up deployment!");
			finishDeployment(attempts);
		} else {
			try {
				var iframeElement = document.getElementById("site-iframe");
				iframeElement.srcdoc = siteHTML;
				finishDeployment(attempts);
			} catch (error) {
				console.log("⚠ Deploy site error = " + error);
				deploySite(siteHTML, --attempts);
			}
		}
	}

	$("#site-iframe").ready(function() {
		deploySite(html, headAgainstWallThreshold); // sometimes, it just takes a while...	
	});
}

///

var username = param("username");
var repository = param("repository");
var filename = param("filename");
var auth = new iggieGithubAuth("ddd03fe93afa0b9612aa", "fe7bba0464c06e72d02a417af28b1f9dbc744b6e");

setLoadingString("🗃 Getting ready to dance...");

/// 

var iggieHistory = [];
var iggieRefHistory = [];
var selectedHistory = 0;

function recrawlCurrentHistory() {
	var ref = iggieRefHistory[selectedHistory];
	var currentHTML = $("#site-iframe").contents().find("html")[0].innerHTML; 
	var files = iggieHistory[selectedHistory];

	var recrawlHistorian = new iggie(username, repository, auth);
	recrawlHistorian.getCrawledHTMLFileWithResolvedURLs(ref, currentHTML, files, function (recrawledHTML) {
		updateHistoryUI(null, recrawledHTML, function() {
			console.log("🙌 Done recrawl & render!");
		});
	});
}

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

	var littleHistorian = new iggie(username, repository, auth);
	littleHistorian.getHistoryFilesHTML(filename, historyRef, historyFiles, function(url, html) {
		if (url == null || html == null) {
			setMessageString("🎨 Reached end of history");
			console.log("🔴 End of history");
		} else {
			updateHistoryUI(url, html, function() {
				console.log("🎨 Rendered history!");
			});
		}
	});
}

function safeSetHistory(delta) {
	try {
		setHistory(delta);
	} catch(error) {
		setErrorString("😭 iggie ran into an issue rendering the finished site.");
		console.log("⚠ safeSetHistory error: " + error);
	}
}

//

function loadDialForGithubCommits(dialGithubCommits) {
	var uiItems = DialUIItem.convertGithubCommitRefsToDialUIItems(dialGithubCommits);
	var uiItemCSS = DialUIItemCSS.fromDict({"width" : 20.0,"padding" : 2.0,"selectedWidth" : 30.0});
	DialDrawer.drawDialUIItems(uiItems, uiItemCSS, "dial");

	var dialCallback = function(target) {
		var currentRef = iggieRefHistory[selectedHistory].substring(0, 3);
		var currentRefIndex = selectedHistory;
		var selectedRefIndex = -1;
		for (var i = 0; i < dialGithubCommits.length; i++) {
			var thisRef = dialGithubCommits[i].substring(0, 3);
			if (thisRef == target.id) {
				selectedRefIndex = i;
			}
		}

		if (i < 0) {
			throw "Dial unable to find ref selected";
		}

		var delta = currentRefIndex - selectedRefIndex;
		safeSetHistory(delta);
	};

	var dialListener = new DialListener(dialCallback);
	addDialListener(dialListener);
}

//

setLoadingString("⬇ Connecting to Github...");

var historyError;
var historian = new iggie(username, repository, auth);
historian.getHistoryOfAllFiles(function(commitRefs, commitFiles, error) {
	if (error != null) {
		historyError = error;
		setErrorString(historyError);
	} else if (commitRefs == null || commitFiles == null) {
		historyError = "🙅‍ Github rejected our request!";
		setErrorString(historyError);
	} else {
		iggieRefHistory = commitRefs;
		iggieHistory = commitFiles;
		$("#go").removeClass("disabled");

		safeSetHistory(0);
		loadDialForGithubCommits(commitRefs);
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
		safeSetHistory(1);
	}
});

$("#refresh").on("click", function(e) {
	e.preventDefault();
	recrawlCurrentHistory();
});

$("#forward").on("click", function(e) {
	e.preventDefault();
	if ($("#forward").hasClass('disabled') == false) {
		safeSetHistory(-1);
	}
});

$(document).keydown(function(e) {
	e.preventDefault();
	if (e.which == 37) { // left 
		if ($("#back").hasClass('disabled') == false) {
			safeSetHistory(1);
		}
	}

	else if (e.which == 39) { // right
		if ($("#forward").hasClass('disabled') == false) {
			safeSetHistory(-1);
		}
	}
});
