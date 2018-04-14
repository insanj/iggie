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
		  	var decodedContents = [];
		  	for (var i = 0; i < result.length; i++) {
		  		var commit = result[i];
		  		var base64Contents = commit.content;
		  		var contents = window.atob(base64Contents);
				decodedContents.push(contents);
			}

		  	callback(decodedContents);
		  }
		});
	}

	getGithubContentsOfFileInCommits(networker, filename, commits, callback) {
		var history = [];

		var iterateGetContents = function(i, getContents) {
			// no-op
		};
		iterateGetContents = function(i, getContents) {
			if (i >= commits.length) {
				callback(history);
			} else {
				var ref = commits[i];
				networker.getGithubContentsOfFileInCommit(filename, ref, function(refContents) {
					history.push(refContents);
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
    		networker.getGithubContentsOfFileInCommits(networker, filename, commits, function(commitsContents) {
    			callback(commitsContents);
    		});
    	});
	}	
}
