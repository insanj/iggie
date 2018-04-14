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
}
