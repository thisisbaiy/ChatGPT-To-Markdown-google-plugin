/**
 * @Author Ye bv
 * @Time 2024/2/8 15:02
 * @Description
 */
// 当DOM加载完成时，添加一个点击事件监听器
window.onload = () => {
    const exportButton = document.createElement('export-chat');
    exportButton.textContent = 'Export Chat';
    exportButton.id = 'export-chat';

    const styles = {
        position: 'fixed',
        height: '36px',
        top: '10px',
        right: '60px',
        zIndex: '800',
        padding: '10px',
        backgroundColor: '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        textAlign: 'center',
        lineHeight: '16px'
    };
    // 将样式应用到按钮
    for (let property in styles) {
        exportButton.style[property] = styles[property];
    }
    document.body.appendChild(exportButton);
    // 添加点击事件监听器
    exportButton.addEventListener('click', exportChatAsMarkdown);
}

// 导出聊天记录为Markdown格式
function exportChatAsMarkdown() {
    let markdownContent = "";
    // 使用querySelector方法选择匹配选择器的第一个元素
    const userElements = document.querySelectorAll('div[data-message-author-role="user"]');
    // 使用querySelectorAll方法选择所有匹配选择器的元素
    const answerElements = document.querySelectorAll('div[data-message-author-role="assistant"]');
    // 遍历所有选中的元素并提取其内部的文本内容
    let minLen = Math.min(userElements.length, answerElements.length);
    for (let i = 0; i < minLen; i++) {
        let userText = userElements[i].textContent.trim();
        let answerText = answerElements[i].innerHTML.trim();
        // 将用户的问题添加到Markdown内容中
        // 1. 对answer的html格式的文本进行处理
        answerText = htmlToMarkdown(answerText);
        // 2. 将其添加到markdownContent中
        markdownContent += `\n # 用户问题 \n ${userText} \n # chatGPT \n ${answerText}`;
    }

    // 如果markdownContent不为空，则调用下载函数
    if (markdownContent) {
        // 调用之前定义的下载函数
        download(markdownContent, 'chat-export.md', 'text/markdown');
    } else {
        console.log("Could not find any questions or answers.");
    }
}

// 下载函数
function download(data, filename, type) {
    var file = new Blob([data], {type: type});
    if (window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveOrOpenBlob(file, filename);
    } else {
        var a = document.createElement('a'),
            url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    }
}

// 将HTML转换为Markdown
function htmlToMarkdown(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // 1. 处理公式
    // 移除包含class="katex-html"的<span>及其所有内容
    doc.querySelectorAll('span.katex-html').forEach(element => element.remove());
    // 直接移除所有的<mrow>标签及其内容
    doc.querySelectorAll('mrow').forEach(mrow => mrow.remove());
    // 转换<annotation encoding="application/x-tex">为Markdown格式
    doc.querySelectorAll('annotation[encoding="application/x-tex"]').forEach(element => {
        const latex = element.textContent;
        element.replaceWith(`$${latex}$`);
    });

    // 2. 加粗处理
    // 处理加粗文本
    doc.querySelectorAll('strong, b').forEach(bold => {
        const markdownBold = `**${bold.textContent}**`;
        const boldTextNode = document.createTextNode(markdownBold);
        bold.parentNode.replaceChild(boldTextNode, bold);
    });

    // 3. 斜体处理
    // 处理斜体文本
    doc.querySelectorAll('em, i').forEach(italic => {
        const markdownItalic = `*${italic.textContent}*`;
        const italicTextNode = document.createTextNode(markdownItalic);
        italic.parentNode.replaceChild(italicTextNode, italic);
    });

    // 4. 链接处理
    // 处理链接
    doc.querySelectorAll('a').forEach(link => {
        const markdownLink = `[${link.textContent}](${link.href})`;
        const linkTextNode = document.createTextNode(markdownLink);
        link.parentNode.replaceChild(linkTextNode, link);
    });

    // 5. 处理图片
    // 处理图片
    doc.querySelectorAll('img').forEach(img => {
        const markdownImage = `![${img.alt}](${img.src})`;
        const imgTextNode = document.createTextNode(markdownImage);
        img.parentNode.replaceChild(imgTextNode, img);
    });

    // 6. 代码块处理
    // 代码块的代码类型处理
    // 代码块类型——在pre下第一个div的第一个div的span中,代码块在pre下第一个div的第而个div中
    doc.querySelectorAll('pre').forEach(pre => {
        // 代码类型位于第一个div > 第一个div > span中
        const codeType = pre.querySelector('div > div:first-child > span').textContent;
        // 代码本身位于第一个div的第二个div中
        // 使用:nth-child(2)选择器来准确定位第二个div
        const markdownCode = pre.querySelector('div > div:nth-child(2)').textContent;
        // 使用innerHTML替换pre元素的内容
        pre.innerHTML = `\n\`\`\`${codeType}\n${markdownCode}\`\`\`\n`;
    });

    // 7. 处理列表ol与ul
    // 分别处理文档中的<ol>和<ul>，但不嵌套处理
    // 处理<ul>元素，转换为Markdown格式的无序列表
    doc.querySelectorAll('ul').forEach(ul => {
        let markdown = '';
        // 仅选择直接子级的<li>元素进行转换
        ul.querySelectorAll(':scope > li').forEach(li => {
            markdown += `- ${li.textContent.trim()}\n`;
        });
        // 创建一个文本节点来替换原来的<ul>元素
        const markdownTextNode = document.createTextNode('\n' + markdown.trim());
        ul.parentNode.replaceChild(markdownTextNode, ul);
    });

    // 处理<ol>元素，转换为Markdown格式的有序列表
    doc.querySelectorAll('ol').forEach(ol => {
        let markdown = '';
        // 仅选择直接子级的<li>元素进行转换
        ol.querySelectorAll(':scope > li').forEach((li, index) => {
            markdown += `${index + 1}. ${li.textContent.trim()}\n`;
        });
        // 创建一个文本节点来替换原来的<ol>元素
        const markdownTextNode = document.createTextNode('\n' + markdown.trim());
        ol.parentNode.replaceChild(markdownTextNode, ol);
    });

    // 8. 标题处理
    // 处理标题，从<h1>到<h6>
    for (let i = 1; i <= 6; i++) {
        doc.querySelectorAll(`h${i}`).forEach(header => {
            const markdownHeader = '\n' + `${'#'.repeat(i)} ${header.textContent}\n`;
            const headerTextNode = document.createTextNode(markdownHeader);
            header.parentNode.replaceChild(headerTextNode, header);
        });
    }
    // 移除所有剩余的HTML标签，只留下文本内容
    // 这里我们转换整个body的innerHTML为文本，然后移除所有HTML标签
    let markdown = doc.body.innerHTML.replace(/<[^>]*>/g, '');
    return markdown.trim();
}
