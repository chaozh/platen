module.exports = function(grunt) {
  var platen_scripts = ['scripts/app.js', 'scripts/*/*.js'];
//'vendor/angular.min.1.1.5.js',
//'vendor/ui-bootstrap-0.3.0.min.js',
// 'vendor/angular-ui.min.js',
// 'vendor/embedded_ga_host.js',
    var all_scripts = ['vendor/jquery-1.9.1.min.js',
      'vendor/jquery.xmlrpc.min.js',
      'vendor/bower-libs/angular/angular.min.js',
      'vendor/bower-libs/angular-route/angular-route.min.js',
      'vendor/bower-libs/angular-bootstrap/ui-bootstrap.min.js',
      'vendor/bower-libs/angular-bootstrap/ui-bootstrap-tpls.min.js',
      'vendor/bower-libs/angular-ui/build/angular-ui.min.js',
      'vendor/marked.js',
      'vendor/moment.min.js',
      'vendor/underscore.1.4.4.min.js',
      'scripts/app.js',
      'scripts/*/*.js'
  ];

  /*var all_scripts = ['vendor/bower-libs/jquery/jquery.min.js',
        'vendor/bower-libs/jquery-xmlrpc/jquery.xmlrpc.min.js',
        'vendor/bower-libs/angular/angular.min.js',
        'vendor/bower-libs/angular-ui/build/angular-ui.min.js',
        'vendor/bower-libs/angular-ui-bootstrap-bower/ui-bootstrap.min.js',
        'vendor/bower-libs/angular-bootstrap/ui-bootstrap-tpls.min.js',
        'vendor/bower-libs/marked/bin/marked.js',
        'vendor/bower-libs/moment/min/moment.min.js',
        'vendor/embedded_ga_host.js',
        'scripts/app.js',*/
        //'scripts/*/*.js'
  //];

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

     // Automatically inject Bower components into the app
    wiredep: {
      app: {
        src: ['index.html'],
        ignorePath:  /\.\.\//
      }/*,
      test: {
        devDependencies: true,
        src: '<%= karma.unit.configFile %>',
        ignorePath:  /\.\.\//,
        fileTypes:{
          js: {
            block: /(([\s\t]*)\/{2}\s*?bower:\s*?(\S*))(\n|\r|.)*?(\/{2}\s*endbower)/gi,
              detect: {
                js: /'(.*\.js)'/gi
              },
              replace: {
                js: '\'{{filePath}}\','
              }
            }
          }
      }*/
    },

    uglify: {
      dev: {
        options: {
          banner: '/*! DEV ! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
          compress: false,
          mangle: false,
          beautify: true
        },
        files: {
          'platen.js': all_scripts
        }
      },

      dist: {
        options: {
          banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
          compress: true,
          mangle: true,
          beautify: false
        },
        files: {
          'platen.js': all_scripts
        }
      }
    },

    jshint: {
      files: {
        src: platen_scripts
      }
    },

    watch: {
      scripts: {
        files: platen_scripts,
        tasks: ['jshint', 'uglify:dev'],
        options: {
          nospawn: true
        }
      },
      styles: {
        files: ['styles/**/*.less'],
        tasks: ['less:dev']
      }
    },

    less: {
      dev: {
        files: {
          "styles/themes/white-theme.css": "styles/themes/white-theme.less",
          "styles/themes/gray-theme.css": "styles/themes/gray-theme.less",
          "styles/themes/dark-theme.css": "styles/themes/dark-theme.less"
        }
      },
      dist: {
        options: {
          yuicompress: true
        },
        files: {
          "styles/themes/gray-theme.css": "styles/themes/gray-theme.less",
          "styles/themes/white-theme.css": "styles/themes/white-theme.less",
          "styles/themes/dark-theme.css": "styles/themes/dark-theme.less"
        }
      }
    },

    zip: {
      platen: {
        src: ['fonts/*',
            'images/*',
            'platen.js',
            'styles/themes/*.css',
            'views/**/*',
            'index.html',
            'manifest.json',
            'main.js'
        ],
        dest: 'platen.zip'
      }
    },
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-zip');

  // Default task(s).
  grunt.registerTask('default', ['watch']);
  grunt.registerTask('dist', ['uglify:dist', 'less:dist', 'zip:platen']);

};