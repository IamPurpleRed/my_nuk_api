let express = require('express');
var request = require('request');
var iconv = require('iconv-lite');
var cheerio = require('cheerio');

let router = express.Router();

router.get('/', (req, res) => {
    let id = req.query.id;
    let channel = req.query.channel;
    let requestHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.164 Safari/537.36',
        'Content-Type': 'application/x-www-form-urlencoded'
    };

    /* 驗證管道1：E平台 1.0 */
    if (channel == 1) {
        let elearning1 = request.defaults({ jar: true }); // cookie開啟
        elearning1({
            url: 'http://elearning.nuk.edu.tw/p_login_stu_at.php?bStu_id=' + id,
            method: 'GET',
            encoding: null,
            headers: requestHeaders
        }, (err, res, body) => {
            /* 如果偵測到錯誤或是收到的body為空 */
            if (err || !body) {
                fail('伺服器錯誤', 'Failed to login e-learning 1.0. Error message: ' + err);
            } else {
                let cookie = res.headers['set-cookie'][0];  // sessionID
                gotoHomepage(cookie);
            }
        });

        function gotoHomepage(cookie) {
            let homepageRequest = request.defaults({ jar: true }); // cookie開啟
            homepageRequest({
                url: 'http://elearning.nuk.edu.tw/m_student/m_stu_index.php',
                method: 'GET',
                encoding: null,
                headers: requestHeaders,
                Cookie: cookie
            }, (err, res, body) => {
                if (err || !body) {
                    fail('伺服器錯誤', 'Failed to get to e-learning 1.0 homepage. Error message: ' + err);
                } else {
                    let result = iconv.decode(body, 'utf-8');
                    let $ = cheerio.load(result);
                    
                    asyncTask($, cookie);
                    // NOTE: 由於E平台1.0 sessionID的機制，爬每個課程的網址都需要先等待上個工作完成，因此需要使用非同步函式搭配await，包住接下來的所有工作
                }
            });
        }
        async function asyncTask($, cookie) {
            let data = [];  // 爬下來但未整理的資料

            for (let i = 1; true; i++) {
                let selector = '#myTable > tbody > tr:nth-child(' + i + ')';
                let item = [];

                /* 若該區塊非粉紅色，就不是本學期課程 */
                if ($('#myTable > tbody > tr:nth-child(' + i + ') > td:nth-child(1)').attr('bgcolor') != '#FFDCD7') {
                    break;
                }

                let id = $(selector + ' > td:nth-child(1)').text();
                let name = $(selector + ' > td:nth-child(2) > a').text();
                let classroom = $(selector + ' > td:nth-child(5)').text();
                let time = $(selector + ' > td:nth-child(6)').text();
                let href = 'http://elearning.nuk.edu.tw/' + $(selector + ' > td:nth-child(2) > a').attr('href').substring(3);
                await getProfName(href, cookie).then((profName) => {
                    item.push(id);
                    item.push(name);
                    item.push(classroom);
                    item.push(time);
                    item.push(profName);
                    data.push(item);
                });
            }
                    
            let finalResult = formatData(data);
            showPage(JSON.stringify(finalResult, null, 2));
        }

        function getProfName(href, cookie) {
            return new Promise((resolve, reject) => {
                let coursepageRequest = request.defaults({ jar: true }); // cookie開啟
                coursepageRequest({
                    url: href,
                    method: 'GET',
                    encoding: null,
                    headers: requestHeaders,
                    Cookie: cookie
                }, (err, res, body) => {
                    if (err || !body) {
                        resolve('(無法取得教授名字)');
                    } else {
                        let coursepageRequest2 = request.defaults({ jar: true });
                        coursepageRequest2({
                            url: 'http://elearning.nuk.edu.tw/m_mtp/m_mpt_p1.php',
                            method: 'GET',
                            encoding: null,
                            headers: requestHeaders,
                            Cookie: cookie
                        }, (err, res, body) => {
                            if (err || !body) {
                                resolve('(無法取得教授名字)');
                            } else {
                                let result = iconv.decode(body, 'utf-8');
                                let $ = cheerio.load(result);
                                resolve($('#form1 > table > tbody > tr:nth-child(2) > td > table > tbody > tr:nth-child(2) > td.txt_black_BU > table > tbody > tr:nth-child(6) > td:nth-child(2)').text());
                            }
                        });
                    }
                });
            });
        }

        function formatData(data) {
            console.log(data);
            let result = {
                "1": [
                    ['', '', 'CS-D521', 'CS-D521', 'CS-D521', '', '', '', '', '', '', '', '', '', ''],
                    ['', '', '視窗程式設計', '視窗程式設計', '視窗程式設計', '', '', '', '', '', '', '', '', '', ''],
                    ['', '', '蘇家輝', '蘇家輝', '蘇家輝', '', '', '', '', '', '', '', '', '', ''],
                    ['', '', '工學院209', '工學院209', '工學院209', '', '', '', '', '', '', '', '', '', '']
                ]
            };

            return result;
        }
    } else {
        fail('無效的通道', 'Invalid channel.');
    }

    function showPage(jsonData) {
        res.set('content-type', 'application/json');
        res.send(jsonData);
    }

    function fail(message, log) {
        let finalResult = {
            'status': 'fail',
            'reason': message,
            'log': log
        };
        showPage(JSON.stringify(finalResult, null, 2));
    }
});

module.exports = router;