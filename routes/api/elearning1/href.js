let express = require('express');
var request = require('request');
var iconv = require('iconv-lite');
var cheerio = require('cheerio');

let router = express.Router();

router.post('/', (req, res) => {
    let id = req.body.id;

    let finalResult = {
        'status': 'success',
        'content': [],
    };
    let page = 0; // 目前爬到第幾頁
    let status = true; // 判斷是否要繼續爬蟲
    let requestHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.164 Safari/537.36',
        'Content-Type': 'application/x-www-form-urlencoded'
    };

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
            let cookie;
            try {
                cookie = res.headers['set-cookie'][0];  // sessionID
            } catch (err) {
                fail('伺服器錯誤', 'Failed to login e-learning 1.0. Error message: ' + err);
            }
            asyncTask(cookie);
        }
    });

    async function asyncTask(cookie) {
        /* 爬蟲直到status為false */
        while (status) {
            page++;
            await currentPage(cookie);
        }
        showPage(JSON.stringify(finalResult, null, 2));
    }

    function currentPage(cookie) {
        return new Promise((resolve, reject) => {
            let pageRequest = request.defaults({ jar: true }); // cookie開啟

            pageRequest({
                url: 'http://elearning.nuk.edu.tw/m_student/m_stu_index.php?p=' + page,
                method: 'GET',
                encoding: null,
                headers: requestHeaders,
                Cookie: cookie
            }, (err, res, body) => {
                if (err || !body) {
                    status = false;
                    resolve('fail');
                } else {
                    let result = iconv.decode(body, 'utf-8');
                    let $ = cheerio.load(result);
                    for (let i = 1; i <= 21; i++) {
                        let item = $('#myTable > tbody > tr:nth-child(' + i + ') > td:nth-child(2) > a');
                        if (item.text() == '') {
                            status = false;
                            break;
                        } else {
                            finalResult.content.push([item.text(), 'http://elearning.nuk.edu.tw' + item.attr('href').substring(2)]);
                        }
                    }
                    resolve('finish page ' + page);
                }
            });
        });
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