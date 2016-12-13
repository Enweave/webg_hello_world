module.exports = function (grunt) {
    require("load-grunt-tasks")(grunt);

    grunt.initConfig({
        // pkg: grunt.file.readJSON("package.json"),

        connect: {
            server: {
                options: {
                    port: 8000,
                    hostname: "*",
                    keepalive: true
                }
            }
        },

        // babel: {
        //     options: {
        //         sourceMap: true
        //     },
        //     dist: {
        //         files: {
        //             "dist/app.js": "media/js/app.js"
        //         }
        //     }
        // },

        concat: {
            css: {
                src: [
                    'bower_components/reset-css/reset.css',
                    "src/stylesheets/style.css"
                ],
                dest: 'dist/css/style.css'
            },
            js_vendors: {
                src: [
                    "bower_components/zepto/zepto.min.js",
                    "bower_components/dat.gui/dat.gui.min.js",
                    "bower_components/three.js/three.min.js"
                ],
                dest: 'dist/js/vendor.js'
            }
        }
    });

    grunt.registerTask("build_css", ["concat:css"]);
    grunt.registerTask("build_js_vendors", ["concat:js_vendors"]);


    grunt.registerTask("runserver", ["connect"]);
};
