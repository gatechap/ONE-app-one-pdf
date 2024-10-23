const sharp = require('sharp');
const b64 = require('./base64');
const fileUtil = require('./file.utils');

module.exports = {
  qualityImageJPG: function (bufferImage, quality) { sharp(bufferImage).jpeg({ quality }) },

  qualityImagePNG: function (bufferImage, quality) { sharp(bufferImage).png({ quality }) },

  qualityImage: async function (bufferImage, fileType, { quality, isReduceResolution, width, height }) {
    let processSharp = null;

    if (fileType === 'jpg') {
      processSharp = qualityImageJPG(bufferImage, quality);
    } else if (fileType === 'png') {
      processSharp = qualityImagePNG(bufferImage, quality);
    } else throw new Error(`Doesn't support file type: {${fileType}}`);

    if (isReduceResolution) {
      processSharp = processSharp.resize(width, height);
    }

    return await processSharp.toBuffer();
  },

  getImageMetaData: async function (bufferImage) {
    return await sharp(bufferImage).metadata();
  },

  reduceImageBase64: async function (
    base64,
    mimeType,
    options = { maxSizeMB: 1, isReduceResolution: false, minQuality: 10 },
  ) {
    const fileType = fileUtil.getFileType(mimeType);
    if (!['jpg', 'png'].includes(fileType)) {
      throw new Error(`Doesn't support mime type: {${mimeType}}`);
    }
    const { maxSizeMB = 1, isReduceResolution = false } = options;
    const maxSizeByte = maxSizeMB * 1024 * 1024;
    const reduceQuality = 5;
    const minQuality = options.minQuality && options.minQuality > reduceQuality ? options.minQuality : reduceQuality;

    let bufferImage = Buffer.from(base64, 'base64');
    let currentSize = bufferImage.byteLength;
    let quality = 100;
    let width, height;

    if (isReduceResolution) {
      const metaData = await getImageMetaData(bufferImage);
      [width, height] = [metaData.width, metaData.height];
    }

    while (maxSizeByte <= currentSize && minQuality <= quality - reduceQuality) {
      if (isReduceResolution) {
        [width, height] = [width, height].map((v) => Math.floor(v * 0.95));
      }

      quality -= reduceQuality;
      bufferImage = await qualityImage(bufferImage, fileType, { quality, isReduceResolution, width, height });
      currentSize = bufferImage.byteLength;
    }

    return bufferImage.toString('base64');
  },

  reduceImageDataURL: async function (
    imgDataURL,
    options = { maxSizeMB: 1, isReduceResolution: false, minQuality: 10 },
  ) {
    const { base64, mimeType } = b64.getBase64AndMimeTypeFromDataURLImage(imgDataURL);
    const reduceBase64 = await reduceImageBase64(base64, mimeType, options);
    return b64.toDataURL(reduceBase64, mimeType);
  }

};
