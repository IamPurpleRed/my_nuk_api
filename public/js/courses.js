let loginId = 'a1085524';
axios.get("http://localhost:3000/api/courses",{
        params:{
            id:loginId,
            channel:1
        }
    })
    .then(function(response){
    if(response.request.readyState === 4 && response.status === 200){
        let info = response.data;
        for(let i in info){
            let name = info[i][1];          //取出課程名稱
            let lecturer = info[i][2];      //取出教授
            let place = info[i][3];         //取出地點
            let temp = new Object();
            for(let j in info[i][2]){
               if(info[i][1][j] != null){
                   let course = Number(j);
                   course++;                //JSON課程陣列從0開始 介面表格從1開始 因此加1
                   temp = document.getElementById(course+'-'+i+'-1');
                   temp.textContent = info[i][1][j];
                   temp = document.getElementById(course+'-'+i+'-3');
                   temp.textContent = info[i][2][j];
                   temp = document.getElementById(course+'-'+i+'-2');
                   temp.textContent = info[i][3][j];
               }
            }
            delete temp;
        }
        
    } else{
        console.log("error");
    }
});
//格式: 1-1-1: Monday First-Course 課程名稱
//          2: Monday Second-Course 教室地點
//          3: Monday Third-Course 教授名稱
