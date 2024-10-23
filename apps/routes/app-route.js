'use strict';

const multer = require('multer');
const upload = multer();

module.exports = function (app) {
    const controller = require('../controllers/controller');
    upload.fields([{ name: 'watermark', maxCount: 1 }, { name: 'images', maxCount: 9 }]);
    app.route('/img2WatermarkedPdfV1').get(async (request, response, nextAction) => {
        await controller.img2WatermarkedPdfV1(request, response, nextAction).catch(nextAction);
    });
    // app.route.post('/img2WatermarkedPdfV2', upload.none(), controller.img2WatermarkedPdfV2);
    app.post('/img2WatermarkedPdfV2', upload.array('images'), controller.img2WatermarkedPdfV2);
};
