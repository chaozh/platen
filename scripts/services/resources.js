angular.module('platen.services').value('resources',
  {
    BLOG_DIRECTORY_PATH: 'blogs',
    POST_DIRECTORY_PATH: 'posts',
    IMAGE_DIRECTORY_PATH: 'images',

    events: {
      PROCESSING_STARTED: 'processingStarted',
      PROCESSING_FINISHED: 'processingFinished',
      ELEMENT_EDITED: 'elementEdited',
      FONT_CHANGED: 'fontChanged',
      IMAGE_INSERTED: 'imageInserted',
      ALL_POSTS_DELETED: 'allPostsDeleted',
      ALL_IMAGES_DELETED: 'allImagesDeleted'
    },

    typography: {
      UNIT_OF_MEASURE: 'rem',
      INCREMENT: 0.1
    },

    post_status: {
      STATUS_DRAFT: 'draft',
      STATUS_PUBLISH: 'publish'
    }
  }
);