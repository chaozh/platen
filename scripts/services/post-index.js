/**
 * Created by zc on 2015/4/28.
 */
angular.module('platen.models').factory('postIndex', ['$rootScope', 'resources', 'fileManager', 'storage', 'logger',
    function ($rootScope, resources, fileManager, storage, logger) {
        var postsMap = {};

        var createLoacalIndex = function(post) {
            return {
                id: post.post_id, //new Date().getTime(),//TODO: blog sign
                wordPressId: post.post_id,
                status: post.post_status,
                title: post.post_title,
                type: post.post_type,
                format: post.post_format,

                state: {
                    createDate: new Date(),
                    lastModifiedDate: post.post_modified, //remote
                    lastSaveDate: '', //local
                    lastSyncDate: ''
                }
            };
        };

        return {
            init: function(onCompletionCallback){
                if(_.isEmpty(postsMap)){
                    storage.get(resources.BLOG_DIRECTORY_PATH, function(posts) {
                        angular.forEach(posts, function(post) {
                            postsMap[post.id] = post;
                            if(onCompletionCallback)
                                onCompletionCallback(post);
                        });
                    });
                } else {
                    angular.forEach(postsMap, function(post) {
                        if(onCompletionCallback)
                            onCompletionCallback(post);
                    });
                }
            },

            updateByFile: function(file, isCovered, onCompletionCallback){
                if(isCovered || angular.isUndefined(postsMap[file.id])) {
                    postsMap[file.id] = file; //blog sign
                    if(onCompletionCallback)
                        onCompletionCallback(file);
                }
            },

            updateByRemote: function(newPosts, onCompletionCallback) {
                angular.forEach(newPosts, function (post) {
                    if(angular.isUndefined(postsMap[post.post_id])) {
                        var desc = createLoacalIndex(post);
                        postsMap[desc.id] = desc;
                        if(onCompletionCallback)
                            onCompletionCallback(desc);
                    }
                });
            },

            deleteByID: function(id, onCompletionCallback) {
                postsMap[id] = null;
                if(onCompletionCallback)
                    onCompletionCallback();
            },

            save: function(onCompletionCallback){
                storage.set(resources.BLOG_DIRECTORY_PATH, postsMap, function(){
                    if(onCompletionCallback)
                        onCompletionCallback();
                });
            }
        };
    }
]);
