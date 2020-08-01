import { parse } from 'papaparse';
import Cookies   from 'js-cookie';
var toastr  = require('toastr');

const INTERVAL_NOT_CONNECTED = 3000;
var KAFKA_CONNECTED = undefined;

var CACHED_FILES = {};

const heartbeatInterval = window.setInterval(heartbeat, INTERVAL_NOT_CONNECTED);

toastr.options.preventDuplicates = true;
toastr.options.closeButton       = true;
toastr.options.timeOut           = 0;
toastr.options.extendedTimeOut   = 0;

function processCSV() {

    let fileUploadForm = $("#uploadedFile")[0];

    if (fileUploadForm.value !== "") {
        let file = fileUploadForm.files[0]
        let filename = file.name;
        var allRowsSize = file.size;

        var counter = 0;
        var sumRowByteSize = 0;
        var averageRowByteSize = 0;
        var percentCompleted = 0;

        parse(file, {
            worker: true,
            header: true,
            step: function(row) {
                if (counter === 0) {
                    allRowsSize = allRowsSize - headerSize(row.data);
                }

                var rowSize = rowDataSize(row.data);

                counter = counter + 1;
                sumRowByteSize = sumRowByteSize + rowSize;
                averageRowByteSize = sumRowByteSize/counter;
                percentCompleted = counter*(averageRowByteSize/allRowsSize)*100;

                sendDataToServer(row.data, counter, percentCompleted);
            }
        });
        return {'filename': filename, 'rows': counter};
    }
    else {
        toastr.warning("No file uploaded");
        return undefined;
    }
}

function setProgressBar(percent) {
    $('.progress-bar').css("width", percent + "%");
}

function clearRowsSentInfo() {
    $('.info-text-row').text("");
}

function setRowsSentInfo(rowsSent) {
    $('.info-text-row').text(`Sent ${rowsSent} rows`);
}

function sendDataToServer(dataRow, rowsSent, percent) {
    $.ajax({
        url: '/data/',
        type: 'POST',
        data: {'dataRow': dataRow},
        success: function(data) {
            setRowsSentInfo(rowsSent);
            setProgressBar(percent);
        }
    }).complete(function () {
    });
}

function heartbeat() {
    $.ajax({
        url: '/data/heartbeat',
        type: 'GET',
        complete: function(response) {
            if (response.status == 200 && KAFKA_CONNECTED != true) {
                toastr.success('Connected to Kafka broker!');
                KAFKA_CONNECTED = true;
                window.clearInterval(heartbeatInterval);
                setUploadButtonToActive(true);
            } else if (response.status == 503 && KAFKA_CONNECTED != false) {
                toastr.error('Disconnected from Kafka broker!');
                KAFKA_CONNECTED = false;
                setUploadButtonToActive(false);
            }
        }
    });
}

function headerSize(data) {
    return Buffer.byteLength(Object.keys(data).toString());
}

function rowDataSize(data) {
    return Buffer.byteLength(Object.values(data).toString());
}

function setUploadButtonToActive(activated) {
    $("#uploadFile").find("button").prop('disabled', !activated);
}

function cacheSentFile(filename, rows) {
    Cookies.set(filename, JSON.stringify({
        'rowCount': rows,
        'timestamp': new Date()
    }), { sameSite: 'lax' });
}

$('document').ready(function () {

    $("#uploadFile").on("click", function(e) {
        setProgressBar(0);
        var processed = processCSV();
        $(document).ajaxStop(function() {
            if (processed != undefined) {
                toastr.success("File upload completed");
                cacheSentFile(processed['filename'], processed['rows']);
                setProgressBar(100);
            }
        });
    });

    $('#uploadedFile').on("change", function() {
        clearRowsSentInfo();
        setProgressBar(0);
    });
});

