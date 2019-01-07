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
Add styles and images.
Move javascripts to "js" folder.
Change structure of html pages. Now the folder "index_files" folder will be copied if index.html copied.
Add test files:
 - TEST_FILE_FOR_EMBEDDING.txt - this file containing the string "test string in the TEST_FILE_FOR_EMBEDDING.txt"
 - EMPTY_COVER.jpg - original empty image (JPEG).
 - STEGO_JPEG_WITH_FILE.jpeg - picture for test decoding file using default password, and download this.
 - change pathways in example.html
 - Change README.md
 
______________
Usage:

Try to embedding file with data there:
1. Run example.html or index.html
2. Password: secret
3. Select EMPTY_COVER.jpg as cover image.
4. Select TEST_FILE_FOR_EMBEDDING.txt
5. Press button "embed data".
6. Download new jpeg file - repack.jpg
7. Move this near EMPTY_COVER.jpg
8. Rename this to STEGO_JPEG_WITH_FILE.jpeg

Try to extract file from STEGO_JPEG_WITH_FILE.jpeg:
1. Re-open example.html
2. Password: secret
3. Container - Select STEGO_JPEG_WITH_FILE.jpeg
4. Press button "Extract data."
5. Download file with data by clicking on the link "download extracted data".
6. Filename the same, contents too.
7. Open this as text, and see the string: "test string in the TEST_FILE_FOR_EMBEDDING.txt".
Now the filename saved in the encrypted data, and filename is not damaged.

Comparing, using WinMerge,
the EMPTY_COVER.jpg and STEGO_JPEG_WITH_FILE.jpeg,		some differences
and downloaded file with TEST_FILE_FOR_EMBEDDING.txt	no any differences.

Tests finished successfully!