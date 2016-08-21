f5extract.min.js
================

4.5kb of javascript what can decode Huffman-coded baseline and progressive jpegs and extract from them data hidden with f5 algorithm.

To use this function just include file
```html
<script type="text/javascript" src="f5extract.min.js"></script>
```
or copy and paste its contents to your scripts.

Usage
-----

```js
var stegKey = [1,2,3,4,5,6,7,8,9];

var f5get = f5extract(stegKey); // init stegger with key. Decoding function is returned.

//extract message from image
var message = f5get(secretImage);
```

Here `stegKey` is an array of byte values which is used for initialization of f5 shuffle. `secretImage` is `Uint8Array` instances with cover jpeg image data. Extracted message will be also returned as `Uint8Array`.

Note: this function will throw in case of errors. And can return zero length array or array of garbage if image has no embedded message or incorrect `stegKey` was used.

For more information and license refer to [main readme](../README.md)
