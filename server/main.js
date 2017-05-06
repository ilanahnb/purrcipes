import { Meteor } from 'meteor/meteor';
import { FilesCollection } from 'meteor/ostrio:files';

Meteor.startup(() => {
    if (!RecipeGroup.findOne()){
        console.log("No recipe group yet. Creating starter data.");
        RecipeGroup.insert({
            group:"Breakfast",
            group_url:"breakfast",
            img_src:"/group_breakfast.png"
        });
        RecipeGroup.insert({
            group:"Desserts",
            group_url:"desserts",
            img_src:"/group_dessert.jpg"
        });
        RecipeGroup.insert({
            group:"Drinks",
            group_url:"drinks",
            img_src:"/group_drinks.png"
        });
        RecipeGroup.insert({
            group:"Healthy",
            group_url:"healthy",
            img_src:"/group_healthy.png"
        });
        RecipeGroup.insert({
            group:"Main Course",
            group_url:"main-course",
            img_src:"/group_maindish.png"
        });
        RecipeGroup.insert({
            group:"Meats",
            group_url:"meats",
            img_src:"/group_meat.png"
        });
        RecipeGroup.insert({
            group:"Snacks",
            group_url:"snacks",
            img_src:"/group_snacks.png"
        });
        RecipeGroup.insert({
            group:"Soups and Stews",
            group_url:"soups-and-stews",
            img_src:"/group_stew.png"
        });
    }
    reCAPTCHA.config({
        privatekey: ""
    })
});



/////
// PUBLISH
/////

// publish all recipes
Meteor.publish("recipes", function() {
    return Recipes.find();
});
// publish all recipe groups
Meteor.publish("recipegroup", function() {
    return RecipeGroup.find();
});
// publish all available users
Meteor.publish("users", function(){
    return Meteor.users.find({}, {fields: {username: 1, avatar: 1}});
});

Meteor.publish("userData", function () {
    if (this.userId) {
        return Meteor.users.find({_id: this.userId}, {fields: {username: 1, avatar: 1, avatar_id: 1, emails: 1}});
    } else {
        this.ready();
    }
});
// publish all recipe images
Meteor.publish("files.images.all", function () {
    return Images.find().cursor;
});
// publish all avatars
Meteor.publish("files.avatars.all", function () {
    return Avatars.find().cursor;
});



/////
// METHODS
/////

Meteor.methods({
    voteOnRecipe:function (recipe_id, rating) {
        if(this.userId == undefined){
            return false;
        }
        
        // throw an error if the rating is out of range
        if (rating > 5 || rating < 1) {
            throw new Meteor.Error("wtf are you trying to do?");
        }
        
        // create variable to update the votes object
        var vote = {};
        // set the vote from the current user
        vote["votes." + this.userId] = rating;
        
        Recipes.update({_id:recipe_id}, {
            // insert new vote if the user hadn't voted
            // or update the user's vote
            $set: vote
        });
        
        var the_recipe = Recipes.findOne({_id:recipe_id});
        var elmt = Object.entries(the_recipe.votes);

        console.log(the_recipe.votes);

        var sum = 0;

        for (var key in the_recipe.votes) {
            if (the_recipe.votes.hasOwnProperty(key)) {
           //     console.log(key + " -> " + the_recipe.votes[key]);
                sum = sum + the_recipe.votes[key];
            }
        }
        var avg = sum/elmt.length;
        console.log("Number of votes: "+elmt.length+". Average: "+avg);

        Recipes.update({_id:recipe_id}, {
            $set:{rating:avg}
        });
    },
    makeFavourite:function (recipe) {
        if(this.userId == undefined){
            return false;
        }
        
        // get the index of the user inside the current recipe's favourites array
        var favourite = recipe.favourites.indexOf(this.userId);

        // if the current recipe is not in the favourites array
        if (favourite == -1){
            Recipes.update({_id:recipe._id}, {
                // add the user to the favourites array
                $addToSet:{favourites:this.userId}
            });
        }
        // if the current recipe is already in the favourites array
        if (favourite !== -1){
            Recipes.update({_id:recipe._id}, {
                // remove the user from the favourites array
                $pull:{favourites:this.userId}
            });
        }
    },
    submitRecipe:function (recipe,
                            recipe_name, 
                            group, 
                            recipe_picture_id, 
                            recipe_picture, 
                            recipe_description, 
                            recipe_ingredients, 
                            recipe_directions) {
        
        var group_url = group.toLowerCase();
        group_url = group_url.replace(/ /g,"-");
        var date = new Date();
        var url = recipe_name.toLowerCase();
        url = url.replace(/ /g,"-");
        
        var existingRecipe = Recipes.findOne({recipe_name:recipe_name});
        
        var validGroups = [];
        
        RecipeGroup.find({}).forEach(
            function(recipegroup) {
                validGroups.push(recipegroup.group);
            }
        );
        
        var msg = [];
        
        // the recipe name is empty
        if (recipe_name == "") {
            msg.push("#emptyName");
        }
        if (group == "-- Choose --") {
            msg.push("#emptyCategory");
        }
        if (existingRecipe){
            if (recipe && existingRecipe.recipe_name != recipe.recipe_name){
                msg.push("#uniqueName");
            } else if (recipe == undefined) {
                msg.push("#uniqueName");
            }
        }
        if (group != "-- Choose --" && validGroups.indexOf(group) == -1) {
            msg.push("#emptyCategory");
        }
        if (recipe_picture == undefined) {
            msg.push("#emptyPicture");
        }
        if (recipe_ingredients == "") {
            msg.push("#emptyIngredients");
        }
        if (recipe_directions == "") {
            msg.push("#emptyDirections");
        }
        
        if (msg.length > 0) {
            throw new Meteor.Error("notValid", "The form is not valid.", msg);
        }
        
        if (msg.length == 0) {
            // it's a new recipe
            if (recipe == undefined){
                // Insert a recipe into the collection
                Recipes.insert({
                    recipe_name:recipe_name, 
                    group:group,
                    group_url:group_url,
                    recipe_picture_id:recipe_picture_id,
                    recipe_picture:recipe_picture,
                    recipe_description:recipe_description,
                    recipe_ingredients:recipe_ingredients,
                    recipe_directions:recipe_directions,
                    createdOn:moment(date).format("LL"), 
                    createdBy:Meteor.user()._id,
                    url: url,
                    favourites:[],
                    votes:{},
                    rating:0
                });
                return "/" + group_url + "/" + url;
            }
            // the recipe with this id already exists
            else {
                // update the recipe in the collection
                Recipes.update({_id:recipe._id}, {
                    $set:{
                        recipe_name:recipe_name, 
                        group:group,
                        group_url:group_url,
                        recipe_picture_id:recipe_picture_id,
                        recipe_picture:recipe_picture,
                        recipe_description:recipe_description,
                        recipe_ingredients:recipe_ingredients,
                        recipe_directions:recipe_directions,
                        url:url
                    }
                });
            }
        }
    },
    removeRecipe:function (imgId, recipe_id) {
        // if the recipe has a picture, remove it from the Images collection
        if (imgId != undefined) {
            Images.remove({"_id": imgId});
        }
        
        // remove recipe from the Recipes collection
        Recipes.remove({"_id": recipe_id});
    },
    removeImage:function (imgid) {
        if (imgid != undefined) {
            Images.remove({"_id": imgid});
        }
    },
    changeAvatar:function (userAvatar, avatar_id, avatar_url) {
        // remove the pre-existent avatar from the Avatar collection
        Avatars.remove({"_id": userAvatar});

        // change the user's avatar
        Meteor.users.update({_id : this.userId}, {
            $set:{
                avatar: avatar_url,
                avatar_id: avatar_id
            }
        });
    },
    keepAvatar:function (avatar_id) {
        // remove the new avatar from the Avatar collection
        if (this.userId != undefined) {
            Avatars.remove({"_id":avatar_id});
        }
    },
    createAccount: function(formData, captchaData) {
        // server side validation
        var verifyCaptchaResponse = reCAPTCHA.verifyCaptcha(this.connection.clientAddress, captchaData);
        
        var msg = [];

        if (!verifyCaptchaResponse.success) {
            msg = ["If you are not a robot, please check the box."];
        } else {
            console.log("reCAPTCHA verification passed!");
        }
        
        var username = formData.username;
        var email = formData.email;
        var password = formData.password;
        var passwordAgain = formData.passwordAgain;
                
        if (password == "") {
            msg = ["Please enter a password.", "#register-password"];
        } else if (password == username) {
            msg = ["Password must be different from Username!", "#register-password"];
        } else if (password.length < 8) {
            msg = ["Password must contain at least eight characters.", "#register-password"];
        } else if (passwordAgain == "") {
            msg = ["Please confirm your password.", "#register-password-again"];
        } else if (password !== passwordAgain) {
            msg = ["The passwords don't match!", "#register-password-again"];
        }
        
        var mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        var newEmail = {}
        newEmail["address"] = email;
        newEmail["verified"] = false;
        var existingEmail = Meteor.users.findOne({emails: newEmail});
        var newEmail2 = {}
        newEmail2["address"] = email;
        newEmail2["verified"] = true;
        var existingEmail2 = Meteor.users.findOne({emails: newEmail2});
        if (email == "") {
            msg = ["Please enter an email address.", "#register-email"];
        } else if (!email.match(mailformat)) {
            msg = ["You've entered an invalid email address.", "#register-email"];
        } else if (existingEmail || existingEmail2){
            msg = ["Email already exists.", "#register-email"];
        }
        
        var existingName = Meteor.users.findOne({username:username});
        check(username, String);
        if (username == "") {
            msg = ["Please enter a username.", "#register-username"];
        } else if (username.length < 4) {
            msg = ["Username must have at least four characters.", "#register-username"];
        } else if (username.length > 20) {
            msg = ["Username too long! It must have less than twenty characters.", "#register-username"];
        } else if (existingName){
            msg = ["Username already taken.", "#register-username"];
        }
        
        // throw an error if the form is not valid
        if (msg.length > 0) {
            throw new Meteor.Error("notValid", "The form is not valid.", msg);
        }
        
        if (msg.length == 0) {
            return Accounts.createUser({
                username: username,
                email: email,
                password: password
            });
        }
    },
    changeUsername:function (newUsername) {
        var msg = [];
        
        if (newUsername.length < 4){
            msg.push("Username must have at least four characters.");
        }
        // throw an error if the newUsername is not valid
        if (msg.length > 0) {
            throw new Meteor.Error("notValid", "The username is not valid.", msg);
        }
        
        // change the user's username
        Accounts.setUsername(this.userId, newUsername);
    },
    changeEmail:function (newAdress) {
        var msg = "";
        var mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        var newEmail = {}
        newEmail["address"] = newAdress;
        newEmail["verified"] = false;
        var existingEmail = Meteor.users.findOne({emails: newEmail});
        var newEmail2 = {}
        newEmail2["address"] = newAdress;
        newEmail2["verified"] = true;
        var existingEmail2 = Meteor.users.findOne({emails: newEmail2});
        if (newAdress == "") {
            msg = "Please enter an email address.";
        } else if (!newAdress.match(mailformat)) {
            msg = "You've entered an invalid email address.";
        } else if (existingEmail || existingEmail2){
            msg = "Email already exists.";
        }
        
        // throw an error if the newAdress is not valid
        if (msg != "") {
            throw new Meteor.Error("notValid", "The email is not valid.", msg);
        }
        
        Meteor.users.update({_id : this.userId}, {
            $set:{
                "emails" : [newEmail]
            }
        });
    },
    deleteAccount:function () {
        if(this.userId == undefined){
            return false;
        }
        // delete avatar
        Avatars.remove({userId:this.userId});
        // delete user
        Meteor.users.remove({_id:this.userId});
    }
});



Accounts.onCreateUser(function(options, user) {
    user.avatar = "/user-avatar.png";
    // default hook's "profile" behavior.
    if (options.profile){
        user.profile = options.profile;
    }
    return user;
});

// Ensuring every user has an email address, should be in server-side code
Accounts.validateNewUser((user) => {
    new SimpleSchema({
        _id: { type: String },
        username: { type: String },
        avatar: { type: String },
        emails: { type: Array },
        "emails.$": { type: Object },
        "emails.$.address": { type: String },
        "emails.$.verified": { type: Boolean },
        createdAt: { type: Date },
        services: { type: Object, blackbox: true }
    }).validate(user);

    // Return true to allow user creation to proceed
    return true;
});
