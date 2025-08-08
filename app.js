const express = require('express');
const app = express();
const path = require('path');
const cookieParser = require('cookie-parser');


//middleware to serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(cookieParser());



app.get('/', function(req, res){
    res.send("Hello World!");
});

app.post('/create', async function(req, res){
    let {username, name, email, password} = req.body;

    let user = await userModel.findOne({username});
    if (user){
        return res.status(400).send("User already exists"
        );    
    }   
    bcrypt.genSalt(10, function(err, salt){
        if (err) return res.status(500).send("Error generating salt");
        bcrypt.hash(password, salt, async function(err, hash){
            if (err) return res.status(500).send("Error in hashing password");
            else{
                userModel.create({
                    username,
                    name,
                    email,
                    password: hash
                }, function(err, user){
                    if (err) return res.status(500).send("Error creating user");
                    res.cookie('userId', user._id, { maxAge: 900000, httpOnly: true });
                    res.status(200).send("User created successfully");
                })

            }
            let token = jwt.sign({userId: user._id, email: email}, 'secretKey', {expiresIn: '1h'});
            res.send("User created successfully");
        })
    })
});

app.post('login', async function(req,res){
    let {username, password} = req.body;
    let user = await userModel.findOne({email: username});
    if (!user){
        return res.status(400).send("User does not exist");
  }
  bcrypt.compare(passwoord, user.password, function(err, result){
    if (err) return res.status(500).send("something went wrong");
    if (!result) return res.status(400).send("Incorrect password");
    
    let token = jwt.sign({userId: user._id, email: user.email}, 'secretKey', {expiresIn: '1h'});
    res.cookie('token', token, { maxAge: 900000, httpOnly: true });
    res.status(200).send("Login successful");
  }



});

app.get('/logout', function(req, res){
    res.clearCookie('token');
    res.redirect('/login');
});





app.listen (3000, function(){
    console.log("Server is running on port 3000"); // it is on the https://localhost:3000
});