// code sent to client and server
// which gets loaded before anything else (since it is in the lib folder)

RecipeGroup = new Mongo.Collection("recipegroup");
Recipes = new Mongo.Collection("recipes");


///// EasySearch for the Recipes collection
RecipesIndex = new EasySearch.Index({
    collection: Recipes,
    fields: ['recipe_name'],
    engine: new EasySearch.Minimongo()
});



Comments.config({
    rating: 'likes'
});




/////
// SECURITY
/////


Recipes.allow({
    insert:function(userId, doc){
        // test if the user is logged in
        if (Meteor.user()){
            return true;
        }
        // user is not logged in - do not let them add a recipe. 
        else {
            return false;
        }
    },
    remove:function(userId, doc){
        // test if the user is logged in
        if (Meteor.user()){
            if (userId != doc.createdBy){ // the recipe has the wrong userId
                return false;
            }
            else { // the recipe has the correct userId
                return true;
            }
        }
        // user is not logged in - do not let them remove the recipe. 
        else {
            return false;
        }
    },
    update:function(userId, doc){
        // they are logged in
        if (Meteor.user()){
            if (userId != doc.createdBy){ // the recipe has the wrong userId
                return false;
            }
            else { // the recipe has the correct userId
                return true;
            }
        }
        // user not logged in - do not let them update the recipe. 
        else {
			return false;
		}
    }
});

Meteor.users.allow({
    update: function (userId, doc) {
        // they are logged in
        if (Meteor.user()){
            if (userId != doc._id){ // the user has the wrong userId
                return false;
            }
            else { // the user has the correct userId
                return true;
            }
        }
        // user not logged in 
        else {
			return false;
		}
    },
    remove:function(userId, doc){
        // they are logged in
        if (Meteor.user()){
            if (userId != doc._id){ // the user has the wrong userId
                return false;
            }
            else { // the user has the correct userId
                return true;
            }
        }
        // user not logged in 
        else {
			return false;
		}
    }
});

