var http = require('http');
var url = require('url');
var _ = require('underscore');

var	errors = require('./errors');
var responders = require('./responders');
var server = http.createServer();

exports.io = require('socket.io').listen(server);

exports.start = function (port) {
	console.log('starting http server on port ' + port);
	server.listen(port);
};

server.on('request', function (request, response) {
	var parsedUrl = url.parse(request.url);
	var method = request.method.toLowerCase();
	var tube = tubes.route(parsedUrl.pathname);

	request.parsedUrl = parsedUrl;

	if (parsedUrl.pathname.substr(0, 10) === '/socket.io') {
		return;
	}

	var startTime = Date.now();

	function complete(response) {
		return function (status) {
			var args = _(arguments).toArray();
			args.shift();
			var responder = responders.get(status);
			responder.apply(response, args);
			server.emit('request complete', {
				method: request.method,
				path: request.url,
				status: response.statusCode,
				responseTime: Date.now() - startTime
			});
		};
	}

	try {
		if (tube === undefined) {
	        throw new errors.HTTPError('Not Found');
		} else {
			var handler = tube[method];
			handler(request, response, complete(response));
		}
	} catch (e) {
		if (e.type === 'HTTP Error') {
			response.writeHead(e.statusCode, e.getHeaders());
			response.end(e.entity);
		} else {
			throw e;
		}
	}
});

server.on('request complete', function (stat) {
	console.log(stat.method, stat.path, stat.status, 'in', stat.responseTime, 'ms');
});

server.on('close', function () {
	console.log('server closing');
});