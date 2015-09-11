(function() {
  var helper;

  helper = require("./helper");

  module.exports = function(files, vnuPath) {
    var args, defer, e, error, path, spawn, validator;
    if (vnuPath == null) {
      vnuPath = helper.vnuJar;
    }
    spawn = require("child_process").spawn;
    path = require("path");
    args = ["-jar", vnuPath, "--format", "json"].concat(files);
    defer = require("q").defer();
    try {
      validator = spawn(helper.javaBin(), args);
      return validator.stderr.on("data", function(data) {
        var e, error;
        try {
          return defer.resolve(JSON.parse(data).messages);
        } catch (error) {
          e = error;
          return defer.reject(e);
        }
      });
    } catch (error) {
      e = error;
      return defer.reject(e);
    } finally {
      return defer.promise;
    }
  };

}).call(this);
