import { parse } from 'papaparse';
var toastr  = require('toastr');

const INTERVAL_NOT_CONNECTED = 3000;
var KAFKA_CONNECTED = undefined;

const heartbeatInterval = window.setInterval(heartbeat, INTERVAL_NOT_CONNECTED);

toastr.options.preventDuplicates = true;
toastr.options.closeButton       = true;
toastr.options.timeOut           = 0;
toastr.options.extendedTimeOut   = 0;

function processCSV() {

    let fileUploadForm = $("#uploadedFile")[0];

    if (fileUploadForm.value !== "") {
        let file = fileUploadForm.files[0]
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
    }
    else {
        toastr.warning("No file uploaded");
    }
}

function setProgressBar(percent) {
    $('.progress-bar').css("width", percent + "%");
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
            console.log('Sent data!');
        }
    }).complete(function () {
        setRowsSentInfo(rowsSent);
        setProgressBar(percent);
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
    console.log("Setting upload button to disabled");
    $("#uploadFile").find("button").prop('disabled', !activated);
}

$('document').ready(function () {
    $("#uploadFile").on("click", function(e) {
        setProgressBar(0);
        processCSV();
        $(document).ajaxStop(function() {
            toastr.success("File upload completed");
            setProgressBar(100);
        });
    });
});

