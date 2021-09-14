let express = require('express');
let request = require('request');
let iconv = require('iconv-lite');
let cheerio = require('cheerio');

let router = express.Router();

router.post('/', (req, res) => {
    let id = req.body.id;
    let pwd = req.body.pwd;
    let channel = req.body.channel;

    /* channel 1：用於APP登入驗證，取得帳號密碼的正確性 & 使用者名字 */
    if (channel == 1) {
        let jar = request.jar();
        let loginRequest = request.defaults({ jar: jar });
        loginRequest({
            url: 'https://aca.nuk.edu.tw/Student2/Menu1.asp',
            method: 'POST',
            encoding: null,
            followRedirect: false,
            form: {
                Account: id,
                Password: pwd
            },
        }, (err, res, body) => {
            /* 如果偵測到錯誤或是收到的body為空 */
            if (err) {
                fail('伺服器錯誤', 'Failed to login "aca.nuk.edu.tw". Error message: ' + err);
            } else if (!body) {
                fail('伺服器錯誤', 'Failed to login "aca.nuk.edu.tw". Error message: Body is null.');
            } else {
                let result = iconv.decode(body, 'big-5');  // 學校網站用big-5，否則會讀到亂碼
                let $ = cheerio.load(result);
                if ($('h1').text().trim() == '物件已移動')
                    gotoScorePage();
                else
                    fail('帳號或密碼輸入錯誤', 'Wrong account or password.');  // 使用者輸入錯的帳號密碼
            }
        });

        function gotoScorePage() {
            let nameRequest = request.defaults({ jar: jar });
            nameRequest({
                url: 'https://aca.nuk.edu.tw/Student2/SO/SOMenu.asp',
                method: 'GET',
                encoding: null,
            }, (err, res, body) => {
                if (err) {
                    fail('伺服器錯誤', 'Failed to reach score page. Error message: ' + err);
                } else if (!body) {
                    fail('伺服器錯誤', 'Failed to reach score page. Error message: Body is null.');
                } else {
                    let result = iconv.decode(body, 'big-5');
                    let $ = cheerio.load(result);

                    /* 如果成功的話，最終要送出的json */
                    let successResult = {
                        'status': 'success',
                        'name': '',
                    };

                    /* 取得學生名字 */
                    let capture = $('body > p:nth-child(3) > b > font').text();
                    successResult['name'] = capture.substring(3, capture.length - 3);

                    /* 輸出 */
                    if (successResult['name'] == '')
                        fail('成功登入，但無法取得名字，請填寫BUG回報表單', 'Web crawler error.');
                    else 
                        showPage(JSON.stringify(successResult, null, 2));
                }
            });
        }
    }

    /* channel 2：用於登入教務系統，取得sessionID */
    else if (channel == 2) {
        let jar = request.jar();
        let loginRequest = request.defaults({ jar: jar });
        loginRequest({
            url: 'https://aca.nuk.edu.tw/Student2/Menu1.asp',
            method: 'POST',
            encoding: null,
            followRedirect: false,
            form: {
                Account: id,
                Password: pwd
            },
        }, (err, res, body) => {
            /* 如果偵測到錯誤或是收到的body為空 */
            if (err) {
                fail('伺服器錯誤', 'Failed to login "aca.nuk.edu.tw". Error message: ' + err);
            } else if (!body) {
                fail('伺服器錯誤', 'Failed to login "aca.nuk.edu.tw". Error message: Body is null.');
            } else {
                let result = iconv.decode(body, 'big-5');  // 學校網站用big-5，否則會讀到亂碼
                let $ = cheerio.load(result);
                if ($('h1').text().trim() == '物件已移動') {
                    /* 如果成功的話，最終要送出的json */
                    let successResult = {
                        'status': 'success',
                        'cookies': res.headers['set-cookie'][0],
                    };
                    showPage(JSON.stringify(successResult, null, 2));
                }
                else {
                    fail('帳號或密碼輸入錯誤', 'Wrong account or password.');  // 使用者輸入錯的帳號密碼
                }
            }
        });
    }

    else {
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