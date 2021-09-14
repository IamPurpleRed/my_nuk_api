My NUK API
===
###### tags: `GitHub`, `Node.JS`

## 簡介 | Introduction
一個簡易的API提供給 my_nuk Flutter APP 使用。

A simple API for my_nuk Flutter APP.

## 路由 | Routes
- /verification (驗證路由)
- /api (取得json格式資料的路由)
  - /grades (查詢歷年學期成績和排名)
  - /courses (查詢本學期課表)
  - /elearning1 (有關E平台1.0的所有項目)
    - /href (使用者所有課程的網址)
    - /handouts (教材分享)
- /user (提供給使用者顯示的路由，跟api路由搭配)
  - /grades
  - /courses
