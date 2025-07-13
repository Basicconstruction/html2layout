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
    const outputCsvPath = args[1];
    // 启动无头浏览器
    //windows
    const browser = await puppeteer.launch({ headless: true,executablePath: 'C:\\Users\\betha\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe' });
    //linux
    // const browser = await puppeteer.launch({ headless: true});

    // 新建页面
    const page = await browser.newPage();

    // 设置虚拟窗口大小（视口）
    await page.setViewport({ width: 1980, height: 1980 });
    // await page.setViewport({width: 1980, height: (h+13)* pages.length+100});
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
        const firstPage = document.querySelector('div[id^="pf"]');
        let bound = firstPage.getBoundingClientRect();
        let w = bound.width;
        let h = bound.height;
        // let w = firstPage.offsetWidth;
        // let h = firstPage.offsetHeight;
        const pages =  Array.from(document.querySelectorAll('div[id^="pf"]'));

        let rid = 1;
        let res = []

        pages.forEach((pageDiv, pageIndex) => {
            // 找该页内所有class包含'pc'的div
            const pcDivs = pageDiv.querySelectorAll('div[class*="pc"]');

            pcDivs.forEach(pcDiv => {
                const childDivs = Array.from(pcDiv.children).filter(el => el.tagName.toLowerCase() === 'div');

                childDivs.forEach(childDiv => {
                    const rect = childDiv.getBoundingClientRect();
                    const pageRect = pageDiv.getBoundingClientRect();

                    res.push({
                        id: rid++,
                        page: pageIndex + 1,
                        width: rect.width,
                        height: rect.height,
                        left: rect.left - pageRect.left,
                        top: rect.top - pageRect.top,
                    });
                });
            });
        });
        // 第一页的画面宽高，忽略偏移
        res.splice(0, 0, {
            id: 0,
            width: w,
            height: h,
            left: 0,
            top: 0,
        })
        return res;
    });

    // 转换为CSV格式
    const csv = 'ID,Width,Height,Left,Top\n'+data.map(d => `${d.id},${d.width},${d.height},${d.left},${d.top}`).join('\n');

    // 写入CSV文件
    fs.writeFileSync(outputCsvPath, csv);

    console.log(`CSV已生成：${outputCsvPath}`);

    await browser.close();
})();
