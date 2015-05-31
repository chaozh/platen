angular.module('platen.models').factory('Post', ['$rootScope', '$q', 'resources', 'fileManager', 'wordpress', 'logger', 'postIndex',
    function ($rootScope, $q, resources, fileManager, wordpress, logger, postIndex) {
        var data = {};


        var reMarker = new reMarked();

        var getFilePath = function (postId) {
            return "/" + resources.POST_DIRECTORY_PATH + '/' + postId;
        };

        var createPost = function () {
            data.id = new Date().getTime();
            data.path = getFilePath(data.id);
            data.status = resources.post_status.STATUS_DRAFT;
            data.title = '';

            /* there are 4 representations of the post:
             contentMarkdown - raw text written using markdown formatting (innerText property of the editor window)
             contentMarkdownHTML - markdown text, HTMLified by the browswer (innerHTML property of the editor window)
             contentHTMLPreview - markdown text converted to HTML (innerHTML content of the preview window)
             content - markdown text converted to HTML and encoded (i.e. content of the post for Wordpress) */
            data.content = '';
            data.contentMarkdown = ''; // set by editable-markdown directive
            data.contentMarkdownHtml = '';
            data.contentHtmlPreview = '';
            data.wordPressId = 0;

            data.excerpt = '';

            data.images = {};
            data.tags = '';
            data.categories = '';
            /*
             *TODO: if version surpport then lastSaveDate would be same function as lasModifiedDate(local) time
             */
            data.state = {
                createDate: new Date(),
                lastSaveDate: '',
                lastUploadDate: ''
            };
        };

        var createRemotePost = function(post) {
            data.id = post.post_id; //new Date().getTime();
            data.path = getFilePath(data.id);
            data.status = post.post_status;
            data.title = post.post_title;

            /* there are 4 representations of the post:
             contentMarkdown - raw text written using markdown formatting (innerText property of the editor window)
             contentMarkdownHTML - markdown text, HTMLified by the browswer (innerHTML property of the editor window)
             contentHTMLPreview - markdown text converted to HTML (innerHTML content of the preview window)
             content - markdown text converted to HTML and encoded (i.e. content of the post for Wordpress) */
            data.content = post.post_content;
            data.contentMarkdown = post.custom_fields['markdown'] ||  reMarker.render(post.post_content); // set by editable-markdown directive,
            data.contentMarkdownHtml = data.contentMarkdown;
            data.contentHtmlPreview = '';
            data.wordPressId = post.post_id;

            data.excerpt = post.post_excerpt;

            data.images = {};
            //deal with tags & categories
            data.tags = '';
            data.categories = '';
            angular.forEach(post.terms, function(term){
                switch (term.taxonomy){
                    case 'post_tag':
                        if (data.tags === ''){
                            data.tags = term.name;
                        }else{
                            data.tags += ', '+ term.name;
                        }
                        break;
                    case 'category':
                        if (data.categories === ''){
                            data.categories = term.name;
                        } else {
                            data.categories += ', ' + term.name;
                        }
                        break;
                }
            });

            data.state = {
                createDate: new Date(),
                lastSaveDate: '',
                lastUploadDate: ''
            };

        };

        var savePost = function (onSuccessCallback, onErrorCallback) {
            var postToSave = JSON.parse(JSON.stringify(data));
            // since there are 4 different representations of the same content, we only need to save one of them
            postToSave.content = '';
            postToSave.contentHtmlPreview = '';

            fileManager.writeFile(getFilePath(data.id), JSON.stringify(postToSave), function () {
                data.state.lastSaveDate = new Date();
                postIndex.updateByFile(data, true);
                postIndex.save();
                onSuccessCallback();
            }, onErrorCallback);
        };

        var saveRemotePost = function (onSuccessCallback, onErrorCallback) {
            var postToSave = JSON.parse(JSON.stringify(data));
            // since there are 4 different representations of the same content, we only need to save one of them
            postToSave.content = '';
            postToSave.contentHtmlPreview = '';

            fileManager.removeFile(getFilePath(data.id), function() {
                logger.log("deleted origin local post '" + data.id + "'", "Posts");
                postIndex.deleteByID(data.id);
                postToSave.id = data.id = data.wordPressId; //TODO: blog sign

                fileManager.writeFile(getFilePath(data.id), JSON.stringify(postToSave), function () {
                    logger.log("successfully save remote post '" + data.id + "'", "Posts");
                    data.state.lastSaveDate = new Date();
                    postIndex.updateByFile(data, true);
                    postIndex.save();
                    onSuccessCallback();
                }, onErrorCallback);

            }, function(error) {
                logger.log("failed to delete origin local post '" + data.id + "'", "Posts");
            });
        };

        var uploadImage = function (image) {
            var d = $q.defer();

            try {
                fileManager.readFile(image.filePath, false, function (imageData) {
                    // platen suffixes images with a unique identifier which has to be removed prior to uploading the file to WordPress
                    var cleanFileName = image.fileName.substr(0, image.fileName.lastIndexOf("."));

                    wordpress.uploadFile(cleanFileName, image.type, imageData, function (response) {
                        image.blogUrl = response[0].url;
                        image.blogId = response[0].id;

                        logger.log("uploaded image '" + image.name + "' to '" + image.blogUrl + "'", "Post module");
                        d.resolve();
                        $rootScope.$apply();

                    }, function (e) {
                        logger.log("error uploading image '" + image.name + "'", "Post Module");
                        d.reject();
                        $rootScope.$apply();
                    });

                }, function (e) {
                    logger.log("error reading image '" + image.name + "'", "Post Module");
                    d.reject();
                    $rootScope.$apply();
                });

            } catch (e) {
                d.reject();
                logger.log("error uploading image '" + image.name + "'", "Post Module");
            }

            return d.promise;
        };

        var uploadImages = function (content, onCompletionCallback) {
            var promises = [];

            angular.forEach(data.images, function (image) {
                if (!image.blogId || image.blogId.trim() === '') {
                    // for each image to be uploaded, initiate upload to wordpress
                    // because this operation is asyncronous, we need to get a promise for it
                    promises.push(uploadImage(image));
                }
            });

            if (promises.length > 0) {
                // once all promises are fullfilled (i.e. all items have been uploaded),
                // proceed with uploading the post
                $q.all(promises).then(onCompletionCallback);
            } else {
                // if there were no promises to begin with, just proceed with uploading
                onCompletionCallback();
            }
        };

        var replaceImageHtml = function (content, image) {
            var imgReplacement = '<a href="' + image.blogUrl + '"><img class="align' + image.alignment;
            var endingPTag = '';

            if (image.width > 0) {
                imgReplacement += '" width="' + image.width;
            }

            imgReplacement += '" src="' + image.blogUrl;

            if (image.alignment === 'center') {
                imgReplacement = '<p style="text-align: center;">' + imgReplacement;
                endingPTag = '</p>';
            }

            return content
                    .replace('<img src="' + image.localUrl, imgReplacement)
                    .replace('alt="' + image.name + '">', 'alt="' + image.name + '"></a>') + endingPTag;
        };

        return {
            initialize: function (postId, onSuccessCallback, onErrorCallback) {
                // load or create new
                if (postId === "0") {
                    createPost();
                    onSuccessCallback(data);
                } else {
                    //first try local
                    fileManager.readFile(getFilePath(postId), true, function (postJson) {
                        data = JSON.parse(postJson);
                        onSuccessCallback(data);
                    }, function (error) {
                        //try remote then
                        wordpress.getCredentials(function () {
                            wordpress.getPost(postId, function (posts) {
                                var post = posts[0]; //TODO array??
                                createRemotePost(post);
                                onSuccessCallback(data);
                            }, function () {
                                onErrorCallback(error);
                            });
                        });
                    });
                }
            },

            save: function (onSuccessCallback, onErrorCallback) {
                if (data.title.trim() === '' && data.contentMarkdown.trim() === '') return;
                savePost(onSuccessCallback, onErrorCallback);
            },

            sync: function (onSuccessCallback, onErrorCallback) {
                data.content = marked(data.contentMarkdown);

                var saveOnSuccessCallback = function (result) {
                    logger.log("synched post '" + data.title + "'", "Post service");

                    data.state.lastUploadDate = new Date();
                    if (!data.wordPressId) {
                        data.wordPressId = result[0];
                        saveRemotePost(onSuccessCallback, onErrorCallback);
                    }else{
                        savePost(onSuccessCallback, onErrorCallback);
                    }

                };

                try {
                    // before uploading the post to WordPress, we need to
                    // extract and upload any images which haven't already been uploaded
                    uploadImages(data.content, function () {
                        // replace references to images within the post body with WordPress urls
                        var content = data.content;

                        angular.forEach(data.images, function (image) {
                            content = replaceImageHtml(content, image);
                        });

                        data.content = content;

                        wordpress.savePost(data, saveOnSuccessCallback, onErrorCallback);

                    });
                } catch (e) {
                    onErrorCallback(e);
                }
            },

            resetWordPressInfo: function () {
                data.wordPressId = 0;
                angular.forEach(data.images, function (image) {
                    image.blogUrl = null;
                    image.blogId = null;
                });
            }
        };
    }
]);