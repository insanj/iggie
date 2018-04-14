/*
 	(c) 2018 Julian Weiss // insanj
	iggie // interactive github site history
	https://github.com/insanj/iggie
*/

class iggie {
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

	getGithubCommits(url, callback) {
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

	buildContentsOfCommitURL(filename, ref) {
		var urlHost = "https://api.github.com/";
		var apiRepoPath = "repos/";
		var apiContentsPath = "/contents/";
		var precomposedURL = urlHost + apiRepoPath + this.username + "/" + this.repository + apiContentsPath;
		var refQuery = "?ref=" + ref;
		return precomposedURL + filename + refQuery;
	}

	getGithubContentsOfFileInCommit(url, filename, ref, callback) {
		$.ajax({
		  type: 'GET',
		  url: url,
		  dataType: 'json',
		  success: function (result) {
		  	var decodedContents = [];
		  	$result.each(function( index ) {
		  		var base64Contents = commit.content;
		  		var contents = window.atob(base64Contents);
				decodedContents.push(contents);
			});

		  	callback(decodedContents);
		  }
		});
	}

	getGithubContentsOfFileInCommits(url, filename, commits, callback) {
		var history = [];

		var iterateGetContents = function(i, getContents) {
			// no-op
		};
		iterateGetContents = function(i, getContents) {
			if (i >= commits.length) {
				callback(history);
			} else {
				var ref = commits[i];
				var contents = getContents(url, filename, ref, function(refContents) {
					history.push(refContents);
					iterateGetContents(i+1);
	    		});
    		}
		};

		iterateGetContents(0, this.getGithubContentsOfFileInCommit);
	}
}