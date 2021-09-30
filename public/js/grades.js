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
let semesterRank = document.getElementById('semesterRank');
let semesterScore = document.querySelector('.semesterScore');
let currSemester = document.getElementById('currSemester');
semesterScore.style.display = "none";
semesterRank.style.display = "none";
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
            console.log(res);
            generateSelection();
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
        getData();
    }       
}

function showTotal(){
    semesterRank.style.display = "none";
    semesterScore.style.display = "none";
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
    totalData.style.display = "none";
    if (boolSemester && boolTerm) {
        curScore.style.display = "none";
        semesterScore.style.display = "none";
        semesterRank.style.display = "none";
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
function generateSelection(){
    let semesterNum = res.grades.length;
    let judge = semesterNum % 2;
    for (let i = admission; i < admission + Math.ceil(semesterNum/2); i++) {
        let option = document.createElement('option');
        option.setAttribute('value', i);
        option.textContent = i;
        semester.appendChild(option);
    }
    
    let option = document.createElement('option');
    option.setAttribute('value','total');
    option.textContent = '總成績';
    semester.appendChild(option);
}
function showGraph(search_index) {
    drawPic_semester(res.grades[search_index].stats.earnedCredits, res.grades[search_index].stats.allCredits);
    drawPic_Avg(res.grades[search_index].stats.avgScore,100);
}

function drawPic_Avg(cur,total){
    semesterScore.style.display = "block";
    semesterRank.style.display = "block";
    if(cur == ""){
        semesterScore.style.strokeDasharray = '0,340';
        return;
    }
    let temp_cur = 0;
    let timer = window.setInterval(count, 8);
    let times = 3; //轉速
    cur = cur * times;
    total = total * times;
    function count(){
        if (temp_cur < cur)
            temp_cur++;
        let curPercent = temp_cur / total;
        semesterScore.style.strokeDasharray = String(curPercent * 314) + ',' + String(314 - curPercent * 314);
        if (temp_cur > cur)
            clearInterval(timer);
    }
}

function drawPic_semester(cur, total) {
    totalCredit.textContent = total;
    curScore.style.display = "block";
    let temp_cur = 0;
    let timer = window.setInterval(count, 8);
    let times = 10; //轉速
    cur = cur * times;
    total = total * times;

    function count(){
        if (temp_cur < cur)
            temp_cur++;
        curCredit.textContent = parseInt(temp_cur / times);
        let curPercent = temp_cur / total;
        curScore.style.strokeDasharray = String(curPercent * 314) + ',' + String(314 - curPercent * 314);
        if (temp_cur == cur)
            clearInterval(timer);
    }
}

function showData(search_index) {
    currSemester.textContent = res.grades[search_index].stats.avgScore;
    semesterRank.innerHTML = '<h4>系排 : <span>'+ res.grades[search_index].stats.ranking +'</span></h4>';
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