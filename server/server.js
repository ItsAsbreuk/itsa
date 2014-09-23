/* jshint node:true */
"use strict";
var express = require('express'),
	bodyParser = require('body-parser'),
    bodyParserIEcors = require('express-ie-cors'),
    DATEPATTERN = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/,
    REVIVER = function(key, value) {
        return DATEPATTERN.test(value) ? new Date(value) : value;
    },
    BASEDIR = '/var/www/vhosts/server.parcela.io/server';

var app = express();

// process.chdir(BASEDIR);
process.title = 'parcela-server';

// parse application/x-www-form-urlencoded for IE using cors
// cors-ie cannot recieve a content-type: so it is unaware of the contentype and will not parse the right way
// in case of IE<10 browsers, the useragent is determined and contentype of 'application/json' is assumed on POST-requests
// in case you need another contentype, you could use something like this instead:
// app.use(bodyParserIEcors({contentType: 'application/x-www-form-urlencoded'}));
app.use(bodyParserIEcors());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(function (req, res, next) {
    bodyParser.json(req.headers['x-jsondate'] ? {reviver: REVIVER} : null)(req, res, next);
})
// parse application/vnd.api+json as json
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));
app.use(bodyParser.text());

// app.use(function (req, res, next) {
    // console.log('\n',req.method, req.path);
    // next();
// });

// serves up all your javascript files, handling all require() calls
// The module needs to receive a reference to the express server instance
// and the path that will serve as root for the requests it receives.
require('./test/manualTestWare.js')(app, 'test');
require('./iotester/iotester.js')(app, 'io');
require('./crudtester/crudtester.js')(app, 'crud');
require('./polyfills/index.js')(app, 'polyfills');

// fallback for other static resources
app.use(express.static(__dirname));
app.get('*', function (req, res) {
	res.set('Content-Type', 'text/html');
	res.end('Path ' + req.path + ' not found. <br/> Try <a href="/test">/test</a>.');
});

app.set('port', process.env.PORT || 8000);

app.listen(app.get('port'), function(){
    // console.log("Express server listening on port " + app.get('port'));
});