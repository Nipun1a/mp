const express = require('express');
const app = express();
const path = require('path');

//middleware to serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');



app.get('/', function(req, res){
    res.send("Hello World!");
});

app.listen (3000, function(){
    console.log("Server is running on port 3000"); // it is on the https://localhost:3000
});