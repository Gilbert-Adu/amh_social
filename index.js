const express = require("express");
const path = require("path");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');

app.get("/", (req, res) =>{
    res.render('home');
});
app.post('/dashboard', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    console.log(email);
    res.render('dashboard');
});
app.listen(3000, () => {
    console.log("up on 3000!")
});