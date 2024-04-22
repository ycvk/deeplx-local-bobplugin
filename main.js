var items = [
    ["auto", "auto"],
    ["zh-Hans", "ZH"],
    ["zh-Hant", "ZH"],
    ["en", "EN"],
];

var langMap = new Map(items);
var langMapReverse = new Map(
    items.map(([standardLang, lang]) => [lang, standardLang])
);

function supportLanguages() {
    return items.map(([standardLang, lang]) => standardLang);
}

function translate(query, completion) {
    const header = {
        "Content-Type": "application/json",
    };
    const deeplxUrl = $option.url;
    const text = query.text;
    const chunkSize = 2048; // 每个请求的最大长度
    const chunkNum = Math.ceil(text.length / chunkSize); // 需要拆分的请求数
    
    // 将长文本拆分成多个部分
    const textChunks = [];
    for (let i = 0; i < chunkNum; i++) {
        let startIndex = i * chunkSize;
        let endIndex = (i + 1) * chunkSize;
        if (endIndex > text.length) {
            endIndex = text.length;
        }
        // 避免从单词中间截断
        while (endIndex < text.length && /\w/.test(text[endIndex])) {
            endIndex++;
        }
        textChunks.push(text.slice(startIndex, endIndex));
    }
    
    // 并行发送多个翻译请求
    const requests = textChunks.map(chunk => {
        const body = {
            text: chunk,
            source_lang: langMap.get(query.detectFrom),
            target_lang: langMap.get(query.detectTo),
        };
        return $http.request({
            method: "POST",
            url: deeplxUrl,
            header,
            body,
        });
    });
    
    // 等待所有请求完成,按顺序拼接结果
    Promise.all(requests).then(responses => {
        const translatedChunks = responses.map(resp => resp.data.data);
        const translatedText = translatedChunks.join('');
        
        completion({
            result: {
                from: query.detectFrom,
                to: query.detectTo,
                toParagraphs: [translatedText],
            },
        });
    }).catch(err => {
        completion({
            error: {
                type: err._type || "unknown",
                message: err._message || "未知错误",
                addtion: err._addtion,
            },
        });
    });
}
