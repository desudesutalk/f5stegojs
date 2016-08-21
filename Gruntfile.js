module.exports = function(grunt) {
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		uglify: {
			options: {
				mangle: {
					toplevel: true
				},
				compress: {
					drop_console: true
				},
				mangleProperties: 2,
				exceptionsFiles: [ 'uglifyexcept.json' ],
				screwIE8: true,
				banner: '/*! <%=pkg.name%> v<%=pkg.version%> | <%=pkg.license%> license | <%=pkg.homepage%> */\n'
			},
			default: {
				files: {
					"f5stego.min.js": ["f5stego.js"]
				}
			},
			extra: {
				options:{
					exceptionsFiles: [ 'extra/uglifyexcept.json' ]
				},
				files: {
					"extra/f5extract.min.js": ["extra/f5extract.js"]
				}
			}
		},

		jshint: {
			all: ["f5stego.js", "extra/f5extract.js"],
			options: {
				strict: true,
				browser: true,
				devel: true,
				esversion: 5,
			}
		},
	});

	grunt.registerTask('default', ['jshint', 'uglify']);
}
