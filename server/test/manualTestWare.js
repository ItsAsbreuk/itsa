/* jshint node:true */
"use strict";
var path = require('path'),
	FS = require('q-io/fs'),
	browserify = require('browserify'),
	SRC = '../src',
	root;


var list = function (req, res) {
	var testFiles = {};
	FS.listTree(SRC, function (filePath, stat) {
		if (stat.isDirectory())  {
			if (path.basename(filePath) === 'node_modules') return null;
			return false;
		}
		var parts = filePath.split('/'),
			t = parts.indexOf('tests');
		if (t !== -1) {
			var module = parts[t-1],
				file = parts[t + 1];
			if (!testFiles[module]) {
				testFiles[module] = [];
			}
			testFiles[module].push(file);
			return true;
		}
		return false;
	}).then(function (files) {
		var html = '<h1>Tests available</h1>';

		for (var m in testFiles) {
			html += '<p>' + m + '</p><ul>' + testFiles[m].map(function (file) {
				return '<li><a href="' + path.join(root, m, file) + '">' + file + '</a></li>';
			}).join('\n') + '</ul>';
		}

		// console.log('listing test files', testFiles);

		res.send(html);
	});
};


var test = function (req, res, next) {
	// console.log('test:', req.params, req.query);
	var m = req.params.module,
		t = req.params.test;

	var resolve = function (module) {
		// console.log('Resolving requires in ', module);

		res.setHeader('content-type', 'application/javascript');
		var brw = browserify();
		if (path.extname(t) === '.js') {
			brw.add(module);
		} else {
			brw.require(module);
		}
		brw.exclude('jsdom');

		brw.bundle().pipe(res);
	};


	if (t === undefined) {
		resolve(m);
	} else if (path.extname(t) === '.js') {
		if (req.query.js !== 'ok') {
			// console.log('sending stub instead');
			FS.read('test/stub.html').then(function (content) {
				res.send(content.replace('{test}',req.path).replace('{title}', m + ' - ' + t));
			});
			return;
		}

		resolve(path.join(SRC, m, 'tests', t));

	} else {
		// console.log('sending:', path.resolve(process.cwd(), path.join(SRC, m, 'tests', t)));
		res.sendfile(path.resolve(process.cwd(), path.join(SRC, m, 'tests', t)));
	}
};


module.exports = function (app, prefix) {
	root = prefix;
	prefix = '/' + prefix;
	app.get(prefix + '/:module/:test', test);
	app.get(prefix + '/:module', test);
	app.get(prefix, list);
};