var config = module.exports;

config["Browser tests"] = {
  env: "browser",
  rootPath: "./",
  libs: [
    "components/underscore/underscore-min.js",
    "components/backbone/backbone-min.js"
  ],
  sources: [
    "src/*.js"
  ],
  tests: [
    "test/*-test.js"
  ]
};
