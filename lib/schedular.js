var schedule = require('node-schedule');
var nouuid = require('node-uuid'); 
var log = require('nodeutil').simplelog;

var jobpool = {};

exports.addJob = function(jobname, jobtime, catg, opts, jobfunction) {
	var uuid = nouuid.v1();
	var ts = new Date(jobtime);
	if(ts.getTime() <= new Date().getTime()) {
		return {error: 'job time is not future'};
	}

	jobpool[uuid] =
		schedule.scheduleJob( ts, function(){
			log.info('The job %s is going to execute...', uuid);

			//request worker for running job
			if(catg && opts) {
				log.info('worker[%s] execute opts:', catg, opts);
				try {
					log.info('start load worker:' + catg);
					var worker = require('../workers/'+catg);
					worker.exec(opts);
				} catch (e) {
					log.error('worker execute error:', e);
				}
			}

			delete jobpool[uuid];
			jobfunction(uuid, jobtime);
		});
	jobpool[uuid]['job_name'] = jobname;
	jobpool[uuid]['job_id'] = uuid;
	return jobpool[uuid] ;
}

exports.getAllJobs = function() {
	return jobpool;
}

exports.cancelJob = function(uuid) {
  jobpool[uuid].cancel();
	delete jobpool[uuid];
}
