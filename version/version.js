/* jshint node:true */

var Q = require('q'),
	FS = require('q-io/fs'),
	path = require('path'),
	HTTP = require('q-io/http'),
	exec = require('child_process').exec;

var CLONE = path.resolve('./clone');

var errors = [];

var execP = function (cmd, options) {
	console.log(options && options.cwd.replace(CLONE,''), cmd);
	var deferred = Q.defer();
	exec(cmd, options, function (error, stdout, stderr) {
		if (error) {
			errors.push(
				'-------------------',
				'at:     ' + options.cwd,
				'cmd:    ' + cmd,
				'err:    ' + error,
				'stderr: ' + stderr,
				'stdout: ' + stdout
			);
			console.error(stderr);
			deferred.reject(new Error(error));
		} else {
			console.log(stdout.toString());
			deferred.resolve(stdout.toString());
		}
	});
	return deferred.promise;
};

var SUBREGEX = /\{\s*([^|}]+?)\s*(?:\|([^}]*))?\s*\}/g,
	sub = function(s, o) {
    	return s.replace ? s.replace(SUBREGEX, function (match, key) {
        	return o[key] === undefined ? match : o[key];
    	}) : s;
	};

var version = process.argv[2];
if (version === '-r') {
	var ghget = function(template, data) {
		console.log(sub(template, data));
		return HTTP.read({
//			auth: "",
			ssl:true,
			headers: {
				accept: 'application/vnd.github.v3+json',
				'user-agent':'satyam@satyam.com.ar'
			},
			hostname: "api.github.com",
			method: "GET",
			path: sub(template, data),
			port: 443
		}).then(function (resp) {
			return JSON.parse(resp.toString());
		});
	};
	return ghget('/orgs/{org}/repos',{org:'Parcela'})
	.then(function (repos) {
		return void console.log(JSON.stringify(repos.map(function (repo) {
			return {
				id: repo.id,
				name: repo.name,
				url: repo.ssh_url,
				type: 0
			};
		}), null, 4));
	});
	process.exit(0);
}

	

if (! /^\d+\.\d+\.\d+$/.test(version)) {
	console.log('Usage');
	console.log('\t node version.js <version>');
	console.log('\t\t where <version> is the version number to set.');
	console.log('\t\t\tIt should be three groups of digits separated by dots');
	process.exit(1);
}

var gitHubUrlRx = /^Parcela\/(.+)$/;
var editPackageJson = function (repo) {
	var fileName = path.join(CLONE, repo.name, 'package.json');
	var cwd = {cwd: path.join(CLONE, repo.name)};
	return FS.read(fileName)
	.then(function (text) {
		var pkg = JSON.parse(text);
		pkg.version = version;
		delete pkg.licenses;
		pkg.license = 'BSD 3-clause';
		var patchDeps = function (deps) {
			for (var dep in deps) {
				var match = gitHubUrlRx.exec(deps[dep]);
				if (match && match[1] == dep) {
					deps[dep] = sub('git://github.com/Parcela/{name}.git#v{version}',{
						name: dep,
						version:version
					});
				}
			}
		};
		patchDeps(pkg.dependencies);
		patchDeps(pkg.devDependencies);
		return FS.write(fileName, JSON.stringify(pkg,null, 4))
		.then(function () {
			return execP(sub('git commit -a -m "package.json ready for release {version}"',repo), cwd);
		})
		.then(function () {
			return execP(sub('git push origin {branch}' , repo), cwd);
		})
		.then(function () {
			return execP(sub('git tag -a {version} -m "Release: {version} "',repo) , cwd);
		})
		.then(function () {
			return execP(sub('git push origin {version}', repo), cwd);
		})
		.then(function () {
			var back = function (deps) {
				for (var dep in deps) {
					deps[dep] = deps[dep].replace('git://github.com/Parcela/','Parcela/').replace('.git#v' + version, '');
				}
			};
			back(pkg.dependencies);
			back(pkg.devDependencies);
			return FS.write(fileName, JSON.stringify(pkg, null, 4));
		})
		.then(function () {
			return execP('git commit -a -m "Return to development version"', cwd);
		})
		.then(function () {
			return execP(sub('git push origin {branch}', repo), cwd);
		})
		.fail(function (err) {
			errors.push('Processing of repo ' + repo.name + ' ended in error: ' + err);
			return 'error at repo ' + repo.name +  ' error: ' + err;
		});
	});
		
};
var editDocVersion = function (repo) {
	var fileName = path.join(CLONE, repo.name, '_config.yml');
	var cwd = {cwd: path.join(CLONE, repo.name)};
	return FS.read(fileName)
	.then(function (text) {
		text = text.replace(/\nversion: +v\d+\.\d+\.\d+\s*\n/i, sub('\nversion: {version}\n',repo));
		return FS.write(fileName, text);
	})
	.then(function () {
		return execP(sub('git commit -a -m "_config.yml ready for release {version}"',repo), cwd);
	})
	.then(function () {
		return execP(sub('git push origin {branch}' , repo), cwd);
	})
	.then(function () {
		return execP(sub('git tag -a {version} -m "Release: {version} "',repo) , cwd);
	})
	.then(function () {
		return execP(sub('git push origin {version}', repo), cwd);
	})
	.fail(function (err) {
		errors.push('Processing of repo ' + repo.name + ' ended in error: ' + err);
		return 'error at repo ' + repo.name +  ' error: '  + err;
	});

};

FS.makeTree(CLONE)
.then(function () {
	FS.read('repos.json')
	.then(function (json) {
		var repos = JSON.parse(json);
		return Q.all(repos.map(
			function(repo) {
				repo.branch = repo.branch || 'master';
				repo.version = 'v' + version;
				return execP(
					sub('git clone -b {branch} {url}', repo), {cwd: CLONE})
				.then(function () {
					switch (repo.type) {
					case 0:
							return editPackageJson(repo);
					case 1:
							return editDocVersion(repo);							
					}

				})
				.fail(function (error) {
					console.error('for repo', repo.name);
					console.error(error);
					process.exit(1);
				});
			}
		));
	})
	.then(function (p) {
		console.log('Successfully changed version to ' + version);
	})
	.fail(function (err) {
		console.error('Global err: ' + err);
	})
	.finally(function () {
		console.error(errors.join('\n'));
		FS.removeTree(CLONE);
	});
});
