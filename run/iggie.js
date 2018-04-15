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

	buildTreeForCommitURL(ref) {
		var urlHost = "https://api.github.com/";
		var apiRepoPath = "repos/";
		var apiTreesPath = "/git/trees/";
		var precomposedURL = urlHost + apiRepoPath + this.username + "/" + this.repository + apiTreesPath;
		return precomposedURL + ref + "?recursive=1";
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

			callback(commitHashes, null);
		  },
		  error: function ( xhr, status, error) {
			callback(null, error);
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
		var githubHistory = {};

		var iterateGetContents = function(i) {
			// no-op
		};
		iterateGetContents = function(i) {
			if (i >= commits.length) {
				callback(githubHistory);
			} else {
				var ref = commits[i];
				networker.getGithubContentsOfAllFilesInCommit(ref, function(files) {
					githubHistory[ref] = files;
					iterateGetContents(i+1);
	    		});
    		}
		};

		// begin!
		iterateGetContents(0);
	}

	getGithubTreeForCommit(ref, callback) {
		var builder = new iggieURLBuilder(username, repository);
		var url = builder.buildTreeForCommitURL(ref);

		$.ajax({
		  type: 'GET',
		  url: url,
		  dataType: 'json',
		  success: function (result) {
			var decodedFileContents = [];
			for (var i = 0; i < result.tree.length; i++) {
				var file = result.tree[i];
			  	decodedFileContents.push(file);
			}

		  	callback(decodedFileContents);
		  }
		});
	}

	getContentsForURL(url, callback) {
		$.ajax({
			type: 'GET',
			url: url,
			success: function (htmlResult) {
				callback(htmlResult);
			}
		});
	}

	getContentForBlobURL(url, callback) {
		$.ajax({
		  type: 'GET',
		  url: url,
		  dataType: 'json',
		  success: function (result) {
		  	var decodedContent = window.atob(result.content);
		  	callback(decodedContent);
		  }
		});
	}

	crawlHTMLAndResolveURLs(networker, commit, commitHTML, callback) {
		//var gitPaths = [];
		//var gitPathDict = {};

		var crawledHTML = commitHTML;
		networker.getGithubTreeForCommit(commit, function(result) {
			for (var i = 0; i < result.length; i++) {
				var file = result[i];
				//gitPaths.push(file.path);
				//gitPathDict[file.path] = file;

				if (file.type == "blob") {
					console.log("replacing " + file.path + " with " + file.url + " which is at index = " + crawledHTML.indexOf(file.path));
					
					//
					//networker.getContentForBlobURL(file.url, function(content) {
					crawledHTML = crawledHTML.replace(file.path, file.url);
					//
					// Caveat: the file.url here will be a blob url, not the download_url
					// How do we get the download_url? Simple! NOT from a github tree request,
					// but from a normal dir request. Accept as a param a dict of paths
					// to files that we already have. If there's something in there for this
					// path, then boom, we're good. If not, make an additional call to 
					// get the contents of the directory that hosts the blob, even if
					// its not a dir itself, then snatch the file from there, adding it
					// and the rest of the files to the param dict for the rest of the
					// loop. Then, all paths should be replaced with resolved download_urls!
					//
				}
			}

			/*var crawledContents = commitHTML;
			for (var l = 0; l < linkMatches.length; l++) {
				var link = linkMatches[l];
				if (gitPaths.indexOf(link) > 0) {
					console.log("found link " + link);
					var substitutionLink = gitPathDict[link].download_url;
					crawledContents = crawledContents.replace(link, substitutionLink);
				}
			}*/

			callback(crawledHTML);
		});
	}
}

class iggie {
	constructor(username, repository) {
		this.username = username
		this.repository = repository
	}

	getHistory(filename, callback) {
		var networker = new iggieNetworker(this.username, this.repository);
		networker.getGithubCommits(function(commits, error) {
    		networker.getGithubContentsOfFileInCommits(networker, filename, commits, function(commitsContents, commitsURLs) {
    			callback(commitsContents, commitsURLs);
    		});
    	});
	}

	getHistoryOfAllFiles(callback) {
		var networker = new iggieNetworker(this.username, this.repository);
		networker.getGithubCommits(function(commits, error) {
			if (error != null) {
				callback(null, error);
			} else {
	    		networker.getGithubContentsOfAllFilesInCommits(networker, commits, function(fileDict) {
					var refs = [];
					var files = [];
					for (var ref in fileDict) {
				    	refs.push(ref);
				    	files.push(fileDict[ref]);
					}

	    			callback(refs, files, null);
	    		});
	    	}
    	});
	}

	getHistoryFilesHTML(filename, ref, historyFiles, callback) {
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
		for (var i = 0; i < historyFiles.length; i++) {
			var file = historyFiles[i];
			if (file.name == filename) {
				historyHTMLFile = file;
			}
		}

		var networker = new iggieNetworker(this.username, this.repository);
		networker.getContentsForURL(historyHTMLFile.download_url, function(results) {
			setLoadingString("🎉 Finished up homepage search, downloading additional resources...");	

			networker.crawlHTMLAndResolveURLs(networker, ref, results, function (crawledResults) {
				setLoadingString("🤖 We did it, iggie! Sending website your way...");
				callback(historyHTMLFile.html_url, crawledResults);
			});
		});
	}
}
