const createError         = require('http-errors');
const express             = require('express');
const bodyParser          = require('body-parser')
const path                = require('path');
const cookieParser        = require('cookie-parser');
const logger              = require('morgan');

// Kafka connection
const {Kafka, logLevel}   = require('kafkajs');
const kafkaConfig         = require('./config/kafkaConfig.json');

// Routers
const indexRouter         = require('./routes/index');
const dataRouter          = require('./routes/data');

var app = express();
app.set('view cache', true);

// View engine setup
const views = path.join(__dirname, 'views');
app.set('views', views);
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(bodyParser({limit: '50mb'}));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Kafka configuration
const kafka = new Kafka({
    logLevel: logLevel.NOTHING,
    clientId: kafkaConfig.clientID,
    brokers:  kafkaConfig.brokers,
    retry:    {
        initialRetryTime: 1000,
        retires:          1
    }
});
const producer = kafka.producer();
app.set('kafka', producer);

// Kafka connection status
var KAFKA_CONNECTED = false;

// Kafka events
const {CONNECT, DISCONNECT} = producer.events;

producer.on(CONNECT, function() {
    KAFKA_CONNECTED = true;
})
producer.on(DISCONNECT, function() {
    KAFKA_CONNECTED = false;
})

// Middleware for passing Kafka connection status
app.use('/data/heartbeat', async function(req, res, next) {
  if (KAFKA_CONNECTED == false) {
    console.log("Trying to connect to the Kafka broker...");
    await producer.connect().catch(e => {KAFKA_CONNECTED = false});
  }
  res.locals.KAFKA_CONNECTED = KAFKA_CONNECTED;
  next();
});

app.use('/', indexRouter);
app.use('/data', dataRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use('/data', function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

console.log(`View cache ${ app.get('view cache') }`)

app.on('close', function() {
    producer.disconnect();
})

module.exports = app;
