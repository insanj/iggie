/*
 	(c) 2018 Julian Weiss // insanj
	iggie // interactive github site history
	https://github.com/insanj/iggie
*/

class iggieURLBuilder {
	constructor(username, repository) {
		this.username = username
		this.repository = repository
	}

	buildCommitsURL() {
		var urlHost = "https://api.github.com/";
		var apiRepoPath = "repos/";
		var apiCommitsPath = "/commits";
		var composedURL = urlHost + apiRepoPath + this.username + "/" + this.repository + apiCommitsPath;
		return composedURL;
	}

	buildContentsOfCommitURL(filename, ref) {
		var urlHost = "https://api.github.com/";
		var apiRepoPath = "repos/";
		var apiContentsPath = "/contents/";
		var precomposedURL = urlHost + apiRepoPath + this.username + "/" + this.repository + apiContentsPath;
		var refQuery = "?ref=" + ref;
		return precomposedURL + filename + refQuery;
	}
	
	buildContentsOfAllFilesInCommitURL(ref) {
		var urlHost = "https://api.github.com/";
		var apiRepoPath = "repos/";
		var apiContentsPath = "/contents/";
		var precomposedURL = urlHost + apiRepoPath + this.username + "/" + this.repository + apiContentsPath;
		var refQuery = "?ref=" + ref;
		return precomposedURL + refQuery;
	}
}

class iggieFile {
	constructor(name, url, data) {
		this.name = name
		this.url = url
		this.data = data
	}
}

class iggieNetworker {
	constructor(username, repository) {
		this.username = username
		this.repository = repository
	}

	getGithubCommits(callback) {
		var builder = new iggieURLBuilder(username, repository);
		var url = builder.buildCommitsURL();
		$.ajax({
		  type: 'GET',
		  url: url,
		  dataType: 'json',
		  success: function (result) {
		  	var commitHashes = [];
			for (var i = 0; i < result.length; i++) {
		  		var commit = result[i];
		  		var sha = commit.sha;
		  		commitHashes.push(sha);
			}

			callback(commitHashes);
		  }
		});
	}

	getGithubContentsOfFileInCommit(filename, ref, callback) {
		var builder = new iggieURLBuilder(username, repository);
		var url = builder.buildContentsOfCommitURL(filename, ref);
		$.ajax({
		  type: 'GET',
		  url: url,
		  dataType: 'json',
		  success: function (result) {
		  	var file;
		  	if ($.isArray(result)) {
		  		var commitFiles = result;
			  	for (var i = 0; i < commitFiles.length; i++) {
			  		var commitFile = commitFiles[i];
			  		if (commitFile.name == filename) {
			  			file = commitFile;
			  			break;
			  		}
			  	}

			  	if (file == null) {
			  		console.log("⚠ Unable to find filename = " + filename);
			  		return;
			  	}
		  	} else {
		  		file = result;
		  	}

		  	var encoding = file.encoding;
		  	var decodedContent = file.content;
		  	var fileURL = file.html_url;
		  	if (encoding == 'base64') {
		  		decodedContent = window.atob(decodedContent);
		  	} else {
		  		console.log("⚠ Unknown encoding = " + commit);
		  	}

		  	callback(decodedContent, fileURL);
		  }
		});
	}

	getGithubContentsOfFileInCommits(networker, filename, commits, callback) {
		var history = [];
		var historyURLs = [];

		var iterateGetContents = function(i, getContents) {
			// no-op
		};
		iterateGetContents = function(i, getContents) {
			if (i >= commits.length) {
				callback(history, historyURLs);
			} else {
				var ref = commits[i];
				networker.getGithubContentsOfFileInCommit(filename, ref, function(refContents, refURL) {
					history.push(refContents);
					historyURLs.push(refURL);
					iterateGetContents(i+1);
	    		});
    		}
		};

		// begin!
		iterateGetContents(0);
	}

	getGithubContentsOfAllFilesInCommit(ref, callback) {
		var builder = new iggieURLBuilder(username, repository);
		var url = builder.buildContentsOfAllFilesInCommitURL(ref);
		$.ajax({
		  type: 'GET',
		  url: url,
		  dataType: 'json',
		  success: function (result) {
		  	var commitFiles = [];
			var decodedFileContents = [];
			for (var i = 0; i < result.length; i++) {
				var file = result[i];
			  	decodedFileContents.push(file);
			}

		  	callback(decodedFileContents);
		  }
		});
	}

	getGithubContentsOfAllFilesInCommits(networker, commits, callback) {
		var history = [];

		var iterateGetContents = function(i, getContents) {
			// no-op
		};
		iterateGetContents = function(i, getContents) {
			if (i >= commits.length) {
				callback(history);
			} else {
				var ref = commits[i];
				networker.getGithubContentsOfAllFilesInCommit(ref, function(files) {
					history.push(files);
					iterateGetContents(i+1);
	    		});
    		}
		};

		// begin!
		iterateGetContents(0);
	}
}

class iggie {
	constructor(username, repository) {
		this.username = username
		this.repository = repository
	}

	getHistory(filename, callback) {
		var networker = new iggieNetworker(this.username, this.repository);
		networker.getGithubCommits(function(commits) {
    		networker.getGithubContentsOfFileInCommits(networker, filename, commits, function(commitsContents, commitsURLs) {
    			callback(commitsContents, commitsURLs);
    		});
    	});
	}

	getHistoryOfAllFiles(callback) {
		var networker = new iggieNetworker(this.username, this.repository);
		networker.getGithubCommits(function(commits) {
    		networker.getGithubContentsOfAllFilesInCommits(networker, commits, function(files) {
    			callback(files);
    		});
    	});
	}

	getHistoryFilesHTML(filename, historyFiles, callback) {
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

		$.ajax({
			type: 'GET',
			url: historyHTMLFile.download_url,
			success: function (htmlResult) {
				if (historyCSSFile != null) {
					setLoadingString("🎉 Finished up homepage search, downloading additional resources...");
					$.ajax({
						type: 'GET',
						url: historyCSSFile.download_url,
						success: function (cssResult) {
							var combinedResult = htmlResult.replace("<head>", "<head><style>" + cssResult + "</style>");
							setLoadingString("🤖 We did it, iggie! Sending website your way...");
							callback(historyHTMLFile.html_url, combinedResult);
						}
					});
				} else {
					setLoadingString("🤖 We did it, iggie! Sending website your way...");
					callback(historyHTMLFile.html_url, htmlResult);
				}
			}
		});
	}
}
