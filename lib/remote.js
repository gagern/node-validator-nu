(function() {
  var Vnu, freeport, fs, helper, http, path, q, spawn,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  spawn = require("child_process").spawn;

  path = require("path");

  q = require("q");

  http = require("http");

  fs = require("fs");

  freeport = require("freeport");

  helper = require("./helper");

  Vnu = (function() {
    function Vnu(vnuPath, verbose) {
      this.vnuPath = vnuPath != null ? vnuPath : helper.vnuJar;
      this.verbose = verbose;
      this["validate"] = bind(this["validate"], this);
      this["close"] = bind(this["close"], this);
      this["open"] = bind(this["open"], this);
      this.server = null;
    }

    Vnu.prototype["open"] = function() {
      return q.nfcall(freeport).then((function(_this) {
        return function(port) {
          var defer, e, error, server, stderrData;
          _this.port = port;
          defer = q.defer();
          stderrData = [];
          try {
            server = _this.server = spawn(helper.javaBin(), ["-cp", _this.vnuPath, "nu.validator.servlet.Main", port.toString(10)]);
            _this.server.on("exit", function(code, signal) {
              if (stderrData) {
                stderrData.forEach(process.stderr.write.bind(process.stderr));
              }
              if (code === null) {
                return defer.reject(new Error("The server exited on signal " + signal));
              } else if (code !== 0) {
                return defer.reject(new Error("The server exited with code " + code));
              }
            });
            _this.server.on("error", function(err) {
              return defer.reject(err);
            });
            _this.server.stderr.on("data", function(data) {
              var dataStr;
              dataStr = data.toString();
              if (dataStr.match(/INFO:oejs\.Server:main: Started @/)) {
                stderrData = null;
                return defer.resolve(server.pid);
              } else if (stderrData !== null) {
                return stderrData.push(data);
              }
            });
            return _this.server.stderr.on("end", function() {
              if (this.verbose) {
                return console.log("The server is opened on port " + this.port);
              }
            });
          } catch (error) {
            e = error;
            return defer.reject(e);
          } finally {
            return defer.promise;
          }
        };
      })(this));
    };

    Vnu.prototype["close"] = function() {
      var defer, e, error, signal;
      defer = q.defer();
      signal = "SIGHUP";
      this.server.on("error", function(err) {
        if (signal === "SIGHUP") {
          signal = "SIGINT";
        } else if (signal === "SIGINT") {
          signal = "SIGTERM";
        } else if (signal === "SIGTERM") {
          signal = "SIGKILL";
        } else {
          defer.reject(new Error(err));
          return;
        }
        return this.server.kill(signal);
      });
      this.server.on("close", function(code, signal) {
        return defer.resolve(code, signal);
      });
      try {
        return this.server.kill(signal);
      } catch (error) {
        e = error;
        return defer.reject(e);
      } finally {
        return defer.promise;
      }
    };

    Vnu.prototype["validate"] = function(input) {
      var data, defer, e, error, post_option, req;
      defer = q.defer();
      data = [];
      post_option = {
        "host": "127.0.0.1",
        "port": this.port,
        "path": "/?out=json",
        "method": "POST",
        "headers": {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Length": input.length
        }
      };
      try {
        req = http.request(post_option, function(res) {
          if (res.statusCode > 299 || res.statusCode < 200) {
            defer.reject(new Error("Server side error! code: " + res.statusCode));
            return;
          }
          res.setEncoding("utf8");
          res.on("data", function(chunk) {
            return data.push(chunk.toString());
          });
          return res.on("end", function() {
            var e, error;
            try {
              data = JSON.parse(data.join("")).messages;
              return defer.resolve(data);
            } catch (error) {
              e = error;
              return defer.reject(e);
            }
          });
        });
        req.on("error", defer.reject);
        req.write(input);
        return req.end();
      } catch (error) {
        e = error;
        return defer.reject(e);
      } finally {
        return defer.promise;
      }
    };

    Vnu.prototype["validateFiles"] = function(files) {
      var defer, e, error, file, filesToPass, i, len, numResults, result, results;
      filesToPass = [].concat(files);
      numResults = 0;
      result = {};
      defer = q.defer();
      try {
        results = [];
        for (i = 0, len = filesToPass.length; i < len; i++) {
          file = filesToPass[i];
          results.push((function(_this) {
            return function(file) {
              return q.nfcall(fs.readFile, file).then(function(input) {
                return _this.validate(input);
              }).then(function(validationResult) {
                result[file] = validationResult;
                numResults++;
                if (numResults === filesToPass.length) {
                  return defer.resolve(result);
                }
              })["catch"](defer.reject);
            };
          })(this)(file));
        }
        return results;
      } catch (error) {
        e = error;
        return defer.reject(e);
      } finally {
        return defer.promise;
      }
    };

    return Vnu;

  })();

  exports.Vnu = Vnu;

}).call(this);
