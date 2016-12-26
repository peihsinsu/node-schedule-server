Node REST Schedule Service
====

## Installation

### Using docker

```
$ git clone git@github.com:peihsinsu/node-schedule-server.git $project_home
```

Iniit database

```
docker run --name=nscheduler_mysql -e MYSQL_ROOT_PASSWORD=1234qwer -v /tmp/schema.sql:/docker-entrypoint-initdb.d/schema.sql -d mysql
```

### Using docker-compose

```
cd $project && docker-compose up
```

Note: At the first start, db will late than ap server... You need to wait db init finished, and restart again for everything ready...


## Start Service

```
docker run -d -p 3000:3000 --network container:nscheduler_mysql peihsinsu/nscheduler
```

## Add a job

```
curl http://127.0.0.1:3000/schedule/task-001 -d "jobtime=2015/1/31 22:47:00" -X POST
```

If the given time is not future, system will reject the job with the following message.

```
{
  "code": 500,
  "error": "job time is not future"
}
```

If the time is correct, it will shows:

```
{
  "code": 200,
  "msg": "success",
  "job": {
    "name": "<Anonymous Job 1>",
    "_events": {},
    "job_name": "testjob",
    "job_id": "026dc3a0-a960-11e4-9c9c-7f72acf080ea"
  }
}
```

## List all jobs

```
$ curl -sS http://127.0.0.1:3000/schedule/listall | json
{
  "026dc3a0-a960-11e4-9c9c-7f72acf080ea": {
    "name": "<Anonymous Job 1>",
    "_events": {},
    "job_name": "testjob",
    "job_id": "026dc3a0-a960-11e4-9c9c-7f72acf080ea"
  }
}
```

## Delete a job with id

```
$ curl http://127.0.0.1:3000/schedule/026dc3a0-a960-11e4-9c9c-7f72acf080ea -X DELETE
{"code":200,"msg":"delete job done"}
```

## Default restful worker schedule - restclient

```
curl -X POST -sS http://127.0.0.1:3000/schedule/testjob \
  -d "jobtime=2015/2/1 1:59:00" \
  -d catg=restclient \
  -d 'opts={"url":"http://localhost:3000","method":"GET"}'
```

## Write a worker

* Put your worker into $project_home/workers
* The name will be the same with your "catg" name that you will put in the post body
* Reference to restclient.js to implement your code:
  * Must implement exec function 
  * The exec function must has one json input for carry data from job create time (the data will be carry by the "opts" parameter)

The sample worker - workers/restclient.js:

```
var request = require('request');
var log = require('nodeutil').simplelog;

exports.exec = function(opts) {
	if(typeof(opts) == 'string')
		opts = JSON.parse(opts);
  //Here you can do the job...
	request(opts, function(e, r, d) {
		if(e) log.error('Job[%s] execute error:', e);
		log.info('Job[%s] execute result:', d);
	});
}
```

## Other jobs

### standard time string job

```
curl -X POST -sS http://127.0.0.1:3000/schedule/testjob \
  -d "jobtime=2015/2/4 12:59:00" \
  -d catg=restclient \
  -d 'opts={"url":"http://localhost:3000","method":"GET"}'
```

### cron without endtime

```
curl -X POST -sS http://127.0.0.1:3000/schedule/testjob \
  -d "cron_job=*/1 * * * *" \
  -d catg=restclient \
  -d 'opts={"url":"http://localhost:3000","method":"GET"}'
```

### date time with endtime

```
curl -X POST -sS http://127.0.0.1:3000/schedule/testjob \
  -d "jobtime=2015/2/4 11:42:00" \
  -d catg=restclient \
  -d retry_max=3 \
  -d "job_endtime=2015/2/4 11:46:00" \
  -d 'opts={"url":"http://localhost:3010","method":"GET"}'
```

### retry with interval

```
curl -X POST -sS http://127.0.0.1:3000/schedule/testjob \
  -d "jobtime=2015/2/4 18:04:00" \
  -d catg=restclient \
  -d retry_max=3 \
  -d retry_interval=5 \
  -d "job_endtime=2015/2/4 18:15:00" \
  -d 'opts={"url":"http://localhost:3010","method":"GET"}'
```

### retry without interval

```
curl -X POST -sS http://127.0.0.1:3000/schedule/testjob \
  -d "jobtime=2015/2/4 18:16:00" \
  -d catg=restclient \
  -d retry_max=3 \
  -d "job_endtime=2015/2/4 18:25:00" \
  -d 'opts={"url":"http://localhost:3010","method":"GET"}'
```


