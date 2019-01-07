/**
 * Creates a new Uint8Array based on two different ArrayBuffers
 *
 * @private
 * @param {ArrayBuffers} buffer1 The first buffer.
 * @param {ArrayBuffers} buffer2 The second buffer.
 * @return {ArrayBuffers} The new ArrayBuffer created out of the two.
 */
var _appendBuffer = function(buffer1, buffer2) {
  var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
  tmp.set(new Uint8Array(buffer1), 0);
  tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
  return tmp.buffer;
};

// source: http://stackoverflow.com/a/11058858
function ab2str(buf) {//array buffer to string
  return String.fromCharCode.apply(null, new Uint16Array(buf));
}

// source: http://stackoverflow.com/a/11058858
function str2ab(str) {//string to arraybuffer
  var buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
  var bufView = new Uint16Array(buf);
  for (var i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

if (!ArrayBuffer.prototype.slice)
    ArrayBuffer.prototype.slice = function (start, end) {
        var that = new Uint8Array(this);
        if (end == undefined) end = that.length;
        var result = new ArrayBuffer(end - start);
        var resultArray = new Uint8Array(result);
        for (var i = 0; i < resultArray.length; i++)
           resultArray[i] = that[i + start];
        return result;
    }

if (!Uint8Array.prototype.slice) {
  Object.defineProperty(Uint8Array.prototype, 'slice', {
    value: function (begin, end)
     {
        return new Uint8Array(Array.prototype.slice.call(this, begin, end));
     }
  });
}

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

var container = null, embeddata = null;
var iv = [];
var j = new jsf5steg();

var handleContainerSelect = function(evt) {
    "use strict";

    container = null;

    var files = evt.target.files; // FileList object

    if (files[0] && files[0].type.match('image.*')) {
        var reader = new FileReader();

        reader.onload = (function(theFile) {
            return function(e) {
                    container = e.target.result;
            };
        })(files[0]);
        reader.readAsArrayBuffer(files[0]);
    }else{
        alert('Please select image!');
    }
};

var handleDataSelect = function(evt) {
    "use strict";

    embeddata = null;

    var files = evt.target.files; // FileList object
    var reader = new FileReader();

    reader.onload = (function(theFile) {
        return function(e) {
                var file_content = e.target.result;								//file content in arraybuffer

				var filename = files[0].name;								//filename to string

				var filename_buf = new ArrayBuffer(256);					//set static bytelength for filename
				var fn_bufView = new Uint16Array(filename_buf);
				for (var i = 0, strLen = filename.length; i < strLen; i++) { //fill filename to arraybuffer
					fn_bufView[i] = filename.charCodeAt(i);
				}				
				var filename_and_content = _appendBuffer(filename_buf, file_content);	//concatenate two arraybuffers with filename and content

				embeddata = filename_and_content; //this will be encrypted...
        };
    })(files[0]);

    reader.readAsArrayBuffer(files[0]);
};

var doEmbed = function(evt) {
	"use strict";
    $('#outputdiv').empty();

    if(iv.length == 0){
        var buffer = new ArrayBuffer(256);
        var int32View = new Int32Array(buffer);
        var Uint8View = new Uint8Array(buffer);

        var key_from_pass = sjcl.misc.pbkdf2($('input[name="passwd"]').val(), $('input[name="passwd"]').val(), 1000, 256 * 8);

        int32View.set(key_from_pass);

        for (var i = 0; i < 256; i++) {
            iv[i] = Uint8View[i];
        }
    }


	var time_start = new Date().getTime();
    try{
        j.parse(container);
    } catch(e){
        $('#outputdiv').append('<b style="color: #f00">JPEG DECODE FAILED!</b>');
        return false;
    }
    var duration = new Date().getTime() - time_start;
	console.log('Unpack '+ duration + 'ms');

    j.f5embed(embeddata,iv);

	var time_start = new Date().getTime();
    var pck = j.pack();
    var duration = new Date().getTime() - time_start;
	console.log('Repack '+ duration + 'ms, size: ' + pck.length);
	var jpegDataUri = 'data:image/jpeg;base64,' + arrayBufferDataUri(pck);
	$('#outputdiv').append('<a href="'+jpegDataUri+'" download="repack.jpg">download repacked image</a><br/>');
	$('#outputdiv').append('<img src="'+jpegDataUri+'">');
	//console.log(jpegDataUri);
};

var doExtract = function(evt) {
    "use strict";
    $('#outputdiv').empty();

    if(iv.length == 0){
        var buffer = new ArrayBuffer(256);
        var int32View = new Int32Array(buffer);
        var Uint8View = new Uint8Array(buffer);

        var key_from_pass = sjcl.misc.pbkdf2($('input[name="passwd"]').val(), $('input[name="passwd"]').val(), 1000, 256 * 8);

        int32View.set(key_from_pass);

        for (var i = 0; i < 256; i++) {
            iv[i] = Uint8View[i];
        }
    }


    var time_start = new Date().getTime();
    try{
        j.parse(container);
    } catch(e){
        $('#outputdiv').append('<b style="color: #f00">JPEG DECODE FAILED!</b>');
        return false;
    }
    var duration = new Date().getTime() - time_start;
    console.log('Unpack '+ duration + 'ms');

    var hidData = j.f5extract(iv);												//decrypted filename and content
	var view = new Uint8Array(hidData);											//int array from arraybuffer
	
	var filename_uint8 = new Uint8Array(256);
	for (var i = 0; i < 256; i++) { 											//fill filename uint8 array
		filename_uint8[i] = view[i];
	}
	var extracted_filename_buf = filename_uint8.buffer;							//uint8 to arraybuffer
	var extracted_filename = ab2str(extracted_filename_buf).replace(/\0/g, '');	//get filename string from arraybuffer, and remove null-bytes in the end.
	
	var hiddata_without_filename = new Uint8Array(hidData).slice(256);			//get uint8 array after filename arraybuffer.
	var hiddata_file_content = new Uint8Array(hidData-256);						//resize content arraybuffer and cut arraybuffer with filename
	hiddata_file_content = hiddata_without_filename.buffer;						//uint8 to arraybuffer

    var hidDataUri = 'data:application/octet-stream;base64,' + arrayBufferDataUri(hiddata_file_content); //using content only

    $('#outputdiv').append(	'<a href="'+hidDataUri+'" download="'+extracted_filename+'">download extracted data</a><br/>'); //filename in "download"
};


$(function($){
    "use strict";

    $('#image-select').on('change', handleContainerSelect);
    $('#data-select').on('change', handleDataSelect);

    $('#do_embed').on('click', doEmbed);
    $('#do_extract').on('click', doExtract);

    $('input[name="passwd"]').on('change', function(){iv = [];});
});