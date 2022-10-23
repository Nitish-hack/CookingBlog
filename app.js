const express=require("express");
const bodyParser=require("body-parser");
const expressLayouts=require("express-ejs-layouts")
const fileUpload = require('express-fileupload');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app=express();
const port=process.env.PORT|| 3000; 

require('dotenv').config();

app.use(express.urlencoded({extended:true}));
app.use(express.static("public"));
app.use(expressLayouts);
// app.use(express.json())

app.use(cookieParser('CookingBlogSecure'));
app.use(session({
  secret: 'CookingBlogSecretSession',
  saveUninitialized: true,
  resave: true
}));

app.use(passport.initialize());
app.use(passport.session());


app.use(flash());
app.use(fileUpload());



app.set('layout','./layouts/main');
app.set('view engine','ejs');
const routes=require('./server/routes/recipeRoutes.js');
app.use('/',routes);

app.listen(port,function () {
   console.log("listening to port"); 
});