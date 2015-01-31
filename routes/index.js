var express = require('express');
var router = express.Router();
var log = require('nodeutil').simplelog

/* GET home page. */
router.get('/', function(req, res, next) {
	log.warn('-------------------> index called');
  res.render('index', { title: 'Express' });
});

module.exports = router;
