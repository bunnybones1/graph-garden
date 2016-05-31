var esprima = require('esprima');
var xhr = require('xhr');
var Signal = require('signals').Signal;
var urlParam = require('urlparam');

var options = {
    comment: true,
    range: true,
    loc: true,
    tokens: true,
    raw: true,
    tolerant: true,
    source: null,
    // sourceType: syntax.sourceType
};

function EsprimaManager() {

	var file = urlParam('file', null);
	var port = urlParam('port', 9966);
	var jsPath;
	var onTreeSignal = new Signal();

	if(!file) {
		window.location += '?file=https://cdnjs.cloudflare.com/ajax/libs/gsap/1.18.4/TweenMax.min.js';
	} else if(file.indexOf('http') === -1) {
		var addressParts = window.location.href.split('/');
		addressParts[2] = addressParts[2].split(':');

		addressParts[2][1] = port;
		addressParts[2] = addressParts[2].join(':');
		addressParts.pop();
		addressParts = addressParts.join('/');
		addressParts += '/'+file;
		jsPath = addressParts;
	} else {
		jsPath = file;
	}

	  // if (!opt.headers)
	  //   opt.headers = { "Content-Type": "application/json" };
	var opts = {
		uri: jsPath,
		useXDR: true
	};
	xhr(opts, function(err, res, body) {
	    if (err) {
	    	console.error(err);
	     	return;
	     } else {
			var estree = esprima.parse(body, { tolerant: options.tolerant, sourceType: options.sourceType });
	     	onTreeSignal.dispatch(estree);
	     }
	});

	this.onTreeSignal = onTreeSignal;
}


module.exports = EsprimaManager;