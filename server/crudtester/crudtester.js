/* jshint node:true*/
"use strict";

// See: http://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html

// data contains a hashmap per resource and each resource by id
// with this initial setup you should be able to query localhost:8000/crud/existing/1 
// and get "first existing record"
var data = {
	existing: [
		null,
		{id:1,text:"first existing record"},
		{id:2,text:"second existing record"}
	]
};


var errReq = function (req) {
	var err = req.query.status;
	if (err) {
		err = parseInt(err.substr(1),10);
		console.log('status reply requested: ', err, ' for: ');
		return err;
	}
};
	
var listRequest = function (req, res) {
	var r = req.params.resource,
		err = errReq(req),
		resp = data[r];
	
	console.log('list request for resource: ' + r);
	if (resp !== undefined) {
		res.set('Content-type', 'application/json');
		res.status(err || 200).end(JSON.stringify(resp));
		console.log('sent', resp);
	} else {
		console.log('replied: not found');
		res.status(err || 404).end('Not found');
	}
};		
	
var readRequest = function (req, res) {
	var r = req.params.resource,
		id = req.params.id,
		err = errReq(req),
		resp = data[r] && data[r][id];
	
	
	console.log('read request for resource: ' + r + ' id: ' + id);
	if (resp !== undefined) {
		res.set('Content-type', 'application/json');
		res.status(err || 200).end(JSON.stringify(resp));
		console.log('send',resp);
	} else {
		console.log('replied: not found');
		res.status(err || 404).end('Not found');
	}
};

var createRequest = function (req, res) {
	var r = req.params.resource,
		id,
		err = errReq(req),
		d = data[r],
		body = req.body;
	
	
	console.log('create request into resource: ' + r + ' body: ', body);
	
	if (!d) {
		console.log('created resource', r);
		d = data[r] = [];
	}
	id = body.id = d.length;
	d[id] = body;
	res.set('Location', req.path + '/' + id);
	res.set('Content-type', 'application/json');
	res.status(201).end(JSON.stringify({id: id}));
	console.log('added item',id);
};

var updateRequest = function (req, res) {
	var r = req.params.resource,
		id = req.params.id,
		err = errReq(req),
		d = data[r],
		body = req.body;
		
	console.log('update request for resource: ' + r + ' id: ' + id, 'with', body);
	
	if (d) {
		var old = d[id],
			status = err || (old === undefined?201:200);
		
		d[id] = body;
		res.set('Content-type', 'application/json');
		res.status(status).end(JSON.stringify(old));
		console.log('reply status', status, 'old', old);
	} else {
		res.status(err || 404).end('Not found');
		console.log('replied not found');
	}
};

var deleteRequest = function (req, res) {
	var r = req.params.resource,
		id = req.params.id,
		err = errReq(req),
		resp = data[r] && data[r][id];
	
	console.log('delete request for resource: ' + r + ' id: ' + id);
	
	if (resp) {
		res.set('Content-type', 'application/json');
		res.status(err || 200).send(JSON.stringify(resp));
		delete data[r][id];
		console.log('sent:', resp);
	} else {
		res.status(err || 404).end('Not found');
		console.log('replied not found');
	}
};

var otherRequest = function (req, res) {
	console.log('Received a generic ' + req.method + ' request with path: ' + req.path);
	res.status(200).send('Received a generic ' + req.method + ' request with path: ' + req.path);
};
	
module.exports = function (app, prefix) {
	prefix = '/' + prefix;
	app.get(   prefix + '/:resource/:id', readRequest); 
	app.get(   prefix + '/:resource', listRequest);
	app.post(  prefix + '/:resource', createRequest);
	app.put(   prefix + '/:resource/:id', updateRequest);
	app.delete(prefix + '/:resource/:id', deleteRequest);
	app.all(   prefix, otherRequest);
	
};