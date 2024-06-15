# deeplx-local-bobplugin

用于自建deeplx服务的bob翻译插件

优化了查询超大文本时，自动做拆分，并避免从单词中间截断，影响翻译结果，然后并行请求翻译，再根据段落顺序拼接返回查询结果

### 使用方式

1. 下载[最新的此bobplugin插件](https://github.com/ycvk/deeplx-local-bobplugin/releases)
2. 在bob里安装后，在服务里点添加并选中此插件，在右侧修改deeplx服务的请求地址，如`http://localhost:62155/translate`，点击保存即可使用。

