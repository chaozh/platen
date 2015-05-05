var PostsController = function ($scope, $location, storage, fileManager, wordpress, logger, resources, postIndex) {
    $scope.postsList = [];
    $scope.confirm = {};
    $scope.loaded = false;
    $scope.postToDelete = {};

    $scope.postsOffset = 0;
    $scope.currentPage = 1;
    $scope.maxPageSize = 5;
    var DEFAULT_PAGE_SIZE = 10;
    var DEFAULT_MAX_PAGE_SIZE = DEFAULT_PAGE_SIZE * $scope.maxPageSize;
    $scope.totalItems = DEFAULT_MAX_PAGE_SIZE;

    var SORT_DESCENDING = 'descending';
    var SORT_ASCENDING = 'ascending';

    var POST_FIELDS = ['post_id', 'post_title', 'post_name', 'post_type', 'post_status', 'post_format', 'post_date', 'post_modified', 'terms'];

    $scope.filters = {};
    $scope.filters.dateSortOrder = SORT_DESCENDING;

    var loadLocalPosts = function () {
        $scope.postsList = [];
        $scope.safeApply();

        //first try load from local using remote index!
        postIndex.init(function (post) {
            $scope.postsList.push(post);
            $scope.loaded = true;
            $scope.safeApply();
        });

        fileManager.accessFilesInDirectory(resources.POST_DIRECTORY_PATH, fileManager.directoryAccessActions.READ, function (file) {
            try {
                var post = JSON.parse(file);
                postIndex.updateByFile(post, false, function (post) {
                    $scope.postsList.push(post);
                    $scope.loaded = true;
                    $scope.safeApply();
                });
            } catch (error) {
                logger.log("error reading file [" + file + "]: " + error, "PostsController");
                $scope.$emit(resources.events.PROCESSING_FINISHED, {
                    message: "loading posts failed",
                    success: false
                });
                $scope.$apply();
            }
        }, function (error) {
            logger.log(error, "PostsController");

            $scope.$emit(resources.events.PROCESSING_FINISHED, {
                message: "loading posts failed",
                success: false
            });
        });
    };

    //@TODO: wait animation
    var loadPosts = function () {
        //fetch from remote then
        var postFilters = {
            number: DEFAULT_MAX_PAGE_SIZE,
            offset: $scope.postsOffset
        };
        wordpress.getCredentials(function () {
            wordpress.getPosts(postFilters, POST_FIELDS, function (posts) {
                //logger.log(posts);
                postIndex.updateByRemote(posts[0], function (post) {
                    $scope.postsList.push(post);
                    $scope.loaded = true;
                    $scope.safeApply();
                });

                postIndex.save(function () {
                    logger.log("fetch posts from blog ", "PostsController");
                });

            }, function (error) {
                logger.log(error, "PostsController");

                $scope.$emit(resources.events.PROCESSING_FINISHED, {
                    message: "loading posts failed",
                    success: false
                });
            });

        });
    };

    if (!$scope.loaded) {
        loadLocalPosts();
    }
    //delete all posts in local!
    $scope.$on(resources.events.ALL_POSTS_DELETED, function (event, args) {
        loadLocalPosts();
    });

    $scope.fetchPost = function () {
        loadPosts();
    };

    /*$scope.nextPage = function () {
        $scope.postsOffset = DEFAULT_PAGE_SIZE * $scope.currentPage;
        logger.log($scope.postsOffset);
        if ($scope.postsOffset >= DEFAULT_MAX_PAGE_SIZE)
            loadPosts();
    };*/

    $scope.setPage = function (pageNo) {
        $scope.currentPage = pageNo;
    };

    $scope.deletePost = function (post) {
        $scope.postToDelete = post;
        $scope.deletePostConfirmOpen = true;
    };

    $scope.cancelDelete = function () {
        $scope.deletePostConfirmOpen = false;
        $scope.postToDelete = {};
    };

    $scope.proceedWithDelete = function () {
        $scope.deletePostConfirmOpen = false;

        // delete all related images
        angular.forEach($scope.postToDelete.images, function (image) {
            fileManager.removeFile(image.filePath, function () {
                logger.log("deleted image '" + image.name + "'", "PostsController");
            }, function (error) {
                logger.log("failed to delete image '" + image.name + "'", "PostsController");
            });
        });

        // delete the post itself
        fileManager.removeFile($scope.postToDelete.path, function () {
            var newList = _.reject($scope.postsList, function (post) {
                return (post.id === $scope.postToDelete.id);
            });

            postIndex.deleteByID($scope.postToDelete.id);
            postIndex.save(function () {
                logger.log("delete post from blog index", "PostsController");
            });
            $scope.postsList = newList;

            logger.log("deleted post '" + $scope.postToDelete.id + $scope.postToDelete.title + "'", "PostsController");
            $scope.postToDelete = {};
            $scope.$apply();

        }, function (error) {
            logger.log(error, "PostsController");

            $scope.$emit(resources.events.PROCESSING_FINISHED, {
                message: "failed to remove post '" + $scope.postToDelete.title + "'",
                success: false
            });
        });
    };

    $scope.editPost = function (post) {
        $location.path('posts/' + post.id);
    };
};

PostsController.$inject = ['$scope', '$location', 'storage', 'fileManager', 'wordpress', 'logger', 'resources', 'postIndex'];