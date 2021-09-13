let url = new URL(location.href);
let loginId = url.searchParams.get('id');
let loginPwd = url.searchParams.get('pwd');
let admission = Number(loginId.slice(1,4));        //入學年度
let boolTerm = false;
let boolSemester = false;
let term = document.getElementById('Term');
let semester = document.getElementById('Semester');
let courseTable = document.getElementById('courseTable');
console.log(courseTable);
let res = null;
axios.get('http://localhost:3000/api/grades', {
    params: {
        id: loginId,
        pwd: loginPwd
    }
})
.then(function (response) {
    if (response.request.readyState === 4 && response.status === 200) {
        res = response.data;
    } else {
        alert('Error: With Internet Problem');
    }
});
term.addEventListener('change',changeTerm);
semester.addEventListener('change',changeSemester);
function changeTerm(){
    boolTerm = true;
    getData();
}
function changeSemester(){
    boolSemester = true;
    getData();
}
function getData(){
    if(boolSemester && boolTerm){
        let search_index = 2*(Number(semester.value) - admission)+Number(term.value)-1;
        if(res.grades[search_index] != undefined){
            
            let courseNum = res.grades[search_index].subjects.length;
        } else
            alert('Error: Wrong information.')
    }
};
//動態產生年度選項
for(let i=admission;i<admission+5;i++){
    let option = document.createElement('option');
    option.setAttribute('value',i);
    option.textContent = i;
    semester.appendChild(option);
}