let express = require('express');
let request = require('request');
let rp = require('request-promise');
let iconv = require('iconv-lite');
let cheerio = require('cheerio');

let router = express.Router();

router.get('/', (req, res) => {
    let id = req.query.id;
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
            firstPage();
        }
    });

    /* INFO: 造訪第一頁，取得總頁數 & 第一頁的爬蟲 */
    function firstPage() {
        let firstPageRequest = rp.defaults({ jar: jar });
        firstPageRequest({
            url: 'http://elearning.nuk.edu.tw/m_student/m_stu_index.php?p=1',
            method: 'GET',
            encoding: null,
            transform: (body) => {
                let result = iconv.decode(body, 'utf-8');
                return cheerio.load(result);
            }
        }).then(($) => {
            loopItems($); // 第一頁課程內容
            let page = $('#MMpage').children().length - 4;  // 總共要爬的頁數(包括第一頁)

            /* 取得頁數後，開始加準備要爬的網址到waitingToCrawl陣列 */
            for (let i = 2; i <= page; i++) {
                waitingToCrawl.push('http://elearning.nuk.edu.tw/m_student/m_stu_index.php?p=' + i);
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

    /* INFO: 爬蟲程式碼，每一頁最多可以顯示21頁課程 */
    function loopItems($) {
        for (let i = 1; i <= 21; i++) {
            let item = $('#myTable > tbody > tr:nth-child(' + i + ') > td:nth-child(2) > a');
            if (item.text() == '') {
                break;
            } else {
                finalResult.content.push([item.text(), 'http://elearning.nuk.edu.tw' + item.attr('href').substring(2)]);
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