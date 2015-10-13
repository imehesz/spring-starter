var gulp = require('gulp');
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');
var minifyCss = require('gulp-minify-css');
var rename = require('gulp-rename');
var inject = require('gulp-inject');

var webAppPath = "src/main/webapp/";
var jsPath = webAppPath + "js/";
var cssPath = webAppPath + "css/";
var jsAll = jsPath + "*.js";
var cssAll = cssPath + "*.css";
var assets = webAppPath + "assets/";

var cssConcatReady = false;
var jsConcatReady = false;
var assetsConcatReady = function() {
  return cssConcatReady && jsConcatReady;
};

var jsMinificationReady = false;
var cssMinificationReady = false;
var assetsMinificationReady = function() {
  return jsMinificationReady && cssMinificationReady;
};

gulp.task("concatJs", function(){
  gulp.src([jsAll])
    .pipe(concat("all.js"))
    .pipe(gulp.dest(assets))
    .on("end", function(){
      jsConcatReady = true;
    });
});
gulp.task("concatCss", function(){
  gulp.src([cssAll])
    .pipe(concat("all.css"))
    .pipe(gulp.dest(assets))
    .on("end", function(){
      cssConcatReady = true;
    });
});
gulp.task("concatAssets", ["concatJs", "concatCss"]);

gulp.task("compressJs", function() {
  var miniMe = function() {
    if (assetsConcatReady() && !assetsMinificationReady()) {
      gulp.src([assets + "all.js"])
        .pipe(uglify())
        .pipe(rename( "all.min.js" ))
        .pipe(gulp.dest(assets))
        .on("end", function(){
          jsMinificationReady = true;
          clearInterval(tickId);
        });
    }
  }

  var tickId = setInterval(miniMe, 100);
});

gulp.task("compressCss", function() {
  var miniMe = function() {
    if (assetsConcatReady() && !assetsMinificationReady()) {
    gulp.src([assets + "all.css"])
      .pipe(minifyCss())
      .pipe(rename( "all.min.css" ))
      .pipe(gulp.dest(assets))
      .on("end", function(){
        cssMinificationReady = true;
        clearInterval(tickId);
      });
    }
  }

  var tickId = setInterval(miniMe, 100);
});

gulp.task("compressAssets", ["compressCss", "compressJs"]);

gulp.task("copyAll", function(){
  gulp.src([jsAll, cssAll])
    .pipe(gulp.dest(webAppPath + "assets"));
});

gulp.task("injectDev", function(){
  var target = gulp.src("src/main/resources/templates/layout.html");
  var sources = gulp.src([jsAll, cssAll], {read: false});

  return target.pipe(inject(sources, {
        ignorePath: webAppPath
      }))
    .pipe(gulp.dest("src/main/resources/templates/"));
});

gulp.task("injectProd", function(){
  var miniMe = function() {
    if (assetsConcatReady() && assetsMinificationReady()) {
      var target = gulp.src("./src/main/resources/templates/layout.html");
      var sources = gulp.src([assets + "all.min.js", assets + "all.min.css"], {read: false});

      target.pipe(inject(sources, {
            ignorePath: webAppPath
          }))
        .pipe(gulp.dest("./src/main/resources/templates/"))
        .on("end", function(){
          clearInterval(tickId);
        });
    }
  }

  var tickId = setInterval(miniMe, 100);
});

gulp.task('default', ["injectDev"]);
gulp.task("deploy", ["concatAssets", "compressAssets", "injectProd"]);
