(function() {
  var path;

  path = require("path");

  module.exports = {
    vnuJar: path.normalize(path.join(__dirname, "..", "vnu", "vnu.jar")),
    javaBin: function() {
      if (process.env.JAVA_HOME) {
        return path.join(process.env.JAVA_HOME, "bin", "java");
      } else {
        return "java";
      }
    }
  };

}).call(this);
