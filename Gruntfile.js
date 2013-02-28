module.exports = function ( grunt ) {

  'use strict';

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON( 'package.json' ),

    meta: {
      banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        '<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
        '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
        ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */'
    },

    buster: {
      // Defaults
    },

    concat: {
      dist: {
        src: [ 'src/**/*.js' ],
        dest: 'dist/backbonejs-computed.js'
      }
    },

    jshint: {
      files: [
        'buster.js',
        'grunt.js',
        'src/**/*.js',
        'test/**/*.js'
      ],
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        node: true,
        es5: true
      }
    },

    watch: {
      files: [ '<%= jshint.files %>' ],
      tasks: [ 'test' ]
    },

    uglify: {
      dist: {
        src: [ '<banner:meta.banner>', 'src/**/*.js' ],
        dest: 'dist/backbonejs-computed.min.js'
      }
    }

  });

  grunt.loadNpmTasks( 'grunt-contrib-concat' );
  grunt.loadNpmTasks( 'grunt-contrib-jshint' );
  grunt.loadNpmTasks( 'grunt-contrib-watch' );
  grunt.loadNpmTasks( 'grunt-contrib-uglify' );
  grunt.loadNpmTasks( 'grunt-buster' );

  // Default task.
  grunt.registerTask( 'default', [ 'test', 'concat', 'uglify' ]);
  grunt.registerTask( 'test', [ 'jshint', 'buster' ]);

};
