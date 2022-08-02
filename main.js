var http = require('http');
var fs = require('fs');
var url = require('url');
var qs = require('querystring');
var template = require('./lib/template');
var path = require('path');
var sanitizehtml = require('sanitize-html');
var mysql = require('mysql');
var dotenv = require('dotenv');
dotenv.config();
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PW,
    database: process.env.DB_DATABASE,
});
db.connect();

var app = http.createServer((request,response) => {
    var QueryData = url.parse(request.url, true).query;
    var uri = url.parse(request.url, true).pathname;

    if (uri === '/') {
        if (QueryData.page === undefined) {
            db.query('SELECT * from topic;', (err, data) => {
                if (err) {
                    console.error(data);
                    throw err;
                } else {
                    var title = 'welcome';
                    var description = 'hello';
                    var list = template.LIST(data);
                    var html = template.HTML(title, list, `<h2>${title}</h2><p>${description}</p>`, `<a href="/create">create</a>`);
                    response.writeHead(200);
                    response.end(html);
                }
            }); 
        } else {
            db.query(`SELECT * from topic;`, (err, data) => {
                if (err) {
                    console.error(err);
                    throw err;
                } else {
                    db.query(`SELECT * from topic  where id=?;`,[QueryData.page], (error, page) => {
                        if (error) {
                            console.error(error);
                            throw error;
                        } else {
                            var title = page[0].title;
                            var description = page[0].description;
                            var list = template.LIST(data);
                            var html = template.HTML(title, list, `<h2>${title}</h2><p>${description}</p>`, 
                            `<a href="/create">create</a>
                            <a href="/update?page=${QueryData.page}">update</a> 
                            <form action="delete_process" method="post">
                               <input type="hidden" name="id" value="${QueryData.page}">
                               <input type="submit" value="delete">
                            </form>
                            `);
                            response.writeHead(200);
                            response.end(html);
                        }
                    });
                }
            });
        }
    } else if (uri === '/create') {
        db.query('SELECT * from topic;', (err, data) => {
            if (err) {
                console.error(data);
                throw err;
            } else {
                var title = 'new page';
                var list = template.LIST(data);
                var html = template.HTML(title, list, `
                    <form action="/create_process" method="post">
                    <p><input type="text" name="title" placeholder="title"class="title"></p>
                    <p>
                        <textarea name="description" placeholder="description" class="desc"></textarea>
                    </p>
                    <p>
                        <input type="submit">
                    </p>
                    </form>
                `, '');
                response.writeHead(200);
                response.end(html);
            }
        }); 
    } else if (uri === '/create_process') {
        var body = '';
        request.on('data', function(data) {
            body = body+data; 
        });
        request.on('end', function() {
            var post = qs.parse(body);
            db.query(`INSERT INTO topic (title, description, created, author_id) VALUES(?, ?, NOW(), ?);`, [post.title, post.description, '1'], (err, result) => {
                if (err) {
                    console.error(err);
                    throw err;
                } else {
                    response.writeHead(302, {Location: `/?page=${result.insertId}`});
                    response.end();
                }
            });
        });
    } else if (uri === '/update') {
        db.query('select * from topic;', (err, data) => {
            if (err) {
                console.error(err);
                throw err;
            } else {
                db.query(`select * from topic where id=?;`, [QueryData.page], (error, page) => {
                    if (error) {
                        console.error(err);
                        throw err;
                    } else {
                        var list = template.LIST(data);
                        var html = template.HTML(page[0].title, list, 
                        `
                        <form action="/update_process" method="post">
                            <input type="hidden" name="id" value="${page[0].id}">
                            <p><input type="text" name="title" placeholder="title"class="title" value="${page[0].title}"></p>
                            <p>
                                <textarea name="description" placeholder="description" class="desc">${page[0].description}</textarea>
                            </p>
                            <p>
                                <input type="submit">
                            </p>
                        </form>
                        `, `<a href="/create">create</a> <a href="/update?page=${page[0].id}">update</a>`);
                        response.writeHead(200);
                        response.end(html);
                    }
                });
            }
        });
    } else if (uri === '/update_process') {
        var body = '';
        request.on('data', function(data) {
            body = body+data; 
        });
        request.on('end', function() {
            var post = qs.parse(body);
            /* fs.rename(`data/${id}`, `data/${title}`, function(err) {
                if (err) {
                    console.log('ERROR:' + err);
                    throw err;
                }
                fs.writeFile(`data/${title}`, description, (err) => {
                    if (err) throw err;
                    else {
                        response.writeHead(302, {Location: `/?page=${title}`});
                        response.end();
                    };
                });
            }); */
            db.query('UPDATE topic SET title=?, description=?, author_id=1 WHERE id=?', [post.title, post.description, post.id], (err, result) => {
                if (err) {
                    console.error(err);
                    throw err;
                } else {
                    response.writeHead(302, {Location: `/?id=${post.id}`});
                    response.end();
                }
            });
        });
    } else if (uri === '/delete_process') {
        var body = '';
        request.on('data', function(data) {
            body = body+data; 
        });
        request.on('end', function() {
            var post = qs.parse(body);
            db.query('DELETE from topic where id=?', [post.id], (err, result) => {
                if(err) {
                    console.error(err);
                    throw err;
                } else {
                    response.writeHead(302, {location: `/`});
                    response.end();
                }
            });
        });
     } else {
        response.writeHead(404);
        response.end(`
        <!DOCTYPE html>
        <html lang="ko">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Document</title>
            <style>
                body {
                    text-align: center;
                }
            </style>
        </head>
        <body>
            <p>Not found</p>
        </body>
        </html>
        `);
    }
});
app.listen(80, () => {
    console.log('1');
});