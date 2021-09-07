My NUK API
===
###### tags: `GitHub`, `Node.JS`

## 簡介 | Introduction
一個簡易的API提供給 my_nuk Flutter APP 使用。

A simple API for my_nuk Flutter APP.

## 路由 | Routes
- /verification (驗證在APP上的登入資訊是否正確)
- /api (取得json格式資料的路由)
  - /grades (查詢歷年學期成績和排名)
  - /courses (查詢本學期課表)
  - /elearning1 (有關E平台1.0的所有項目)
    - /href (使用者所有課程的網址)
    - /handouts (教材分享)
- /user (提供給使用者顯示的路由，跟api路由搭配)
  - /grades
  - /courses

## 版本歷程紀錄 | Version History
### v0.4-beta (2021/09/08):
- 新增API功能：取得當前學期的所有課程(/api/courses)
  - 以完成E平台1.0通道(channel 2)
  - 因為E平台1.0的速率大幅影響爬蟲效率，因此沒有爬取授課教授
  - 未來預期再開通2個通道(channel 1: 選課系統 & channel 3: E平台3.0)
- 新增網頁：使用者能查看當前學期的所有課程(/user/courses)
  - 透過接收API的json格式，再渲染成網頁
  - 目前無法顯示教授名字，因為目前只開通channel 2

### v0.3-beta (2021/09/05):
- 新增API功能：取得E平台1.0指定課程的所有講義網址(/api/elearning1/handouts)

### v0.2.1-beta (2021/09/04):
- 修正/api/elearning1/href路由的爬蟲語法，此漏洞將導致API回傳的結果均為fail
  
### v0.2-beta (2021/09/03):
- 新增API功能：取得E平台1.0每個課程的網址(/api/elearning1/href)

### v0.1.2-beta (2021/09/01):
- /verification 現在使用POST方法取得

### v0.1.1-beta (2021/08/28):
- enable CORS(跨來源資源共享)

### v0.1-beta (2021/08/25):
- 新增驗證登入路由(/verification)
- 登入路由完成通道1(預計會有3個驗證通道)
- 首次部署至Heroku
