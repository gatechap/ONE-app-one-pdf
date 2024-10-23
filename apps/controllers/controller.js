const service = require('../services/service');

module.exports = {
    img2WatermarkedPdfV1: async function (request, response, nextAction) {
        try {
            let pdfBytes = await service.img2WatermarkedPdfV1();
            response.setHeader('Content-Type', 'application/pdf');
            let img = Buffer.from(pdfBytes);
            return response.send(img);
        } catch (err) {
            console.log(err);
            return response.json({ result: `fail` });
        }
    },

    img2WatermarkedPdfV2: async function (request, response, nextAction) {
        try {
            const watermark = request.body.watermark;
            const images = request.files;
            let pdfBytes = await service.img2WatermarkedPdfV2(watermark, images);
            response.setHeader('Content-Type', 'application/pdf');
            let img = Buffer.from(pdfBytes);
            return response.send(img);
        } catch (err) {
            console.log(err);
            return response.json({ result: `fail` });
        }
    }
};