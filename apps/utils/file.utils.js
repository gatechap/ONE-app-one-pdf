const axios = require('axios');
const lodash = require('lodash');

module.exports = {
  getFileType: function (fileType) {
    if (/^application\/pdf/.test(fileType)) return 'pdf';
    else if (/^image\/png/.test(fileType)) return 'png';
    else if (/^image\/(jpg|jpeg)/.test(fileType)) return 'jpg';
    else if (/^image\/gif/.test(fileType)) return 'gif';
    else if (/^text\/plain/.test(fileType)) return 'text';
    return 'unknown';
  },

  getFileTypeBase64: function (fileType) {
    const _fileType = lodash.toUpper(fileType);
    if (_fileType === 'PNG') return 'image/png';
    else if (_fileType === 'JPG' || _fileType === 'JPEG') return 'image/jpeg';
    else if (_fileType === 'GIF') return 'image/gif';
    else if (_fileType === 'PDF') return 'application/pdf';
    return '';
  },

  removeBase64Prefix: function (imageData) {
    return lodash.trim(lodash.replace(imageData, /(data:image|data:application)\/(png|jpg|jpeg|gif|pdf);base64,/, ''));
  },

  getBase64: function (file) {
    var reader = new FileReader();
    reader.readAsDataURL(file);
    return new Promise((resolve, reject) => {
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.onerror = (error) => {
        reject(error);
      };
    });
  },

  getBase64FromURL: async function (path) {
    try {
      const response = await axios.get(path, {
        responseType: 'arraybuffer',
      });
      if (response.status === 200) {
        const type = response?.headers['content-type'];
        const base64 = Buffer.from(response?.data, 'binary').toString('base64');
        return {
          status: response.status,
          base64: `data:${type};base64,${base64}`,
          type,
          size: response?.headers['content-length'],
        };
      } else {
        return { status: response.status };
      }
    } catch (e) {
      console.debug(e);
      return { status: 500 };
    }
  },

  detectMimeType: function (b64) {
    var signatures = {
      JVBERi0: 'application/pdf',
      R0lGODdh: 'image/gif',
      R0lGODlh: 'image/gif',
      iVBORw0KGgo: 'image/png',
      '/9j/': 'image/jpg',
    };
    for (var s in signatures) {
      if (b64.indexOf(s) === 0) {
        return signatures[s];
      }
    }
  },

  // BLOB Section
  /**
   * Convert BASE64 to BLOB
   * @param base64Image Pass Base64 image data to convert into the BLOB
   */

  base64ToBlob: function (base64Image) {
    // Split into two parts
    const parts = base64Image.split(';base64,');

    // Decode Base64 string
    const imageContent = Buffer.from(parts[1], 'base64').toString(); // window.atob(parts[1]);
    // create an ArrayBuffer and a view (as unsigned 8-bit)
    // eslint-disable-next-line no-undef
    const buffer = new ArrayBuffer(imageContent.length);
    // eslint-disable-next-line no-undef
    const uInt8Array = new Uint8Array(buffer);

    // Insert all character code into uInt8Array
    for (let n = 0; n < imageContent.length; n++) {
      uInt8Array[n] = imageContent.charCodeAt(n);
    }
    return Buffer.from(uInt8Array, 'base64');
  },

  // not test yet
  blobToFile: function (theBlob, fileName) {
    return new File([theBlob], fileName, {
      lastModified: new Date().getTime(),
      type: theBlob.type,
    });
  }

};
