fs = require "fs"
q = require "q"

expect = require("chai").expect
vnu = require "../../src/validatornu"

describe "Invalid case tests", ->
  describe "Raw data test", ->
    it "The error should be returned as an object", ->
      q.nfcall(fs.readFile, "./tests/data/invalid.html").then(
        (result) -> vnu.validate(result)
      ).then(
        (result) ->
          expect(result).eql [
            "extract": "body>\n    <article>\n     "
            "firstColumn": 5
            "hiliteLength": 9
            "hiliteStart": 10
            "lastLine": 8
            "lastColumn": 13
            "type": "info"
            "subType": "warning"
            "message": [
              "Article lacks heading. Consider using “h2”-“h6” elements"
              "to add identifying headings to all articles."
            ].join " "
          ]
      ).catch((err) -> throw err)

  describe "Single File", ->
    it "The error should be returned as an object", ->
      vnu.validateFiles(
        "./tests/data/invalid.html"
      ).then((result) ->
        expect(result[0].url).to.match /tests\/data\/invalid\.html$/
        delete result[0].url
        expect(result).eql [
          "extract": "body>\n    <article>\n     "
          "firstColumn": 5
          "hiliteLength": 9
          "hiliteStart": 10
          "lastLine": 8
          "lastColumn": 13
          "type": "info"
          "subType": "warning"
          "message": [
            "Article lacks heading. Consider using “h2”-“h6” elements"
            "to add identifying headings to all articles."
          ].join " "
        ]
      ).catch((err) -> throw err)

  describe "Multiple Files", ->
    it "The error should be returned as an object", ->
      cb = (result) ->
        expect(result[0].url).to.match /tests\/data\/invalid\.html$/
        expect(result[1].url).to.match /tests\/data\/invalid2\.html$/
        delete result[0].url
        delete result[1].url
        expect(result).eql [
          (
            "extract": "body>\n    <article>\n     "
            "firstColumn": 5
            "hiliteLength": 9
            "hiliteStart": 10
            "lastLine": 8
            "lastColumn": 13
            "type": "info"
            "subType": "warning"
            "message": [
              "Article lacks heading. Consider using “h2”-“h6” elements"
              "to add identifying headings to all articles."
            ].join " "
          )
          (
            "extract": "id HTML :(</p>\n</bod"
            "firstColumn": 53
            "hiliteLength": 4
            "hiliteStart": 10
            "lastLine": 8
            "lastColumn": 56
            "type": "error"
            "message": "No “p” element in scope but a “p” end tag seen."
          )
        ]
      vnu.validateFiles([
        "./tests/data/invalid.html"
        "./tests/data/invalid2.html"
      ]).then(cb).catch(
        (err) -> throw err
      )

describe "Print Java error message", ->
  describe "When `validate()` is called", ->
    it "The message should be printed", ->
      vnu.validate("<html/>", ("ss": "64"))
        .catch (err) ->
          expect(err).to.be.an.instanceof(SyntaxError)
          expect(err.message).to.match(
            /^Unexpected token [\s\S]+Invalid thread stack size: -Xss64/
          )

  describe "When `validateFiles()` is called", ->
    it "The message should be printed", ->
      vnu.validateFiles(["./tests/data/invalid.html"], ("ss": "32"))
        .catch (err) ->
          expect(err).to.be.an.instanceof(SyntaxError)
          expect(err.message).to.match(
            /^Unexpected token [\s\S]+Invalid thread stack size: -Xss32/
          )
