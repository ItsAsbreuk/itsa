/* jshint node:true*/
"use strict";
var http = require('http'),
	Promise = require('ypromise');

var read = 'GET',
	update = 'PUT',
	create = 'POST',
	del = 'DELETE';
	
var send = function (method, url, body) {
	console.log('\n',method, url, body);
	return new Promise(function(resolve, reject) {
		var options = {
			hostname: 'localhost',
			port: 8000,
			path: '/crud/' + url,
			method: method.toUpperCase()
		};
		if (body) {
			options.headers = {
				'Content-type':'application/json'
			};
		}
		var req = http.request(options, function (res) {
			console.log('\nREPLY:');
			console.log('STATUS: ' + res.statusCode);
			console.log('HEADERS: ' + JSON.stringify(res.headers));
			res.setEncoding('utf8');
			res.on('data', function (chunk) {
				console.log('BODY: ' + chunk);
			});
			resolve(res.statusCode);
		});

		req.on('error', function (e) {
			console.log('problem with request: ' + e);
			reject(e);
		});

		if (body) {
			req.write(JSON.stringify(body));
		}
		req.end();
	});
};

send(read, 'existing')
.then(function() {return send(read, 'xxxxx');})
.then(function() {return send(read, 'existing/1');})
.then(function() {return send(create, 'existing',{data:"new record"});})
.then(function() {return send(read, 'existing/3');})
.then(function() {return send(update, 'existing/3', {id:3,data:"new changed record"});})
.then(function() {return send(read, 'existing');})
.then(function() {return send(del , 'existing/3');})
.then(function() {return send(read, 'existing');});
