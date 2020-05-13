var express = require('express');
var router = express.Router();

/* POST data from CSV. */
router.post('/', function(req, res, next) {
  console.log(req.body);
  res.send('POST to data');
});

module.exports = router;
