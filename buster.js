var config = module.exports;

config["Browser tests"] = {
  env: "browser",
  rootPath: "./",
  libs: [
    "lib/underscore-min.js",
    "lib/backbone-min.js",
  ],
  sources: [
    "src/*.js"
  ],
  tests: [
    "test/*-test.js"
  ]
};
