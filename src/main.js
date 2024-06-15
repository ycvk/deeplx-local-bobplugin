var items = [
    ["auto", "auto"],
    ["bg", "BG"], // Bulgarian
    ["cs", "CS"], // Czech
    ["da", "DA"], // Danish
    ["de", "DE"], // German
    ["el", "EL"], // Greek
    ["en", "EN"], // English
    ["es", "ES"], // Spanish
    ["et", "ET"], // Estonian
    ["fi", "FI"], // Finnish
    ["fr", "FR"], // French
    ["hu", "HU"], // Hungarian
    ["id", "ID"], // Indonesian
    ["it", "IT"], // Italian
    ["ja", "JA"], // Japanese
    ["lt", "LT"], // Lithuanian
    ["lv", "LV"], // Latvian
    ["nl", "NL"], // Dutch
    ["pl", "PL"], // Polish
    ["pt", "PT"], // Portuguese
    ["ro", "RO"], // Romanian
    ["ru", "RU"], // Russian
    ["sk", "SK"], // Slovak
    ["sl", "SL"], // Slovenian
    ["sv", "SV"], // Swedish
    ["tr", "TR"], // Turkish
    ["uk", "UK"], // Ukrainian
    ["zh-Hans", "ZH"], // Simplified Chinese
    ["zh-Hant", "ZH"], // Traditional Chinese
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
    const chunkIndexes = [];
    for (let i = 0; i < chunkNum; i++) {
        let startIndex = i * chunkSize;
        let endIndex = (i + 1) * chunkSize;
        if (endIndex > text.length) {
            endIndex = text.length;
        }
        while (endIndex < text.length && /\w/.test(text[endIndex])) {
            endIndex++;
        }
        textChunks.push(text.slice(startIndex, endIndex));
        chunkIndexes.push([startIndex, endIndex]);
    }

    // 并行发送多个翻译请求
    const requests = textChunks.map((chunk, index) => {
        const [startIndex, endIndex] = chunkIndexes[index];
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
        }).then(resp => ({
            translatedText: resp.data.data,
            startIndex,
            endIndex,
        }));
    });

    // 等待所有请求完成,按顺序拼接结果
    Promise.all(requests).then(responses => {
        responses.sort((a, b) => a.startIndex - b.startIndex);
        let translatedText = "";
        let lastEndIndex = 0;
        responses.forEach(resp => {
            const { translatedText: chunkTranslatedText, startIndex, endIndex } = resp;
            translatedText += text.slice(lastEndIndex, startIndex) + chunkTranslatedText;
            lastEndIndex = endIndex;
        });
        translatedText += text.slice(lastEndIndex);

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
