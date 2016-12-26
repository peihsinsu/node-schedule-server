var mode = process.env.NODE_ENV == 'production' ? 'production' : 'sandbox';

exports.db = {
  production: {
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '1234qwer',
    database: 'nscheduler'
  }, 
  sandbox: {
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '1234qwer',
    database: 'nscheduler'
  }
}[mode];

exports.sql = {
  loadAllJobs: 'select job_id, catg, job_name, job_time, job_options from nscheduler_jobs'
}

exports.msgSender = {
  url:'http://127.0.0.1:8000/api/msgSender',
  method:'POST',
  json:{
    messager:{}
  }
};

exports.schedule = {
  default_interval: 10 //second
}