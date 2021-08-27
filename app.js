var express = require('express');
var cors = require('cors');

var app = express();
app.use(cors());
app.use(express.static('./public'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

var verification = require('./routes/verification');
app.use('/verification', verification);

app.use((req, res) => {
    res.status(404).send('404 Not Found.');
});

app.use((err, req, res) => {
    console.log(err);
    res.status(500).send('Internal server error.');
});

var port = process.env.PORT || 3000;
app.listen(port);