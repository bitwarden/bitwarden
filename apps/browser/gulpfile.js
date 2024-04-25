const child = require("child_process");
const fs = require("fs");

const { rimraf } = require("rimraf");
const gulp = require("gulp");
const gulpif = require("gulp-if");
const jeditor = require("gulp-json-editor");
const replace = require("gulp-replace");

const manifest = require("./src/manifest.json");

const paths = {
  build: "./build/",
  dist: "./dist/",
  coverage: "./coverage/",
  node_modules: "./node_modules/",
  popupDir: "./src/popup/",
  cssDir: "./src/popup/css/",
  safari: "./src/safari/",
};

const filters = {
  fonts: [
    "!build/popup/fonts/*",
    "build/popup/fonts/Open_Sans*.woff",
    "build/popup/fonts/bwi-font.woff2",
    "build/popup/fonts/bwi-font.woff",
    "build/popup/fonts/bwi-font.ttf",
  ],
  safari: ["!build/safari/**/*"],
};

function buildString() {
  var build = "";
  if (process.env.MANIFEST_VERSION) {
    build = `-mv${process.env.MANIFEST_VERSION}`;
  }
  if (process.env.BETA_BUILD === "1") {
    build += "-beta";
  }
  if (process.env.BUILD_NUMBER && process.env.BUILD_NUMBER !== "") {
    build = `-${process.env.BUILD_NUMBER}`;
  }
  return build;
}

function distFileName(browserName, ext) {
  return `dist-${browserName}${buildString()}.${ext}`;
}

async function dist(browserName, manifest) {
  const { default: zip } = await import("gulp-zip");
  const { default: filter } = await import("gulp-filter");

  return gulp
    .src(paths.build + "**/*")
    .pipe(filter(["**"].concat(filters.fonts).concat(filters.safari)))
    .pipe(gulpif("popup/index.html", replace("__BROWSER__", "browser_" + browserName)))
    .pipe(gulpif("manifest.json", jeditor(manifest)))
    .pipe(zip(distFileName(browserName, "zip")))
    .pipe(gulp.dest(paths.dist));
}

function distFirefox() {
  return dist("firefox", (manifest) => {
    delete manifest.storage;
    delete manifest.sandbox;
    manifest.optional_permissions = manifest.optional_permissions.filter(
      (permission) => permission !== "privacy",
    );
    if (process.env.BETA_BUILD === "1") {
      manifest = applyBetaLabels(manifest);
    }
    return manifest;
  });
}

function distOpera() {
  return dist("opera", (manifest) => {
    delete manifest.applications;
    if (process.env.BETA_BUILD === "1") {
      manifest = applyBetaLabels(manifest);
    }
    return manifest;
  });
}

function distChrome() {
  return dist("chrome", (manifest) => {
    delete manifest.applications;
    delete manifest.sidebar_action;
    delete manifest.commands._execute_sidebar_action;
    if (process.env.BETA_BUILD === "1") {
      manifest = applyBetaLabels(manifest);
    }
    return manifest;
  });
}

function distEdge() {
  return dist("edge", (manifest) => {
    delete manifest.applications;
    delete manifest.sidebar_action;
    delete manifest.commands._execute_sidebar_action;
    if (process.env.BETA_BUILD === "1") {
      manifest = applyBetaLabels(manifest);
    }
    return manifest;
  });
}

function distSafariMas(cb) {
  return distSafariApp(cb, "mas");
}

function distSafariMasDev(cb) {
  return distSafariApp(cb, "masdev");
}

function distSafariDmg(cb) {
  return distSafariApp(cb, "dmg");
}

function distSafariApp(cb, subBuildPath) {
  const buildPath = paths.dist + "Safari/" + subBuildPath + "/";
  const builtAppexPath = buildPath + "build/Release/safari.appex";
  const builtAppexFrameworkPath = buildPath + "build/Release/safari.appex/Contents/Frameworks/";
  const entitlementsPath = paths.safari + "safari/safari.entitlements";
  var args = [
    "--verbose",
    "--force",
    "-o",
    "runtime",
    "--sign",
    "Developer ID Application: 8bit Solutions LLC",
    "--entitlements",
    entitlementsPath,
  ];
  if (subBuildPath !== "dmg") {
    args = [
      "--verbose",
      "--force",
      "--sign",
      subBuildPath === "mas"
        ? "3rd Party Mac Developer Application: Bitwarden Inc"
        : "E7C9978F6FBCE0553429185C405E61F5380BE8EB",
      "--entitlements",
      entitlementsPath,
    ];
  }

  return rimraf([buildPath + "**/*"], { glob: true })
    .then(() => safariCopyAssets(paths.safari + "**/*", buildPath))
    .then(() => safariCopyBuild(paths.build + "**/*", buildPath + "safari/app"))
    .then(() => {
      const proc = child.spawn("xcodebuild", [
        "-project",
        buildPath + "desktop.xcodeproj",
        "-alltargets",
        "-configuration",
        "Release",
      ]);
      stdOutProc(proc);
      return new Promise((resolve) => proc.on("close", resolve));
    })
    .then(async () => {
      const { default: filter } = await import("gulp-filter");

      const libs = fs
        .readdirSync(builtAppexFrameworkPath)
        .filter((p) => p.endsWith(".dylib"))
        .map((p) => builtAppexFrameworkPath + p);
      const libPromises = [];
      libs.forEach((i) => {
        const proc = child.spawn("codesign", args.concat([i]));
        stdOutProc(proc);
        libPromises.push(new Promise((resolve) => proc.on("close", resolve)));
      });
      return Promise.all(libPromises);
    })
    .then(() => {
      const proc = child.spawn("codesign", args.concat([builtAppexPath]));
      stdOutProc(proc);
      return new Promise((resolve) => proc.on("close", resolve));
    })
    .then(
      () => {
        return cb;
      },
      () => {
        return cb;
      },
    );
}

function safariCopyAssets(source, dest) {
  return new Promise((resolve, reject) => {
    gulp
      .src(source)
      .on("error", reject)
      .pipe(gulpif("safari/Info.plist", replace("0.0.1", manifest.version)))
      .pipe(
        gulpif("safari/Info.plist", replace("0.0.2", process.env.BUILD_NUMBER || manifest.version)),
      )
      .pipe(gulpif("desktop.xcodeproj/project.pbxproj", replace("../../../build", "../safari/app")))
      .pipe(gulp.dest(dest))
      .on("end", resolve);
  });
}

async function safariCopyBuild(source, dest) {
  const { default: filter } = await import("gulp-filter");

  return new Promise((resolve, reject) => {
    gulp
      .src(source)
      .on("error", reject)
      .pipe(filter(["**"].concat(filters.fonts)))
      .pipe(gulpif("popup/index.html", replace("__BROWSER__", "browser_safari")))
      .pipe(
        gulpif(
          "manifest.json",
          jeditor((manifest) => {
            delete manifest.sidebar_action;
            delete manifest.commands._execute_sidebar_action;
            delete manifest.optional_permissions;
            manifest.permissions.push("nativeMessaging");
            if (process.env.BETA_BUILD === "1") {
              manifest = applyBetaLabels(manifest);
            }
            return manifest;
          }),
        ),
      )
      .pipe(gulp.dest(dest))
      .on("end", resolve);
  });
}

function stdOutProc(proc) {
  proc.stdout.on("data", (data) => console.log(data.toString()));
  proc.stderr.on("data", (data) => console.error(data.toString()));
}

async function ciCoverage(cb) {
  const { default: zip } = await import("gulp-zip");
  const { default: filter } = await import("gulp-filter");

  return gulp
    .src(paths.coverage + "**/*")
    .pipe(filter(["**", "!coverage/coverage*.zip"]))
    .pipe(zip(`coverage${buildString()}.zip`))
    .pipe(gulp.dest(paths.coverage));
}

function applyBetaLabels(manifest) {
  manifest.name = "Bitwarden Password Manager BETA";
  manifest.short_name = "Bitwarden BETA";
  manifest.description = "THIS EXTENSION IS FOR BETA TESTING BITWARDEN.";
  if (process.env.GITHUB_RUN_ID) {
    manifest.version_name = `${manifest.version} beta - ${process.env.GITHUB_SHA.slice(8)}`;
    manifest.version = `${manifest.version}.9${parseInt(process.env.process.env.GITHUB_RUN_ID.slice(-4))}`;
  } else {
    manifest.version = `${manifest.version}.0`;
  }
  return manifest;
}

exports["dist:firefox"] = distFirefox;
exports["dist:chrome"] = distChrome;
exports["dist:opera"] = distOpera;
exports["dist:edge"] = distEdge;
exports["dist:safari"] = gulp.parallel(distSafariMas, distSafariMasDev, distSafariDmg);
exports["dist:safari:mas"] = distSafariMas;
exports["dist:safari:masdev"] = distSafariMasDev;
exports["dist:safari:dmg"] = distSafariDmg;
exports.dist = gulp.parallel(distFirefox, distChrome, distOpera, distEdge);
exports["ci:coverage"] = ciCoverage;
exports.ci = ciCoverage;
