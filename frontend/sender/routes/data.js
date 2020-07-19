var express = require('express');

var router = express.Router();

let re = /dataRow\[([^\[\]]*)\]/ig;

/* POST data from CSV. */
router.post('/', async function(req, res, next) {
  sendMessage(req.app.get('kafka'), cleanKeys(JSON.stringify(req.body)));
  res.send('POST succeeded');
});

router.get('/heartbeat', async function(req, res, next) {
    if (res.locals.KAFKA_CONNECTED == true) {
        res.status(200);
    } else {
        res.status(503);
    }
    res.send();
});

async function sendMessage(kafka, message) {
    await kafka.send({
    topic: 'Spectra',
    messages: [{
            key: 'RowData',
            value: message
        }],
    });
}

function cleanKeys(dataRow) {
    return dataRow.replace(re, "$1")
}

module.exports = router;
