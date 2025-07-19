const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
//html 1 "C:\Users\betha\Desktop\html\4_PDFsam_issue65_en.html"
// html 2 "C:\Users\betha\Documents\ptmsln\samsung\origin\html\origin.html"
(async () => {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.error('Usage: node script.js <input-html-path> <output-csv-path>');
        process.exit(1);
    }
    const inputHtmlPath = args[0];
    const outputFilePath = args[1];
    // 启动无头浏览器
    //windows
    const browser = await puppeteer.launch({ headless: true,executablePath: 'C:\\Users\\betha\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe' });
    //linux
    // const browser = await puppeteer.launch({ headless: true});

    // 新建页面
    const page = await browser.newPage();

    // 设置虚拟窗口大小（视口）
    await page.setViewport({ width: 1980, height: 1980 });
    // 加载本地HTML文件，路径要用file://协议
    const filePath = path.resolve(inputHtmlPath);
    await page.goto('file://' + filePath, { waitUntil: 'load' });
    const data0 = await page.evaluate(async () => {
        // 获取第一页的画面宽高
        const firstPage = document.querySelector('div[id^="pf"]');
        let bound = firstPage.getBoundingClientRect();
        let h = bound.height;
        return {h: h, size: Array.from(document.querySelectorAll('div[id^="pf"]')).length};
    });
    console.log(data0);
    await page.setViewport({width: 1980, height: (data0.h+13)* data0.size+100});
    const filePath2 = path.resolve(inputHtmlPath);
    await page.goto('file://' + filePath2, { waitUntil: 'load' });


    const data = await page.evaluate(async () => {
        // 获取第一页的画面宽高
        // const firstPage = document.querySelector('div[id^="pf"]');
        // let bound = firstPage.getBoundingClientRect();
        // let w = bound.width;
        // let h = bound.height;

        const pages =  Array.from(document.querySelectorAll('div[id^="pf"]'));


        let res = []
        // let pageId = 1;
        pages.forEach((pageDiv, pageIndex) => {
            // 找该页内所有class包含'pc'的div
            const pcDivs = pageDiv.querySelectorAll('div[class*="pc"]');// pcDivs length <= 1
            let bound = pageDiv.getBoundingClientRect();
            let pageWidth = bound.width;
            let pageHeight = bound.height;
            let pageChildren = [];
            let rid = 1;
            pcDivs.forEach(pcDiv => {
                const childDivs = Array.from(pcDiv.children).filter(el => el.tagName.toLowerCase() === 'div');

                childDivs.forEach(childDiv => {
                    const rect = childDiv.getBoundingClientRect();
                    const pageRect = pageDiv.getBoundingClientRect();

                    pageChildren.push({
                        id: rid++,
                        width: rect.width,
                        height: rect.height,
                        left: rect.left - pageRect.left,
                        top: rect.top - pageRect.top,
                    });
                });
            });
            res.push({
                pageId:  pageIndex + 1,
                width: pageWidth,
                height: pageHeight,
                children: pageChildren,
            })
        });
        return res;
    });


    const fsContent = JSON.stringify(data, null, 2);

    fs.writeFileSync(outputFilePath, fsContent);

    console.log(`文件已生成：${outputFilePath}`);

    await browser.close();
})();
