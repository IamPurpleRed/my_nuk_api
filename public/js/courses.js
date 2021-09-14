let url = new URL(location.href);
let loginId = url.searchParams.get('id');
let loginPwd= url.searchParams.get('pwd');
let loginChannel = 1;
let btn = document.getElementById("idForButton");
let weekdays = document.getElementById("courseForWeek");
let weekends = document.getElementById("courseForWeekend");
let weekends_title = document.getElementById("weekend");
let weekdays_title = document.getElementById("weekday");
let isWeekDay = true;
btn.addEventListener("click", tran);

function tran() {
    if (isWeekDay) {
        weekdays.style.opacity = 0;
        weekdays_title.style.opacity = 0;
        weekends.style.opacity = 1;
        weekends_title.style.opacity = 1;
        weekends_title.style.zIndex = 5;
        weekends.style.zIndex = 4;
    } else {
        weekdays.style.opacity = 1;
        weekdays_title.style.opacity = 1;
        weekends.style.opacity = 0;
        weekends_title.style.opacity = 0;
        weekends_title.style.zIndex = 3;
        weekends.style.zIndex = 2;
    }
    isWeekDay = !isWeekDay;
}
axios.get("https://my-nuk-api.herokuapp.com/api/courses", {
        params: {
            id: loginId,
			pwd: loginPwd,
            channel: loginChannel
        }
    })
    .then(function (response) {
        if (response.request.readyState === 4 && response.status === 200) {
            let info = response.data;
            for (let i in info) {
                let name = info[i][1]; //取出課程名稱
                let lecturer = info[i][2]; //取出教授
                let place = info[i][3]; //取出地點
                let temp = new Object();
                for (let j in info[i][2]) {
                    if (info[i][1][j] != null) {
                        let course = Number(j);
                        course++; //JSON課程陣列從0開始 介面表格從1開始 因此加1
                        temp = document.getElementById(course + '-' + i + '-1');
                        temp.textContent = info[i][1][j];
                        temp = document.getElementById(course+'-'+ i +'-3');
                        temp.textContent = info[i][2][j];
                        temp = document.getElementById(course + '-' + i + '-2');
                        temp.textContent = info[i][3][j];
                    }
                }
                delete temp;
            }
        } else {
            alert('Error: With Internet Problem');
        }
    });