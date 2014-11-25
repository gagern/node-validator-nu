/*global exports, require*/
/*jslint unparam: true*/
(function (exports, requrie) {
    "use strict";
    exports.validate = function (input, callback, validatorNuBinPath) {
        var validatorPath = validatorNuBinPath || "/usr/bin/validatornu",
            spawn = require("child_process").spawn,
            validator = spawn(validatorPath, ["--format", "json", "-"]);
        validator.stderr.on("data", function (data) {
            callback(JSON.parse(data).messages);
        });
        validator.stdin.write(input);
        validator.stdin.end();
    };
}(exports, require));