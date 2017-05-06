import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';



/////
// Subscribe
/////

Meteor.subscribe("recipes");
Meteor.subscribe("recipegroup");
Meteor.subscribe("users");
Meteor.subscribe("userData");
Meteor.subscribe("files.images.all");
Meteor.subscribe("files.avatars.all");



/////
// Configurations
/////

Comments.ui.config({
    limit: 5,
    loadMoreCount: 10,
    template: "bootstrap",
    generateAvatar: function (user) {
        if (user != undefined){
            return user.avatar;
        }
    },
    defaultAvatar:'https://en.gravatar.com/userimage/99519708/1e6b136214e071b7871b6a70ee43348e.png?size=200'
});

ShareIt.configure({
    sites: {                // nested object for extra configurations
        'facebook': {
            'appId': null	// use sharer.php when it's null, otherwise use share dialog
        },
        'twitter': {},
        'googleplus': {},
        'pinterest': {}
    },
    classes: "btn", // string (default: 'large btn')
                          // The classes that will be placed on the sharing buttons, bootstrap by default.
    iconOnly: true,      // boolean (default: false)
                          // Don't put text on the sharing buttons
    applyColors: true,     // boolean (default: true)
                          // apply classes to inherit each social networks background color
    faSize: '',            // font awesome size
    faClass: ''		  // font awesome classes like square
});



Meteor.startup(function() {
    reCAPTCHA.config({
        publickey: '6LeotA0UAAAAADp1pbwCVFiulZbVmfeT-YZrtvAL',
        hl: 'en' // optional display language
    });
});


/////
// HELPERS
/////

var numberVotes = function(){
    if (this.votes == undefined){
        return 0;
    }
    var count_votes = Object.entries(this.votes).length;
    if (count_votes == 1){
        count_votes = count_votes + " vote";
        return count_votes;
    }
    count_votes =  count_votes + " votes";
    
    return count_votes;
};

var sharedByUser = function(){
    var user = Meteor.users.findOne({_id:this.createdBy});
    if (user == undefined){
        return false;
    }
    return user.username;
};

var createdByUser = function(){
    var user = Meteor.userId();
    if (user == undefined){
        return false;
    }
    if (this.createdBy == user){
        return true;
    }
};

function showMore(count){
    if (Session.get("recipesLimit") >= count) {
        return false;
    }
    if (count > 15) {
        return true;
    }
    else {
        return false;
    }
}

function manyRecipes(count){
    if (count > 15) {
        return true;
    }
    else {
        return false;
    }
}


///// header helpers
Template.header.helpers({
    getRecipeGroups:function(){
        return RecipeGroup.find({}, {sort:{group:1}});
    },
    showResults:function(){
        var session = Session.get("searching");
        if (session == undefined){
            return false;
        }
        return RecipesIndex.search(session).fetch();
    }
});


///// homepage helpers
Template.home.helpers({
    getRecipeGroups:function(){
        return RecipeGroup.find({}, {sort:{group:1}});
    }
});


///// helpers for /search/:searchName
Template.search_recipes.helpers({
    getResults:function(){
        var result = RecipesIndex.search(Session.get("search")).fetch();
        
        // put in an array all the recipes' recipe_name found
        var recipesFound = [];
        result.forEach(
            function(recipe) {
                recipesFound.push(recipe.recipe_name);
            }
        );
        
        // no recipes were found
        if (recipesFound.length == 0){
            return false;
        }
        
        // create variable to update the sort object
        var sortResults = {};
        // set the sorting from the session
        if (Session.get("sort") == "rating" || Session.get("sort") == "favourites"){
            sortResults[Session.get("sort")] = -1;
        } else {
            sortResults[Session.get("sort")] = 1;
        }
        
        // return the recipes with the recipe_name in the recipesFound array
        return Recipes.find({recipe_name: {"$in": recipesFound}}, {sort: sortResults, limit: Session.get("recipesLimit")});
    },
    countResults:function(){
        var count_results = RecipesIndex.search(Session.get("search")).count();
        if (count_results == 1){
            count_results = "<span class='badge'>" + count_results + "</span> result";
            return count_results;
        }
        count_results = "<span class='badge'>" + count_results + "</span> results";
        return count_results;
    },
    search:function(){
        return (Session.get("search"));
    },
    showMoreRecipes:function(){
        var count_recipes = RecipesIndex.search(Session.get("search")).count();
        return showMore(count_recipes);
    },
    hasManyRecipes:function(){
        var count_recipes = RecipesIndex.search(Session.get("search")).count();
        return manyRecipes(count_recipes);
    }
});

Template.search_item.helpers({
    sharedBy: sharedByUser,
    numVotes: numberVotes,
    createdByCurrentUser: createdByUser
});


///// helpers for /:group_url
Template.recipes_list.helpers({
    getRecipes:function(){
        return Recipes.find({group_url: this.group_url}, {sort:{recipe_name:1}, limit: Session.get("recipesLimit")});
    },
    showMoreRecipes:function(){
        var count_recipes = Recipes.find({group_url: this.group_url}).count();
        return showMore(count_recipes);
    },
    hasManyRecipes:function(){
        var count_recipes = Recipes.find({group_url: this.group_url}).count();
        return manyRecipes(count_recipes);
    },
    countRecipes:function(){
        var count_recipes = Recipes.find({group_url: this.group_url}).count();
        if (count_recipes == 0) {
            return false;
        }
        if (count_recipes == 1){
            count_recipes = "<span class='badge'>" + count_recipes + "</span> recipe";
            return count_recipes;
        }
        count_recipes = "<span class='badge'>" + count_recipes + "</span> recipes";
        return count_recipes;
    }
});

Template.recipe_item.helpers({
    sharedBy: sharedByUser,
    numVotes: numberVotes,
    createdByCurrentUser: createdByUser
});


///// helpers for /members
Template.all_users.helpers({
    getUsers:function(){
        return Meteor.users.find({}, {sort:{username:1}, limit: Session.get("usersLimit")});
    },
    countUsers:function(){
        var users = Meteor.users.find({});
        var count_users = users.count();
        return count_users;
    },
    showMoreUsers:function(){
        var count_users = Meteor.users.find({}).count();
        if (Session.get("usersLimit") >= count_users) {
            return false;
        }
        if (count_users > 18) {
            return true;
        }
        else {
            return false;
        }
    },
    hasManyUsers:function(){
        var count_users = Meteor.users.find({}).count();
        if (count_users > 18) {
            return true;
        }
        else {
            return false;
        }
    }
});

Template.one_user.helpers({
    userRecipes:function(){
        return Recipes.find({createdBy: this._id}, {sort:{recipe_name:1}});
    },
    countRecipes:function(){
        var userRecipes = Recipes.find({createdBy: this._id});
        var count_recipes = userRecipes.count();
        if (count_recipes == 0) {
            return false;
        }
        if (count_recipes == 1){
            count_recipes = count_recipes + " recipe";
            return count_recipes;
        }
        count_recipes = count_recipes + " recipes";
        return count_recipes;
    }
});


///// helpers for /members/:username
Template.user_recipes.helpers({
    getUserRecipes:function(){
        return Recipes.find({createdBy: this._id}, {sort:{recipe_name:1}, limit: Session.get("recipesLimit")});
    },
    countRecipes:function(){
        var usersRecipes = Recipes.find({createdBy: this._id});
        var count_recipes = usersRecipes.count();
        if (count_recipes == 0) {
            return false;
        }
        if (count_recipes == 1){
            count_recipes = "<span class='badge'>" + count_recipes + "</span> recipe";
            return count_recipes;
        }
        count_recipes = "<span class='badge'>" + count_recipes + "</span> recipes";
        return count_recipes;
    },
    showMoreRecipes:function(){
        var count_recipes = Recipes.find({createdBy: this._id}).count();
        return showMore(count_recipes);
    },
    hasManyRecipes:function(){
        var count_recipes = Recipes.find({createdBy: this._id}).count();
        return manyRecipes(count_recipes);
    }
});

Template.user_recipe_item.helpers({
    numVotes: numberVotes
});


///// helpers for /:group_url/:url
Template.the_recipe.helpers({
    isFavourite:function(){
        // get the current user
        var user = Meteor.user()._id;
        
        if (this.favourites == undefined){
            return false;
        }
        
        // get the index of the user inside the current recipe's favourites array
        var favourite = this.favourites.indexOf(user);
        // if the current recipe is already in the favourites array
        if (favourite !== -1){
            return true;
        } else {
            return false;
        }
    },
    numVotes: numberVotes,
    sharedBy: sharedByUser,
    createdByCurrentUser: createdByUser,
    getIngredients:function(){
        if (this.recipe_ingredients == undefined){
            return "";
        }
        var ingredients = this.recipe_ingredients;
        // transform the ingredients into html list items
        ingredients = ingredients.replace(/\r?\n/g, "</span></li><li><span>");
        ingredients = "<li><span>" + ingredients + "</span></li>";
        return ingredients;
    },
    getDirections:function(){
        if (this.recipe_directions == undefined){
            return "";
        }
        var directions = this.recipe_directions;
        directions = directions.replace(/\r?\n/g, "</span></li><li><span>");
        directions = "<li><span>" + directions + "</span></li>";
        return directions;
    }
});


///// helpers for /my-page
Template.my_page.helpers({
    getFavourites:function(){
        if (Meteor.user() == undefined){
            return false;
        }
        return Recipes.find({favourites:Meteor.user()._id}, {sort:{recipe_name:1}, limit: Session.get("recipesLimit")});
    },
    countFavourites:function(){
        if (Meteor.user() == undefined){
            return false;
        }
        var my_favourites = Recipes.find({favourites:Meteor.user()._id});
        var count_recipes = my_favourites.count();
        if (count_recipes == 0){
            return false;
        }
        if (count_recipes == 1){
            count_recipes = "<span class='badge'>" + count_recipes + "</span> favourite recipe!";
            return count_recipes;
        }
        count_recipes = "<span class='badge'>" + count_recipes + "</span> favourite recipes!";
        return count_recipes;
    },
    showMoreRecipes:function(){
        if (Meteor.user() == undefined){
            return false;
        }
        var count_recipes = Recipes.find({favourites:Meteor.user()._id}).count();
        return showMore(count_recipes);
    },
    hasManyRecipes:function(){
        if (Meteor.user() == undefined){
            return false;
        }
        var count_recipes = Recipes.find({favourites:Meteor.user()._id}).count();
        return manyRecipes(count_recipes);
    }
});

Template.recipe_item_favourites.helpers({
    numVotes: numberVotes,
    sharedBy: sharedByUser
});


///// helpers for /my-page/my-recipes
Template.my_recipes.helpers({
    getMyRecipes:function(){
        return Recipes.find({createdBy:Meteor.userId()}, {sort:{recipe_name:1}, limit: Session.get("recipesLimit")});
    },
    countMyRecipes:function(){
        var my_recipes = Recipes.find({createdBy:Meteor.userId()});
        var count_recipes = my_recipes.count();
        if (count_recipes == 0){
            return false;
        }
        if (count_recipes == 1){
            count_recipes = "<span class='badge'>" + count_recipes + "</span> recipe";
            return count_recipes;
        }
        count_recipes = "<span class='badge'>" + count_recipes + "</span> recipes";
        return count_recipes;
    },
    showMoreRecipes:function(){
        var count_recipes = Recipes.find({createdBy:Meteor.userId()}).count();
        return showMore(count_recipes);
    },
    hasManyRecipes:function(){
        var count_recipes = Recipes.find({createdBy:Meteor.userId()}).count();
        return manyRecipes(count_recipes);
    }
});

Template.recipe_item_mine.helpers({
    numVotes: numberVotes
});


///// helpers for the delete_recipe_button template
Template.delete_recipe_button.helpers({
    getRecipeName:function(){
        var recipe = Recipes.findOne({_id:Session.get("recipeId")});
        if (recipe == undefined){
            return false;
        }
        return recipe.recipe_name;
    }
});


Template.my_settings.helpers({
    getEmail:function(){
        if (Meteor.user() == undefined){
            return false;
        }
        return Meteor.user().emails[0].address;
    }
});



/////
// Functions for uploading IMAGES
/////

Template.uploadedFile.helpers({
    uploadedFile:function() {
        return Images.findOne({_id:Session.get("imgId")});
    },
    imageId: function () {
        return Session.get("imgId");
    }
});

Template.uploadForm.onCreated(function () {
    this.currentUpload = new ReactiveVar(false);
});

Template.uploadForm.helpers({
    currentUpload: function () {
        return Template.instance().currentUpload.get();
    }
});

Template.uploadForm.events({
    "change #fileInput": function (e, template) {
        if (e.currentTarget.files && e.currentTarget.files[0]) {
        // We upload only one file, in case 
        // multiple files were selected
                        
            var imgid = Session.get("imgId");
            
            // if there is a pre-existent image,
            // remove it from the Image collection
            Meteor.call("removeImage",
                imgid,
                function(error) {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log("Removed image: " + Session.get("imgId"));
                        Session.set("imgId", undefined);
                    }
                }
            );

            // insert image
            var upload = Images.insert({
                file: e.currentTarget.files[0],
                streams: "dynamic",
                chunkSize: "dynamic"
            }, false);

            upload.on("start", function () {
                template.currentUpload.set(this);
            });

            upload.on("end", function (error, fileObj) {
                if (error) {
                    alert("Error during upload: " + error);
                } else {
                    // set an id for the img element
                    imgId = fileObj._id;
                    // set the session with the uploaded image's id
                    Session.set("imgId", imgId);
                    $("#emptyPicture").hide();
                }
                template.currentUpload.set(false);
            });

            upload.start();
        }
    }
});

Template.uploadedFile.events({
    "click .js-delete-picture":function(){
        var btn = $(".js-delete-picture").button('loading');
        Meteor.call("removeImage",
            Session.get("imgId"),
            function(error) {
                btn.button('reset');
                if (error) {
                    console.log(error);
                } else {
                    console.log("Removed image: " + Session.get("imgId"));
                    Session.set("imgId", undefined);
                }
            }
        );
    }
});



Template.uploadedAvatar.helpers({
    uploadedFile:function() {
        return Avatars.findOne({_id:Session.get("avatarId")});
    },
    avatarId: function () {
        return Session.get("avatarId");
    }
});
Template.uploadAvatarForm.events({
    "change #avatarInput": function (e, template) {
        if (e.currentTarget.files && e.currentTarget.files[0]) {
        // We upload only one file, in case 
        // multiple files were selected
                                    
            $(".uploadedAvatar").addClass("loading");
            
            // if there's an uploaded image already
            // remove it from the Avatar collection
            Meteor.call("keepAvatar",
                Session.get("avatarId"), // avatar_id
                function(error) {
                    if (error) {
                        $(".uploadedAvatar").removeClass("loading");
                        console.log(error);
                    } else {
                        $(".uploadedAvatar").removeClass("loading");
                    }
                }
            );
            
            var file = e.currentTarget.files[0];
            
            Resizer.resize(file, {width: 500, height: 500, cropSquare: true}, function(err, file) {
                // insert avatar
                var upload = Avatars.insert({
                    file: file,
                    streams: "dynamic",
                    chunkSize: "dynamic"
                }, false);

                upload.on("end", function (error, fileObj) {
                    if (error) {
                        alert("Error during upload: " + error);
                    } else {
                        // set an id for the img element
                        avatarId = fileObj._id;
                        // set the session with the uploaded image's id
                        Session.set("avatarId", avatarId);
                    }
                });

                upload.start();
            });
        }
    }
});

Template.change_avatar.events({
    "click .js-save-avatar":function(){
        var btn = $(".js-save-avatar").button('loading');
        Meteor.call("changeAvatar",
            Meteor.user().avatar_id, // userAvatar, user's current avatar_id
            Session.get("avatarId"), // new avatar_id
            $("div.uploadedAvatar").find("img").attr("src"), // avatar_url
            function(error) {
                btn.button('reset');
                if (error) {
                    alert(error);
                } else {
                    // Clear the session avatarId variable before the modal is closed
                    Session.set("avatarId", undefined);
                    $("#changeAvatar").modal("hide");
                }
            }
        );
    },
    "hidden.bs.modal #changeAvatar": function(event){
        var btn = $(".js-keep-avatar").button('loading');
        // if there is a Session "avatarId" it means that there is an
        // uploaded image that is not going to substitute the user's current avatar
        // so remove the image from the Avatar collection
        Meteor.call("keepAvatar",
            Session.get("avatarId"), // avatar_id
            function(error) {
                btn.button('reset');
                if (error) {
                    console.log(error);
                } else {
                }
            }
        );
        // Clear the session avatarId variable when the modal is closed
        Session.set("avatarId", undefined);
    }
});



/////
// EVENTS
/////


///// invoke the voteOnRecipe method passing the recipe's id and the current rating as arguments
///// this variable is used in many templates
var rateRecipe = function(event){
    var recipeId = $(event.target).closest("[data-id]").data("id");
    Meteor.call("voteOnRecipe",
        recipeId,
        $(event.currentTarget).data("userrating"), // create variable to update the votes object
        function(error) {
            if (error) {
                alert(error);
            }
        }
    );
};


///// click on edit button
var editRecipe = function(event){
    var the_recipe = Recipes.findOne({_id:this._id});
    var recipename = the_recipe.recipe_name;
    var imgId = this.recipe_picture_id;
    console.log("Editing the recipe with id: " + this._id + " and image id: " + imgId);
    // Fill in form
    $("#editModal").on("show.bs.modal", function (event) {
        // set the session with the image's id
        Session.set("imgId", imgId);
        Session.set("recipeName", recipename);
        var recipeid = the_recipe._id;
        var recipecategory = the_recipe.group;
        var recipedescription = the_recipe.recipe_description;
        var recipepicture = the_recipe.recipe_picture;
        var recipeingredients = the_recipe.recipe_ingredients;
        var recipedirections = the_recipe.recipe_directions;
        var modal = $(this);
        modal.find("form").attr("id", recipeid);
        modal.find("#RecipeName").val(recipename);
        modal.find("#RecipeCategory").val(recipecategory);
        modal.find("#RecipeDescription").val(recipedescription);
        modal.find("#uploadedPicture").attr("src", recipepicture);
        modal.find("#RecipeIngredients").val(recipeingredients);
        modal.find("#RecipeDirections").val(recipedirections);
    });

    $("#editModal").on("hidden.bs.modal", function (event) {
        // Clear the session imgId variable when the modal is closed
        Session.set("imgId", undefined);
        Session.set("recipeName", undefined);
    });
};

///// submit changes
var editRecipeForm = function(event, callback){    
    // Prevent default browser form submit
    event.preventDefault();
    
    var btn = $(".js-save-changes").button('loading');
    
    // get the id of the recipe that is being updated        
    var id = $(".js-edit-recipe-form").attr("id");
    console.log(id);

    var recipe = Recipes.findOne({_id:id});

    // Get value from form element
    var target = event.target;
    var recipe_name = target.RecipeName.value;
    var group = target.RecipeCategory.value;
    var recipe_picture_id = Session.get("imgId");
    var recipe_picture = $("div.uploadedImage").find("img").attr("src");
    var recipe_description = target.RecipeDescription.value;
    var recipe_ingredients = target.RecipeIngredients.value;
    var recipe_directions = target.RecipeDirections.value;

    $(".my-alert").hide();
        
    Meteor.call("submitRecipe",
        recipe,
        recipe_name,
        group,
        recipe_picture_id,
        recipe_picture,
        recipe_description,
        recipe_ingredients,
        recipe_directions,
        function(error, result) {
            btn.button('reset');
            if (error) {
                for (var key in error.details){
                    $(error.details[key]).show();
                }
                sAlert.error("Incomplete form! Please go back and complete the recipe.", {effect: "scale", position: "bottom-right", timeout: 10000, onRouteClose: true, stack:{limit:1}, offset: "100px"});
            } else {
                $("#editModal").modal("hide");
                $("#editModal").on("hidden.bs.modal", function (event) {
                    Session.set("imgId", undefined);
                    Session.set("recipeName", undefined);
                });
                
                if (callback){
                    callback.call();
                }
            }
        }
    );
};


///// click on delete button
var deleteRecipe = function(event){
    var recipeId = this._id;
    var imgId = this.recipe_picture_id;
    console.log("Confirm to delete recipe with id " + recipeId + " and image with id " + imgId);
    $("#deleteModal").on("show.bs.modal", function (event) {
        Session.set("recipeId", recipeId);
        var modal = $(this);
        modal.find(".js-confirm-delete-recipe").attr("id", recipeId);
    });
};

///// confirm delete a recipe
var deleteRecipeConfirm = function(event){
    var createdBy = this.createdBy;
    var recipe_id = $(".js-confirm-delete-recipe").attr("id");
    var recipe_picture_id = Recipes.findOne({"_id":recipe_id}).recipe_picture_id;

    console.log("Deleting the recipe with id " + recipe_id + " and image with id " + recipe_picture_id + ". Created by " + createdBy);
    
    var btn = $(event.target).closest(".js-confirm-delete-recipe").button('loading');
    
    Meteor.call("removeRecipe",
        recipe_picture_id, // imgId
        recipe_id, // recipe_id
        function(error) {
            btn.button('reset');
            if (error) {
                console.log(error);
            } else {
                if (Router.current().route.getName() == "recipe"){
                    window.location.href = "/my-page/my-recipes";
                }
                else {
                    $("#deleteModal").modal("hide");
                    $("body").removeClass("modal-open");
                    $(".modal-backdrop").remove();
                    sAlert.warning("The recipe has been deleted forever!", {effect: "scale", position: "top", timeout: 10000, onRouteClose: true, stack:{limit:1}, offset: "100px"});
                }
            }
        }
    );
};


///// hide search dropdown
Template.layout.events({
    "click":function(e){
        $("#searching").hide();
        $("#emptySearch").hide();
        Session.set("searching", undefined);
        if ($("#my-navbar-collapse").is(".in")){
            if (!$(e.target).is(".nav a") && !$(e.target).is(".nav input") && !$(e.target).is(".btn-submit") && !$(e.target).is(".glyphicon-search")) {
                $("#my-navbar-collapse").collapse("hide");
            }
        }
    },
    "click .js-to-the-top":function(event){
        $(window).scrollTop(0);
    },
    "click .js-load-more-recipes":function(event){
        Session.set("recipesLimit", Session.get("recipesLimit") + 15);
    }
});


///// header event functions
Template.header.events({
    "submit .js-search-recipe":function(event){
        // Prevent default browser form submit
        event.preventDefault();
        
        var searchName = event.target.SearchName.value;
        
        // if the search is empty, show error message
        if (searchName == "" || searchName == undefined) {
            $("#emptySearch").show();
            return {
                valid: false
            };
        }
        window.location.href = "/search/" + searchName;
    },
    "keyup #SearchName": function (e, template) {        
        if ($("#SearchName").val().length >= 3){
            $("#searching").show();
            Session.set("searching", $("#SearchName").val());
        } else {
            Session.set("searching", undefined);
            $("#searching").hide();
        }
    },
    "click .logout": function(event){
        event.preventDefault();
        Meteor.logout();
        Router.go("home");
    }
});


///// event functions for /my-page
Template.my_page.events({
    "click .js-remove-favourite":function(event){
        var btn = $(event.currentTarget).button('loading');
        
        Meteor.call("makeFavourite",
            this,
            function(error) {
                btn.button('reset');
                if (error) {
                    alert(error);
                } else {
                    sAlert.warning("You removed the recipe from your favourites!", {effect: "scale", position: "top-right", timeout: 10000, onRouteClose: true, stack:{limit:1}, offset: "100px"});
                }
            }
        );
    }
});


Template.recipe_item_favourites.events({
    "click .js-rate-recipe":rateRecipe
});

Template.my_settings.events({
    "click .js-edit":function(event){
        $(".edit-collapse").collapse("hide");
    },
    "click .js-edit-cancel":function(event){
        $(".edit-collapse").collapse("hide");
    },
    "hidden.bs.collapse .edit-collapse": function(event){
        $("#changeUsername").val(Meteor.user().username);
        $("#changeEmail").val(Meteor.user().emails[0].address);
        $(".alert").hide();
        $(".alert").html("");
        $(".js-change-password input").val("");
    },
    "click .js-change-username":function(event){
        var username = $("#changeUsername").val();
        var btn = $(event.currentTarget).button('loading');

        Meteor.call("changeUsername",
            username,
            function(error, result) {
                btn.button('reset');
                if (error) {
                    console.log(error);
                    $("#change-username-error-msg").show();
                    if (error.details) {
                        for (var key in error.details){
                            $("#change-username-error-msg").html(error.details[key]);
                        }
                    } else if (error.details == undefined) {
                        $("#change-username-error-msg").html(error.reason);
                    }
                } else {
                    $(".edit-collapse").collapse("hide");
                }
            }
        );
    },
    "click .js-change-email":function(event){
        var email = $("#changeEmail").val();
        var btn = $(event.currentTarget).button('loading');

        Meteor.call("changeEmail",
            email,
            function(error) {
                btn.button('reset');
                if (error) {
                    console.log(error);
                    $("#change-email-error-msg").show();
                    $("#change-email-error-msg").html(error.details);
                } else {
                    $(".edit-collapse").collapse("hide");
                }
            }
        );
    },
    "submit .js-change-password":function(event) {
        event.preventDefault();
        
        var btn = $(".js-save-new-password").button('loading');
        
        var currentPassword = $("#user-current-password").val();
        var newPassword = $("#user-new-password").val();
        var newPasswordAgain = $("#user-new-password-again").val();
        
        // Validate passwords better than this!!
        if (newPassword !== newPasswordAgain) {
            $("#change-password-success-msg").hide();
            $("#change-password-error-msg").show();
            $("#change-password-error-msg").html("The new passwords don't match!");
            btn.button('reset');
            return false;
        }
            
        Accounts.changePassword(currentPassword, newPassword, function(error) {
            btn.button('reset');
            if (error) {
                $("#change-password-success-msg").hide();
                $("#change-password-error-msg").show();
                $("#change-password-error-msg").html(error.reason);
            } else {
                $("#change-password-error-msg").hide();
                $("#change-password-success-msg").show();
                $("#change-password-success-msg").html("You successfully changed your password!");
                $(".js-change-password input").val("");
            }
        });

        return false;
    },
    "click .js-delete-account":function(event){
        var btn = $(event.currentTarget).button('loading');

        Meteor.call("deleteAccount",
            function(error) {
                if (error) {
                    btn.button('reset');
                    alert(error);
                } else {
                    $("body").removeClass("modal-open");
                    $(".modal-backdrop").remove();
                }
            }
        );
    }
});


///// share a recipe form
Template.recipe_form.events({
    "submit .js-new-recipe-form":function(event){
        // Prevent default browser form submit
        event.preventDefault();
        
        var btn = $("#submit-new-recipe").button('loading');
        
        // Get value from form element
        var target = event.target;
        var recipe_name = target.RecipeName.value;
        var group = target.RecipeCategory.value;
        var recipe_picture_id = Session.get("imgId");
        var recipe_picture = $("div.uploadedImage").find("img").attr("src");
        var recipe_description = target.RecipeDescription.value;
        var recipe_ingredients = target.RecipeIngredients.value;
        var recipe_directions = target.RecipeDirections.value;
        
        $(".my-alert").hide();
        
        Meteor.call("submitRecipe",
            undefined,
            recipe_name,
            group,
            recipe_picture_id,
            recipe_picture,
            recipe_description,
            recipe_ingredients,
            recipe_directions,
            function(error, result) {
                btn.button('reset');
                if (error) {
                    for (var key in error.details){
                        $(error.details[key]).show();
                    }
                    if (Router.current().route.getName() != "recipe"){
                        sAlert.error("Incomplete form! Please go back and complete the recipe.", {effect: "scale", position: "bottom-right", timeout: 10000, onRouteClose: true, stack:{limit:1}, offset: "100px"});
                    }
                } else {
                    window.location.href = result;
                }
            }
        );
        
    }
});


///// event functions for /my-page/my-recipes
Template.recipe_item_mine.events({
    "click .js-delete-recipe": deleteRecipe,
    "click .js-confirm-delete-recipe": deleteRecipeConfirm,
    "click .js-edit-recipe": editRecipe,
    "submit .js-edit-recipe-form": editRecipeForm,
    "click .js-rate-recipe": rateRecipe
});

///// event functions for /:group_url
Template.recipe_item.events({
    "click .js-rate-recipe": rateRecipe,
    "click .js-edit-recipe": editRecipe,
    "submit .js-edit-recipe-form": editRecipeForm,
    "click .js-delete-recipe": deleteRecipe,
    "click .js-confirm-delete-recipe": deleteRecipeConfirm
});


///// event functions for /:group_url/:url
Template.the_recipe.events({
    "click .js-make-favourite":function(event){
        var btn = $(".js-make-favourite").button('loading');
        Meteor.call("makeFavourite",
            this,
            function(error) {
                btn.button('reset');
                if (error) {
                    alert(error);
                }
            }
        );
    },
    "click .js-rate-recipe":rateRecipe,
    "click .js-delete-recipe": deleteRecipe,
    "click .js-confirm-delete-recipe": function(event){
        deleteRecipeConfirm(event);
    },
    "click .js-edit-recipe": editRecipe,
    "submit .js-edit-recipe-form":function(event){
        editRecipeForm(event, function (){
            var recipe_name = $("#RecipeName").val();
            var group = $("#RecipeCategory").val();
            var group_url = group.toLowerCase();
            group_url = group_url.replace(/ /g,"-");
            var url = recipe_name.toLowerCase();
            url = url.replace(/ /g,"-");

            if (Iron.Location.get().path != "/" + group_url + "/" + url){
                window.location.href = "/" + group_url + "/" + url;
            }
        });
    }
});


///// event functions for /search/:searchName
Template.search_recipes.events({
    "click .js-sort-by-name":function(event){
        Session.set("sort", "recipe_name");
        $(".sort-by a.dropdown-toggle").html("name <span class='caret'></span>");
    },
    "click .js-sort-by-popularity":function(event){
        Session.set("sort", "favourites");
        $(".sort-by a.dropdown-toggle").html("popularity <span class='caret'></span>");
    },
    "click .js-sort-by-rating":function(event){
        Session.set("sort", "rating");
        $(".sort-by a.dropdown-toggle").html("rating <span class='caret'></span>");
    }
});

Template.search_item.events({
    "click .js-delete-recipe": deleteRecipe,
    "click .js-confirm-delete-recipe": deleteRecipeConfirm,
    "click .js-edit-recipe": editRecipe,
    "submit .js-edit-recipe-form": editRecipeForm,
    "click .js-rate-recipe": rateRecipe
});


Template.single_comment.events({
    "click .remove-action": function (event) {
        $("body").removeClass("modal-open");
        $(".modal-backdrop").remove();
    }
});


Template.all_users.events({
    "click .js-load-more-users":function(event){
        Session.set("usersLimit", Session.get("usersLimit") + 18);
    }
});

Template.user_recipe_item.events({
    "click .js-rate-recipe":rateRecipe
});


Template.login.events({
    "submit form": function(event){
        event.preventDefault();
        var username = $("#login-username").val();
        var password = $("#login-password").val();
        
        Meteor.loginWithPassword(username, password, function(error){
            if (error) {
                $("#login-messages").show();
                $("#login-messages").html(error.reason);
            } else {
                Router.go("my_page"); // Redirect user if login succeeds
            }
        });
    },
    "click .js-email-reset-password": function (event) {
        var email = $("#send-reset-email").val();
        
        var btn = $(event.currentTarget).button('loading');
        console.log(email);
        Accounts.forgotPassword({email: email}, function(error) {
            btn.button('reset');
            if (error) {
                console.log(error);
                $("#reset-password-success").hide();
                $("#reset-password-error").show();
                $("#reset-password-error").html(error.reason);
            } else {
                $("#reset-password-error").hide();
                $("#reset-password-success").show();
                $("#send-reset-email").val("");
            }
        });
    },
    "hidden.bs.modal #forgotPassword": function(event){
        $("#reset-password-error").hide();
        $("#reset-password-success").hide();
        $("#send-reset-email").val("");
    }
});


Template.register.events({
    "submit form": function(event){
        event.preventDefault();
        
        var btn = $("#sign-up-button").button('loading');
        
        var formData = {
            //get the data from the register form fields
            username: $("#register-username").val(),
            email: $("#register-email").val(),
            password: $("#register-password").val(),
            passwordAgain: $("#register-password-again").val()
        };
        
        //get the captcha data
        var captchaData = grecaptcha.getResponse();
        
        Meteor.call("createAccount",
            formData,
            captchaData,
            function(error) {
                // reset the captcha
                grecaptcha.reset();
                btn.button('reset');
                if (error) {
                    console.log("Error reason: " + error.reason); // Output error if registration fails
                    console.log("Error Details: " + error.details[0]);
                    $("#sign-up-error-msg").show();
                    $("#sign-up-error-msg").html(error.details[0]);
                    $(error.details[1]).focus();
                } else {
                    Meteor.loginWithPassword(formData.username, formData.password, function(error){
                        if (error) {
                            console.log(error);
                        } else {
                            Router.go("my_page"); // Redirect user if login succeeds
                        }
                    });
                }
            }
        );
    }
});
