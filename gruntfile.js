'use strict';

module.exports = function (grunt) {

    require('time-grunt')(grunt);
    require('load-grunt-config')(grunt);

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        src: 'src',
        dest: 'app',

        // browser sync - maps your local site to an ip address that you can visit with other devices on the same network.
        // Run using grunt sync, then copy the External URL.
        browserSync: {
            dev: {
                options: {
                    proxy: ''
                }
            }
        },

        sass: {
            development: {
                files: {
                    '<%= dest %>/css/app.css': '<%= src %>/sass/app.scss'
                }
            }
        },

        notify: {
            sass: {
                options: {
                    message: '<%= pkg.name %> build finished successfully.'
                }
            }
        },

        postcss: {
            options: {
                map: false,
                processors: [
                    require('autoprefixer')({browsers: ['last 2 versions', 'ie >= 8']}),
                    require('cssnano')({
                        zindex: false
                    })
                ]
            },
            dist: {
                src: '<%= dest %>/css/app.css'
            }
        },

        watch: {
            styles: {
                files: ['<%= src %>/sass/*.scss', '<%= src %>/sass/**/*.scss'],
                tasks: ['sass', 'postcss', 'notify'],
                options: {
                    spawn: false // this fixes the issue of having to save twice before livereload works
                }
            },
            livereload: {
                files: ['<%= dest %>/css/app.css'],
                options: {
                    livereload: true
                }
            }
        },

        concurrent: {
            first: ['sass'],
            second: ['postcss']
        }
    });

    grunt.registerTask('default', ['concurrent:first', 'concurrent:second', 'watch']);

    grunt.registerTask('sync', ['browserSync']);
};
