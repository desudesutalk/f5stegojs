f5stego.js
==========

Port of [f5 steganographic algorithm](https://code.google.com/p/f5-steganography/) to JavaScript for modern browsers and Node.js.

[Simple online deomo](http://desudesutalk.github.io/f5stegojs/).

Documentation
=============

* [Overview](#overview)
  * [Security considerations](#security-considerations)
* [Installation](#installation)
* [Usage](#usage)
  * [Advanced usage](#advanced-usage)
  * [Metadata manipulation](#metadata-manipulation)
  * [CLI tool](#cli-tool)
* [Contributors](#contributors)
* [License](#license)

Overview
--------

This library implements jpeg codec capable of reading Huffman-coded baseline and progressive jpeg files and writing Huffman-coded baseline files. Decompression is done only up to raw DCT coefficients. They are not dequantized or dezigzagged. This coefficients are then used for embedding hidden messages with f5 algorithm.

I decided to make this library because for my projects I need small (this lib is 15kb minified and 5.5kb if gzipped) and fast code what is easy to maintain (and review). Speed mostly considered for extraction process as often I need to process many images at once.

Previously I was using [Eph5](https://github.com/Kleshni/Eph5) library. But now it looks unmaintained and I'm too lazy to get into that Emscripten things. And also Eph5 is 370kb and this Emscripten magic is not actually that performant. f5stego.js while being small has at least same performance as Eph5 and in some cases is 2x faster.

Another interest was to make tiny extract only version. You can find it in [extra](extra/) folder. Minified version of that extractor is only 4.5kb (2kb if gzipped).

Note: this implimentation is not compatible with [original code](https://code.google.com/p/f5-steganography/). It uses different shuffle algorithm and stores meatadata (used coding, data size) in a different way.

:warning: Work is still in progress.

### Security considerations

First: this lib **does not encrypt** data it hides. If you need good security then encrypt your data with some strong algorithms before embedding. If you want my advice then take a look at [TweetNaCl-js](https://github.com/dchest/tweetnacl-js).

Yes, you need to provide key for data extraction. And if key is not correct, garbage will be extracted. This looks like encryption but actually this is just a side effect. This key is used for coefficients shuffling and data masking - all this is for making f5 less detectable, not encrypted.

Second: f5 **can be detected**. For example with [stegdetect](https://github.com/abeluck/stegdetect). Yep, this is not 100% guaranteed especially if you embed small messages into big images. But it is better to think what you hide your data from humans, not machines.

Installation
------------

```
npm install f5stegojs
```

This package also provides simple cli tool which can be installed with

```
npm install f5stegojs --global
```

f5stego.js uses [typed arrays](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays) so it will not work in environments where typed arrays are not present.


Usage
-----
In browser include minifed version

```html
<script type="text/javascript" src="f5stego.min.js"></script>
```

In Node use `require` to load module

```js
var f5stego = require('f5stegojs');
```

Simple usage will be like

```js
var stegKey = [1,2,3,4,5,6,7,8,9];

var stegger = new f5stego(stegKey); // init stegger with key

//embed message into image
var secretImage = stegger.embed(imageArray, dataArray);

//extract message from image
var message = stegger.extract(secretImage);
```

Here `stegKey` is an array of byte values which is used for initialization of f5 shuffle. `imageArray` and `dataArray` are `Uint8Array` instances with cover jpeg image and message to embed respectively.

f5stegojs waits for `Uint8Array` in its input and also returns `Uint8Array`. But in recent versions of Node `Buffer` is also instance of `Uint8Array` so buffers can be used as inputs but lib still return `Uint8Array`.

Also note that f5stegojs throws in case of errors, so use try-catch.

### Advanced usage

f5stego has also several utility methods and expose a several functions what allow you to control a bit how data is embedded into image.

#### f5stego.prototype.analyze()

Perform analyze of parsed jpeg for capacity. Returns object what looks like

```js
{
  "capacity": [0,
    18477,
    13371,
    9092,
    5856,
    3609,
    2152,
    1251,
    713,
    399,
    220,
    120,
    63,
    33,
    16,
    6,
    3
  ],
  "coeff_total": 460800,
  "coeff_large": 114241,
  "coeff_zero": 270810,
  "coeff_one": 68549,
  "coeff_one_ratio": 0.37501504458668417
}
```

Most interesting here is `capacity` array. It contains maximum capacity (in bytes) for different f5 coding modes. This library supports f5 matrix encodings from 1 to 16. As arrays are indexed from zero first element is not used.

#### f5stego.prototype.parse(jpeg)

Parses jpeg file. Jpeg is decompressed up to DCT coefficients and now ready for embedding/extracting f5 data.

#### f5stego.prototype.f5put(data)

Embeds `data` into image using most appropriate coding. Returns object with resulting statistics what looks like

```js
{
  "k": 4,
  "embedded": 5024,
  "examined": 155976,
  "changed": 14070,
  "thrown": 5267,
  "efficiency": "2.86",
  "stats": { ... } // same object what was returned by analyze()
}
```
Here `k` shows what coding was used by f5 algorithm. `changed` shows how many DCT coefficients was changed and `thrown` shows how many of them was thrown (turned to zero). `efficiency` is how many bits of message was written by change of one DCT coefficient.

Value of `embedded` will be bigger than original message because it also counts additional bits what is embedded into image by this library (`k` value, data size. From 20 to 28 bits).

#### f5stego.prototype.f5put(data, k)

If you pass second argument to `f5put` then its value will be used as `k` in f5 algorithm. Returning object in this case will be like

```js
{
  "k": 2,
  "embedded": 5023.75,
  "examined": 67931,
  "changed": 20269,
  "thrown": 7648,
  "efficiency": "1.98"
}
```

Here `k` equals to value you provided in `f5put` call. There is no `stats` property because image was not analyzed for finding best value of `k`.

#### f5stego.prototype.f5get()

Extracts hidden data from previously parsed jpeg and returns it as `Uint8Arrat`. Zero length array can be returned or array containing garbage (if image has no embedded message, or if wrong `stegoKey` was used).

#### f5stego.prototype.pack()

Compresses jpeg back and return resulting file as `Uint8Array`.

### Metadata manipulation

This methods can be used to manipulate data what was stored in jpeg as `APPn` blocks or located after EOI marker.

#### f5stego.prototype.getTail()

Returns `Uint8Array` with data what was found after EOI marker.

#### f5stego.prototype.setTail(data)

Sets `data` as image tail. If tail data was already presented its old value will be returned. Otherwise `null` is returned.

#### f5stego.prototype.clearTail()

Clears image tail data.

#### f5stego.prototype.getAPPn(id, remove)

Returns data from `APPn` block `id`. jpeg uses ids from 0xE0 to 0xEF for `APPn` blocks and id 0xFE for comment. If `remove` evaluates to true, then block will be removed from image.

If there is no block with provided `id` then `null` will be returned.

#### f5stego.prototype.setAPPn(id, data)

Sets data as `APPn` block `id`. If such block was already presented in image its previous value will be returned. Otherwise `null` is returned.

#### f5stego.prototype.clearAPPs()

Removes all `AAPn` blocks from image and returns them. **Note**: JFIF block (with id 0xE0) will not be removed.

#### f5stego.prototype.strip()

Internally calls `clearAPPs` and `clearTail`. Always returns `true`.

### CLI tool

This package also contains binary what allows you to embed and extract data from images in command line. This tool is very simple and naive. It can be installed globally with npm by command `npm install f5stegojs --global`.

To embed data execute something like
```
f5stego -e -p SecreT cover.jpg message.txt output.jpeg
```

To extract
```
f5stego -x -p SecreT cover.jpg output.txt
```

Note what password is required for both operations. It is used to initialize f5 shuffling.

Contributors
------------

Original f5 algorithm is by Andreas Westfeld. https://code.google.com/p/f5-steganography/

JavaScript port of f5 algorithm and jpeg codec optimizations by [desudesutalk](https://github.com/desudesutalk).

Code of this lib is based on [js-steg](https://github.com/owencm/js-steg) by Owen Campbell-Moore. js-steg uses code from:

 * [notmasteryet](https://github.com/notmasteryet/jpgjs) (jpeg decoding)
 * Andreas Ritter (jpeg encoding)

License
-------
Released under MIT. See [LICENSE.txt](LICENSE.txt)