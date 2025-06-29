const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

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
    await page.setViewport({ width: 1980, height: 768 });

    // 加载本地HTML文件，路径要用file://协议
    const filePath = path.resolve(inputHtmlPath);
    await page.goto('file://' + filePath, { waitUntil: 'load' });

    // 执行页面内JS，计算目标元素宽高
    const data = await page.evaluate(() => {
        let rid = 1;

        // 找到所有class包含'pc'的div元素
        const pcDivs = document.querySelectorAll('div[class*="pc"]');

        pcDivs.forEach(pcDiv => {
            // 找到该div的所有直接子div元素
            const childDivs = Array.from(pcDiv.children).filter(el => el.tagName.toLowerCase() === 'div');

            childDivs.forEach(childDiv => {
                // 添加rid属性
                childDiv.setAttribute('rid', rid.toString());
                rid++;
            });
        })

        // 这里根据你的页面结构修改选择器
        var elements = document.querySelectorAll('[rid]');
        return Array.from(elements).map(el => ({
            id: el.getAttribute('rid'),
            width: Math.ceil(el.offsetWidth),
            height: Math.ceil(el.offsetHeight),
            left: el.offsetLeft,
            top: el.offsetTop,
        }));
    });

    // 转换为CSV格式
    const csv = 'ID,Width,Height,Left,Top\n' + data.map(d => `${d.id},${d.width},${d.height},${d.left},${d.top}`).join('\n');

    // 写入CSV文件
    fs.writeFileSync(outputCsvPath, csv);

    console.log(`CSV已生成：${outputCsvPath}`);

    await browser.close();
})();
