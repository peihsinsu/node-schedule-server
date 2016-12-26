var schedule = require('node-schedule');
var nouuid = require('node-uuid'); 
var log = require('nodeutil').simplelog;
var dbm = require('./dbmanager');
var moment = require('moment');
var cfg = require('../lib/config');

var jobpool = {};

exports.addJob = addJob;
function addJob(jobname, jobtime, catg, opts, jobopts, jobfunction) {
	var cron_job = jobopts.cron_job;
	var ts = ( cron_job ? new Date() : new Date(jobtime) );

  if( !cron_job ) {
  	if(ts.getTime() <= new Date().getTime()) {
			log.error(jobname + ' job time is not future');
			return {error: jobname + ' job time is not future'};
		}
	} 

	var uuid = nouuid.v1();
	jobpool[uuid] =
		schedule.scheduleJob( ts, function(){
			log.info('The job %s is going to execute...', uuid);

			//request worker for running job
			if(catg && opts) {
				log.info('worker[%s] execute opts:', catg, opts);
				try {
					log.info('start load worker:' + catg);
					var worker = require('../workers/'+catg);
					worker.exec(opts, uuid, successCb, failedCb);
				} catch (e) {
					log.error('worker execute error:', e);
					failedCb();
				}
			}

			function successCb(){
				dbm.updateJobFinish(uuid, function(err, rows, fields){
					if(err) log.error('update status error:', err);
					delete jobpool[uuid];
					if(jobfunction) jobfunction(uuid, jobtime);
				})
			}
			
			function failedCb(){
				dbm.updateJobFailed(uuid, function(err, rows, fields){
					if(err) log.error('update status error:', err);
					
					dbm.loadJobById(uuid, function(err, rows, fields){
						if(err) {
							log.error('load job by id:%s error', uuid, err);
							return;
						}
						//delete job first
						log.warn('do the delete first...');
						delete jobpool[uuid];
						if(jobfunction) jobfunction(uuid, jobtime);
						log.warn('query result:%s   ', rows.length,  rows);
						if(rows.length > 0 && rows[0].retry_times < rows[0].retry_max) { //do the retry
							log.warn('retry_times:%s, retry_max:%s, retry_interval:%s', rows[0].retry_times, rows[0].retry_max, rows[0].retry_interval);
							log.warn('re-insert job...');
							var newJobTime = new Date( jobtime.getTime() + rows[0].retry_interval * 1000 )
						//if(retry_times >= retry_max)
							initJobFromDb(uuid, jobname, newJobTime, catg, opts, 
								rows[0].retry_max, rows[0].retry_times , cron_job, rows[0].job_endtime, rows[0].retry_interval);
						}
					});
				})
			}

		});

	dbm.saveJob(uuid, {
		catg: catg,
		name: jobname,
		time: ts,
		opts: JSON.stringify(opts), 
		retry_max: jobopts.retry_max || 0, 
		retry_times: jobopts.retry_times || 0, 
		job_endtime: jobopts.job_endtime || null,
		cron_job: cron_job, 
		retry_interval: jobopts.retry_interval || cfg.schedule.default_interval
	}, function(err, rows, fields) {
		if(err) {
			log.error('Saving job error:', err);
			return null;
		}
		
		jobpool[uuid]['job_name'] = jobname;
		jobpool[uuid]['job_id'] = uuid;
		jobpool[uuid]['job_time'] = ts;
		jobpool[uuid]['catg'] = catg;
		jobpool[uuid]['job_opts'] = opts;

		jobpool[uuid]['retry_max'] = jobopts.retry_max || 0;
		jobpool[uuid]['retry_times'] = jobopts.retry_times || 0;
		jobpool[uuid]['retry_interval'] = jobopts.retry_interval || cfg.schedule.default_interval;
		jobpool[uuid]['job_endtime'] = jobopts.job_endtime || null;
		jobpool[uuid]['cron_job'] = cron_job || null;

		return jobpool[uuid] ;
	});
}

exports.getAllJobs = function() {
	return jobpool;
}

exports.cancelJob = function(uuid) {
  jobpool[uuid].cancel();
	delete jobpool[uuid];
}

exports.loadJobsFromDb = function() {
	dbm.loadAllJobs(function(err, rows, fields){
		if(err) {
			log.error('load jobs from db error:', err)
		}

		if(rows){
			log.info('total restored jobs:', rows.length);
			rows.forEach(function(row){
				initJobFromDb(row.job_id, row.job_name, row.job_time, row.catg, row.job_opts, 
					row.retry_max, row.retry_times, row.cron_job, row.job_endtime, row.retry_interval);
			})
		}
	});
}

function initJobFromDb(jobid, jobname, jobtime, catg, opts, retry_max, retry_times, cron_job, job_endtime, retry_interval) {
	
	if(opts && typeof(opts) == 'string') opts = JSON.parse(opts);

	var uuid = jobid || nouuid.v1();
	log.debug('---> origin jobtime: ', jobtime);

	//using cron_job first
	var dt = ( cron_job ? cron_job : new Date(jobtime) );

  if( !cron_job ) {
  	if(dt.getTime() <= new Date().getTime()) {
			//return {error: jobid + ' job time is not future'};
			//if retry_time < retry_max, update job_time and also fire
			if(retry_times < retry_max) {
				dt = new Date(new Date(jobtime).getTime() + 5000)
				log.info(jobid + ' job time will retry, original time is ' + jobtime + ' set time to ' + dt);
			} else {
				log.error(jobid + ' job time is not future');
				return {error: jobname + ' job time is not future'};
			}
		}
	} 

	log.debug('------->after convert dt(jobtime) = ', dt);

	jobpool[uuid] =
		schedule.scheduleJob( dt, function(){
			log.info('The job %s is going to execute...', uuid);

			//request worker for running job
			if(catg && opts) {
				log.info('worker[%s] execute opts:', catg, opts);
				try {
					log.info('start load worker:' + catg + '=='+uuid);
					var worker = require('../workers/'+catg);
					worker.exec(opts, uuid, successCb, failedCb);
				} catch (e) {
					log.error('worker execute error:', e);
				}
			}
			//job success system callback
			function successCb(){
				dbm.updateJobFinish(uuid, function(err, rows, fields){
					if(err) log.error('update status error:', err);
					delete jobpool[uuid];
				})
			}
			//job error system callback
			function failedCb(){
				dbm.updateJobFailed(uuid, function(err, rows, fields){
					if(err) log.error('update status error:', err);

					dbm.loadJobById(uuid, function(err, rows, fields){
						if(err) {
							log.error('load job by id:%s error', uuid, err);
							return;
						}
						//delete job first
						log.warn('delete job first...');
						delete jobpool[uuid];
						log.warn('query result:%s   ', rows.length,  rows);
						if(rows.length > 0 && rows[0].retry_times < rows[0].retry_max) {
							log.warn('re-insert job...');
							log.warn('retry_times:%s, retry_max:%s, retry_interval:%s', 
								rows[0].retry_times, rows[0].retry_max, rows[0].retry_interval);
							
							var newRetryInterval = new Date( jobtime.getTime() + rows[0].retry_interval * 1000 )
						//if(retry_times >= retry_max)
							initJobFromDb(jobid, jobname, jobtime, catg, opts, 
								rows[0].retry_max, rows[0].retry_times , cron_job, job_endtime, retry_interval);
						}
					});
				})
			}
			
		});
	
	jobpool[uuid]['job_name'] = jobname;
	jobpool[uuid]['job_id'] = uuid;
	jobpool[uuid]['job_time'] = (cron_job ? null : dt);
	jobpool[uuid]['catg'] = catg;
	jobpool[uuid]['job_opts'] = opts;

	jobpool[uuid]['retry_max'] = retry_max || 0;
	jobpool[uuid]['retry_times'] = retry_times || 0;
	jobpool[uuid]['retry_interval'] = retry_interval || cfg.schedule.default_interval;
	jobpool[uuid]['job_endtime'] = job_endtime || null;
	jobpool[uuid]['cron_job'] = cron_job || null;

	return jobpool[uuid] ;
}
