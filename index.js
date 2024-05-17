const express = require("express");
const path = require("path");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const app = express();
const port = process.env.PORT || 3000;
require('dotenv').config();

const User = require("./db/models/user");
const {sendConfirmationEmail} = require("./functions/emailer");

const Post = require("./db/models/post");

mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'Mongo DB connection error'));
db.once('open', () => console.log('connected to MongoDB'));


app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');

app.get("/", (req, res) =>{
    try {
        res.render('home');


    }catch(err) {
        res.render('error');


    }
});
app.get("/register", (req, res) => {
    res.render('register')
});

//sign up
app.post("/r/messaging", async (req, res) => {
    let { firstName, lastName, email, phone, password, city, state, age} = req.body;

    let hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await new User({
        "firstName": firstName,
        "lastName": lastName,
        "email": email,
        "phone": phone,
        "password": hashedPassword,
        "city": city,
        "state": state,
        "age": age

    });
    await sendConfirmationEmail(email);
    await newUser.save()
        .then((newUser) => {
            console.log("new user created!");
            //send confirmation email here.
            res.render('dashboard', {data: newUser});

        })
        .catch((err) => {
            res.render('error');

        })






});
//login
app.post("/messaging", async (req, res) => {
    

    try {
        let { email, password} = req.body;

        const user = await User.findOne({email}).exec();
        if (!user) {
            res.render('error', {message: "Email or Password is incorrect!", desc: "", solution: "Try another email or password", code: ""});

            //res.send("user not found")
        }
        const passwordMatch = bcrypt.compare(password, user.password);
        if (passwordMatch) {
            res.render('dashboard', {data: user});
        }else {
            res.send('email or password is incorrect');
        }

        


    }catch(err) {
        res.render('error');


    }

    
});

//change to view all blogs
app.get('/blog', (req, res) => {
    //const blogContent = await req.body.data;
    //console.log('submitted not showing')
    res.render('blog');

});

app.get('/submit-a-blog', (req, res) => {
    res.render('submitBlog');
});

//get the blog content
app.post('/submit-a-blog', async(req, res) => {
    //const blogContent = await req.body.data;
    //console.log('submitted not showing')
    res.render('blog');
});


app.listen(port, () => {
    console.log("up on 3000!")
});