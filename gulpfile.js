var gulp         = require("gulp"),
    util         = require("gulp-util"),
    browserSync  = require("browser-sync").create(),
    sass         = require("gulp-sass"),
    autoprefixer = require("gulp-autoprefixer"),
    plumber      = require("gulp-plumber"),
    pkg          = require("./package.json"),
    config = {
      // TODO create banner for minified source files
      paths: {
        src: "src/",
        dist: "dist/"
      },
      autoprefixer: {
        browsers: ["last 2 versions", "> 5%"]
      },
      browserSync: {
        server: {
          baseDir: "src/"
        },
        notify: false,
        // Create a tunnel (if using `--tunnel`) with a subdomain of:
        // 1. the first "chunk" of the package.json `name`
        // 2. a random 6-character string appended to it
        // Note: needs to be lowercased alphanumerics
        tunnel: util.env.tunnel ?
                (pkg.name.trim().toLowerCase().split(/[^a-zA-Z0-9]/g)[0] + // [1]                                                    /* [2] */
                Math.random().toString(36).substr(2, 6)) :                 // [2]
                false,
        // Uncomment to prevent `browser-sync` from automatically opening up
        // a tab for localhost:3000 (or whatever port)
        // open: false
      },
      sass: {
        outputStyle: "expanded"
      }
    };

// Init `browser-sync`
gulp.task("browser-sync", function() {
  browserSync.init(config.browserSync);
});

// Build the SCSS and run it through Autoprefixer
gulp.task("build:css", function() {
  return gulp.src(config.paths.src + "scss/*.scss")
    .pipe(plumber())
    // need to use sass.sync() for `plumber` to work correctly and not hang
    // https://github.com/floatdrop/gulp-plumber/issues/32#issuecomment-106589180
    .pipe(sass.sync(config.sass))
    .pipe(autoprefixer(config.autoprefixer))
    .pipe(gulp.dest(config.paths.src + "css"))
    .pipe(browserSync.reload({ stream: true }));
});

// Generic `build` task to run all `build:*` tasks
gulp.task("build", ["build:css"]);

// Serve the app via `browser-sync` and watch for changes and reload
gulp.task("serve", ["browser-sync"], function() {
  gulp.watch(config.paths.src + "scss/**/*.scss", ["build:css"]);
  gulp.watch(config.paths.src + "*.html", browserSync.reload);
});

// Default task runs `build` then `serve`
gulp.task("default", ["build"], function() {
  gulp.start("serve");
});
