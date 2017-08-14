var gulp         = require("gulp"),
    plugins      = require("gulp-load-plugins")(),
    browserSync  = require("browser-sync").create(),
    lazypipe     = require("lazypipe"),
    pkg          = require("./package.json"),
    // want the string between git+ and .git in the repository URL
    repository   = pkg.repository.url.substring(4, pkg.repository.url.length - 4),
    // flag for production builds (vs development)
    production = (plugins.util.env.prod || plugins.util.env.production) ? true : false,
    paths = {
      src: "src",
      dist: "build"
    },
    config = {
      banners: {
        html: [
                "<!--",
                "                     _ _                                                   ",
                "   _ __   __ _ _   _| (_)___  __ ___      _____  ___  ___   _ __ ___   ___ ",
                "  | '_ \\ / _` | | | | | / __|/ _` \\ \\ /\\ / / _ \\/ __|/ _ \\ | '_ ` _ \\ / _ \\",
                "  | |_) | (_| | |_| | | \\__ \\ (_| |\\ V  V /  __/\\__ \\ (_) || | | | | |  __/",
                "  | .__/ \\__,_|\\__,_|_|_|___/\\__,_| \\_/\\_/ \\___||___/\\___(_)_| |_| |_|\\___|",
                "  |_|",
                "",
                "  Hi! You can reach me at " + pkg.author.email + " with any questions, comments, or cat GIFs.",
                "",
                "-->"
        ].join("\n"),
        css:  [
                "/*",
                " * Hi there!",
                " * This CSS has been minified and optimized.",
                " * You can view the source code in the repository: <%= repository %>",
                " */",
                ""
              ].join("\n"),
        js:   [
                "/*",
                " * Hey there!",
                " * This JavaScript has been minified.",
                " * If you'd like to view the full source, visit the repository: <%= repository %>",
                " */",
                ""
              ].join("\n")
      },
      autoprefixer: {
        browsers: ["last 2 versions", "> 1%"]
      },
      cssnano: {
        discardComments: {
          removeAll: true
        }
      },
      htmlmin: {
        collapseWhitespace: true,
        minifyJS: true,
        minifyCSS: true,
        removeComments: true
      },
      browserSync: {
        server: {
          baseDir: (production) ? paths.dist : paths.src
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

// `useref` all the HTML files, optimizing HTML, CSS, and JS in the process
gulp.task("build:useref", function() {
  return gulp.src(paths.src + "/*.html")
    .pipe(plugins.useref())
    // Minify CSS, add comment banner
    .pipe(plugins.if("*.css", lazypipe()
      .pipe(plugins.rev)
      .pipe(plugins.cssnano, config.cssnano)
      .pipe(plugins.header, config.banners.css, { repository: repository })()
    ))
    // Minify JS, add comment banner
    .pipe(plugins.if("*.js", lazypipe()
      .pipe(plugins.rev)
      .pipe(plugins.uglify)
      .pipe(plugins.header, config.banners.js, { repository: repository })()
    ))
    // Minify HTML, add comment banner
    .pipe(plugins.if("*.html", lazypipe()
      .pipe(plugins.htmlmin, config.htmlmin)
      .pipe(plugins.replace, /^(<!doctype html>)/i, "$1" + config.banners.html)()
      // .pipe(plugins.header, config.banners.html, { repository: repository })()
    ))
    .pipe(plugins.revReplace())
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
    .pipe(plugins.sourcemaps.write())
    .pipe(gulp.dest(paths.src + "/css"))
    .pipe(browserSync.reload({ stream: true }));
});

// Build the JS (lint)
gulp.task("build:js", function() {
  return gulp.src(paths.src + "/js/*.js")
    .pipe(plugins.jshint())
    .pipe(plugins.jshint.reporter("jshint-stylish"));
});

// Build (optimize) images
gulp.task("build:img", function() {
  return gulp.src(paths.src + "/img/**/*.+(jpg|jpeg|gif|png|svg)")
    .pipe(plugins.imagemin())
    .pipe(gulp.dest(paths.dist + "/img"));
});

// Copy documents to build directory
gulp.task("build:docs", function() {
  return gulp.src(paths.src + "/doc/**/*")
    .pipe(gulp.dest(paths.dist + "/doc"));
})

// Combined SVG icons
gulp.task("build:icons", function() {
  return gulp.src(paths.src + "/icons/**/*.svg", { base: paths.src + "/icons" })
    .pipe(plugins.rename({ prefix: "icon-" }))
    .pipe(plugins.svgstore())
    .pipe(plugins.if(production, gulp.dest(paths.dist + "/img"), gulp.dest(paths.src + "/img")));
});

// Copy humans.txt to build directory
gulp.task("build:humans.txt", function() {
  return gulp.src("humans.txt")
    .pipe(plugins.updateHumanstxtDate())
    .pipe(gulp.dest(paths.dist));
});

// Copy favicons to root of build directory
gulp.task("build:favicons", function() {
  return gulp.src(paths.src + "/favicons/*")
    .pipe(gulp.dest(paths.dist));
});

// Build assets depending on if `--prod` is set
gulp.task("build", function(callback) {
  if (production) {
    plugins.runSequence(
      "clean",
      "build:css",
      [
        "build:useref",
        "build:img",
        "build:docs",
        "build:icons",
        "build:humans.txt",
        "build:favicons"
      ],
      callback
    );
  } else {
    plugins.runSequence(
      [
        "build:css",
        "build:icons"
      ],
      callback
    );
  }
});

// Clean the dist directory
gulp.task("clean", function() {
  return gulp.src(paths.dist, { read: false })
    .pipe(plugins.clean({ force: true }));
});

// Serve the app via `browser-sync` and watch for changes and reload
gulp.task("serve", ["build"], function() {
  browserSync.init(config.browserSync);
  gulp.watch(paths.src + "/scss/**/*.scss", ["build:css"]);
  gulp.watch(paths.src + "/js/**/*.js", browserSync.reload);
  gulp.watch(paths.src + "/icons/**/*.svg", ["build:icons"]);
  gulp.watch(paths.src + "/*.html", browserSync.reload);
});

// Default to `serve`
gulp.task("default", ["serve"]);