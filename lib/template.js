var template = {
    HTML: function(title, list, body, control) {
        return `
        <!doctype html>
        <html lang="ko">
        <head>
            <title>WEB2 - ${title}</title>
            <meta charset="utf-8">
        </head>
        <body>
            </style>
            <h1><a href="/">WEB</a></h1>
            ${list}
            ${control}
            ${body}
        </body>
        </html>
            `;
    },
    LIST: function(data) {
        var list = '<ul>';
        var i = 0;
        while(i < data.length) {
            list = list + `<li><a href="/?page=${data[i].id}">${data[i].title}</a></li>`;
        i = i+1;
        }
        list = list+'</ul>';
        return list;
    },
}

module.exports = template;