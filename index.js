const express = require("express");
const path = require("path");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const Pusher = require('pusher');
const app = express();

const port = process.env.PORT || 3000;


const pusher = new Pusher({
    appId: "1806480",
    key:"be75e3dbef6dc92be9b4",
    secret: "2cd188cc98efd7046b8d",
    cluster:"us2",
    useTLS: true

});
require('dotenv').config();





const User = require("./db/models/user");
const {sendConfirmationEmail} = require("./functions/emailer");
const Branch = require("./db/models/branch");
const Post = require("./db/models/post");

mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'Mongo DB connection error'));
db.once('open', () => console.log('connected to MongoDB'));

//middlewares
const {generateToken, verifyToken} = require("./middlewares/tokens");


app.use(bodyParser.json());
app.use(express.json());

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');

app.get("/", async (req, res) =>{
    try {
        let posts = await Post.find();
        let branches = await Branch.find()


        
        res.render('home', {posts: posts, branches: branches});



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

    const colors = ['#FF0000', 'green', '#003285', '#850F8D', '#006769', '#8E3E63', '#344C64',
            '#9B3922', '#0C0C0C', '#430A5D', '#092635', '#940B92', '#005B41', '#116D6E', '#ED2B2A', 
            '#1A120B', '#C147E9', '#FB2576', '#B25068', '#F10086', '#B85C38', '#082032', '#6C0345', 
            '#CD5C08', '#606C5D', '#32012F', '#FA7070'
        ]
    const col = colors[Math.floor(Math.random() * colors.length)]
      

    const newUser = await new User({
        "firstName": firstName,
        "lastName": lastName,
        "email": email,
        "phone": phone,
        "password": hashedPassword,
        "city": city,
        "state": state,
        "age": age,
        "userColor": col

    });
    const theUser = {
        "_id": newUser._id,
        "firstName": firstName,
        "lastName": lastName,
        "email": email,
        "password": password,
        "phone": phone,
        "city": city,
        "state": state,
        "age": age,
        "userColor": col,
        "__v": newUser.__v
    }
    
    
    const token = generateToken(theUser);
    newUser.token = token;

    await newUser.save();
    await User.updateOne({ email: email }, { $set: { token: token } });

    sendConfirmationEmail(theUser);

    res.render('confirmationPage');

    //res.render('dashboard', {data: theUser});

        
});

app.get("/finduser/:email", async(req, res) => {
    const email = req.params.email;
    const theUser = await User.findOne({email:email});
    //console.log(theUser)
});

app.get("/")


//send message
app.post("/send/:userID", async(req, res) => {

    try {
        const userID = req.params.userID;
        const user = await User.findById(userID);
        const message = req.body.message;

        let payload = {
        "user": user,
        "message": message,
        "userID": userID
        }

        //console.log(payload)
        pusher.trigger('chat', 'message', payload);
        res.sendStatus(200);
    



    }catch(err) {

        console.error({"message":err.message})

    }

    
});


//login
app.post("/messaging", async (req, res) => {
    

    try {
        let { email, password} = req.body;

        const user = await User.findOne({email}).exec();

        
        if (!user) {
            return res.render('error', {message: "Email or Password is incorrect!", desc: "", solution: "Try another email or password", code: ""});

            //res.send("user not found")
        }
        const passwordMatch = bcrypt.compare(password, user.password);
        if (passwordMatch) {
            const {_id, firstName, lastName, email, password, phone, city, state, age, __v} = user;

            const colors = ['#FF0000', 'green', '#003285', '#850F8D', '#006769', '#8E3E63', '#344C64',
            '#9B3922', '#0C0C0C', '#430A5D', '#092635', '#940B92', '#005B41', '#116D6E', '#ED2B2A', 
            '#1A120B', '#C147E9', '#FB2576', '#B25068', '#F10086', '#B85C38', '#082032', '#6C0345', 
            '#CD5C08', '#606C5D', '#32012F', '#FA7070'
        ]
            const col = colors[Math.floor(Math.random() * colors.length)]
      
            if (!user.userColor) {
                await User.updateOne({ email: email }, { $set: { userColor: col } });

            }

            const theUser = {
                "_id": _id,
                "firstName": firstName,
                "lastName": lastName,
                "email": email,
                "password": password,
                "phone": phone,
                "city": city,
                "state": state,
                "age": age,
                "__v": __v,
                "userColor": col
            }
            const token = generateToken(theUser);
            //res.json({"token" : token});
            //res.locals.token = token;
            req.user = user;
            theUser.token = token;
            user.token = token;
            //res.send({token: token})
            await User.updateOne({ email: email }, { $set: { token: token } });

            res.render('dashboard', {data: theUser});
        }else {
            //return res.send('an error occurred, Gilbert')
            res.send('email or password is incorrect');
        }

        


    }catch(err) {
        return res.json({message: err.message})
        //res.render('error');


    }

    
});

//after email verification
app.get("/messaging/:userID", async (req, res) => {
    

    try {
        let userID = req.params.userID;

        const user = await User.findById(userID);

        const {firstName, lastName, email, password, phone, city, state, age, __v} = user;
        const theUser = {
                "_id": userID,
                "firstName": firstName,
                "lastName": lastName,
                "email": email,
                "password": password,
                "phone": phone,
                "city": city,
                "state": state,
                "age": age,
                "__v": __v
            }



            const token = generateToken(theUser);
            //res.json({"token" : token});
            //res.locals.token = token;
            req.user = user;
            theUser.token = token;
            user.token = token;
            //res.send({token: token})
            await User.updateOne({ email: email }, { $set: { token: token } });

            res.render('dashboard', {data: theUser});
        

        


    }catch(err) {
        return res.json({message: err.message})
        //res.render('error');


    }

    
});

app.get("/trial", (req, res) => {

    res.render("confirmationPage");

});

//change to view all blogs
app.get('/blog/:blogID', async (req, res) => {
    //const blogContent = await req.body.data;
    //console.log('submitted not showing')
    const ID = req.params.blogID;
    const message = await Post.findById(ID)
    res.render('blog', {message:message});

});



app.get('/submit-a-blog/:userId', async(req, res) => {

    const ID = req.params.userId;
    const user = await User.findById(ID);



    if (verifyToken(user)) {

        res.render('submitBlog', {data: ID});

    }else {
        res.send("you are not logged in")
    }



    //use a new view ejs file
});

//get the blog content
app.post('/submit-a-blog/:userId', async(req, res) => {

    const numSections = req.body.title.length;
    req.body.userId = req.params.userId;

    const { title, desc, mainImage, altText, content} = req.body;

    try {
        const user = await User.findById(req.body.userId);

        if (verifyToken(user)) {
            const newPost = new Post({
                "title": title,
                "desc": desc,
                "mainImage": mainImage,
                "altText": altText,
                "content": content,
                "userId": req.params.userId,
                "postedBy": user.firstName + " " + user.lastName,
                
            });
        
    
            await newPost.save();
    
            req.body.postedBy = user.firstName + ' ' + user.lastName;
            req.body.postedOn = newPost.postedOn;
            res.render('blog', {message: req.body, numSections: numSections});
    
        }else {
            res.send("you are not logged in")
        }

    }catch(error) {
        console.error(error);
        res.status(500).json({message: "Internal server error"})
    }
});


app.get("/allblogs/:userID", async (req, res) => {
    const posts = await Post.find();
    const theUser = req.params.userID;
    //console.log(posts.length);
    //console.log(posts);

    res.render("allblogs", {blogs: posts, userID: theUser});
});

app.get("/deletePosts", async(req, res) => {
    await Post.deleteMany({})
    res.send("posts deleted")
});

app.post("/createBranch", async(req, res) => {

    try {
        const {name} = req.body;
        const branch = await new Branch({
        "name": name
        });

    await branch.save();
    res.send(name + " added to branches")


    }catch(err) {

        res.send({"message":err.message})

    }
});

app.get("/allbranches", async (req, res) => {
    try {
        const branches = await Branch.find();
    res.send(branches);


    }catch(err) {
        res.send({"message": err.message})
    }
    
});

app.get("/branch/:branchID", async (req, res) => {

    try {
        const branchID = req.params.branchID;

        const theBranch = await Branch.findById(branchID);

        res.render('branch', {branch: theBranch});



    }catch(err) {
        res.send({"message": err.message})
    }
    
});

app.listen(port, () => {
    console.log("up on 3000!")
});