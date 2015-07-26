var PostsController = function($scope, $location, storage, fileManager, wordpress, logger, resources, postIndex) {
  $scope.postsList = [];
  $scope.filteredPostsList = [];
  $scope.confirm = {};
  $scope.loaded = false;
  $scope.postToDelete = {};

  $scope.currentPage = 1;
  $scope.maxSize = 3;
  $scope.itemsPerPage = 10;

  var postsOffset = 0,
      fetchNum =  $scope.maxSize * $scope.itemsPerPage;

  var SORT_DESCENDING = 'descending';
  var SORT_ASCENDING = 'ascending';

  var POST_FIELDS = ['post_id', 'post_title', 'post_name', 'post_type', 'post_status', 'post_format', 'post_date', 'post_modified', 'terms'];

  $scope.filters = {};
  $scope.filters.dateSortOrder = SORT_DESCENDING;

  var loadLocalPosts = function() {
    $scope.postsList = [];
    //$scope.safeApply();

    //first try load from local using remote index!
    postIndex.init(function(post) {
      $scope.postsList.push(post);
      $scope.loaded = true;
      //$scope.safeApply();
    }, function(){
      logger.log("read local files", "PostsController");

      fileManager.accessFilesInDirectory(resources.POST_DIRECTORY_PATH, fileManager.directoryAccessActions.READ, function(file) {
        try {
          var post = JSON.parse(file);
          postIndex.updateByFile(post, false, function(post){
            $scope.postsList.push(post);
            $scope.loaded = true;
            //$scope.safeApply();
            paginatedPosts();
          });
        } catch (error) {
          logger.log("error reading file [" + file + "]: " + error, "PostsController");
          $scope.$emit(resources.events.PROCESSING_FINISHED, {
            message: "loading posts failed",
            success: false
          });
          $scope.$apply();
        }
      }, function(error) {
        logger.log(error, "PostsController");

        $scope.$emit(resources.events.PROCESSING_FINISHED, {
          message: "loading posts failed",
          success: false
        });
      });

      paginatedPosts();
    });
  };

  //@TODO: wait animation
  var loadPosts = function() {
        //fetch from remote then
        var postFilters = {
            number: fetchNum,
            offset: postsOffset
        };
        wordpress.getCredentials(function () {
          wordpress.getPosts(postFilters, POST_FIELDS, function (posts) {
            //logger.log(posts);
            postIndex.updateByRemote(posts[0], function(post){
              $scope.postsList.push(post);
              $scope.loaded = true;
              //$scope.safeApply();
            }, paginatedPosts);

            postIndex.save(function(){
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

  var paginatedPosts = function() {
    var begin = (($scope.currentPage - 1) * $scope.itemsPerPage),
        end = begin + $scope.itemsPerPage;

    if($scope.postsList.length > end) {
      $scope.filteredPostsList = $scope.postsList.slice(begin, end);
    } else {
      $scope.filteredPostsList = $scope.postsList;
    }

    $scope.safeApply();
    logger.log("repaginate posts", "PostsController");
  };

  if (!$scope.loaded) {
    loadLocalPosts();
  }
 //handle event
  //delete all posts in local!
  $scope.$on(resources.events.ALL_POSTS_DELETED, function(event, args) {
    loadLocalPosts();
  });

  $scope.fetchPost = function() {
    loadPosts();
  };

  $scope.pageChanged = function() {
    var begin = (($scope.currentPage - 1) * $scope.itemsPerPage);
    //TODO: to be more specified dealing with local post & performance improvement
    if(begin + $scope.itemsPerPage >= postsOffset + fetchNum){
      postsOffset += fetchNum;
      loadPosts();
    }else{
      paginatedPosts();
    }
  };

  $scope.deletePost = function(post) {
    $scope.postToDelete = post;
    $scope.deletePostConfirmOpen = true;
  };

  $scope.cancelDelete = function() {
    $scope.deletePostConfirmOpen = false;
    $scope.postToDelete = {};
  };

  $scope.proceedWithDelete = function() {
    $scope.deletePostConfirmOpen = false;

    // delete all related images
    angular.forEach($scope.postToDelete.images, function(image) {
      fileManager.removeFile(image.filePath, function() {
        logger.log("deleted image '" + image.name + "'", "PostsController");
      }, function(error) {
        logger.log("failed to delete image '" + image.name + "'", "PostsController");
      });
    });

    // delete the post itself
    fileManager.removeFile($scope.postToDelete.path, function() {
      var newList = _.reject($scope.postsList, function(post) {
        return (post.id === $scope.postToDelete.id);
      });

      postIndex.deleteByID($scope.postToDelete.id, paginatedPosts);
      postIndex.save(function(){
        logger.log("delete post from blog index", "PostsController");
      });
      $scope.postsList = newList;

      logger.log("deleted post '" + $scope.postToDelete.id + $scope.postToDelete.title + "'", "PostsController");
      $scope.postToDelete = {};
      $scope.$apply();

    }, function(error) {
      logger.log(error, "PostsController");

      $scope.$emit(resources.events.PROCESSING_FINISHED, {
        message: "failed to remove post '" + $scope.postToDelete.title + "'",
        success: false
      });
    });
  };

  $scope.editPost = function(post) {
    $location.path('posts/' + post.id);
  };
};

PostsController.$inject = ['$scope', '$location', 'storage', 'fileManager', 'wordpress', 'logger', 'resources', 'postIndex'];
angular.module('platen.controllers').controller('PostsController', PostsController);