var express = require('express');
var router = express.Router();
var schedular = require('../lib/schedular');
var log = require('nodeutil').simplelog;

router.post('/:jobname', function(req, res, next) {
	var jobname = req.params.jobname;
	var tstring = req.body.jobtime;
	var catg = req.body.catg;
	var opts = req.body.opts;

	var ts = new Date(tstring);
	if(ts.getTime() <= new Date().getTime()) {
		return res.send({code:500, error: 'job time is not future'});
	}

  var job = schedular.addJob(jobname, new Date(tstring), catg, opts, function(uuid, time){
    log.info('%s run done at %s... now:%s', uuid, time, new Date());

	});

	var rtn = {
		code: 200,
		msg: 'success',
	  job: job
	}
	res.send(rtn);
});

router.delete('/:uuid', function(req, res, next) {
	var uuid = req.params.uuid;
	schedular.cancelJob(uuid);
	res.send({code:200, msg:'delete job done'});
});

router.get('/listall', function(req, res, next) {
	var jobs = schedular.getAllJobs();
	res.send(jobs);
});

module.exports = router;
