let express = require('express');
var request = require('request');
var iconv = require('iconv-lite');
var cheerio = require('cheerio');

let router = express.Router();

router.post('/', (req, res) => {
    let id = req.body.id;
    let pwd = req.body.pwd;
    let channel = req.body.channel;
    let successResult = {
        'status': 'success',
        'content': null,
    };
    let dic = {
        'B01': '綜合大樓',
        'C01': '工學院',
        'C02': '理學院',
        'H1-': '人社科學院',
        'H2-': '人社科學院',
        'K01': '運健休大樓',
        'L01': '圖資大樓',
        'L02': '法學院',
        'M01': '管學院'
    };

    /* INFO: 驗證管道1：學生選課系統 */
    if (channel == 1) {
        let jar = request.jar();
        let loginRequest = request.defaults({ jar: jar });
        loginRequest({
            url: 'https://course.nuk.edu.tw/Sel/SelectMain1.asp',
            method: 'POST',
            encoding: null,
            followRedirect: false,
            form: {
                Account: id,
                Password: pwd
            },
        }, (err, res, body) => {
            if (err) {
                fail('伺服器錯誤', 'Failed to login "course.nuk.edu.tw". Error message: ' + err);
            } else if (!body) {
                fail('伺服器錯誤', 'Failed to login "course.nuk.edu.tw". Error message: Body is null.');
            } else {
                let result = iconv.decode(body, 'big-5');
                let $ = cheerio.load(result);
                if ($('h1').text().trim() == '物件已移動')
                    goToCourseTablePage();
                else 
                    fail('帳號或密碼輸入錯誤', 'Wrong account or password.');  // 使用者輸入錯的帳號密碼
            }
        });

        function goToCourseTablePage() {
            let courseTablePageRequest = request.defaults({ jar: jar });
            courseTablePageRequest({
                url: 'https://course.nuk.edu.tw/Sel/query3.asp',
                method: 'GET',
                encoding: null,
            }, (err, res, body) => {
                if (err) {
                    fail('伺服器錯誤', 'Failed to reach course table. Error message: ' + err);
                } else if (!body) {
                    fail('伺服器錯誤', 'Failed to reach course table. Error message: Body is null.');
                } else {
                    let result = iconv.decode(body, 'big-5');
                    let $ = cheerio.load(result);
                    
                    let courseList = [];  // 存放所有爬蟲資料(一個項目為一堂課)
                    for (let i = 2; i <= $('body > table > tbody > tr').length; i++) {
                        let item = [];  // 存放當前課程資料(共5個，蒐集完畢會存進courseList陣列)
                        let selector = 'body > table > tbody > tr:nth-child(' + i + ')';

                        let id = $(selector + ' > td:nth-child(2)').text();
                        let name = $(selector + ' > td:nth-child(3)').text();
                        let time = $(selector + ' > td:nth-child(6)').text();
                        let classroom = $(selector + ' > td:nth-child(7)').text();
                        let professor = $(selector + ' > td:nth-child(8)').text();
                        item.push(id);
                        item.push(name);
                        item.push(time);
                        item.push(classroom);
                        item.push(professor);

                        courseList.push(item);
                    }
                    
                    let content = formatData(courseList);  // 進行資料整理
                    successResult['content'] = content;
                    showPage(JSON.stringify(successResult, null, 2));
                }
            });
        }

        function formatData(data) {
            let result = data;  // 把這行刪掉(這行只是為了讓程式能正常運作)
            // TODO: 鈺修整理資料
            
            return result;
        }
    }

    /* INFO: 驗證管道2：E平台 1.0(考量效率，此管道不會爬教授名字) */
    else if (channel == 2) {
        let jar = request.jar();
        let loginRequest = request.defaults({ jar: jar });
        loginRequest({
            url: 'http://elearning.nuk.edu.tw/p_login_stu_at.php?bStu_id=' + id,
            method: 'GET',
            encoding: null,
        }, (err, res, body) => {
            if (err) {
                fail('伺服器錯誤', 'Failed to login e-learning 1.0. Error message: ' + err);
            } else if (!body) {
                fail('伺服器錯誤', 'Failed to login e-learning 1.0. Error message: Body is null.');
            } else {
                try {
                    cookie = res.headers['set-cookie'][0];  // sessionID
                } catch (err) {
                    fail('伺服器錯誤', 'Failed to login e-learning 1.0. Error message: ' + err);
                }
                gotoHomepage();
            }
        });

        function gotoHomepage() {
            let homepageRequest = request.defaults({ jar: jar });
            homepageRequest({
                url: 'http://elearning.nuk.edu.tw/m_student/m_stu_index.php',
                method: 'GET',
                encoding: null,
            }, (err, res, body) => {
                if (err) {
                    fail('伺服器錯誤', 'Failed to GET e-learning 1.0 homepage. Error message: ' + err);
                } else if (!body) {
                    fail('伺服器錯誤', 'Failed to GET e-learning 1.0 homepage. Error message: Body is null.');
                } else {
                    let result = iconv.decode(body, 'utf-8');
                    let $ = cheerio.load(result);
                    
                    /* 爬蟲工作 */
                    let courseList = [];  // 存放爬下來但未整理的資料
                    for (let i = 1; true; i++) {
                        let selector = '#myTable > tbody > tr:nth-child(' + i + ')';
                        let item = [];

                        /* 若該區塊非粉紅色，就不是本學期課程 */
                        if ($(selector + ' > td:nth-child(1)').attr('bgcolor') != '#FFDCD7') {
                            break;
                        }

                        let id = $(selector + ' > td:nth-child(1)').text();
                        let name = $(selector + ' > td:nth-child(2) > a').text();
                        let classroom = $(selector + ' > td:nth-child(5)').text();
                        let time = $(selector + ' > td:nth-child(6)').text();
                        item.push(id);
                        item.push(name);
                        item.push(classroom);
                        item.push(time);
                        item.push('');  // 空的教授名字

                        courseList.push(item);
                    }

                    let content = formatData(courseList);  // 進行資料整理
                    successResult['content'] = content;
                    showPage(JSON.stringify(successResult, null, 2));
                }
            });
        }

        function formatData(data) {
            let result = Object();
            let arr3D = new Array();
            for (let i = 1; i < 6; i++) {
                arr3D[i] = new Array();
                for (let j = 0; j < 4; j++) {
                    arr3D[i][j] = new Array();
                    for (let k = 0; k < 15; k++) {
                        arr3D[i][j][k] = null;
                    }
                }
            }
            for (let a in data) {
                let courseDay = data[a][2].charAt(1); // 取出星期幾
                let courseNum = data[a][2].split('_'); // 取出節數 X:0 Y:5(中午) 所以原本第五節5之後都順延1
                courseNum.shift();
                for (let a in courseNum) {
                    if (courseNum[a] != 'X' && courseNum[a] != 'Y')
                        courseNum[a] = Number(courseNum[a]);
                    if (courseNum[a] > 4)
                        courseNum[a]++;
                    if (courseNum[a] == 'X')
                        courseNum[a] = 0;
                    else if (courseNum[a] == 'Y')
                        courseNum[a] = 5;
                }
                let courseCode = data[a][0].slice(0, 2) + '-' + data[a][0].slice(2, 6); // 取出代碼(String)
                let courseName = data[a][1].slice(6); // 取出課程名稱
                let classroom = data[a][3].split('-'); // 取出教室
                if (classroom[1] != null)
                    classroom = [dic[classroom[0]]] + classroom[1];
                else
                    classroom = '未定';
                let professor = data[a][4]; // 取出教授
                
                for (let i in courseNum) {
                    arr3D[courseDay][0][courseNum[i]] = courseCode;
                    arr3D[courseDay][1][courseNum[i]] = courseName;
                    arr3D[courseDay][2][courseNum[i]] = professor;
                    arr3D[courseDay][3][courseNum[i]] = classroom;
                }
            }
            result['1'] = arr3D[1];
            result['2'] = arr3D[2];
            result['3'] = arr3D[3];
            result['4'] = arr3D[4];
            result['5'] = arr3D[5];
            
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
        let failResult = {
            'status': 'fail',
            'reason': message,
            'log': log
        };
        showPage(JSON.stringify(failResult, null, 2));
    }
});

module.exports = router;