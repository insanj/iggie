/*
 	(c) 2018 Julian Weiss // insanj
	iggie // interactive github site history
	https://github.com/insanj/iggie
*/

class iggieGithubAuth {
	constructor(clientId, clientSecret) {
		this.clientId = clientId;
		this.clientSecret = clientSecret;
	}

	clientURLQueryString() {
		return "client_id="+ this.clientId +"&client_secret=" + this.clientSecret;
	}

	appendClientURLQueryString(str) {
		if (str.indexOf("?") > 0) {
			return str + "&" + this.clientURLQueryString();
		} else {
			return str + "?" + this.clientURLQueryString();
		}
	}
}

class iggieURLBuilder {
	constructor(username, repository, auth) {
		this.username = username;
		this.repository = repository;
		this.auth = auth;
	}

	buildCommitsURL(untilDate) {
		var urlHost = "https://api.github.com/";
		var apiRepoPath = "repos/";
		var apiCommitsPath = "/commits";
		var composedURL = urlHost + apiRepoPath + this.username + "/" + this.repository + apiCommitsPath;
		if (untilDate != null) {
			composedURL = composedURL + "?until=" + untilDate;
		}
		return this.auth.appendClientURLQueryString(composedURL);
	}

	buildContentsOfCommitURL(filename, ref) {
		var urlHost = "https://api.github.com/";
		var apiRepoPath = "repos/";
		var apiContentsPath = "/contents/";
		var precomposedURL = urlHost + apiRepoPath + this.username + "/" + this.repository + apiContentsPath;
		var refQuery = "?ref=" + ref;
		var composedURL = precomposedURL + filename + refQuery;
		return this.auth.appendClientURLQueryString(composedURL);
	}
	
	buildGetFileInCommitURL(path, ref) {
		var urlHost = "https://api.github.com/";
		var apiRepoPath = "repos/";
		var apiContentsPath = "/contents/";
		var precomposedURL = urlHost + apiRepoPath + this.username + "/" + this.repository + apiContentsPath;
		var composedURL = precomposedURL + path;
		return this.auth.appendClientURLQueryString(composedURL);
	}

	buildContentsOfAllFilesInCommitURL(ref) {
		var urlHost = "https://api.github.com/";
		var apiRepoPath = "repos/";
		var apiContentsPath = "/contents/";
		var precomposedURL = urlHost + apiRepoPath + this.username + "/" + this.repository + apiContentsPath;
		var refQuery = "?ref=" + ref;
		var composedURL = precomposedURL + refQuery;
		return this.auth.appendClientURLQueryString(composedURL);
	}

	buildTreeForCommitURL(ref) {
		var urlHost = "https://api.github.com/";
		var apiRepoPath = "repos/";
		var apiTreesPath = "/git/trees/";
		var precomposedURL = urlHost + apiRepoPath + this.username + "/" + this.repository + apiTreesPath;
		var composedURL = precomposedURL + ref + "?recursive=1";
		return this.auth.appendClientURLQueryString(composedURL);
	}
}

class iggieNetworker {
	constructor(username, repository, auth) {
		this.username = username;
		this.repository = repository;
		this.auth = auth;
	}

	getGithubCommits(callback) {
		var builder = new iggieURLBuilder(this.username, this.repository, this.auth);
		var	getPaginatedGithubCommitsURL = function(paginatedDate) {
			return builder.buildCommitsURL(paginatedDate);
		}

		var getGithubCommitsPaginated = function(paginatedCallback, pulledCommitHashes, untilDate) {
		}
		getGithubCommitsPaginated =  function(paginatedCallback, pulledCommitHashes, untilDate) {
			var url = getPaginatedGithubCommitsURL(untilDate);
			$.ajax({
			  type: 'GET',
			  url: url,
			  dataType: 'json',
			  success: function (result) {
			  	if (result == null || result.length <= 0) { // || pulledCommitHashes.includes(result[0].sha)) {
				  	console.log("🗞 Done paginating all available Github commits!");
					paginatedCallback(pulledCommitHashes, null);
			  	} else {
				  	var commitHashes = pulledCommitHashes;
					for (var i = 0; i < result.length; i++) { // don't include the last element to prevent filtering out from if
				  		var commit = result[i];
				  		var sha = commit.sha;
				  		commitHashes.push(sha);
					}

				  	var finalDate = result[result.length-1].commit.author.date;
				  	console.log("📃 Paginated from " + untilDate + " to " + finalDate + "!");
				  	if (finalDate == untilDate) {
						paginatedCallback(pulledCommitHashes, null);
				  	} else {
				  		getGithubCommitsPaginated(paginatedCallback, commitHashes, finalDate);
				  	}
			  	}
			  },
			  error: function ( xhr, status, error) {
				paginatedCallback(null, error);
		      }
			});
		}

		getGithubCommitsPaginated(callback, [], null);
	}

	getGithubContentsOfFileInCommit(filename, ref, callback) {
		var builder = new iggieURLBuilder(this.username, this.repository, this.auth);
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

	getGithubFileInCommit(path, ref, callback) {
		var builder = new iggieURLBuilder(this.username, this.repository, this.auth);
		var url = builder.buildGetFileInCommitURL(path, ref);
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
			  		if (commitFile.path == path) {
			  			file = commitFile;
			  			break;
			  		}
			  	}

			  	if (file == null) {
			  		console.log("⚠ Unable to find path = " + path);
			  		return;
			  	}
		  	} else {
		  		file = result;
		  	}

		  	callback(file);
		  },
		  error: function ( xhr, status, error) {
			callback(null);
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
		var builder = new iggieURLBuilder(this.username, this.repository, this.auth);
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
		var builder = new iggieURLBuilder(this.username, this.repository, this.auth);
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

	getContentsForURL(getURL, getCallback) {
		try {
			$.ajax({
				type: 'GET',
				url: getURL,
				success: function (getURLResult) {
					getCallback(getURLResult);
				},
				error: function ( xhr, status, error) {
					getCallback(null);
				}
			});
		} catch (err) {
			console.log("⚠ getContentsForURL undefined result for url (" + getURL + ") = " + err);
			getCallback(null);
		}
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

	findFullFileForPath(filePath, commit, alreadyFullFiles, callback) {
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

		var fullFile;
		if (alreadyFullFiles == null) {
			console.log("alreadyFullFiles null :( filePath =" + filePath);
		} else {
			fullFile = alreadyFullFiles[filePath]
		}

		if (fullFile != null) {
			callback(fullFile);
		} else {
			this.getGithubFileInCommit(filePath, commit, function(foundFullFile) {
				var newFullFiles = alreadyFullFiles;
				if (foundFullFile != null && newFullFiles != null) {
					newFullFiles[foundFullFile.path] = foundFullFile;
				}

				callback(foundFullFile, newFullFiles);
			});
		}
	}

	crawlHTMLAndResolveURLs(networker, commit, commitHTML, knownFiles, callback) {
		var knownFilesDict = {};
		for (var i = 0; i < knownFiles.length; i++) {
			var knownFile = knownFiles[i];
			knownFilesDict[knownFile.path] = knownFile;
		}

		var rawgitDownloadURL = function(githubDownloadURL) {
			return githubDownloadURL.replace("raw.githubusercontent.com", "rawgit.com");
		}

		var iterateGithubTreeFile = function(iterateNetworker, treeFiles, i, crawlingHTML, iterateCallback) {
		}
		iterateGithubTreeFile = function(iterateNetworker, treeFiles, i, crawlingHTML, crawlingKnownFiles, iterateCallback) {
			if (i < 0 || i >= treeFiles.length) {
				iterateCallback(crawlingHTML);
			} else {
				var crawlingFile = treeFiles[i];
				if (crawlingFile == null) {
					console.log("Found null file while crawling = " + crawlingFile);
					iterateGithubTreeFile(iterateNetworker, treeFiles, ++i, crawlingHTML, crawlingKnownFiles, iterateCallback);
				} else {
					var encodedPath = crawlingFile.path.replace(" ", "%20");
					var pathWithSingleQuotes = "'" + encodedPath + "'";
					var pathWithDoubleQuotes = '"' + encodedPath + '"';

					// make sure the END of the path is found, surrounded by quotes, and thus, NOT a part
					// of a larger file. we also ensure this by only replacing blobs, but that does not
					// mean the HTML file doesn't coincidentally have paths that contain blob download URLs!
					var singleQuotesFound = crawlingHTML.indexOf(pathWithSingleQuotes) >= 0;
					var doubleQuotesFound = crawlingHTML.indexOf(pathWithDoubleQuotes) >= 0;
					var regularPathFound = crawlingHTML.indexOf(encodedPath) >= 0;
					var filePathIsInHTML = singleQuotesFound == true || doubleQuotesFound == true;

					if (filePathIsInHTML == true && crawlingFile.type == "blob") {		
						iterateNetworker.findFullFileForPath(crawlingFile.path, commit, crawlingKnownFiles, function(crawlingFoundFile, newlyKnownFiles) {
							if (crawlingFoundFile != null) {
								var downloadURL = rawgitDownloadURL(crawlingFoundFile.download_url);

								var crawlingHTMLReplacement = crawlingHTML;
								while (crawlingHTMLReplacement.indexOf(pathWithSingleQuotes) >= 0 || crawlingHTMLReplacement.indexOf(pathWithDoubleQuotes) >= 0) {
									crawlingHTMLReplacement = crawlingHTMLReplacement.replace(pathWithSingleQuotes, "'"+downloadURL+"'");
									crawlingHTMLReplacement = crawlingHTMLReplacement.replace(pathWithDoubleQuotes, '"'+downloadURL+'"');
								}

								var newlyCrawlingHTML = crawlingHTMLReplacement;
								console.log("💥 Found " + crawlingFoundFile.path + " and replaced with " + downloadURL);

								var realKnownFiles = newlyKnownFiles;
								if (realKnownFiles == null) {
									realKnownFiles = crawlingKnownFiles;
								}

								iterateGithubTreeFile(iterateNetworker, treeFiles, ++i, newlyCrawlingHTML, realKnownFiles, iterateCallback);
							}
						});
					} else {
						iterateGithubTreeFile(iterateNetworker, treeFiles, ++i, crawlingHTML, crawlingKnownFiles, iterateCallback);
					}
				}
			}
		} // end iterateGithubTreeFile()

		networker.getGithubTreeForCommit(commit, function(treeResult) {
			var totalIterations = treeResult.length-1;
			iterateGithubTreeFile(networker, treeResult, 0, commitHTML, knownFilesDict, function(crawledHTML) {
				callback(crawledHTML);
			});	
		});
	}
}

class iggie {
	constructor(username, repository, auth) {
		this.username = username;
		this.repository = repository;
		this.auth = auth;
	}

	getHistory(filename, callback) {
		var networker = new iggieNetworker(this.username, this.repository, this.auth);
		networker.getGithubCommits(function(commits, error) {
    		networker.getGithubContentsOfFileInCommits(networker, filename, commits, function(commitsContents, commitsURLs) {
    			callback(commitsContents, commitsURLs);
    		});
    	});
	}

	getHistoryOfAllFiles(callback) {
		var networker = new iggieNetworker(this.username, this.repository, this.auth);
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

		var networker = new iggieNetworker(this.username, this.repository, this.auth);
		networker.getContentsForURL(historyHTMLFile.download_url, function(results) {
			setLoadingString("🎉 Finished up homepage search, downloading additional resources...");	

			networker.crawlHTMLAndResolveURLs(networker, ref, results, historyFiles, function (crawledResults) {
				setLoadingString("🤖 We did it, iggie! Sending website your way...");
				callback(historyHTMLFile.html_url, crawledResults);
			});
		});
	}

	getCrawledHTMLFileWithResolvedURLs(ref, html, historyFiles, callback) {
		var networker = new iggieNetworker(this.username, this.repository, this.auth);
		networker.crawlHTMLAndResolveURLs(networker, ref, html, historyFiles, function (crawledResults) {
			callback(crawledResults);
		});
	}
}
