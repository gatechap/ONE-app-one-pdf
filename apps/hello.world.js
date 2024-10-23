const { PDFDocument, PageSizes, degrees } = require("pdf-lib");
const fs = require("fs");

async function createPDFDocument() {
    const document = await PDFDocument.create();
    let page1 = document.addPage(PageSizes.A4);
    let page2 = document.addPage(PageSizes.A4);

    page1 = await addImage("./internal_files/images/test.jpg", page1, document, "jpg");
    page2 = await addImage("./internal_files/images/1.png", page2, document, "png");

    fs.writeFileSync("./image.pdf", await document.save());
}

async function addImage(path, page, document, imgType) {
    const imgBuffer = fs.readFileSync(path);
    let img;
    if (imgType === "jpg") {
        img = await document.embedJpg(imgBuffer);
    }
    if (imgType === "png") {
        img = await document.embedPng(imgBuffer);
    }

    // const { width, height } = img.scale(1);
    // page.drawImage(img, {
    //     x: page.getWidth() / 2 - width / 2,
    //     y: page.getHeight() / 2 - height / 2,
    // });
    const jpgDims = img.scale(0.75);
    page.drawImage(img, {
        x: page.getWidth() / 2 - jpgDims.width / 2,
        y: page.getHeight() / 2 - jpgDims.height / 2,
        width: jpgDims.width,
        height: jpgDims.height,
    });
    return page;
}

createPDFDocument().catch((err) => console.log(err));