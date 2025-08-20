const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const crypto = require('crypto');

const userModel = require('./models/user');
const postModel = require('./models/post');

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/post-app')
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(cookieParser());

// Routes
app.get('/', (req, res) => res.render('signup'));
app.get('/login', (req, res) => res.render('login'));

app.post('/signup', async (req, res) => {
    try {
        let { username, name, email, password } = req.body;

        let existingUser = await userModel.findOne({ username });
        if (existingUser) return res.status(400).send("User already exists");

        let salt = await bcrypt.genSalt(10);
        let hash = await bcrypt.hash(password, salt);

        let user = await userModel.create({ username, name, email, password: hash });

        let token = jwt.sign({ userId: user._id, email }, 'secretKey', { expiresIn: '1h' });
        res.cookie('token', token, { maxAge: 900000, httpOnly: true });

        res.status(200).send("User created successfully");
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

app.post('/login', async (req, res) => {
    try {
        let { username, password } = req.body;
        if (!username || !password) return res.status(400).send("Username and password required");

        let user = await userModel.findOne({ username });
        if (!user) return res.status(400).send("User does not exist");

        let isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).send("Incorrect password");

        let token = jwt.sign({ userId: user._id, email: user.email }, 'secretKey', { expiresIn: '1h' });
        res.cookie('token', token, { maxAge: 900000, httpOnly: true });

        res.redirect('/profile');
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

app.get('/profile', isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({ email: req.user.email }).populate('posts');
    res.render('profile', { user });
});

app.post('/post', isLoggedIn, async (req, res) => {
    try {
        let user = await userModel.findOne({ email: req.user.email })
            .populate({ path: 'posts', options: { sort: { date: -1 } } });

        let post = await postModel.create({
            user: user._id,
            content: req.body.postcontent
        });

        user.posts.push(post._id);
        await user.save();

        res.redirect('/profile');
    } catch (err) {
        console.error(err);
        res.status(500).send("Error creating post");
    }
});

app.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/login');
});

app.post("/like/:id", isLoggedIn, async function (req, res) {
    let post = await postModel.findById(req.params.id).populate("user");

    let likeIndex = post.likes.indexOf(req.user.userId);

    if (likeIndex === -1) {
        // User has not liked → Add like
        post.likes.push(req.user.userId);
    } else {
        // User already liked → Remove like
        post.likes.splice(likeIndex, 1);
    }

    await post.save();
    res.redirect('/profile');
});

// GET route to show edit form
app.get("/edit/:id", isLoggedIn, async function (req, res) {
    try {
        let post = await postModel.findById(req.params.id);
        if (!post) {
            return res.status(404).send("Post not found");
        }

        // Ensure only the owner can edit
        if (post.user.toString() !== req.user.userId) {
            return res.status(403).send("You are not authorized to edit this post");
        }

        let user = await userModel.findById(req.user.userId);
        res.render("edit", { user: user, post: post });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

// POST route to update the post
app.post("/edit/:id", isLoggedIn, async function (req, res) {
    try {
        let post = await postModel.findById(req.params.id);
        if (!post) {
            return res.status(404).send("Post not found");
        }

        // Ensure only the owner can edit
        if (post.user.toString() !== req.user.userId) {
            return res.status(403).send("You are not authorized to edit this post");
        }

        post.content = req.body.postcontent;
        await post.save();

        res.redirect("/profile");
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});


//  Multer setup (only once, outside route)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/images/uploads');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

//  Upload route
app.post("/upload", isLoggedIn, upload.single('profileImage'), async function (req, res) {
    try {
        if (!req.file) {
            return res.status(400).send("No file uploaded");
        }

        await userModel.findByIdAndUpdate(
            req.user.userId,
            { profileImage: "/images/uploads/" + req.file.filename }
        );

        res.redirect('/profile');
    } catch (err) {
        console.error(err);
        res.status(500).send("Error saving file path");
    }
});

// Auth middleware
function isLoggedIn(req, res, next) {
    try {
        if (!req.cookies.token) return res.redirect('/login');
        let data = jwt.verify(req.cookies.token, 'secretKey');
        req.user = data;
        next();
    } catch (err) {
        res.redirect('/login');
    }
}

app.listen(3000, () => console.log("Server running on port 3000"));
