let express = require('express');
var request = require('request');
var iconv = require('iconv-lite');
var cheerio = require('cheerio');

let router = express.Router();

router.get('/', (req, res) => {
    let id = req.query.id;
    let pwd = req.query.pwd;
    let channel = req.query.channel;
    let cookie;

    /* INFO: 驗證管道2：E平台 1.0(考量效率，此管道不會爬教授名字) */
    if (channel == 2) {
        let jar = request.jar();
        let request1 = request.defaults({ jar: jar });
        request1({
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
                gotoHomepage(cookie);
            }
        });

        function gotoHomepage(cookie) {
            let request2 = request.defaults({ jar: jar });
            request2({
                url: 'http://elearning.nuk.edu.tw/m_student/m_stu_index.php',
                method: 'GET',
                encoding: null,
                Cookie: cookie
            }, (err, res, body) => {
                if (err) {
                    fail('伺服器錯誤', 'Failed to GET e-learning 1.0 homepage. Error message: ' + err);
                } else if (!body) {
                    fail('伺服器錯誤', 'Failed to GET e-learning 1.0 homepage. Error message: Body is null.');
                } else {
                    let result = iconv.decode(body, 'utf-8');
                    let $ = cheerio.load(result);
                    
                    /* 爬蟲工作 */
                    let data = [];  // 存放爬下來但未整理的資料
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

                        data.push(item);
                    }

                    let finalResult = formatData(data);  // 進行資料整理
                    showPage(JSON.stringify(finalResult, null, 2));
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
        let finalResult = {
            'status': 'fail',
            'reason': message,
            'log': log
        };
        showPage(JSON.stringify(finalResult, null, 2));
    }
});

module.exports = router;