(function() {
  var helper;

  helper = require("./helper");

  module.exports = function(input, vnuPath) {
    var defer, e, error, path, result, spawn, validator;
    if (vnuPath == null) {
      vnuPath = helper.vnuJar;
    }
    spawn = require("child_process").spawn;
    path = require("path");
    defer = require("q").defer();
    result = [];
    try {
      validator = spawn(helper.javaBin(), ["-jar", vnuPath, "--format", "json", "-"]);
      validator.stderr.on("data", function(data) {
        return result.push(data);
      });
      validator.stderr.on("end", function() {
        return defer.resolve(JSON.parse(result.join("")).messages);
      });
      validator.stdin.write(input);
      return validator.stdin.end();
    } catch (error) {
      e = error;
      return defer.reject(e);
    } finally {
      return defer.promise;
    }
  };

}).call(this);
