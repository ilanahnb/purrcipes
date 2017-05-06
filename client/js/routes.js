Router.configure({
    layoutTemplate: 'layout',
    loadingTemplate: 'loading'
});

Router.plugin('seo', {
    defaults: {
        title: 'Purrcipes'
    }
});

Router.route('/',
    function () {
        // add the subscription handle to our waitlist
        this.wait(Meteor.subscribe("recipegroup"));

        // this.ready() is true if all items in the wait list are ready
        if (this.ready()) {
            this.render('home');
        } else {
            this.render('Loading');
        }
    },
    {
        name: 'home'
    }
);

Router.route('/my-page',
    function () {
        // add the subscription handle to our waitlist
        this.wait(
            Meteor.subscribe("recipes", {favourites:Meteor.userId()})
        );

        // this.ready() is true if all items in the wait list are ready
        if (this.ready()) {
            this.render('my_page');
        } else {
            this.render('Loading');
        }
    },
    {
        name: 'my_page',
        seo: {
            title: {
                text: 'Favourite Recipes',
                suffix: 'Purrcipes'
            }
        }
    }
);

Router.route('/my-page/share-recipe',
    function () {
        this.render('share_recipe');
    },
    {
        seo: {
            title: {
                text: 'Share Recipe',
                suffix: 'Purrcipes'
            }
        }
    }
);

Router.route('/my-page/my-recipes',
    function () {
        // add the subscription handle to our waitlist
        this.wait(
            Meteor.subscribe("recipes", {createdBy:Meteor.userId()})
        );

        // this.ready() is true if all items in the wait list are ready
        if (this.ready()) {
            this.render('my_recipes');
        } else {
            this.render('Loading');
        }
    },
    {
        seo: {
            title: {
                text: 'My Recipes',
                suffix: 'Purrcipes'
            }
        }
    }
);

Router.route('/my-page/settings',
    function () {
        this.render('my_settings');
    },
    {
        seo: {
            title: {
                text: 'Settings',
                suffix: 'Purrcipes'
            }
        }
    }
);

Router.route('/members',
    function () {
        // add the subscription handle to our waitlist
        this.wait(
            Meteor.subscribe("users"),
            Meteor.subscribe("files.avatars.all")
        );

        // this.ready() is true if all items in the wait list are ready
        if (this.ready()) {
            this.render('all_users');
        } else {
            this.render('Loading');
        }
    },
    {
        name: 'all-members',
        seo: {
            title: {
                text: 'Members',
                suffix: 'Purrcipes'
            }
        }
    }
);

Router.route('/members/:username',
    function () {
        var user = Meteor.users.findOne({username: this.params.username});
    
        // add the subscription handle to our waitlist
        this.wait(
            Meteor.subscribe("recipes", {createdBy:user._id}),
            Meteor.subscribe("files.images.all")
        );

        // this.ready() is true if all items in the wait list are ready
        if (this.ready()) {
            this.render('user_recipes', {data: user});
        } else {
            this.render('Loading');
        }
    },
    {
        name: 'one-member',
        seo: {
            title: {
                text: function() {
                    var title = Meteor.users.findOne({username: this.params.username}).username;
                    return title;
                },
                suffix: 'Purrcipes'
            }
        }
    }
);

Router.route('/search/:searchName',
    function () {
        Session.set("sort", "recipe_name");
        var searchName = Session.set("search", this.params.searchName);
    
        // add the subscription handle to our waitlist
        this.wait(
            Meteor.subscribe("recipes"),
            Meteor.subscribe("files.images.all")
        );

        // this.ready() is true if all items in the wait list are ready
        if (this.ready()) {
            this.render('search_recipes', {data: searchName});
        } else {
            this.render('Loading');
        }
    },
    {
        name: 'search'
    }
);

Router.route('/:group_url',
    function () {
        var group = RecipeGroup.findOne({group_url: this.params.group_url});
    
        // add the subscription handle to our waitlist
        this.wait(
            Meteor.subscribe("recipes", {group_url: this.params.group_url}),
            Meteor.subscribe("files.images.all")
        );

        // this.ready() is true if all items in the wait list are ready
        if (this.ready()) {
            this.render('recipes_list', {data: group});
        } else {
            this.render('Loading');
        }
    },
    {
        name: 'group',
        seo: {
            title: {
                text: function() {
                    var title = RecipeGroup.findOne({group_url: this.params.group_url}).group;
                    return title;
                },
                suffix: 'Purrcipes'
            }
        }
    }
);


Router.route('/:group_url/:url',
    function () {
        var recipe = Recipes.findOne({url: this.params.url});
    
        // add the subscription handle to our waitlist
        this.wait(Meteor.subscribe("recipes"));

        // this.ready() is true if all items in the wait list are ready
        if (this.ready()) {
            this.render('the_recipe', {data: recipe});
        } else {
            this.render('Loading');
        }
    },
    {
        name: 'recipe',
        seo: {
            title: {
                text: function() {
                    var title = Recipes.findOne({url: this.params.url}).recipe_name;
                    return title;
                },
                suffix: 'Purrcipes'
            }
        }
    }
);


Router.onBeforeAction(function () {
    if (!Meteor.userId()) {
        // if the user is not logged in, render the homepage template
        this.render('home');
    } else {
        // otherwise don't hold up the rest of hooks or our route/action function
        // from running
        this.next();
    }
}, {except: ['group', 'recipe', 'search', 'all-members', 'one-member']});


Router.onAfterAction(function(){
    $("#SearchName").val("");
    $("#my-navbar-collapse").collapse("hide");
    Session.set("avatarId", undefined);
    Session.set("recipesLimit", 15);
    Session.set("usersLimit", 18);
    $(window).scrollTop(0);
});
