js-jpeg-steg
============

JPEG steganography in JavaScript

*Work in progress*

Trying to port [f5 algorithm](https://code.google.com/p/f5-steganography/) to JavaScript

[Demo page](https://username1565.github.io/js-jpeg-steg/example.html) - open browser JS console to see logs.
============
Changes and additions:
main2.js:
	- add function to concatenate arraybuffers.
	- add function to convert arraybuffer to string and string to arraybuffer.
	- add slice functions for arraybuffer and Uint8Array
	- attach filename string (256 bytes) as arraybuffer to embeddata. Now filename is saved and encrypted.
	- slice decrypted arraybuffer hidData, extract from there filename arraybuffer, convert this to string and attach to download attribute.
	- Now the file can be downloaded with original filename.
	
Add index.html from http://desudesutalk.github.io/f5stegojs/ and change HTML code.