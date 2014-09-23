/* jshint node:true*/
"use strict";
var helpers = require('./helpers'),
	polyfillio = require('./lib');

module.exports = function (app, prefix) {
	app.get(new RegExp('^/' + prefix + '(\\.\\w+)(\\.\\w+)?'), function(req, res) {
		var responseStartTime = Date.now();

		var firstParameter = req.params[0].toLowerCase(),
			minified =  firstParameter === '.min',
			fileExtension = minified ? req.params[1].toLowerCase() : firstParameter,
			isGateForced = req.query.gated === "1",
			polyfills   = helpers.parseRequestedPolyfills(req.query.features || '', isGateForced ? ["gated"] : []),
			uaString = req.query.ua || req.header('user-agent');

		var polyfill = polyfillio.getPolyfills({
			polyfills: polyfills,
			extension: fileExtension,
			minify: minified,
			uaString: uaString,
			url: req.originalUrl
		});

		if (fileExtension === '.js') {
			res.set('Content-Type', 'application/javascript');
		} else {
			res.set('Conent-Type', 'text/css');
		}

		res.set('Vary', 'User-Agent');
		res.set('Access-Control-Allow-Origin', '*');
		res.set('Cache-Control', 'public, max-age=86400');
		res.send(polyfill);
	});
};