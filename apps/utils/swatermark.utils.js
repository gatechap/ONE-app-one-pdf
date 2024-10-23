const sharp = require('sharp');
const b64 = require('./base64');
const sharpUtil = require('./sharp.utils');
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// Use a lookup table to find the index.
const lookup = new Uint8Array(256);
for (let i = 0; i < chars.length; i++) {
  lookup[chars.charCodeAt(i)] = i;
}

module.exports = {
  decodeFromBase64: function (base64) {
    let bufferLength = base64.length * 0.75;
    const len = base64.length;
    let i;
    let p = 0;
    let encoded1;
    let encoded2;
    let encoded3;
    let encoded4;

    if (base64[base64.length - 1] === '=') {
      bufferLength--;
      if (base64[base64.length - 2] === '=') {
        bufferLength--;
      }
    }

    const bytes = new Uint8Array(bufferLength);

    for (i = 0; i < len; i += 4) {
      encoded1 = lookup[base64.charCodeAt(i)];
      encoded2 = lookup[base64.charCodeAt(i + 1)];
      encoded3 = lookup[base64.charCodeAt(i + 2)];
      encoded4 = lookup[base64.charCodeAt(i + 3)];

      bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
      bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
      bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }

    return bytes;
  },

  watermark64: async function (b64string, optionObj) {
    // var b64string = ""/* whatever */;
    var arr = b64string.split(',');
    const buf = Buffer.from(arr[1], 'base64');

    return compositeImages(buf, optionObj);
  },

  watermarkStream: async function (imageStream = 'document-1.jpg', watermarkText) {
    const newline = '&#13;';
    const image = sharp(imageStream, { failOnError: false });
    const metadata = await image.metadata();
    let width = metadata.width;
    let height = metadata.height;
    const orientation = metadata.orientation;

    if (orientation === 6) {
      width = metadata.height;
      height = metadata.width;
    }

    let watermarkStr = watermarkText || '';

    let textArray = watermarkStr.split('\\\\n');
    if (textArray.length == 1) {
      textArray = watermarkStr.split('\\n');
    }

    const fontSize = width / 20;
    const fontSize2 = width / 30;
    const isPortrait = height > width;

    const newLineSpace = height / 30 + (isPortrait ? 0 : width / 40);

    let textSubTitle = '';
    for (let i = 1; i < textArray.length; i++) {
      // const y = 50 + (i - 1) * newLineSpace;
      const y = height / 2 + (i - 1) * newLineSpace;
      textSubTitle += `<text
        class="title2"
        font-family="Kanit"
        x="50%" y="${y}"
        text-anchor="middle"
        dominant-baseline="middle"
      >
        ${textArray[i]}
      </text>`;
    }

    const yHeader = height / 2 - newLineSpace;

    const svgImage = `
      <svg width="${width}" height="${height}">
        <style>
        .title {
           fill: rgba(255,0,0,.5); 
           font-size: ${fontSize};
          }
          .title2 {
            fill: rgba(255,0,0,.5); 
            font-size: ${fontSize2};
           }
        </style>
        <text
          class="title"
          font-family="Kanit"
          x="50%" y="${yHeader}"
          text-anchor="middle"
          dominant-baseline="middle"
        >
          ${textArray[0]}
        </text>
        ${textSubTitle}
      </svg>
      `;

    const svgBuffer = Buffer.from(svgImage);

    try {
      const tmpWater = await sharp(svgBuffer)
        .rotate(-15, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .resize(width, height)
        .toBuffer();

      const compoOpt = {
        input: tmpWater,
        blend: 'over',
        gravity: 'center',
      };

      if (orientation === 6) {
        const base64Output = await sharp(imageStream).rotate().composite([compoOpt]).toBuffer();

        return `${base64Output.toString('base64')}`;
      } else {
        const base64Output = await sharp(imageStream).composite([compoOpt]).toBuffer();

        return `${base64Output.toString('base64')}`;
      }
    } catch (error) {
      console.log(error);
      return '';
    }
  },

  watermarkImageDataURL: async function (imgDataURL, { text, maxSizeMB, isReduceResolution }) {
    const { base64, mimeType } = b64.getBase64AndMimeTypeFromDataURLImage(imgDataURL);

    let watermarkBase64 = await watermarkStream(Buffer.from(base64, 'base64'), text);

    // reduce size image.
    if (options.maxSizeMB) {
      watermarkBase64 = sharpUtil.reduceImageBase64(watermarkBase64, mimeType, { maxSizeMB, isReduceResolution, minQuality: 5 });
    }

    return b64.toDataURL(watermarkBase64, mimeType);
  },

  getWatermarkImage: async function (watermarkText, width, height) {
    let watermarkStr = watermarkText || '';

    let textArray = watermarkStr.split('\\\\n');
    if (textArray.length == 1) {
      textArray = watermarkStr.split('\\n');
    }

    const fontSize = '28px';
    const fontSize2 = '20px';
    const isPortrait = height > width;

    const newLineSpace = isPortrait ? 3 : 2;

    let textSubTitle = '';
    for (let i = 1; i < textArray.length; i++) {
      const y = 50 + (i - 1) * newLineSpace;
      textSubTitle += `<text
        class="title2"
        font-family="Kanit"
        x="50%" y="${y}%"
        text-anchor="middle"
        dominant-baseline="middle"
      >
        ${textArray[i]}
      </text>`;
    }

    const svgImage = `
      <svg width="${width}" height="${height}">
        <style>
        .title {
           fill: rgba(255,0,0,.5); 
           font-size: ${fontSize};
          }
          .title2 {
            fill: rgba(255,0,0,.5); 
            font-size: ${fontSize2};
           }
        </style>
        <text
          class="title"
          font-family="Kanit"
          x="50%" y="${50 - newLineSpace}%"
          text-anchor="middle"
          dominant-baseline="middle"
        >
          ${textArray[0]}
        </text>
        ${textSubTitle}
      </svg>
      `;

    const svgBuffer = Buffer.from(svgImage);

    try {
      const tmpWater = await sharp(svgBuffer)
        .rotate(-15, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .resize(width, height)
        .toBuffer();

      return tmpWater;
    } catch (e) { }
  }

};
