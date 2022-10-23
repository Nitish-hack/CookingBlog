const passport = require("passport");
const session = require("express-session");
const passportLocalMongoose = require("passport-local-mongoose");
const bodyParser = require("body-parser");

require('../models/database');
const Category = require('../models/Category');
const Recipe = require('../models/Recipe');
const User = require('../models/User');


passport.use(User.createStrategy());

passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, {
      id: user.id,
      username: user.username
    });
  });
});

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});
// POST/ register
// registerUser


exports.registerUser=async(req,res)=>{
  try {
    
      User.register({ username: req.body.username}, req.body.password, function (err, user) {
        if (err) {
          console.log(err);
          res.redirect("/");
        }
        else {
          passport.authenticate("local")(req, res, function () {
            req.flash('successInfo', 'successfully signed Up and logged In')
            res.redirect('/');
          })
        }
      });
    
  } catch (error) {
    res.status(500).send({message:error.message|| "Error occurred"});
  }
}

// POST/ login
// loginUser


exports.loginUser=async(req,res)=>{
  try {
      User.findOne({  username: req.body.username},function(err, foundUser) {
        if (!err) {
    
          if (foundUser) {
    
            const authenticate = User.authenticate();
    
            authenticate(req.body.username, req.body.password, function(error, result) {
    
              if (!error) {
    
                if (result === false) {
                  req.flash('failureInfo', 'Username or password wrong!');
                  res.redirect("/");
                }
                else {
                  passport.authenticate('local')(req, res, function() {
                    req.flash('successInfo', 'successfully logged in.')
                    res.redirect('/');
                  });
                }
    
              }
              else{
                req.flash('failureInfo', 'Authentication failed!');
              res.redirect('/');
              }
    
            });
    
          }
           else {
            req.flash('failureInfo', 'user not found!');
            res.redirect('/');
           }
    
        } else{
          req.flash('failureInfo', err);
          res.redirect('/');
        }
    
         
    
      });
    
  } catch (error) {
    req.flash('failureInfo', error);
    res.redirect('/');
}
}
// GET/ login
// logoutUser
exports.logoutUser=async(req,res)=>{
try {
  req.logout(req.user, err => {
    if (err) return next(err);
    res.redirect("/");
  });
} catch (error) {
  res.status(500).send({message:error.message|| "Error occurred"});
}
}


// GET / homepage

exports.homepage = async (req, res) => {
  try {
    const limitNumber=5;
    const categories=await Category.find({}).limit(limitNumber);
    const latest=await Recipe.find({}).sort({_id:-1}).limit(limitNumber);
    const thai=await Recipe.find({'category':'Thai'}).limit(limitNumber);
    const mexican=await Recipe.find({'category':'Mexican'}).limit(limitNumber);
    const indian=await Recipe.find({'category':'Indian'}).limit(limitNumber);
 
    const failure= req.flash('failureInfo');
    const success = req.flash('successInfo');

    const food={latest,thai,mexican,indian};
    
    res.render("index", { title: 'Cooking Blog - Home',failure,success,user:req.user,categories,food});
  } catch (error) {
    res.status(500).send({message:error.message|| "Error occurred"});
  }
    
}
exports.exploreCategories = async (req, res) => {
  try {
    const limitNumber=20;
    const categories=await Category.find({}).limit(limitNumber);
 
    res.render("categories", { title: 'Cooking Blog - Categories',categories});
  } catch (error) {
    res.status(500).send({message:error.message|| "Error occurred"});
  }
    
}
exports.exploreRecipe = async (req, res) => {
  try {
   let recipeId=req.params.id;

   const recipe = await Recipe.findById(recipeId);

    res.render("recipe", { title: 'Cooking Blog - Recipe',recipe});
  } catch (error) {
    res.status(500).send({message:error.message|| "Error occurred"});
  }
    
}


// GET/ categories/:id
// categories BY Id

exports.exploreCategoriesById = async (req, res) => {
  try {
    let categoryId=req.params.id;
    const limitNumber=20;
    const categoryById=await Recipe.find({'category':categoryId}).limit(limitNumber);
 
    res.render("categories", { title: 'Cooking Blog - Categories',categoryById});
  } catch (error) {
    res.status(500).send({message:error.message|| "Error occurred"});
  }
    
}


// POST/ search
// searchRecipe

exports.searchRecipe = async (req, res) => {

try {
  let searchTerm=req.body.searchTerm;
  let recipes=await Recipe.find({$text:{$search:searchTerm,$diacriticSensitive:true}});    //this will search for searchTerm in fields contents which have text indexing
  res.render('search',{title:'cooking Blog - Search',recipes});
} catch (error) {
  res.status(500).send({message:error.message|| "Error occurred"});
}

}


// GET/explore-latest
// explore latest
exports.exploreLatest=async(req,res)=>{
  try { 
    const limitNumber=20;
    const recipes=await Recipe.find({}).sort({_id:-1}).limit(limitNumber) ;
    res.render('explore-Latest',{title:'cooking Blog - Latest Recipe',recipes});
  } catch (error) {

    res.status(500).send({message:error.message|| "Error occurred"});
    
  }
}

// GET/explore-random
// explore random
exports.exploreRandom=async(req,res)=>{
  try { 
   let count=Recipe.find().countDocuments();
   let random=Math.floor(Math.random()*count);
   let recipe=await Recipe.findOne().skip(random).exec();
    res.render('explore-Random',{title:'cooking Blog - Random Recipe',recipe});
  } catch (error) {

    res.status(500).send({message:error.message|| "Error occurred"});
    
  }
}


/**
 * GET /submit-recipe
 * Submit Recipe
*/
exports.submitRecipe = async(req, res) => {
  const infoErrorsObj = req.flash('infoErrors');
  const infoSubmitObj = req.flash('infoSubmit');
  
  res.render('submit-recipe', { title: 'Cooking Blog - Submit Recipe', infoErrorsObj, infoSubmitObj  } );
}

/**
 * POST /submit-recipe
 * Submit Recipe
*/
exports.submitRecipeOnPost = async(req, res) => {
  try {

    let imageUploadFile;
    let uploadPath;
    let newImageName;

    if(!req.files || Object.keys(req.files).length === 0){
      console.log('No Files were uploaded.');
    } else {

      imageUploadFile = req.files.image;
      newImageName = Date.now() + imageUploadFile.name;

      uploadPath = require('path').resolve('./') + '/public/uploads/' + newImageName;

      imageUploadFile.mv(uploadPath, function(err){
        if(err) return res.satus(500).send(err);
      })

    }

    const newRecipe = new Recipe({
      name: req.body.name,
      description: req.body.description,
      email: req.body.email,
      ingredients: req.body.ingredients,
      category: req.body.category,
      image: newImageName
    });
    
    await newRecipe.save();

    req.flash('infoSubmit', 'Recipe has been added.')
    res.redirect('/submit-recipe');
  } catch (error) {
    // res.json(error);
    req.flash('infoErrors', error);
    res.redirect('/submit-recipe');
  }
}


// async function insertDummyCategoryData(){
//       try {
//         await Category.insertMany([
//           {
//             "name": "Thai",
//             "image": "thai-food.jpg"
//           },
//           {
//             "name": "American",
//             "image": "american-food.jpg"
//           }, 
//           {
//             "name": "Chinese",
//             "image": "chinese-food.jpg"
//           },
//           {
//             "name": "Mexican",
//             "image": "mexican-food.jpg"
//           }, 
//           {
//             "name": "Indian",
//             "image": "indian-food.jpg"
//           },
//           {
//             "name": "Spanish",
//             "image": "spanish-food.jpg"
//           }
//         ]);
//       } catch (error) {
//         console.log('err', + error)
//       }
//     }
    
//     insertDummyCategoryData();



// async function insertDummyRecipeData(){
//   try {
//     await Recipe.insertMany([
//       { 
//         "name": "Recipe Name Goes Here",
//         "description": `Recipe Description Goes Here`,
//         "email": "recipeemail@raddy.co.uk",
//         "ingredients": [
//           "1 level teaspoon baking powder",
//           "1 level teaspoon cayenne pepper",
//           "1 level teaspoon hot smoked paprika",
//         ],
//         "category": "American", 
//         "image": "southern-friend-chicken.jpg"
//       },
//       { 
//         "name": "Recipe Name Goes Here",
//         "description": `Recipe Description Goes Here`,
//         "email": "recipeemail@raddy.co.uk",
//         "ingredients": [
//           "1 level teaspoon baking powder",
//           "1 level teaspoon cayenne pepper",
//           "1 level teaspoon hot smoked paprika",
//         ],
//         "category": "American", 
//         "image": "southern-friend-chicken.jpg"
//       },
//     ]);
//   } catch (error) {
//     console.log('err', + error)
//   }
// }

// insertDummyRecipeData();
