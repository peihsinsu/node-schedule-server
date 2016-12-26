CREATE DATABASE nscheduler;
USE nscheduler;
CREATE TABLE IF NOT EXISTS nscheduler_jobs (
	job_id VARCHAR(50), 
	catg VARCHAR(20), 
	job_name VARCHAR(200), 
	job_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
	job_opts VARCHAR(20), 
	job_status VARCHAR(20) DEFAULT 'I', 
	retry_max INT DEFAULT 1, 
	retry_times INT DEFAULT 0, 
	cron_job VARCHAR(20), 
	job_endtime TIMESTAMP NULL, 
	retry_interval INT
	);
