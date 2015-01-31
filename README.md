Node REST Schedule Service
====

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
