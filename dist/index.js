/**
 * Copyright 2014 Shape Security, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

"use strict";

var _Parser = require("./parser");

var _JsError = require("./tokenizer");

var _EarlyErrorChecker = require("./early-errors");

function markLocation(node, location) {
  node.loc = {
    start: location,
    end: {
      line: this.lastLine + 1,
      column: this.lastIndex - this.lastLineStart,
      offset: this.lastIndex },
    source: null
  };
  return node;
}

function generateInterface(parsingFunctionName) {
  return function parse(code) {
    var _ref = arguments[1] === undefined ? {} : arguments[1];

    var _ref$loc = _ref.loc;
    var loc = _ref$loc === undefined ? false : _ref$loc;
    var _ref$earlyErrors = _ref.earlyErrors;
    var earlyErrors = _ref$earlyErrors === undefined ? true : _ref$earlyErrors;

    var parser = new _Parser.Parser(code);
    if (loc || earlyErrors) {
      parser.markLocation = markLocation;
    }
    var ast = parser[parsingFunctionName]();
    if (earlyErrors) {
      var errors = _EarlyErrorChecker.EarlyErrorChecker.check(ast);
      // for now, just throw the first error; we will handle multiple errors later
      if (errors.length > 0) {
        var _errors$0 = errors[0];
        var node = _errors$0.node;
        var message = _errors$0.message;

        throw new _JsError.JsError(node.loc.start.offset, node.loc.start.line, node.loc.start.column, message);
      }
    }
    return ast;
  };
}

var parseModule = generateInterface("parseModule");
exports.parseModule = parseModule;
var parseScript = generateInterface("parseScript");
exports.parseScript = parseScript;
exports["default"] = parseScript;