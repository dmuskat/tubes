var _ = require('underscore');

function bitbucket(headerName) {
	return function () {
		return [headerName, ''];
	};
}

function noop(headerName) {
	return function (text) {
		return [headerName, text];
	};
}

function date(headerName) {
	return function (date) {
		return [headerName, new Date(date).toUTCString()];
	};
}

function integer(headerName) {
	return function (number) {
		if (_(number).isString()) {
			number = parseInt(number);
		}
		return [headerName, new Number(number).toString()];
	};
}

var filters = {
	lastModified: date('Last-Modified'),
	date: date('Date'),
	contentType: noop('Content-Type'),
	etag: noop('Etag'),
	contentLength: integer('Content-Length'),
	location: noop('Location')
};

module.exports = exports = function headers(options) {
	var headers = {};
	_(options).each(function (value, key) {
		var headerFilter = filters[key];
		if (headerFilter) {
			header = headerFilter(value);
		} else {
			// TODO: log this when debugging enabled
			//console.log('no header filter for "' + key + '"');
		}
		headers[header[0]] = header[1];
	});
	return headers;
};