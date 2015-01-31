var request = require('request');
var log = require('nodeutil').simplelog;

exports.exec = function(opts) {
	if(typeof(opts) == 'string')
		opts = JSON.parse(opts);
	request(opts, function(e, r, d) {
		if(e) log.error('Job[%s] execute error:', e);
		log.info('Job[%s] execute result:', d);
	});
}
