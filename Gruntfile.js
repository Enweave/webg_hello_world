module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        connect: {
            server: {
                options: {
                    port: 8000,
                    hostname: "*",
                    keepalive: true
                }
            }
        }

    });

    grunt.loadNpmTasks("grunt-contrib-connect");

    // Default task(s).
    // grunt.registerTask("server", ["http-server"]);
};