const express = require('express');
const app = express();
const path = require('path');
const cookieParser = require('cookie-parser');
const userModel = require('./models/user'); // Assuming user model is in models/user.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


//middleware to serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(cookieParser());



app.get('/', function(req, res){
    res.render('signup');
});

app.post('/signup', async (req, res) => {
    try {
        let { username, name, email, password } = req.body;

        let existingUser = await userModel.findOne({ username });
        if (existingUser) {
            return res.status(400).send("User already exists");
        }

        let salt = await bcrypt.genSalt(10);
        let hash = await bcrypt.hash(password, salt);

        let user = await userModel.create({ username, name, email, password: hash });

        let token = jwt.sign({ userId: user._id, email: email }, 'secretKey', { expiresIn: '1h' });
        res.cookie('token', token, { maxAge: 900000, httpOnly: true });
        res.status(200).send("User created successfully");
    } catch (err) {
        res.status(500).send("Server error");
    }
});


app.get('/login', function(req, res) {
    res.render('login'); 
});

app.get("/profile", isLoggedIn, async function(req, res){
    let user = await userModel.findOne({email: req.user.email});

    res.render("profile",user);

})



app.post('/login', async function (req, res) {
    try {
        let { username, password } = req.body;

        // Check if both fields are provided
        if (!username || !password) {
            return res.status(400).send("Username/Email and password are required");
        }

        // Find the user (change 'username' to 'email' if you want email login)
        let user = await userModel.findOne({ username });
        if (!user) {
            return res.status(400).send("User does not exist");
        }

        // Compare password
        let isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).send("Incorrect password");
        }

        // Create token
        let token = jwt.sign(
            { userId: user._id, email: user.email },
            'secretKey', // move to process.env.JWT_SECRET in production
            { expiresIn: '1h' }
        );

        // Store token in cookie
        res.cookie('token', token, { maxAge: 900000, httpOnly: true });

        // Login successful
        res.status(200).redirect('/profile');
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});


app.get('/logout', function(req, res){
    res.clearCookie('token');
    res.redirect('/login');
});

// isko ache se samaj liyo isse we are able to create the protected routes
function isLoggedIn(req, res, next){
    if (req.cookies.token === "")res.redirect('/profile');
    else {
        let data = jwt.verify(req.cookies.token, 'secretKey');
        req.user = data;
        next();
    }
}





app.listen (3000, function(){
    console.log("Server is running on port 3000"); // it is on the https://localhost:3000
});