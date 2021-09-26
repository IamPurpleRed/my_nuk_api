let url = new URL(location.href);
let loginId = url.searchParams.get('id');
let loginPwd = url.searchParams.get('pwd');
let admission = Number(loginId.slice(1, 4)); //入學年度
let boolTerm = false;
let boolSemester = false;
let term = document.getElementById('Term');
let semester = document.getElementById('Semester');
let courseTable = document.getElementById('courseTable');
let curCredit = document.getElementById('currNumber');
let totalCredit = document.getElementById('goalNumber');
let curScore = document.querySelector('.currScore');
let loading = document.querySelector('.Load');
let totalData = document.querySelector('.totalData');
totalData.style.display = "none";
curScore.style.display = "none";
semester.disabled = true;
term.disabled = true;
let res = null;
axios.post('https://my-nuk-api.herokuapp.com/api/grades', {
        id: loginId,
        pwd: loginPwd
    })
    .then(function (response) {
        if (response.request.readyState === 4 && response.status === 200) {
            let parentObj = loading.parentNode;
            parentObj.removeChild(loading); //刪除loading畫面
            semester.disabled = false;
            term.disabled = false;
            res = response.data;
        } else {
            alert('Error: With Internet Problem');
        }
    });
term.addEventListener('change', changeTerm);
semester.addEventListener('change', changeSemester);

function changeTerm() {
    boolTerm = true;
    getData();
}

function changeSemester() {
    boolSemester = true;
    if(this.value == 'total'){
        term.disabled = true;
        showTotal();
    } else{
        term.disabled = false;
        totalData.style.display = "none";
        getData();
    }       
}

function showTotal(){
    curScore.style.display = "none";
    totalData.style.display = 'block';
    let tb = document.getElementById('tb');
    courseTable.innerHTML = null; //清空Table
    let rank = document.getElementById('rank');
    let avg = document.getElementById('avg');
    let credit = document.getElementById('credit');
    rank.textContent = res.stats.ranking;
    avg.textContent = res.stats.avgScore;
    credit.textContent = res.stats.earnedCredits;
}

function getData() {
    if (boolSemester && boolTerm) {
        curScore.style.display = "none";
        let search_index = 2 * (Number(semester.value) - admission) + Number(term.value) - 1;
        if (res.grades[search_index] != undefined) {
            courseTable.innerHTML = null; //清空Table
            showTitle(); //Table加上標題
            showData(search_index); //Table加上查詢內容
            showGraph(search_index);
        } else
            alert('Error: Wrong information.')
    }
};
//動態產生年度選項
for (let i = admission; i < admission + 5; i++) {
    let option = document.createElement('option');
    option.setAttribute('value', i);
    option.textContent = i;
    semester.appendChild(option);
}
let option = document.createElement('option');
option.setAttribute('value','total');
option.textContent = '總成績';
semester.appendChild(option);


function showGraph(search_index) {
    drawPic_semester(res.grades[search_index].stats.earnedCredits, res.grades[search_index].stats.allCredits);
}
function drawPic_semester(cur, total) {
    totalCredit.textContent = total;
    curScore.style.display = "block";
    let temp_cur = 0;
    let temp_total = 0;
    let timer = window.setInterval(count, 8);
    let times = 10; //轉速
    cur = cur * times;
    total = total * times;

    function count() {
        if (temp_cur < cur)
            temp_cur++;
        if (temp_total < total)
            temp_total++;
        curCredit.textContent = parseInt(temp_cur / times);
        let curPercent = temp_cur / total;
        curScore.style.strokeDasharray = String(curPercent * 314) + ',' + String(314 - curPercent * 314);
        if (temp_cur == cur && temp_total == total)
            clearInterval(timer);
    }
}

function showData(search_index) {
    let course = res.grades[search_index].subjects;
    let courseNum = res.grades[search_index].subjects.length;
    let tbody = document.createElement('tbody');
    for (let i in course) {
        let tr = document.createElement('tr');
        let tdCode = document.createElement('td');
        let tdName = document.createElement('td');
        let tdScore = document.createElement('td');
        tdCode.textContent = course[i].id;
        tdName.textContent = course[i].name;
        tdScore.textContent = course[i].score;
        tdCode.setAttribute('class', 'wid-90');
        tdScore.setAttribute('class', 'wid-60');
        tr.appendChild(tdCode);
        tr.appendChild(tdName);
        tr.appendChild(tdScore);
        tbody.appendChild(tr);
    }
    courseTable.appendChild(tbody);
}

function showTitle() {
    let thead = document.createElement('thead');
    let tr = document.createElement('tr');
    let code = document.createElement('td');
    let name = document.createElement('td');
    let score = document.createElement('td');
    code.textContent = '課號';
    name.textContent = '課程名稱';
    score.textContent = '分數';
    tr.appendChild(code);
    tr.appendChild(name);
    tr.appendChild(score);
    thead.appendChild(tr);
    thead.setAttribute('class', 'table-dark');
    courseTable.appendChild(thead);
}