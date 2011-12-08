var _ = require('underscore');
var settings = require('../settings');
var headers = require('../headers');

/*
	ok(entityString[, mimetype][, encoding][, options]);
	ok(entityStream, contentLength[, mimetype][, encoding][, options]);
*/

function resolveArguments() {
	var vocab, stt, state, args, options;
	vocab = {
		'string': function (x) { return _(x).isString(); },
		'stream': function (x) { return x.readable && 'pipe' in x; },
		'number': function (x) { return _(x).isNumber(); },
		'object': function (x) { return !!x; }
	};
	stt = {
		'initial': {
			'string': 'entityString',
			'stream': 'entityStream'
		},
		'entityString': {
			'string': 'mimetype',
			'object': 'options'
		},
		'entityStream': {
			'number': 'contentLength',
			'object': 'options'
		},
		'mimetype': {
			'string': 'encoding',
			'object': 'options'
		},
		'encoding': {
			'object': 'options'
		},
		'contentLength': {
			'string': 'mimetype',
			'object': 'options'
		},
		'options': null
	};
	state = 'initial';
	args = _(arguments).toArray();
	options = {};
	while (args.length > 0) {
		if (stt[state] === null) {
			return options;
		}
		arg = args.shift();
		state = _(stt[state]).find(function (transition, type) {
			return vocab[type](arg);
		});
		if (!state) {
			throw new Error('Invalid arguments passed to "OK" responder.');
		}
		options[state] = arg;
	}
	return options;
}

module.exports = exports = function ok() {
	var args, options, mimetype, encoding, streaming, responseHeaders;
	args = resolveArguments.apply(this, arguments);
	options = args.options || {};
	mimetype = options.mimetype || args.mimetype || settings('server.response.defaultMIMEType');
	encoding = options.encoding || args.encoding || settings('server.response.defaultTextEncoding');
	options.contentType = mimetype + '; charset=' + encoding;
	if ('entityString' in args) {
		streaming = false;
		options.contentLength = args.entityString.length;
		entity = args.entityString;
	} else if ('entityStream' in args) {
		streaming = true;
		entity = args.entityStream;
	}
	responseHeaders = headers(options);
	this.writeHead(200, responseHeaders);
	if (streaming) {
		entity.pipe(this);
	} else {
		this.end(entity);
	}
};