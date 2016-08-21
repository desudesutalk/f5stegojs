/*	This software is licensed under the MIT License.

	Copyright (c) 2016 desudesutalk

	Permission is hereby granted, free of charge, to any person obtaining a copy of
	this software and associated documentation files (the "Software"), to deal in
	the Software without restriction, including without limitation the rights to
	use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
	the Software, and to permit persons to whom the Software is furnished to do so,
	subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
	FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
	COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
	IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
	CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

	https://github.com/desudesutalk/f5stegojs

	This library is based on https://github.com/owencm/js-steg by Owen Campbell-
	Moore. Decoder and encoder was optimized for speed, F5 algorithm and metadata
	manipulation utils was added to library.

	Original code was released under MIT and Apache licenses, so here follows
	original licenses of Owen code:

	jpeg decoder license:

	Modified JPEG decoder for Steganography by Owen Campbell-Moore, based on one
	released by Adobe.

	Copyright 2011 notmasteryet

	Licensed under the Apache License, Version 2.0 (the "License"); you may not use
	this file except in compliance with the License. You may obtain a copy of the
	License at

	http://www.apache.org/licenses/LICENSE-2.0

	Unless required by applicable law or agreed to in writing, software distributed
	under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
	CONDITIONS OF ANY KIND, either express or implied. See the License for the
	specific language governing permissions and limitations under the License.
	*/

/* exported f5extract */
function f5extract(key, maxPixels) {
	'use strict';

	maxPixels = maxPixels || 4096 * 4096;

	var randPool = new ArrayBuffer(maxPixels * 4.125),
		rand32Array = new Uint32Array(randPool),
		i, j, t;

	var k = 0,
		S = new Uint8Array(256),
		rnd = new Uint8Array(randPool);
	i = 0;
	j = 0;
	t = 0;
	// init state from key
	for (i = 0; i < 256; ++i) S[i] = i;

	for (i = 0; i < 256; ++i) {
		j = (j + S[i] + key[i % key.length]) & 255;
		t = S[i];
		S[i] = S[j];
		S[j] = t;
	}
	i = 0;
	j = 0;

	// shuffle data
	for (k = 0; k < maxPixels * 4.125; ++k) {
		i = (i + 1) & 255;
		j = (j + S[i]) & 255;
		t = S[i];
		S[i] = S[j];
		S[j] = t;
		rnd[k] = S[(t + S[i]) & 255];
	}

	function stegShuffle(pm) {
		var k, random_index;

		for (k = 1; k < pm.length; k++) {
			random_index = rand32Array[k] % (k + 1);
			if (random_index != k) {
				t = pm[k];
				pm[k] = pm[random_index];
				pm[random_index] = t;
			}
		}

		return new Uint8Array(randPool, pm.length * 4);
	}

	function _f5read(coeff) {
		var pos = -1,
			extrBit = 0,
			cCount = coeff.length - 1;

		var gamma = stegShuffle(coeff),
			gammaI = 0;

		var n, k = 0;

		var out = new Uint8Array((coeff.length / 8) | 0),
			extrByte = 0,
			outPos = 0,
			bitsAvail = 0,
			code = 0,
			hash = 0;

		while (bitsAvail < 4) {
			pos++;

			if (coeff[pos] === 0) {
				continue;
			}

			extrBit = coeff[pos] & 1;


			if (coeff[pos] < 0) {
				extrBit = 1 - extrBit;
			}

			k |= extrBit << bitsAvail;
			bitsAvail++;
		}

		k = (k ^ gamma[gammaI++] & 15) + 1;
		n = (1 << k) - 1;

		bitsAvail = 0;

		if (k == 1) {
			while (pos < cCount) {
				pos++;

				if (coeff[pos] === 0) {
					continue;
				}

				extrBit = coeff[pos] & 1;

				if (coeff[pos] < 0) {
					extrBit = 1 - extrBit;
				}

				extrByte |= extrBit << bitsAvail;
				bitsAvail++;

				if (bitsAvail == 8) {
					out[outPos++] = extrByte ^ gamma[gammaI++];
					extrByte = 0;
					bitsAvail = 0;
				}
			}
		} else {
			while (pos < cCount) {
				pos++;

				if (coeff[pos] === 0) {
					continue;
				}

				extrBit = coeff[pos] & 1;

				if (coeff[pos] < 0) {
					extrBit = 1 - extrBit;
				}

				hash ^= extrBit * ++code;

				if (code == n) {
					extrByte |= hash << bitsAvail;
					bitsAvail += k;
					code = 0;
					hash = 0;

					while (bitsAvail >= 8) {
						out[outPos++] = (extrByte & 0xFF) ^ gamma[gammaI++];
						bitsAvail -= 8;
						extrByte = extrByte >> 8;
					}
				}
			}
		}

		while (bitsAvail > 0) {
			out[outPos++] = (extrByte & 0xFF) ^ gamma[gammaI++];
			bitsAvail -= 8;
			extrByte = extrByte >> 8;
		}
		var s = 2,
			l = out[0];

		if (out[1] & 128) {
			s++;
			l += ((out[1] & 127) << 8) + (out[2] << 15);
		} else {
			l += out[1] << 8;
		}

		return out.subarray(s, s + l);
	}

	function _buildHuffmanTable(nrcodes, values) {
		var codevalue = 0,
			pos_in_table = 0,
			HT = new Uint16Array(65536);
		for (var k = 0; k < 16; k++) {
			for (var j = 0; j < nrcodes[k]; j++) {
				for (var i = codevalue << (15 - k), cntTo = ((codevalue + 1) << (15 - k)); i < cntTo; i++) {
					HT[i] = values[pos_in_table] + ((k + 1) << 8);
				}
				pos_in_table++;
				codevalue++;
			}
			codevalue *= 2;
		}
		return HT;
	}

	function decodeScan(data, offset, frame, components, resetInterval, spectralStart, spectralEnd, successivePrev, successive) {

		var startOffset = offset,
			bitsData = 0,
			bitsCount = 0,
			eobrun = 0,
			p1 = 1 << successive,  /*  1 in the bit position being coded */
			m1 = -1 << successive; /* -1 in the bit position being coded */

		function decodeHuffman(t) {
			while (bitsCount < 16) {
				bitsData = (bitsData << 8) + (data[offset] | 0);
				bitsCount += 8;
				if (data[offset] == 0xFF) offset++;
				offset++;
			}
			t = t[(bitsData >>> (bitsCount - 16)) & 0xFFFF];
			if (!t) throw "invalid huffman sequence";
			bitsCount -= t >>> 8;
			return t & 255;
		}

		function receiveAndExtend(r) {
			while (bitsCount < r) {
				bitsData = (bitsData << 8) + data[offset++];
				if ((bitsData & 0xff) == 0xFF) offset++;
				bitsCount += 8;
			}
			var n = (bitsData >> (bitsCount - r)) & ((1 << r) - 1);
			bitsCount -= r;
			if (n < 1 << (r - 1)) n += (-1 << r) + 1;
			return n;
		}

		function receive(t) {
			while (bitsCount < t) {
				bitsData = (bitsData << 8) + data[offset++];
				if ((bitsData & 0xff) == 0xFF) offset++;
				bitsCount += 8;
			}
			var n = (bitsData >>> (bitsCount - t)) & ((1 << t) - 1);
			bitsCount -= t;
			return n;
		}

		function getBit() {
			if (!bitsCount) {
				bitsData = data[offset++];
				if (bitsData == 0xFF) offset++;
				bitsCount = 8;
			}
			return (bitsData >>> --bitsCount) & 1;
		}

		function decodeBaseline(component, pos) {
			var t = decodeHuffman(component.huffmanTableDC);
			var diff = 0;
			if (t !== 0) {
				diff = receiveAndExtend(t);
			}
			component.pred += diff;

			var k = 1,
				s, r;
			while (k < 64) {
				s = decodeHuffman(component.huffmanTableAC);

				r = s >> 4;
				s &= 15;

				if (s === 0) {
					if (r < 15) {
						break;
					}
					k += 16;
					continue;
				}
				k += r;
				component.blocks[pos + k] = receiveAndExtend(s);
				k++;
			}
		}

		function decodeDCFirst(component) {
			var diff = 0,
				t = decodeHuffman(component.huffmanTableDC);
			if (t !== 0) {
				diff = receiveAndExtend(t);
			}
			component.pred += diff << successive;
		}

		function decodeACFirst(component, pos) {
			if (eobrun > 0) {
				eobrun--;
				return;
			}

			var k = spectralStart,
				s, r;

			while (k <= spectralEnd) {
				s = decodeHuffman(component.huffmanTableAC);
				r = s >> 4;
				s &= 15;
				if (s === 0) {
					if (r != 15) {
						eobrun = (1 << r) - 1;
						if (r) {
							eobrun += receive(r);
						}
						break;
					}
					k += 16;
					continue;
				}

				k += r;
				component.blocks[pos + k] = receiveAndExtend(s) * p1;
				k++;
			}
		}

		function decodeACSuccessive(component, pos) {
			var k = spectralStart,
				r, s;

			if (!eobrun) {
				while (k <= spectralEnd) {
					s = decodeHuffman(component.huffmanTableAC);
					r = s >> 4;
					s &= 15;

					if (s) {
						if (s != 1) throw "bad jpeg";
						if (getBit()) s = p1;
						else s = m1;
					} else {
						if (r != 15) {
							eobrun = (1 << r);
							if (r) {
								eobrun += receive(r);
							}
							break;
						}
					}

					while (k <= spectralEnd) {
						if (component.blocks[pos + k]) {
							component.blocks[pos + k] += getBit() * (component.blocks[pos + k] >= 0 ? p1 : m1);
						} else {
							if (--r < 0) break;
						}
						k++;
					}

					if (s) component.blocks[pos + k] = s;
					k++;
				}
			}

			if (eobrun) {
				while (k <= spectralEnd) {
					if (component.blocks[pos + k]) {
						component.blocks[pos + k] += getBit() * (component.blocks[pos + k] >= 0 ? p1 : m1);
					}
					k++;
				}
				eobrun--;
			}
		}

		var decodeFn;

		if (frame.progressive) {
			if (spectralStart === 0)
				decodeFn = successivePrev === 0 ? decodeDCFirst : getBit;
			else
				decodeFn = successivePrev === 0 ? decodeACFirst : decodeACSuccessive;
		} else {
			decodeFn = decodeBaseline;
		}

		var marker, mcuExpected, i, j, k, n, mcusPerLine, mcusPerRow, x, y;

		if (components.length == 1) {
			mcusPerLine = components[0].blocksPerLine;
			mcusPerRow = components[0].blocksPerColumn;
			mcuExpected = mcusPerRow * mcusPerLine;

			if (!resetInterval) resetInterval = mcuExpected;
			n = resetInterval;
			components[0].pred = 0;
			eobrun = 0;

			for (y = 0; y < mcusPerRow; y++) {
				for (x = 0; x < mcusPerLine; x++) {
					if (!n) {
						n = resetInterval;
						components[0].pred = 0;
						eobrun = 0;

						// find marker
						offset -= (bitsCount / 8) | 0;
						if (data[offset - 1] == 0xFF) offset--;
						bitsCount = 0;
						marker = (data[offset] << 8) | data[offset + 1];

						if (marker >= 0xFFD0 && marker <= 0xFFD7) { // RSTx
							offset += 2;
						} else {
							if (marker <= 0xFF00) {
								throw "bad jpeg";
							}
							break;
						}
					}
					n--;
					for (i = 0; i < components.length; i++) {
						decodeFn(components[i], (y * components[i].blocksPerLineForMcu + x) * 64);
					}

				}
			}
		} else {
			mcusPerLine = frame.mcusPerLine;
			mcusPerRow = frame.mcusPerColumn;
			mcuExpected = mcusPerRow * mcusPerLine;

			if (!resetInterval) resetInterval = mcuExpected;
			n = resetInterval;
			for (i = 0; i < components.length; i++) components[i].pred = 0;
			eobrun = 0;

			for (y = 0; y < mcusPerRow; y++) {
				for (x = 0; x < mcusPerLine; x++) {
					if (!n) {
						n = resetInterval;
						for (i = 0; i < components.length; i++) components[i].pred = 0;
						eobrun = 0;

						// find marker
						offset -= (bitsCount / 8) | 0;
						if (data[offset - 1] == 0xFF) offset--;
						bitsCount = 0;
						marker = (data[offset] << 8) | data[offset + 1];

						if (marker >= 0xFFD0 && marker <= 0xFFD7) { // RSTx
							offset += 2;
						} else {
							if (marker <= 0xFF00) {
								throw "bad jpeg";
							}
							break;
						}
					}
					n--;
					for (i = 0; i < components.length; i++) {
						for (j = 0; j < components[i].v; j++) {
							for (k = 0; k < components[i].h; k++) {
								decodeFn(components[i], ((y * components[i].v + j) * components[i].blocksPerLineForMcu + x * components[i].h + k) * 64);
							}
						}
					}
				}
			}
		}
		offset -= (bitsCount / 8) | 0;
		if (data[offset - 1] == 0xFF) offset--;
		return offset - startOffset;
	}

	function extract(data) {

		function readUint16() {
			var value = (data[offset] << 8) | data[offset + 1];
			offset += 2;
			return value;
		}

		var frame, offset = 0;

		var markerHi, markerLo, resetInterval, component,
			huffmanTablesAC = [],
			huffmanTablesDC = [];

		while (1) {
			if (offset >= data.length) throw "unexpected EOF";

			markerHi = data[offset++];
			markerLo = data[offset++];

			if (markerHi == 0xFF) {
				if ((markerLo >= 0xE0 && markerLo < 0xF0) || markerLo == 0xFE || markerLo == 0xDB) { //APPn + COM
					offset += readUint16();
				}

				if (markerLo >= 0xC0 && markerLo <= 0xC2) {
					// SOF0 (Start of Frame, Baseline DCT)
					// SOF1 (Start of Frame, Extended DCT)
					// SOF2 (Start of Frame, Progressive DCT)
					if (frame) throw "Only single frame JPEGs supported";
					frame = {};
					readUint16(); // skip data length
					offset++;
					frame.progressive = markerLo === 0xC2;
					frame.scanLines = readUint16();
					frame.samplesPerLine = readUint16();
					frame.components = [];
					frame.componentIds = {};

					if (frame.scanLines * frame.samplesPerLine > maxPixels) throw "Image is too big.";

					var componentsCount = data[offset++],
						componentId;
					var maxH = 0,
						maxV = 0;
					for (i = 0; i < componentsCount; i++) {
						componentId = data[offset];
						var h = data[offset + 1] >> 4;
						var v = data[offset + 1] & 15;
						if (maxH < h) maxH = h;
						if (maxV < v) maxV = v;
						frame.componentIds[componentId] = frame.components.push({
							componentId: componentId,
							h: h,
							v: v
						}) - 1;
						offset += 3;
					}
					frame.maxH = maxH;
					frame.maxV = maxV;

					var mcusPerLine = Math.ceil(frame.samplesPerLine / 8 / maxH);
					var mcusPerColumn = Math.ceil(frame.scanLines / 8 / maxV);
					for (i = 0; i < frame.components.length; i++) {
						component = frame.components[i];
						var blocksPerLine = Math.ceil(Math.ceil(frame.samplesPerLine / 8) * component.h / maxH);
						var blocksPerColumn = Math.ceil(Math.ceil(frame.scanLines / 8) * component.v / maxV);
						var blocksPerLineForMcu = mcusPerLine * component.h;
						var blocksPerColumnForMcu = mcusPerColumn * component.v;

						component.blocks = new Int16Array(64 * blocksPerColumnForMcu * blocksPerLineForMcu);
						component.blocksPerLine = blocksPerLine;
						component.blocksPerColumn = blocksPerColumn;
						component.blocksPerLineForMcu = blocksPerLineForMcu;
						component.blocksPerColumnForMcu = blocksPerColumnForMcu;
					}
					frame.mcusPerLine = mcusPerLine;
					frame.mcusPerColumn = mcusPerColumn;
				}

				if (markerLo == 0xC4) { // DHT (Define Huffman Tables)
					var huffmanLength = readUint16();
					for (i = 2; i < huffmanLength;) {
						var huffmanTableSpec = data[offset++];
						var codeLengths = new Uint8Array(16);
						var codeLengthSum = 0;
						for (j = 0; j < 16; j++, offset++)
							codeLengthSum += (codeLengths[j] = data[offset]);
						var huffmanValues = new Uint8Array(codeLengthSum);
						for (j = 0; j < codeLengthSum; j++, offset++)
							huffmanValues[j] = data[offset];
						i += 17 + codeLengthSum;
						((huffmanTableSpec >> 4) === 0 ?
							huffmanTablesDC : huffmanTablesAC)[huffmanTableSpec & 15] = _buildHuffmanTable(codeLengths, huffmanValues);
					}
				}

				if (markerLo == 0xDD) { // DRI (Define Restart Interval)
					resetInterval = readUint16();
				}

				if (markerLo == 0xDA) { // SOS (Start of Scan)
					if (!frame) throw "bad jpeg";
					readUint16();
					var selectorsCount = data[offset++];
					var components = [];

					for (i = 0; i < selectorsCount; i++) {
						var componentIndex = frame.componentIds[data[offset++]];
						component = frame.components[componentIndex];
						var tableSpec = data[offset++];
						component.huffmanTableDC = huffmanTablesDC[tableSpec >> 4];
						component.huffmanTableAC = huffmanTablesAC[tableSpec & 15];
						components.push(component);
					}

					var spectralStart = data[offset++];
					var spectralEnd = data[offset++];
					var successiveApproximation = data[offset++];
					offset += decodeScan(data, offset,
						frame, components, resetInterval,
						spectralStart, spectralEnd,
						successiveApproximation >> 4, successiveApproximation & 15);
				}

				if (markerLo == 0xD9) { // EOI (End of image)
					break;
				}
			} else {
				if (data[offset - 3] == 0xFF &&
					data[offset - 2] >= 0xC0 && data[offset - 2] <= 0xFE) {
					// could be incorrect encoding -- last 0xFF byte of the previous
					// block was eaten by the encoder
					offset -= 3;
				}
				while (data[offset] != 0xFF && offset < data.length) {
					// file could be damaged and have some extra data between blocks
					offset++;
				}

				if (data[offset] != 0xFF) {
					throw "bad jpeg ";
				}
			}
		}

		if (!frame) throw 'bad jpeg';

		component = frame.components[0];

		if (component.componentId != 1) {
			for (i = 0; i < frame.components.length; i++) {
				if (frame.components[i].componentId == 1) {
					component = frame.components[i];
					break;
				}
			}
		}

		return _f5read(component.blocks);
	}

	return extract;
}
