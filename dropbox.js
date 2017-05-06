var Dropbox, Request, bound, client, fs, Images = {};

if (Meteor.isServer) {
    Dropbox = Npm.require('dropbox');
    Request = Npm.require('request');
    fs = Npm.require('fs');
    bound = Meteor.bindEnvironment(function(callback) {
        return callback();
    });
    client = new Dropbox.Client({
        key: '',
        secret: '',
        token: ''
    });
}


///// Images collection

this.Images = new Meteor.Files({
    debug: false, // Change to 'true' for debugging
    throttle: false,
    storagePath: 'assets/app/uploads/Images',
    collectionName: 'Images',
    allowClientCode: false,
    onBeforeUpload: function (file) {
        // test if the user is logged in
        if (this.userId){
            // Allow upload files under 10MB, and only in png/jpg/jpeg formats
            if (file.size <= 1024*1024*2 && /png|jpg|jpeg/i.test(file.extension)) {
                return true;
            } else {
                return 'Please upload image, with size equal or less than 2MB';
            }
        }
        // user is not logged in - do not let them add an image
        else {
            return false;
        }
    },
    onBeforeRemove: function (doc) {
        // test if the user is logged in
        if (this.userId){
            if (this.userId != doc.userId){ // the image has the wrong userId
                console.log("You can't delete this image!");
                return false;
            }
            else { // the image property "userId" = userId
                return true;
            }
        }
        // user is not logged in - do not let them remove the image 
        else {
            console.log("Not logged in!");
            return false;
        }
    },
    onAfterUpload: function(fileRef) {
        // In onAfterUpload callback we will move file to DropBox
        var self = this;
        var makeUrl = function(stat, fileRef, version, triesUrl) {
            if (triesUrl == null) {
                triesUrl = 0;
            }
            client.makeUrl(stat.path, {
                long: true,
                downloadHack: true
            }, function(error, xml) {
                // Store downloadable link in file's meta object
                bound(function() {
                    if (error) {
                        if (triesUrl < 10) {
                            Meteor.setTimeout(function() {
                                makeUrl(stat, fileRef, version, ++triesUrl);
                            }, 2048);
                        } else {
                            console.error(error, {
                                triesUrl: triesUrl
                            });
                        }
                    } else if (xml) {
                        var upd = {
                            $set: {}
                        };
                        upd['$set']["versions." + version + ".meta.pipeFrom"] = xml.url;
                        upd['$set']["versions." + version + ".meta.pipePath"] = stat.path;
                        self.collection.update({
                            _id: fileRef._id
                        }, upd, function(error) {
                            if (error) {
                                console.error(error);
                            } else {
                                // Unlink original files from FS
                                // after successful upload to DropBox
                                self.unlink(self.collection.findOne(fileRef._id), version);
                            }
                        });
                    } else {
                        if (triesUrl < 10) {
                            Meteor.setTimeout(function() {
                                makeUrl(stat, fileRef, version, ++triesUrl);
                            }, 2048);
                        } else {
                            console.error("client.makeUrl doesn't returns xml", {
                                triesUrl: triesUrl
                            });
                        }
                    }
                });
            });
        };

        var writeToDB = function(fileRef, version, data, triesSend) {
            // DropBox already uses random URLs
            // No need to use random file names
            if (triesSend == null) {
                triesSend = 0;
            }
            client.writeFile(fileRef._id + "-" + version + "." + fileRef.extension, data, function(error, stat) {
                bound(function() {
                    if (error) {
                        if (triesSend < 10) {
                            Meteor.setTimeout(function() {
                                writeToDB(fileRef, version, data, ++triesSend);
                            }, 2048);
                        } else {
                            console.error(error, {
                                triesSend: triesSend
                            });
                        }
                    } else {
                        // Generate downloadable link
                        makeUrl(stat, fileRef, version);
                    }
                });
            });
        };

        var readFile = function(fileRef, vRef, version, triesRead) {            
            if (triesRead == null) {
                triesRead = 0;
            }
            require('fs').readFile(vRef.path, function(error, data) {
                bound(function() {
                    if (error) {
                        if (triesRead < 10) {
                            readFile(fileRef, vRef, version, ++triesRead);
                        } else {
                            console.error(error);
                        }
                    } else {
                        writeToDB(fileRef, version, data);
                    }
                });
            });
        };
        
        var sendToStorage = function(fileRef) {
            _.each(fileRef.versions, function(vRef, version) {
                readFile(fileRef, vRef, version);
            });
        };

        sendToStorage(fileRef);
    },
    interceptDownload: function(http, fileRef, version) {
        var path, ref, ref1, ref2;
        path = (ref = fileRef.versions) != null ? (ref1 = ref[version]) != null ? (ref2 = ref1.meta) != null ? ref2.pipeFrom : void 0 : void 0 : void 0;
        if (path) {
            // If file is moved to DropBox
            // We will pipe request to DropBox
            // So, original link will stay always secure
            Request({
                url: path,
                headers: _.pick(http.request.headers, 'range', 'accept-language', 'accept', 'cache-control', 'pragma', 'connection', 'upgrade-insecure-requests', 'user-agent')
            }).pipe(http.response);
            return true;
        } else {
            // While file is not yet uploaded to DropBox
            // We will serve file from FS
            return false;
        }
    }
});



///// Avatars collection

this.Avatars = new Meteor.Files({
    debug: false, // Change to 'true' for debugging
    throttle: false,
    storagePath: 'assets/app/uploads/Avatars',
    collectionName: 'Avatars',
    allowClientCode: false,
    onBeforeUpload: function (file) {
        // test if the user is logged in
        if (this.userId){
            // Allow upload files under 10MB, and only in png/jpg/jpeg formats
            if (file.size <= 1024*1024*2 && /png|jpg|jpeg/i.test(file.extension)) {
                return true;
            } else {
                return 'Please upload image, with size equal or less than 2MB';
            }
        }
        // user is not logged in - do not let them add an image
        else {
            return false;
        }
    },
    onBeforeRemove: function (doc) {
        // test if the user is logged in
        if (this.userId){
            if (this.userId != doc.userId){ // the avatar has the wrong userId
                console.log("You can't delete this avatar!");
                return false;
            }
            else { // the avatar property "userId" = userId
                return true;
            }
        }
        // user is not logged in - do not let them remove the avatar 
        else {
            console.log("Not logged in!");
            return false;
        }
    },
    onAfterUpload: function(fileRef) {
        // In onAfterUpload callback we will move file to DropBox
        var self = this;
        var makeUrl = function(stat, fileRef, version, triesUrl) {
            if (triesUrl == null) {
                triesUrl = 0;
            }
            client.makeUrl(stat.path, {
                long: true,
                downloadHack: true
            }, function(error, xml) {
                // Store downloadable link in file's meta object
                bound(function() {
                    if (error) {
                        if (triesUrl < 10) {
                            Meteor.setTimeout(function() {
                                makeUrl(stat, fileRef, version, ++triesUrl);
                            }, 2048);
                        } else {
                            console.error(error, {
                                triesUrl: triesUrl
                            });
                        }
                    } else if (xml) {
                        var upd = {
                            $set: {}
                        };
                        upd['$set']["versions." + version + ".meta.pipeFrom"] = xml.url;
                        upd['$set']["versions." + version + ".meta.pipePath"] = stat.path;
                        self.collection.update({
                            _id: fileRef._id
                        }, upd, function(error) {
                            if (error) {
                                console.error(error);
                            } else {
                                // Unlink original files from FS
                                // after successful upload to DropBox
                                self.unlink(self.collection.findOne(fileRef._id), version);
                            }
                        });
                    } else {
                        if (triesUrl < 10) {
                            Meteor.setTimeout(function() {
                                makeUrl(stat, fileRef, version, ++triesUrl);
                            }, 2048);
                        } else {
                            console.error("client.makeUrl doesn't returns xml", {
                                triesUrl: triesUrl
                            });
                        }
                    }
                });
            });
        };

        var writeToDB = function(fileRef, version, data, triesSend) {
            // DropBox already uses random URLs
            // No need to use random file names
            if (triesSend == null) {
                triesSend = 0;
            }
            client.writeFile(fileRef._id + "-" + version + "." + fileRef.extension, data, function(error, stat) {
                bound(function() {
                    if (error) {
                        if (triesSend < 10) {
                            Meteor.setTimeout(function() {
                                writeToDB(fileRef, version, data, ++triesSend);
                            }, 2048);
                        } else {
                            console.error(error, {
                                triesSend: triesSend
                            });
                        }
                    } else {
                        // Generate downloadable link
                        makeUrl(stat, fileRef, version);
                    }
                });
            });
        };

        var readFile = function(fileRef, vRef, version, triesRead) {            
            if (triesRead == null) {
                triesRead = 0;
            }
            require('fs').readFile(vRef.path, function(error, data) {
                bound(function() {
                    if (error) {
                        if (triesRead < 10) {
                            readFile(fileRef, vRef, version, ++triesRead);
                        } else {
                            console.error(error);
                        }
                    } else {
                        writeToDB(fileRef, version, data);
                    }
                });
            });
        };
        
        var sendToStorage = function(fileRef) {
            _.each(fileRef.versions, function(vRef, version) {
                readFile(fileRef, vRef, version);
            });
        };

        sendToStorage(fileRef);
    },
    interceptDownload: function(http, fileRef, version) {
        var path, ref, ref1, ref2;
        path = (ref = fileRef.versions) != null ? (ref1 = ref[version]) != null ? (ref2 = ref1.meta) != null ? ref2.pipeFrom : void 0 : void 0 : void 0;
        if (path) {
            // If file is moved to DropBox
            // We will pipe request to DropBox
            // So, original link will stay always secure
            Request({
                url: path,
                headers: _.pick(http.request.headers, 'range', 'accept-language', 'accept', 'cache-control', 'pragma', 'connection', 'upgrade-insecure-requests', 'user-agent')
            }).pipe(http.response);
            return true;
        } else {
            // While file is not yet uploaded to DropBox
            // We will serve file from FS
            return false;
        }
    }
});





if (Meteor.isServer) {
    // Intercept File's collection remove method
    // to remove file from DropBox
    var _origRemove = this.Images.remove;

    this.Images.remove = function(search) {
        var cursor = this.collection.find(search);
        cursor.forEach(function(fileRef) {
            _.each(fileRef.versions, function(vRef) {
                var ref;
                if (vRef != null ? (ref = vRef.meta) != null ? ref.pipePath : void 0 : void 0) {
                    client.remove(vRef.meta.pipePath, function(error) {
                        bound(function() {
                            if (error) {
                                console.error(error);
                            }
                        });
                    });
                }
            });
        });
        // Call original method
        _origRemove.call(this, search);
    };
}