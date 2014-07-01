var arrayBufferDataUri = function(raw) {
    "use strict";

    var base64 = '',
        encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
        bytes = new Uint8Array(raw),
        byteLength = bytes.byteLength,
        byteRemainder = byteLength % 3,
        mainLength = byteLength - byteRemainder,
        a, b, c, d,
        chunk;

    // Main loop deals with bytes in chunks of 3
    for (var i = 0; i < mainLength; i = i + 3) {
        // Combine the three bytes into a single integer
        chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];

        // Use bitmasks to extract 6-bit segments from the triplet
        a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18
        b = (chunk & 258048) >> 12; // 258048 = (2^6 - 1) << 12
        c = (chunk & 4032) >> 6; // 4032 = (2^6 - 1) << 6
        d = chunk & 63; // 63 = 2^6 - 1
        // Convert the raw binary segments to the appropriate ASCII encoding
        base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
    }

    // Deal with the remaining bytes and padding
    if (byteRemainder == 1) {
        chunk = bytes[mainLength];

        a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2
        // Set the 4 least significant bits to zero
        b = (chunk & 3) << 4; // 3 = 2^2 - 1
        base64 += encodings[a] + encodings[b] + '==';
    } else if (byteRemainder == 2) {
        chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];

        a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
        b = (chunk & 1008) >> 4; // 1008 = (2^6 - 1) << 4
        // Set the 2 least significant bits to zero
        c = (chunk & 15) << 2; // 15 = 2^4 - 1
        base64 += encodings[a] + encodings[b] + encodings[c] + '=';
    }

    return base64;
};



var j = new jsf5steg();

var handleFileSelect = function(evt) {
	"use strict";

    var files = evt.target.files; // FileList object

    if (files[0] && files[0].type.match('image.*')) {
        var reader = new FileReader();

        reader.onload = (function(theFile) {
            return function(e) {
                $('#outputdiv').empty();
            	var time_start = new Date().getTime();
                try{
                    j.parse(e.target.result);
                } catch(e){
                    console.log(e);
                    $('#outputdiv').append('<b style="color: #f00">JPEG DECODE FAILED!</b>');
                    return false;
                }
                var duration = new Date().getTime() - time_start;
    			console.log('Unpack '+ duration + 'ms');

    			var time_start = new Date().getTime();
                var pck = j.pack();
                var duration = new Date().getTime() - time_start;
    			console.log('Repack '+ duration + 'ms');
    			var jpegDataUri = 'data:image/jpeg;base64,' + arrayBufferDataUri(pck);
    			$('#outputdiv').append('<a href="'+jpegDataUri+'" download="repack.jpg">download repacked image</a><br/>');
    			$('#outputdiv').append('<img src="'+jpegDataUri+'">');
    			//console.log(jpegDataUri);
            };
        })(files[0]);

        reader.readAsArrayBuffer(files[0]);
    }
};

$(function($){
    "use strict";

    $('#image-select').on('change', handleFileSelect);
});