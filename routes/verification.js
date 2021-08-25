var express = require('express');
var request = require('request');
var iconv = require('iconv-lite');
var cheerio = require('cheerio');

var router = express.Router();

router.get('/', (req, res) => {
    let id = req.query.id;
    let password = req.query.pwd;
    let channel = req.query.channel;
    let requestHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.164 Safari/537.36',
        'Content-Type': 'application/x-www-form-urlencoded'
    };

    /* 驗證管道1：成績查詢系統 */
    if (channel == 1) {
        let loginRequest = request.defaults({ jar: true }); // cookie開啟
        loginRequest({
            url: 'https://aca.nuk.edu.tw/Student2/Menu1.asp',
            method: 'POST',
            encoding: null,
            followRedirect: false,
            form: {
                Account: id,
                Password: password
            },
            headers: requestHeaders
        }, (err, res, body) => {
            /* 如果偵測到錯誤或是收到的body為空 */
            if (err || !body) {
                fail('伺服器錯誤', err);
            }

            let result = iconv.decode(body, 'big-5');  // 收到的body編碼為big5，需要轉碼
            let $ = cheerio.load(result);
            if ($('h1').text().trim() == '物件已移動') {
                let cookie = res.headers['set-cookie'][0];  // sessionID
                gotoScorePage(cookie);  // 登入成功，開始爬蟲取得名字
            } else {
                fail('帳號或密碼輸入錯誤', 'Wrong id or password.');  // 登入失敗，使用者輸入錯誤的帳號或密碼
            }
        });

        function gotoScorePage(cookie) {
            let nameRequest = request.defaults({ jar: true }); // cookie開啟
            nameRequest({
                url: 'https://aca.nuk.edu.tw/Student2/SO/SOMenu.asp',
                method: 'GET',
                encoding: null,
                headers: requestHeaders,
                Cookie: cookie
            }, (err, res, body) => {
                if (err || !body) {
                    fail('伺服器錯誤', err);
                }

                let result = iconv.decode(body, 'big-5');
                let $ = cheerio.load(result);

                /* 如果成功的話，最終要送出的json */
                let finalResult = {
                    'status': 'success',
                    'name': '',
                };

                /* 取得學生名字 */
                try {
                    let capture = $('body > p:nth-child(3) > b > font').text();
                    finalResult['name'] = capture.substring(3, capture.length - 3);
                } catch (err) {
                    fail('成功登入，但無法取得名字，請填寫BUG回報表單', err);
                }
            
                /* 輸出 */
                if (finalResult['name'] == '') {
                    fail('成功登入，但無法取得名字，請填寫BUG回報表單', 'Web crawler error.');
                } else {
                    showPage(JSON.stringify(finalResult, null, 2));
                }
            });
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