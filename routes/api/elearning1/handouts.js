let express = require('express');
let request = require('request');
let rp = require('request-promise');
let iconv = require('iconv-lite');
let cheerio = require('cheerio');

let router = express.Router();

router.get('/', (req, res) => {
    let id = req.query.id;
    let course = req.query.course;
    let jar = request.jar();

    let waitingToCrawl = [];  // 若該使用者的課程頁數有n頁，則此陣列會有n-1項
    let finalResult = {
        'status': 'success',
        'content': [],
    };

    let elearning1 = request.defaults({ jar: jar }); // cookie開啟
    elearning1({
        url: 'http://elearning.nuk.edu.tw/p_login_stu_at.php?bStu_id=' + id,
        method: 'GET',
        encoding: null,
    }, (err, res, body) => {
        if (err) {
            fail('伺服器錯誤', 'Failed to login e-learning 1.0. Error message: ' + err);
        } else if (!body) {
            fail('伺服器錯誤', 'Failed to login e-learning 1.0. Error message: Body is null.');
        } else {
            coursePage();
        }
    });

    function coursePage() {
        let coursePageRequest = request.defaults({ jar: jar }); // cookie開啟
        coursePageRequest({
            url: 'http://elearning.nuk.edu.tw/m_teacher/m_tea_board.php?id=' + course,
            method: 'GET',
            encoding: null,
        }, (err, res, body) => {
            if (err) {
                fail('伺服器錯誤', 'Failed to go to course page. Error message: ' + err);
            } else if (!body) {
                fail('伺服器錯誤', 'Failed to go to course page. Error message: Body is null.');
            } else {
                handoutPage();
            }
        });
    }

    /* INFO: 造訪第一頁，取得總頁數 & 第一頁的爬蟲 */
    function handoutPage() {
        let handoutPageRequest = rp.defaults({ jar: jar });
        handoutPageRequest({
            url: 'http://elearning.nuk.edu.tw/m_teacher/m_tea_txbook.php?p=1',
            method: 'GET',
            encoding: null,
            transform: (body) => {
                let result = iconv.decode(body, 'utf-8');
                return cheerio.load(result);
            }
        }).then(($) => {
            loopItems($); // 第一頁講義內容
            let handouts = parseInt($('#Mainlayout > table > tbody > tr:nth-child(2) > td > table:nth-child(1) > tbody > tr > td:nth-child(1)').text().substring(4));  // 講義總數
            let page = Math.ceil(handouts / 21);  // 總共要爬的頁數(包括第一頁)

            /* 取得頁數後，開始加準備要爬的網址到waitingToCrawl陣列 */
            for (let i = 2; i <= page; i++) {
                waitingToCrawl.push('http://elearning.nuk.edu.tw/m_teacher/m_tea_txbook.php?p=' + i);
            }

            return page;
        }).then((page) => {
            waitingToCrawl.reduce((p, item) => {
                return p.then(() => {
                    return gotoPage(item);
                });
            }, Promise.resolve()).then(() => {
                showPage(JSON.stringify(finalResult, null, 2));
            });
        });
    }

    /* INFO: 爬蟲程式碼，每一頁最多可以顯示21筆資料 */
    function loopItems($) {
        for (let i = 1; i <= 21; i++) {
            let item = '#myTable > tbody > tr:nth-child(' + i + ')';
            let title = $(item + ' > td:nth-child(1) > table > tbody > tr:nth-child(1) > td:nth-child(2)').text();

            if (title == '') {
                break;
            } else {
                let subtitle = $(item + ' > td:nth-child(1) > table > tbody > tr:nth-child(2) > td:nth-child(2) > span').text();
                let date = $(item + ' > td:nth-child(4)').text();
                let href = 'http://elearning.nuk.edu.tw/m_teacher/' + $(item + ' > td:nth-child(5) > a').attr('href');
                finalResult.content.push([title, subtitle, date, href]);
            }
        }
    }

    /* INFO: 發出request的函式，所有在waitingToCrawl陣列內的網址都會在這裡發出請求 */
    function gotoPage(url) {
        let pageCall = rp.defaults({ jar: jar });
        return pageCall({
            url: url,
            method: 'GET',
            encoding: null,
            transform: (body) => {
                let result = iconv.decode(body, 'utf-8');
                return cheerio.load(result);
            }
        }).then(($) => {
            loopItems($);
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