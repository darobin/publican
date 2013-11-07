module.exports = function (grunt) {
    grunt.initConfig({
        pkg:    grunt.file.readJSON("package.json")
    ,   uglify: {
            build: {
                src:    "node_modules/bootstrap/js/*.js"
            ,   dest:   "public/js/bootstrap.min.js"
            }
        }
    // ,   cssmin: {
    //         minify: {
    //             removeEmpty:    true
    //         ,   src:            "specstatic.css"
    //         ,   dest:           "specstatic.min.css"
    //         }
    //     }
    // ,   concat: {
    //         options: {
    //             banner: banner
    //         }
    //     ,   dist: {
    //             src:    ["specstatic.min.css"]
    //         ,   dest:   "specstatic.min.css"
    //         }
    //     }
    ,   less: {
            development:    {
                options: {
                    paths:  ["node_modules/bootstrap/less"]
                //     compress:   true
                // ,   cleancss:   true
                // ,   report:     "min"
                }
            ,   files: {
                    "public/css/publican.css": "less/publican.less"
                }
            }
        }
    ,   watch: {
            less: {
                files:  ["less/*.less"]
            ,   tasks:  ["less"]
            }
        ,   server: {
                files:  ["app.js"]
            ,   tasks:  ["shell:bevy"]
            }
        }
    ,   shell: {
            bevy: {
                command:    "bevy deploy"
            ,   options: {
                    stdout: true
                ,   stderr: true
                }
            }
        }
    });

    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-cssmin");
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-less");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-shell");
    grunt.registerTask("default", [
                                    "less"
                                ,   "uglify"
                                // ,   "cssmin"
                                // ,   "concat"
                                ]);
};
