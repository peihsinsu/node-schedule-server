var mysql = require('mysql')
  , _ = require('underscore')
  , util = require('util')
  , nu = require('nodeutil')
  , log = nu.simplelog
  , cfg = require('./config')
  , dbcfg = cfg.db;

var conn_cfg = {
  connectionLimit : 10,
  host: dbcfg.host,
  port: dbcfg.port,
  user: dbcfg.user,
  password: dbcfg.password,
  database: dbcfg.database
};

var pool  = mysql.createPool(conn_cfg);
exports.pool = pool;

exports.loadAllJobs = function(callback) {
  var sql = 
    "select job_id, catg, job_name, job_time, job_opts, retry_max, retry_times, cron_job, job_endtime, retry_interval" 
    + " from nscheduler_jobs where "
    //still not execute job
    +" (job_time > ? and job_status = 'I') "
    //cron job that not failed
    + " or (cron_job is not null and cron_job <> '' and job_status <> 'F') "
    //retry the failed job under retry_max
    + " or (retry_times < retry_max and job_status <> 'S') ";
  var ts = new Date();
  var cond = [ts];
  log.info('[SQL]', sql);
  log.info('[Cond]', cond)
  pool.query(sql, cond, callback);
}

exports.loadJobById = function(jobid, callback) {
  var sql = 
    "select job_id, catg, job_name, job_time, job_opts, retry_max, retry_times, cron_job, job_endtime, retry_interval" 
    + " from nscheduler_jobs where job_id = ?";
  var cond = [jobid];
  log.info('[SQL]', sql);
  log.info('[Cond]', cond)
  pool.query(sql, cond, callback);
}

exports.saveJob = function(uuid, job, callback) {
  var sql = "insert into nscheduler_jobs (job_id, catg, job_name, job_time, job_opts, " + 
    "retry_max, retry_times, cron_job, job_endtime, retry_interval) " +
    "values (?,?,?,?,?,?,?,?,?,?)";

  var cond = [uuid, 
    job.catg || null, 
    job.name, 
    job.time, 
    job.opts,
    job.retry_max || 0,
    job.retry_times || 0,
    job.cron_job || null,
    job.job_endtime || null,
    job.retry_interval || null];

  log.info('[SQL]', sql);
  log.info('[Cond]', cond);
  pool.query(sql, cond, callback);
}

exports.updateJobFinish = function(uuid, callback) {
  var sql = "update nscheduler_jobs set job_status = 'S', last_exec_time = ? where job_id = ?";

  var cond = [new Date(), uuid];

  log.info('[SQL]', sql);
  log.info('[Cond]', cond);
  pool.query(sql, cond, callback);
}

exports.updateJobFailed = function(uuid, callback) {
  var sql = "update nscheduler_jobs set job_status = 'F', last_exec_time = ?, " +
    "retry_times = IF(retry_times < retry_max, retry_times+1, retry_max) " +
    "where job_id = ? and retry_max > retry_times";

  var cond = [new Date(), uuid];

  log.info('[SQL]', sql);
  log.info('[Cond]', cond);
  pool.query(sql, cond, callback);
}


