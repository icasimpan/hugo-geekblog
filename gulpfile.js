const gulp = require("gulp");
const rename = require("gulp-rename");
const sass = require("gulp-sass");
const cleanCSS = require("gulp-clean-css");
const autoprefixer = require("gulp-autoprefixer");
const iconfont = require("gulp-iconfont");

const realFavicon = require("gulp-real-favicon");
const path = require("path");
const fs = require("fs");

const svgSprite = require("gulp-svg-sprite");

var CSSDEST = "static/";
var FAVICON_DATA_FILE = "tmp/faviconData.json";
var TIMESTAMP = Math.round(Date.now() / 1000);

gulp.task("sass", function () {
  return gulp
    .src("src/sass/main.scss")
    .pipe(sass({ errLogToConsole: true }))
    .pipe(cleanCSS({ format: "beautify" }))
    .pipe(
      autoprefixer({
        cascade: false,
      })
    )
    .pipe(gulp.dest(CSSDEST))
    .pipe(cleanCSS())
    .pipe(rename({ extname: ".min.css" }))
    .pipe(gulp.dest(CSSDEST));
});

gulp.task("favicon-generate", function (done) {
  realFavicon.generateFavicon(
    {
      masterPicture: "src/favicon/favicon-master.svg",
      dest: "static/favicon",
      iconsPath: "/favicon",
      design: {
        ios: {
          pictureAspect: "backgroundAndMargin",
          backgroundColor: "#2f333e",
          margin: "14%",
          assets: {
            ios6AndPriorIcons: false,
            ios7AndLaterIcons: false,
            precomposedIcons: false,
            declareOnlyDefaultIcon: true,
          },
        },
        desktopBrowser: {},
        windows: {
          pictureAspect: "whiteSilhouette",
          backgroundColor: "#2f333e",
          onConflict: "override",
          assets: {
            windows80Ie10Tile: false,
            windows10Ie11EdgeTiles: {
              small: false,
              medium: true,
              big: false,
              rectangle: false,
            },
          },
        },
        androidChrome: {
          pictureAspect: "shadow",
          themeColor: "#2f333e",
          manifest: {
            display: "standalone",
            orientation: "notSet",
            onConflict: "override",
            declared: true,
          },
          assets: {
            legacyIcon: false,
            lowResolutionIcons: false,
          },
        },
        safariPinnedTab: {
          pictureAspect: "silhouette",
          themeColor: "#2f333e",
        },
      },
      settings: {
        scalingAlgorithm: "Mitchell",
        errorOnImageTooSmall: false,
        readmeFile: false,
        htmlCodeFile: false,
        usePathAsIs: false,
      },
      markupFile: FAVICON_DATA_FILE,
    },
    function () {
      done();
    }
  );
});

gulp.task("favicon-check-update", function (done) {
  var currentVersion = JSON.parse(fs.readFileSync(FAVICON_DATA_FILE)).version;
  realFavicon.checkForUpdates(currentVersion, function (err) {
    if (err) {
      throw err;
    }
  });
  done();
});

gulp.task("svg-sprite", function () {
  config = {
    shape: {
      dimension: {
        maxWidth: 24,
        maxHeight: 24,
        attributes: false,
      },
      spacing: {
        padding: 5,
        box: "content",
      },
      dest: "tmp/intermediate-svg",
    },
    svg: {
      xmlDeclaration: false,
      rootAttributes: {
        style: "position: absolute; width: 0; height: 0; overflow: hidden;",
      },
    },
    mode: {
      inline: true,
      symbol: {
        dest: "layouts/partials/",
        sprite: "svg-icon-symbols.html",
        bust: false,
      },
    },
  };

  return gulp
    .src("src/icons/*.svg")
    .pipe(svgSprite(config))
    .pipe(gulp.dest("."));
});

gulp.task("iconfont", function () {
  var lastUnicode = 0xea01;
  var files = fs.readdirSync("src/iconfont");

  // Filter files with containing unicode value
  // and set last unicode
  files.forEach(function (file) {
    var basename = path.basename(file);
    var matches = basename.match(/^(?:((?:u[0-9a-f]{4,6},?)+)\-)?(.+)\.svg$/i);
    var currentCode = -1;

    if (matches && matches[1]) {
      currentCode = parseInt(matches[1].split("u")[1], 16);
    }

    if (currentCode >= lastUnicode) {
      lastUnicode = ++currentCode;
    }
  });

  return gulp
    .src(["src/iconfont/*.svg"])
    .pipe(
      iconfont({
        startUnicode: lastUnicode,
        fontName: "GeekblogIcons", // required
        prependUnicode: true, // recommended option
        normalize: true,
        fontHeight: 1001,
        centerHorizontally: true,
        formats: ["woff", "woff2"], // default, 'woff2' and 'svg' are available
        timestamp: TIMESTAMP, // recommended to get consistent builds when watching files
      })
    )
    .pipe(gulp.dest("static/fonts/"));
});

gulp.task(
  "default",
  gulp.series("sass", "svg-sprite", "iconfont", "favicon-generate")
);

gulp.task("devel", function () {
  gulp.watch("src/sass/**/*.*css", gulp.series("sass"));
});
