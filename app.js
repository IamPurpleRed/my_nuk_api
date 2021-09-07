let express = require('express');
let cors = require('cors');

let app = express();
app.use(cors());
app.use(express.static('./public'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.set('views', './views'); // 要設定ejs相關東西需要在views資料夾中
app.set('view engine', 'ejs');  // view engine 設定為 EJS

let verification = require('./routes/verification');
app.use('/verification', verification);

let api = require('./routes/api');
app.use('/api', api);

let user = require('./routes/user');
app.use('/user', user);

app.use((req, res) => {
    res.status(404).send('404 Not Found.');
});

app.use((err, req, res) => {
    console.log(err);
    res.status(500).send('Internal server error.');
});

let port = process.env.PORT || 3000;
app.listen(port);