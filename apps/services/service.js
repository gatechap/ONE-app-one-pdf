const fontkit = require('@pdf-lib/fontkit');
const fs = require('fs');
const pdfLib = require('pdf-lib');
const PDFDocument = pdfLib.PDFDocument;
const path = require('path');

module.exports = {
    img2WatermarkedPdf: async function (watermark, imagesBuffer) {
        let pdfDoc = await PDFDocument.create();
        pdfDoc.registerFontkit(fontkit);

        for (let i = 0; i < imagesBuffer.length; i++) {
            const imageBuffer = imagesBuffer[i];
            let page = pdfDoc.addPage(pdfLib.PageSizes.A4);
            let img;
            try {
                img = await pdfDoc.embedPng(imageBuffer.buffer);
            } catch (error) {
                img = await pdfDoc.embedJpg(imageBuffer.buffer);
            }
            const jpgDims = img.scale(0.75);
            page.drawImage(img, {
                x: page.getWidth() - jpgDims.width,
                y: page.getHeight() - jpgDims.height,
                width: jpgDims.width,
                height: jpgDims.height,
            });
        }

        const trueFont = await pdfDoc.embedFont(fs.readFileSync('./assets/fonts/True/TMedium.ttf'), { subset: true });
        let pages = pdfDoc.getPages();

        let textArray = (watermark || '')?.split('\\\\n');
        if (textArray.length === 1) {
            textArray = (watermark || '')?.split('\\n');
            if (textArray.length === 1) {
                textArray = (watermark || '')?.split('\n');
            }
        }

        for (let i = 0; i < pages.length; i++) {
            let page = pages[i];
            const fontSize = 28;
            const fontSizeSub = 20;
            const pageWidth = page.getWidth();
            const pageHeight = page.getHeight();
            const textWidth = trueFont.widthOfTextAtSize(textArray[0], fontSize);

            const watermarkRow = textArray?.length || 0;

            page.drawText(textArray[0], {
                x: pageWidth / 2 - textWidth / 2,
                y: pageHeight / 2 + watermarkRow * 10 + (watermarkRow < 3 ? 0 : 10),
                size: 28,
                font: trueFont,
                color: pdfLib.rgb(1, 0, 0),
                rotate: pdfLib.degrees(15),
                opacity: 0.5,
            });

            for (let i = 1; i < textArray.length; i++) {
                const textWidth2 = trueFont.widthOfTextAtSize(textArray[i], fontSizeSub);
                const y = pageHeight / 2 - i * 10;
                page.drawText(textArray[i], {
                    x: pageWidth / 2 - textWidth2 / 2 + 10,
                    y: y,
                    size: 20,
                    font: trueFont,
                    color: pdfLib.rgb(1, 0, 0),
                    rotate: pdfLib.degrees(15),
                    opacity: 0.5,
                });
            }
        }
        const pdfBytes = await pdfDoc.save();
        fs.writeFileSync(path.join(__dirname, `../internal_files/pdf/watermarkedPdf.pdf`), pdfBytes);
        pdfDoc = null;
        return pdfBytes;
    },

    img2WatermarkedPdfV1: async function () {
        const imagesBuffer = [];
        fs.readdirSync(path.join(__dirname, `../internal_files/images/`)).forEach(file => {
            imagesBuffer.push(fs.readFileSync(path.join(__dirname, `../internal_files/images/`, file)));
        });
        return this.img2WatermarkedPdf('ลายน้ำ APP-ONE-USER-MANAGEMENT V.1', imagesBuffer);
    },

    img2WatermarkedPdfV2: async function (watermark, images) {
        const imagesBuffer = [];
        for (let i = 0; i < images.length; i++) {
            const image = images[i];
            imagesBuffer.push(image.buffer);

        }
        return this.img2WatermarkedPdf(watermark, imagesBuffer);
    }
};
