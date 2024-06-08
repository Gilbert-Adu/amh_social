const express = require("express");
const path = require("path");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const geoip = require('geoip-lite');
const multer = require("multer");
const requestIp = require("request-ip");
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
const { sendConfirmationEmail } = require("./functions/emailer");
const { userIdCleaner } = require("./functions/userIdCleaner");

const Branch = require("./db/models/branch");
const Post = require("./db/models/post");
const Article = require("./db/models/article");
const Comment = require("./db/models/comment");
const Announcement = require("./db/models/announcement");
const Message = require("./db/models/messages");



mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'Mongo DB connection error'));
db.once('open', () => console.log('connected to MongoDB'));

//middlewares
const {generateToken, verifyToken} = require("./middlewares/tokens");
const { rmSync } = require("fs");

//multer config for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});


const fileFilter = (req, file, cb) => {

    //accept images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
        cb(null, true)
    }else {
        cb(new Error('Invalid file type. Only Images and Videos accpeted!'), false)
    }
}

const upload = multer({ storage: storage, fileFilter: fileFilter});


app.use(bodyParser.json());
app.use(express.json());
app.use(requestIp.mw());
//no problem rn but could be a concern later
app.use('/uploads', express.static('uploads'));


/*
app.use((req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const ipAddress = req.clientIp;
    console.log(ipAddress);
    const geo = geoip.lookup(ip);
    console.log(geo);

  
    if (geo && geo.country === 'US') {
      next();
    } else {
      res.status(403).send('Access restricted.');
    }
  });
  
  

*/
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');

app.get("/", async (req, res) =>{
    try {
        let posts = await Post.find({blogDecision: 'yes'});
        let branches = await Branch.find();
        let announs = await Announcement.find();
        let articles = await Article.find();



        res.render('home', {posts: posts, branches: branches, announs: announs, articles: articles});




    }catch(err) {
        res.render('error');


    }
});


app.get("/register", async (req, res) => {
    const branches = await Branch.find();
    res.render('register', {branches: branches});
});
//get admin register page
app.get("/admin/register", async(req, res) => {
    const branches = await Branch.find();
    res.render('adminRegister', {branches: branches});
});

app.get("/admin/dashboard", (req, res) => {

    res.render("adminDashboard");

});

//sign up
app.post("/r/messaging", async (req, res) => {
    
    try {
        let { firstName, lastName, email, phone, password, city, state, age, branchOption, notRobot} = req.body;

        if (notRobot == 'on') {
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
        "branches": [].push(branchOption),
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
        "branches": [branchOption],
        "userColor": col,
        "__v": newUser.__v
    }
    
    const token = generateToken(theUser);
    newUser.token = token;

    await newUser.save();
    await User.updateOne({ email: email }, { $set: { token: token } });
    const userBranch = await Branch.findOne({ name: branchOption });

    await Branch.updateOne({ name: branchOption }, { $set: { numMembers: userBranch.numMembers + 1 } });
    await Branch.updateOne({ name: branchOption }, { $set: { members: userBranch.members.push(email) } });
    await User.updateOne({ email: email }, { $set: { branches: [branchOption] } });


    

    sendConfirmationEmail(theUser);

    res.render('confirmationPage');


        }else {
            res.send("No Robots allowed. Please confirm you're a real person")
        }

    }catch(err) {
        res.send({"error": err.message})
    }


    //res.render('dashboard', {data: theUser});

        
});

//post admin register
app.post("/admin/r/messaging", async (req, res) => {
    try {
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
        "userColor": col,
        "role": "admin"

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
        "role": "admin",
        "__v": newUser.__v
    }
    
    
    const token = generateToken(theUser);
    newUser.token = token;

    await newUser.save();
    await User.updateOne({ email: email }, { $set: { token: token } });


    sendConfirmationEmail(theUser);

    res.render('confirmationPage');


    }catch(err) {
        res.render('error', {message: err.message, desc: "You may have entered the wrong details", solution: "Try again"});


    }

        
});


app.get("/finduser/:email", async(req, res) => {
    const email = req.params.email;
    const theUser = await User.findOne({email:email});
    res.send(theUser)
    //console.log(theUser)
});




//send message
app.post("/send/:userID", async(req, res) => {

    try {
        const userID = req.params.userID;
        const user = await User.findById(userID);
        const message = req.body.message;



        let newMessage = await new Message({
            "user": user,
            "message": message,
            "userID": userID
        });

        await newMessage.save();

        let payload = {
            "user": user,
            "message": message,
            "userID": userID
        };



        //console.log(newMessage);
        pusher.trigger('chat', 'message', payload);
        res.sendStatus(200);
    



    }catch(err) {

        res.render('error', {message: err.message, desc: "Trouble sending message", solution: "Wait a while and try again"});


    }

    
});

//send image/vide in text
app.post('/upload/:userID', upload.single('media'), async (req, res) => {

    try {

        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }
    
        // Send a real-time notification with Pusher
        const userID = req.params.userID;
        const user = await User.findById(userID);
        const message = `/uploads/${req.file.filename}`;
    
        let newMessage = new Message({
            "user": user,
            "message": message,
            "userID": userID
        });
        await newMessage.save();
    
        pusher.trigger('media-channel', 'new-media', {
            url: `/uploads/${req.file.filename}`,
            user: user
        });
    
    
        res.sendStatus(200);
    }catch(err) {
        res.render('error', {message: err.message, desc: "Cannot upload image now", solution: "Try again", code: err.statusCode});


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
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (user && passwordMatch) {
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
            let messages = await Message.find();
            messages = messages.slice(Math.floor(messages.length / 2), messages.length);

            const userBranches = user.branches;

            allAnons = await Announcement.find();

            
            let annons = [];
            for (let i = 0; i < allAnons.length; i++) {

                if (userBranches.includes(allAnons[i].branch)){
                    annons.push(allAnons[i].title)
                }
            };


            if (user.role === 'admin') {
                const users = await User.find();
                const blogs = await Post.find();
                const articles = await Article.find();
                const branches = await Branch.find();


                res.render('adminDashboard', {data: theUser, anons:allAnons, users:users, blogs:blogs, articles:articles, branches: branches});
            }
            else {
                res.render('dashboard', {data: theUser, messages: messages, annons: annons});
            }
        }else {
            //return res.send('an error occurred, Gilbert')
            res.render('error', {message: "Email or Password is incorrect", desc: "Check what you entered", code: "", solution: "Try again"})
            //res.send('email or password is incorrect');
        }

        


    }catch(err) {
        return res.json({message: err.message})
        //res.render('error');


    }

    
});



app.get("/allmessages", async(req, res) => {

    const mess = await Message.find();

    console.log(mess);
});

//after email verification
app.get("/messaging/:userID", async (req, res) => {
    

    try {
        let userID = req.params.userID;

        const user = await User.findById(userID);
        const messages = [];

        const {firstName, lastName, email, password, phone, city, state, age, __v} = user;
        const colors = ['#FF0000', 'green', '#003285', '#850F8D', '#006769', '#8E3E63', '#344C64',
            '#9B3922', '#0C0C0C', '#430A5D', '#092635', '#940B92', '#005B41', '#116D6E', '#ED2B2A', 
            '#1A120B', '#C147E9', '#FB2576', '#B25068', '#F10086', '#B85C38', '#082032', '#6C0345', 
            '#CD5C08', '#606C5D', '#32012F', '#FA7070'
        ]
            const col = colors[Math.floor(Math.random() * colors.length)]
      
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
            await User.updateOne({ email: email }, { $set: { userColor: col } });


            res.render('dashboard', {data: theUser, messages: messages, annons: []});
        

        



    }catch(err) {
        return res.json({message: err.message})
        //res.render('error');


    }

    
});

app.get("/allusers", async(req, res) => {

    const users = await User.find();
    res.send(users);


});

app.post("/approveBlog/:userID/:blogID", async(req, res) => {


    await Post.updateOne({ _id: req.params.blogID }, { $set: { blogDecision: req.body.blogDecision } });
    
    const blogs = await Post.find();
    const theUser = await User.findById(req.params.userID);
    const users = await User.find();
    const allAnons = await Announcement.find();
    const articles = await Article.find();
    const branches = await Branch.find();

    res.render('adminDashboard', {data: theUser, anons:allAnons, users:users, blogs:blogs, articles:articles, branches: branches});


});

//toggle branch member count
app.post("/showMemberCount/:userID/:branchID", async(req, res) => {


    await Branch.updateOne({ _id: req.params.branchID }, { $set: { memberCount: req.body.memberCount } });
    
    const blogs = await Post.find();
    const theUser = await User.findById(req.params.userID);
    const users = await User.find();
    const allAnons = await Announcement.find();
    const articles = await Article.find();
    const branches = await Branch.find();



    res.render('adminDashboard', {data: theUser, anons:allAnons, users:users, blogs:blogs, articles:articles, branches: branches});


});
//change to view all blogs
app.get('/blog/:blogID', async (req, res) => {
    //const blogContent = await req.body.data;
    try {
        const ID = req.params.blogID;
    const message = await Post.findById(ID);
    console.log(message)
    let rawHeaders = req.rawHeaders;
    let commenter = {  _id: '66462b6058281e33f6c169d8'};
    let signedIn = false;
    if (req.headers.referer.includes('http://localhost:3000/allblogs') || req.headers.referer.includes('https://amh-social.onrender.com/allblogs')) {
        commenter = await User.findById(req.headers.referer.split("/")[req.headers.referer.split('/').length - 1]);
        signedIn = true;

    }else{
        commenter = {};
        signedIn = false;


    }

    const comments = await Comment.find({blogID: ID});
    res.render('blog', {message:message, commenter: commenter, comments: comments, signedIn: signedIn});


    }catch(err) {
        res.send({"error": err})

    }
});

app.post('/comment/:blogID/:commenterID', async (req, res) => {
    
    try {
        const ID = req.params.blogID;
        const comment = req.body.comment;
        const commenterID = req.params.commenterID;
        const commenter = await User.findById(commenterID);
        let payload = {
            "comment": comment,
            "commenter": commenter,
            "blogID": ID
        }

        const newComment = await new Comment({
            "comment": comment,
            "commenter": commenter,
            "blogID": ID,
            
        });
        await newComment.save();

        //const message = await Post.findById(ID);
        //let initialComments = message.comments;
        //await Post.updateOne({ _id: ID }, { $set: { comments: initialComments.push(payload) } });
        pusher.trigger('comment-channel', 'comment', payload);
        res.sendStatus(200);

    

    }catch(err) {
        console.log({"error":err.message})
    }
    
    


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
app.post('/submit-a-blog/:userId', upload.array('mainImage', 10), async(req, res) => {

    const numSections = req.body.title.length;
    req.body.userId = req.params.userId;

    const { title, desc, altText, content} = req.body;
    const blogImages = req.files;

    try {
        const user = await User.findById(req.body.userId);

        if (verifyToken(user)) {
            const newPost = new Post({
                "title": title,
                "desc": desc,
                "mainImage": blogImages,
                "altText": altText,
                "content": content,
                "userId": req.params.userId,
                "postedBy": user.firstName + " " + user.lastName,
                
            });
        
    
            await newPost.save();

            const payload = { 
                "title":title, 
                "desc":desc, 
                "altText":altText, 
                "content":content,
                "mainImage": blogImages,
                "postedOn": newPost.postedOn,
                "postedBy": user.firstName + ' ' + user.lastName
            };
        


    
            res.render('blog', {message: payload, numSections: numSections, comments: [], commenter: user, signedIn: true});
    
        }else {
            res.send("you are not logged in")
        }

    }catch(error) {
        console.error(error);
        res.status(500).json({message: "Internal server error"})
    }
});


//submit an article -- invitation only
//get the blog content
app.post('/submit-an-article/:userId', upload.array('mainImage', 10), async(req, res) => {

    const numSections = req.body.title.length;
    req.body.userId = req.params.userId;

    const { title, desc, altText, content} = req.body;
    const blogImages = req.files;

    try {
        const user = await User.findById(req.body.userId);

        if (verifyToken(user)) {
            const newArticle = new Article({
                "title": title,
                "desc": desc,
                "mainImage": blogImages,
                "altText": altText,
                "content": content,
                "userId": req.params.userId,
                "postedBy": user.firstName + " " + user.lastName,
                
            });
        
    
            await newArticle.save();

            const payload = { 
                "title":title, 
                "desc":desc, 
                "altText":altText, 
                "content":content,
                "mainImage": blogImages,
                "postedOn": newArticle.postedOn,
                "postedBy": user.firstName + ' ' + user.lastName
            };
        


    
            res.render('article', {message: payload, numSections: numSections});
    
        }else {
            res.send("you are not logged in")
        }

    }catch(error) {
        console.error(error);
        res.status(500).json({message: "Internal server error"})
    }
});


//get invitational article
app.get('/submit-an-article/:userId', async(req, res) => {

    const ID = req.params.userId;
    const user = await User.findById(ID);



    if (verifyToken(user)) {

        res.render('submitArticle', {data: ID});

    }else {
        res.send("you are not logged in")
    }



    //use a new view ejs file
});


//article page
app.get('/article/:blogID', async (req, res) => {
    //const blogContent = await req.body.data;
    try {
        const ID = req.params.blogID;
        const message = await Article.findById(ID);
        res.render('article', {message:message});


    }catch(err) {
        res.send({"error": err})

    }
});




app.get("/allblogs/:userID", async (req, res) => {
    const posts = await Post.find({blogDecision: 'yes'});

    const theUser = req.params.userID;
    const ads = []

    res.render("allblogs", {blogs: posts, userID: theUser, ads: ads});
});


app.get("/admin/announcement", (req, res) => {
    res.render("announcement");
});

app.get("/getannouncements", async(req, res) => {

    const announs = await Announcement.find();
    console.log(announs);
});

app.post("/admin/announcement", async (req, res) => {

    try {
        let {title, branchOption} = req.body;
        //const userID = req.params.userID;
        let payload = {
            "title": title,
            "branch": branchOption
        };
    
        const announ = await new Announcement(payload);
        announ.save();
    
    
        res.send("announcement made")

    }catch(err) {

        console.log({"message": err.message});

    }

    //res.render("announcement");
});


app.get("/deletePosts", async(req, res) => {
    await Post.deleteMany({})
    res.send("posts deleted")
});

app.get("/deleteMessages", async(req, res) => {
    await Message.deleteMany({})
    res.send("messages deleted")
});



app.post("/createBranch", async(req, res) => {

    try {
        //check if admin
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

app.get("/deletebranches", async(req, res) => {
    await Branch.deleteMany({});
    res.send("branches deleted")
});

app.get("/delete-a-branch/:name", async(req, res) => {
    const branchName = req.params.name;
    await Branch.deleteOne({name:branchName});
    res.send(branchName + " deleted");
});

app.get("/join-branch/:branchID", async(req,res) => {

    const branchID = req.params.branchID;
    const theBranch = await Branch.findById(branchID);


    res.render("joinBranch", {theBranch: theBranch, message:"", theUser: "No"});
});

app.post("/join-branch/:branchID", async(req,res) => {

    const branchID = req.params.branchID;
    const userEmail = req.body.email;
    const theBranch = await Branch.findById(branchID);
    const branchCount = theBranch.numMembers;

    const user = await User.findOne({email:userEmail});

    if (!user) {
        res.render("joinBranch", {theBranch: theBranch, message: 'Please create an account first', theUser: "No"});


    }else {
        await Branch.updateOne({ _id: branchID }, { $set: { numMembers: branchCount + 1 } });
        //update members
        await Branch.updateOne({ _id: branchID }, { $set: { members: theBranch.members.push(userEmail) } });
        await User.updateOne({ email: userEmail }, { $set: { branches: user.branches.push(theBranch.name) } });
        res.render("joinBranch", {theBranch: theBranch, message:`You just joined ${theBranch.name}`, theUser: "Yes"});

    }


});

app.get("/branch/:branchID", async (req, res) => {

    try {
        const branchID = req.params.branchID;

        const theBranch = await Branch.findById(branchID);
        let allAnons = await Announcement.find();
        let anons = [];

        for (let i = allAnons.length-1; i >= 0; i --) {
            if (allAnons[i].branch == theBranch.name) {
                anons.push(allAnons[i])

            }
        }

        res.render('branch', {branch: theBranch, anons: anons});



    }catch(err) {
        res.send({"message": err.message})
    }
    
});

app.listen(port, () => {
    console.log("up on 3000!")
});