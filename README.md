Node REST Schedule Service
====

This program is focus to start a scheduler server that provide restful api endpoint for control the job input and out put. We still not consider the job data persistence, now. You can fork and implement the persistence in the lib/schedular.js file. 
Welcome to feedback me.

## Installation

```
$ git clone git@github.com:peihsinsu/node-schedule-server.git $project_home
```

## Start Service

```
$ cd $project_home
$ npm start
```

## Add a job

```
curl http://127.0.0.1:3000/schedule -d "jobtime=2015/1/31 22:47:00" -X POST
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
