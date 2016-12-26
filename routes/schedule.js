var express = require('express');
var router = express.Router();
var schedular = require('../lib/schedular');
var log = require('nodeutil').simplelog;
var moment = require('moment');

router.post('/:jobname', function(req, res, next) {
	var jobname = req.params.jobname;
	var tstring = req.body.jobtime;
	var catg = req.body.catg;
	var opts = req.body.opts;

	var retry_max = req.body.retry_max;
	var retry_interval = req.body.retry_interval;
	var cron_job = req.body.cron_job;
	var job_endtime = req.body.job_endtime;
	var dt = ( cron_job ? cron_job : new Date(tstring) );

	if(!cron_job) { //if using cron format, it will not check
		if(tstring) {
			dt = new Date(tstring);
			if(dt.getTime() <= new Date().getTime()) {
				return res.send({code:500, error: 'job time is not future'});
			}
		} else {
			dt = null;
		}
	} 

	var jobopts = {
		retry_max: retry_max,
		retry_interval: ( retry_max > 0 ? retry_interval || 30 : 0 ) ,
		job_endtime: job_endtime,
		cron_job: cron_job
	}

  var job = schedular.addJob(jobname, dt, catg, opts, jobopts, function(uuid, time){
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

//Initial jobs from database
schedular.loadJobsFromDb();