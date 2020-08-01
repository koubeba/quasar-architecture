var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { Progress: 0 });
});

router.get('/recent_uploads', function(req, res, next) {
    res.render('uploads');
});

module.exports = router;
