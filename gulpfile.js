var gulp         = require("gulp"),
    plugins      = require("gulp-load-plugins")(),
    browserSync  = require("browser-sync").create(),
    lazypipe     = require("lazypipe"),
    pkg          = require("./package.json"),
    // flag for production builds (vs development)
    production = (plugins.util.env.prod) ? true : false,
    paths = {
      src: "src",
      dist: "build"
    },
    config = {
      banners: {
        html: [
                "<!--",
                "  HTML banner!",
                "  -->",
                ""
              ].join("\n"),
        css:  [
                "/*",
                " * CSS banner!",
                " */",
                ""
              ].join("\n"),
        js:   [
                "/*",
                " * JS banner!",
                " */",
                ""
              ].join("\n")
      },
      autoprefixer: {
        browsers: ["last 2 versions", "> 5%"]
      },
      cssnano: {
        discardComments: {
          removeAll: true
        }
      },
      htmlmin: {
        collapseInlineTagWhitespace: true,
        collapseWhitespace: true,
        removeComments: true,
        minifyCSS: true,
        minifyJS: true
      },
      browserSync: {
        server: {
          baseDir: paths.src
        },
        notify: false,
        // Create a tunnel (if using `--tunnel`) with a subdomain of:
        // 1. the first "chunk" of the package.json `name`
        // 2. a random 6-character string appended to it
        // Note: needs to be lowercased alphanumerics
        tunnel: plugins.util.env.tunnel ?
                (pkg.name.trim().toLowerCase().split(/[^a-zA-Z0-9]/g)[0] + // [1]
                Math.random().toString(36).substr(2, 6)) :                 // [2]
                false,
      }
    };

// Init `browser-sync`
gulp.task("browser-sync", function() {
  browserSync.init(config.browserSync);
});

// `useref` all the HTML files, optimizing HTML, CSS, and JS in the process
gulp.task("build:useref", function() {
  return gulp.src(paths.src + "/*.html")
    .pipe(plugins.useref())
    // Minify CSS, add comment banner
    .pipe(plugins.if("*.css", lazypipe()
      .pipe(plugins.cssnano, config.cssnano)
      .pipe(plugins.header, config.banners.css, { pkg: pkg })()
    ))
    // Minify JS, add comment banner
    .pipe(plugins.if("*.js", lazypipe()
      .pipe(plugins.uglify)
      .pipe(plugins.header, config.banners.js, { pkg: pkg })()
    ))
    // Minify HTML, add comment banner
    .pipe(plugins.if("*.html", lazypipe()
      .pipe(plugins.htmlmin, config.htmlmin)
      .pipe(plugins.header, config.banners.html, { pkg: pkg })()
    ))
    .pipe(gulp.dest(paths.dist));
});

// Build the SCSS (Autoprefixer, Sourcemaps)
gulp.task("build:css", function() {
  return gulp.src(paths.src + "/scss/*.scss")
    .pipe(plugins.plumber())
    // need to use sass.sync() for `plumber` to work correctly and not hang
    // https://github.com/floatdrop/gulp-plumber/issues/32#issuecomment-106589180
    .pipe(plugins.sourcemaps.init())
    .pipe(plugins.sass.sync(config.sass))
    .pipe(plugins.autoprefixer(config.autoprefixer))
    .pipe(plugins.sourcemaps.write("./"))
    .pipe(gulp.dest(paths.src + "/css"))
    .pipe(browserSync.reload({ stream: true }));
});

// Build the JS (lint)
gulp.task("build:js", function() {
  return gulp.src(paths.src + "/js/*.js")
    .pipe(plugins.jshint())
    .pipe(plugins.jshint.reporter("jshint-stylish"));
});

// Build assets depending on if `--prod` is set
gulp.task("build", function() {
  if (production) {
    plugins.runSequence("clean", ["build:css", "build:js"], "build:useref");
  } else {
    plugins.runSequence(["build:css", "build:js"]);
  }
});

// Clean the dist directory
gulp.task("clean", function() {
  return gulp.src(paths.dist, { read: false })
    .pipe(plugins.clean({ force: true }));
});

// Serve the app via `browser-sync` and watch for changes and reload
gulp.task("serve", ["browser-sync", "build"], function() {
  gulp.watch(paths.src + "/scss/**/*.scss", ["build:css"]);
  gulp.watch(paths.src + "/js/**/*.js", browserSync.reload);
  gulp.watch(paths.src + "/*.html", browserSync.reload);
});
