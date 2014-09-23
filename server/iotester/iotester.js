/* jshint node:true*/

var root;

module.exports = function (app, prefix) {
	root = prefix;
	prefix = '/' + prefix;
  app.options('*', options);
  app.get(prefix + '/status', sendStatus);
  app.get(prefix + '/action/responsetxt', sendText);
  app.get(prefix + '/action/responsexml', sendXML);
  app.get(prefix + '/action/responsedelayed', delayed);
  app.get(prefix + '/action/stream', stream);
  app.all(prefix + '/extractdata/method', returnMethod);
  app.all(prefix + '/extractdata/headers', returnHeaders);
  app.all(prefix + '/extractdata', returnRequestData);
	app.get(prefix, getRequest);
	app.post(prefix, postRequest);
	app.put(prefix, putRequest);
	app.delete(prefix, deleteRequest);
	app.all(prefix, otherRequest);

};


var options = function(req, res) {
  var requestHeaders = req.headers['access-control-request-headers'];
  res.set({
         'access-control-allow-origin': '*',
         'access-control-allow-methods': 'POST, GET, PUT, DELETE',
         'access-control-allow-headers': requestHeaders,
         'access-control-max-age': '1728000',
         'content-length': 0
     })
     .status(204)
     .send();
};

var sendStatus = function (req, res) {
  var responseHeader = req.param('res');
    res.set({
          'access-control-allow-origin': '*',
          'Content-Type': 'text/plain'
        })
       .status(responseHeader)
       .send(responseHeader);
};

var sendText = function (req, res) {
    res.set({
          'access-control-allow-origin': '*',
          'Content-Type': 'text/plain'
        })
       .status(200)
       .send('Acknowledge responsetext ok');
};

var stream = function (req, res) {
    var block2k = '',
        i;
    // Very interesting issue where we must take care with:
    // XDomainRequest only fires the `onprogress`-event when the block of code exceeds 2k !
    // see: http://blogs.msdn.com/b/ieinternals/archive/2010/04/06/comet-streaming-in-internet-explorer-with-xmlhttprequest-and-xdomainrequest.aspx
    // Thus, we prepend the response with 2k of whitespace
    for (i=0; i<2000; i++) {
        block2k += ' ';
    }
    res.set({
          'access-control-allow-origin': '*',
          'Content-Type': 'text/plain'
        });
    for (var i=1; i<4; i++) {
        setTimeout((function(j) {
            return function() {
                res.write(new Buffer(block2k+'package '+j));
            }
        })(i),
        i*300);
    }
    setTimeout(function() {
        res.end(block2k+'package 4');
    }, 1200);

    // res.set({'Content-Type': 'text/plain'})
       // .status(200)
       // .send('Acknowledge responsetext ok');
};

var sendXML = function (req, res) {
    var xmlHeader = '<?xml version="1.0" encoding="UTF-8" ?>';
    res.set({
          'access-control-allow-origin': '*',
          'Content-Type': 'text/xml'
        })
       .status(200)
       .send(xmlHeader+'<response>10</response>');
};

var delayed = function (req, res) {
    setTimeout(function() {
      res.set({
            'access-control-allow-origin': '*',
            'Content-Type': 'text/plain'
         })
         .status(200)
         .send('Acknowledge responsetext ok');
   }, 500);
};

var getRequest = function (req, res) {
    res.set({
          'access-control-allow-origin': '*',
          'Content-Type': 'text/plain'
        })
       .status(200)
       .send('Acknowledge get-request with data: ' + req.param('data'));
};

var postRequest = function (req, res) {
    res.set({
          'access-control-allow-origin': '*',
          'Content-Type': 'text/plain'
        })
       .status(200)
       .send('Acknowledge post-request with data: ' + req.param('data'));
};

var putRequest = function (req, res) {
    res.set({
          'access-control-allow-origin': '*',
          'Content-Type': 'text/plain'
        })
       .status(200)
       .send('Acknowledge put-request with data: ' + req.param('data'));
};

var deleteRequest = function (req, res) {
    res.set({
          'access-control-allow-origin': '*',
          'Content-Type': 'text/plain'
        })
       .status(200)
       .send('Acknowledge delete-request with data: ' + req.param('data'));
};

var otherRequest = function (req, res) {
    res.set({
          'access-control-allow-origin': '*',
          'Content-Type': 'text/plain'
        })
       .status(200)
       .send('Received a generic ' + req.method + ' request with path: ' + req.path + ' and with data: ' + req.param('data'));
};

var returnMethod = function (req, res) {
    var returnObj = {};
    returnObj[req.method] = true;
    res.set({
          'access-control-allow-origin': '*',
          'Content-Type': 'application/json'
        })
       .status(200)
       .send(returnObj);
};

var returnHeaders = function (req, res) {
    res.set({
          'access-control-allow-origin': '*',
          'Content-Type': 'application/json'
        })
       .status(200)
       .send(req.headers);
};

var returnRequestData = function (req, res) {
    var delay = req.headers['x-delay'] || 0;
    setTimeout(function() {
        res.set({
              'access-control-allow-origin': '*',
              'Content-Type': 'application/json'
            })
           .status(200)
           .send(((req.method==='PUT') || (req.method==='POST')) ? req.body : req.query);
    }, delay);
};