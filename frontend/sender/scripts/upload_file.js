import { parse } from 'papaparse';

function processCSV() {
    let fileUploadForm = $("#uploadedFile")[0];
    if (fileUploadForm.value !== 'undefined') {
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

                sendDataToServer(row.data, percentCompleted);
            }
        })
    }
    else 
        console.log("No file uploaded")
}

function setProgressBar(percent) {
    $('.progress-bar').css("width", percent + "%");
}

function sendDataToServer(dataRow, percent) {
    $.ajax({
        url: '/data/',
        type: 'POST',
        data: {'dataRow': dataRow},
        success: function(data) {
            console.log('Sent data!');
        }
    }).complete(function () {
        setProgressBar(percent);
    });
}

function headerSize(data) {
    return Buffer.byteLength(Object.keys(data).toString());
}

function rowDataSize(data) {
    return Buffer.byteLength(Object.values(data).toString());
}

$('document').ready(function () {
    $("#uploadFile").on("click", function(e) {
        setProgressBar(0);
        processCSV();
        $(document).ajaxStop(function() {
            setProgressBar(100);
        });
    })
});