import os
from git import Repo

class pash:
	git_url = "https://github.com/insanj/insanj.com"
	git_branch = "master"
	git_tmp_path = "pash-tmp"
	git_count = 5

	def run(self):
		# step one: make tmp dir
		if not os.path.exists(self.git_tmp_path):
		    os.makedirs(self.git_tmp_path)

		# step two: gather information for git repo
		# step three: get total count of commits, loop through each
		# step four: per commit, make clone into temporary dir
		# step five: per commit, add path to temporary dir to list of all paths
		# step six: generate site with all commits 
		self.clone(git_url, git_tmp_path, git_branch, commit)

		client = pashgit(self.git_tmp_path)
		client.print(self.git_count)

	def clone(self, url, path, branch, commit):
		repo = Repo.clone_from(url, path, branch)
		repo.git.checkout(commit)
		return repo

class pashgit:
	repo_path = None

	def __init__(self, repo_path):
		self.repo_path = repo_path

	def print(self, count):
		repo = Repo(self.repo_path)
		if not repo.bare:
			print('Repo at {} successfully loaded.'.format(repo_path))
			self.print_repository(repo)
			# create list of commits then print some of them to stdout
			commits = list(repo.iter_commits('master'))[:count]
			for commit in commits:
				print_commit(commit)
				pass
		else:
			print('Could not load repository at {} :('.format(repo_path))

	def print_commit(self, commit):
		print('----')
		print(str(commit.hexsha))
		print("\"{}\" by {} ({})".format(commit.summary,
										commit.author.name,
										commit.author.email))
		print(str(commit.authored_datetime))
		print(str("count: {} and size: {}".format(commit.count(),
											commit.size)))

	def print_repository(self, repo):
		print('Repo description: {}'.format(repo.description))
		print('Repo active branch is {}'.format(repo.active_branch))
		for remote in repo.remotes:
			print('Remote named "{}" with URL "{}"'.format(remote, remote.url))
			print('Last commit for repo is {}.'.format(str(repo.head.commit.hexsha)))
