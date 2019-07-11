"use strict";

var gulp = require("gulp");
var plumber = require("gulp-plumber");
var sourcemap = require("gulp-sourcemaps");
var less = require("gulp-less");
var postcss = require("gulp-postcss");
var autoprefixer = require("autoprefixer");
var server = require("browser-sync").create();
var del = require('del');
var run = require("run-sequence");
var csso = require('gulp-csso');
var rename = require("gulp-rename");
var imagemin = require('gulp-imagemin');
var webp = require('gulp-webp');
var svgstore = require('gulp-svgstore');
var htmlmin = require('gulp-htmlmin');
var uglify = require('gulp-uglify');
var pipeline = require('readable-stream').pipeline;

gulp.task("css", function () {
  return gulp.src("source/less/style.less")
    .pipe(plumber())
    .pipe(sourcemap.init())
    .pipe(less())
    .pipe(postcss([
      autoprefixer()
    ]))
    .pipe(csso())
    .pipe(rename("style.min.css"))
    .pipe(sourcemap.write("."))
    .pipe(gulp.dest("build/css"))
    .pipe(server.stream());
});


gulp.task("server", function () {
  server.init({
	server: "build/",
	notify: false,
	open: true,
	cors: true,
	ui: false
  })
});

gulp.task("refresh", function (done) {
  server.reload();
  done();
});

gulp.task("copy", function () {
  return gulp.src([
    "source/fonts/**/*.{woff,woff2}",
    "source/img/**/*.{png,jpg,svg}"
  ], {
    base: "source"
  })
    .pipe(gulp.dest("build"));
});

gulp.task("copy-images", function () {
  return gulp.src("source/img/**/*.{png,jpg,svg}"
  , {
    base: "source"
  })
    .pipe(gulp.dest("build"));
});

gulp.task("clean", function () {
  return del("build");
});

gulp.task("sprite", function () {
  return gulp.src("./build/img/inline-icons/*.svg")
    .pipe(svgstore({ inlineSvg: true }))/* Делает спрайт из SVG-файлов */
	.pipe(imagemin([imagemin.svgo()]))
    .pipe(rename("sprite.svg"))
    .pipe(gulp.dest("build/img"));
});

gulp.task("optim", function () {
  return gulp.src(["build/img/**/*.{png,jpg,svg}", "!build/img/**/logo-*.svg"])
    .pipe(imagemin([
      imagemin.jpegtran({progressive: true}),
      imagemin.optipng({optimizationLevel: 3}),
      imagemin.svgo()
    ]))
    .pipe(gulp.dest("build/img"));
});

gulp.task("webp", function () {
  return gulp.src("build/img/**/*.{png,jpg}")
    .pipe(webp({quality: 90}))
    .pipe(gulp.dest("build/img"));
});

gulp.task("html", function () {
  return gulp.src("source/*.html")
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(gulp.dest("build"));
});

gulp.task("js", function () {
  return pipeline(
    gulp.src("source/js/*.js"),
	plumber(),
    uglify(),
	rename({suffix: ".min"}),
    gulp.dest("build/js"),
	server.stream()
  );
});

gulp.task("clean-images", function() {
  return del("./build/img/**/*.{png,jpg,svg,webp}");
});


gulp.task("build", gulp.series("clean", "copy", "css", "html", "js", "optim", "webp", "sprite"));
gulp.task("start", gulp.series("build", "server"));
gulp.task("images-watch", gulp.series("clean-images", "optim", "webp", "sprite", "copy-images", "refresh"));

gulp.watch("source/less/**/*.less", gulp.series("css"));
gulp.watch("source/*.html", gulp.series("html", "refresh"));
gulp.watch("./build/img/inline-icons/*.svg", gulp.series("sprite", "refresh"));
gulp.watch( "source/js/**", gulp.series("js"));
gulp.watch("source/img/**/*.{png,jpg,svg,webp}", gulp.series("images-watch"));


