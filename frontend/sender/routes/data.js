var express = require('express');
var process = require('process')
const { Kafka } = require('kafkajs');
const kafkaConfig = require('../config/kafkaConfig.json');
var router = express.Router();

let re = /dataRow\[([^\[\]]*)\]/ig;

const kafka = new Kafka({
    clientId: kafkaConfig.clientID,
    brokers: kafkaConfig.brokers
});
const producer = kafka.producer();

/* POST data from CSV. */
router.post('/', async function(req, res, next) {
  sendMessage(cleanKeys(JSON.stringify(req.body)));
  res.send('POST data successful');
});

async function sendMessage(message) {
    await producer.connect();
    await producer.send({
    topic: 'Messages',
    messages: [{
            key: 'RowData',
            value: message
        }],
    });
    await producer.disconnect();
}

function cleanKeys(dataRow) {
    return dataRow.replace(re, "$1")
}

module.exports = router;
