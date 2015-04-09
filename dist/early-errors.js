// istanbul ignore next
"use strict";

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

// istanbul ignore next

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

// istanbul ignore next

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

// istanbul ignore next

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (descriptor.value) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

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

var _reduce$MonoidalReducer = require("shift-reducer");

var _isRestrictedWord$isStrictModeReservedWord = require("./utils");

var _EarlyErrorState$EarlyError = require("./early-error-state");

function isStrictFunctionBody(_ref) {
  var directives = _ref.directives;

  return directives.some(function (directive) {
    return directive.rawValue === "use strict";
  });
}

function containsDuplicates(list) {
  var uniqs = [];
  for (var i = 0, l = list.length; i < l; ++i) {
    var item = list[i];
    if (uniqs.indexOf(item) >= 0) {
      return true;
    }
    uniqs.push(item);
  }
  return false;
}

var PatternAcceptor = (function () {
  function PatternAcceptor(pattern) {
    var u = arguments[1] === undefined ? false : arguments[1];

    _classCallCheck(this, PatternAcceptor);

    this.index = 0;
    // constants
    this.length = pattern.length;
    this.pattern = pattern;
    this.u = u;
  }

  _createClass(PatternAcceptor, [{
    key: "eat",
    value: function eat(ch) {
      if (this.index >= this.length || this.pattern[this.index] !== ch) {
        return false;
      }++this.index;
      return true;
    }
  }, {
    key: "eatRegExp",
    value: function eatRegExp(r) {
      if (this.index >= this.length || !r.test(this.pattern[this.index])) {
        return false;
      }++this.index;
      return true;
    }
  }, {
    key: "match",
    value: function match(ch) {
      return this.index < this.length && this.pattern[this.index] === ch;
    }
  }, {
    key: "readDisjunction",
    value: function readDisjunction() {
      return this.readAlternative() && (this.eat("|") ? this.readDisjunction() : true);
    }
  }, {
    key: "readAlternative",
    value: function readAlternative() {
      var savedIndex = this.index;
      while (this.readTerm()) {
        savedIndex = this.index;
      }
      this.index = savedIndex;
      return true;
    }
  }, {
    key: "readTerm",
    value: function readTerm() {
      return this.readAssertion() || this.readAtom() && (this.readQuantifier(), true);
    }
  }, {
    key: "readAssertion",
    value: function readAssertion() {
      var start = this.index;
      if (this.eat("^") || this.eat("$")) {
        return true;
      }if (this.eat("\\")) {
        var b = this.eat("b") || this.eat("B");
        if (!b) this.index = start;
        return b;
      }
      if (this.index + 3 <= this.length && /^\(\?[=!]$/.test(this.pattern.slice(this.index, this.index + 3))) {
        this.index += 3;
        return this.readDisjunction() && this.eat(")");
      }
      return false;
    }
  }, {
    key: "readQuantifier",
    value: function readQuantifier() {
      return this.readQuantifierPrefix() && (this.eat("?"), true);
    }
  }, {
    key: "readQuantifierPrefix",
    value: function readQuantifierPrefix() {
      if (this.eat("*") || this.eat("+") || this.eat("?")) {
        return true;
      }if (this.eat("{") && this.readDecimalDigits()) {
        if (this.eat(",")) this.readDecimalDigits();
        return this.eat("}");
      }
      return false;
    }
  }, {
    key: "readDecimalDigits",
    value: function readDecimalDigits() {
      var start = this.index;
      while (this.eatRegExp(/^\d$/));
      return this.index > start;
    }
  }, {
    key: "readAtom",
    value: function readAtom() {
      if (this.readPatternCharacter() || this.eat(".")) {
        return true;
      }if (this.eat("\\")) {
        return this.readAtomEscape();
      }if (this.readCharacterClass()) {
        return true;
      }if (this.eat("(")) {
        if (this.eat("?") && !this.eat(":")) {
          return false;
        }return this.readDisjunction() && this.eat(")");
      }
      return false;
    }
  }, {
    key: "readSyntaxCharacter",
    value: function readSyntaxCharacter() {
      return this.eatRegExp(/^[\^$\\.*+?()[\]{}|]$/);
    }
  }, {
    key: "readPatternCharacter",
    value: function readPatternCharacter() {
      return this.eatRegExp(/^[^\^$\\.*+?()[\]{}|]$/);
    }
  }, {
    key: "readAtomEscape",
    value: function readAtomEscape() {
      return this.readDecimalEscape() || this.readCharacterEscape() || this.readCharacterClassEscape();
    }
  }, {
    key: "readCharacterEscape",
    value: function readCharacterEscape() {
      return this.readControlEscape() || this.eat("c") && this.readControlLetter() || this.readHexEscapeSequence() || this.readRegExpUnicodeEscapeSequence() || this.readIdentityEscape();
    }
  }, {
    key: "readControlEscape",
    value: function readControlEscape() {
      return this.eatRegExp(/^[fnrtv]$/);
    }
  }, {
    key: "readControlLetter",
    value: function readControlLetter() {
      return this.eatRegExp(/^[a-zA-Z]$/);
    }
  }, {
    key: "readHexEscapeSequence",
    value: function readHexEscapeSequence() {
      return this.eat("x") && this.readHexDigit() && this.readHexDigit();
    }
  }, {
    key: "readHexDigit",
    value: function readHexDigit() {
      return this.eatRegExp(/^[a-fA-F0-9]$/);
    }
  }, {
    key: "readRegExpUnicodeEscapeSequence",
    value: function readRegExpUnicodeEscapeSequence() {
      if (!this.eat("u")) {
        return false;
      }if (this.u) {
        if (this.index + 4 <= this.length && /^D[abAB89][a-fA-F0-9]{2}$/.test(this.pattern.slice(this.index, this.index + 4))) {
          this.index += 4;
          if (this.index + 6 <= this.length && /^\\u[dD][c-fC-F0-9][a-fA-F0-9]{2}$/.test(this.pattern.slice(this.index, this.index + 6))) {
            this.index += 6;
          }
          return true;
        }
        return this.readHex4Digits() || this.eat("{") && this.readHexDigits() && this.eat("}");
      } else {
        return this.readHex4Digits();
      }
    }
  }, {
    key: "readHex4Digits",
    value: function readHex4Digits() {
      var k = 4;
      while (k > 0) {
        --k;
        if (!this.readHexDigit()) {
          return false;
        }
      }
      return true;
    }
  }, {
    key: "readHexDigits",
    value: function readHexDigits() {
      var start = this.index;
      while (this.readHexDigit());
      return this.index > start;
    }
  }, {
    key: "readIdentityEscape",
    value: function readIdentityEscape() {
      if (this.u) {
        return this.readSyntaxCharacter() || this.eat("/");
      } else {
        return this.eatRegExp(/^[^a-zA-Z0-9_]$/); // TODO: SourceCharacter but not UnicodeIDContinue
      }
    }
  }, {
    key: "readDecimalEscape",
    value: function readDecimalEscape() {
      if (this.eat("0")) {
        return this.index <= this.length && !/^\d$/.test(this.pattern[this.index]);
      }var start = this.index;
      while (this.eatRegExp(/^\d$/));
      return this.index > start;
    }
  }, {
    key: "readCharacterClassEscape",
    value: function readCharacterClassEscape() {
      return this.eatRegExp(/^[dDsSwW]$/);
    }
  }, {
    key: "readCharacterClass",
    value: function readCharacterClass() {
      return this.eat("[") && (this.eat("^"), true) && this.readClassRanges() && this.eat("]");
    }
  }, {
    key: "readClassRanges",
    value: function readClassRanges() {
      var start = this.index;
      if (!this.readNonemptyClassRanges()) {
        this.index = start;
      }
      return true;
    }
  }, {
    key: "readNonemptyClassRanges",
    value: function readNonemptyClassRanges() {
      if (this.readClassAtom()) {
        if (this.match("]")) {
          return true;
        }if (this.eat("-")) {
          if (this.match("]")) {
            return true;
          }return this.readClassAtom() && this.readClassRanges();
        }
        return this.readNonemptyClassRangesNoDash();
      }
      return false;
    }
  }, {
    key: "readNonemptyClassRangesNoDash",
    value: function readNonemptyClassRangesNoDash() {
      if (this.eat("-")) {
        return true;
      }if (this.readClassAtomNoDash()) {
        if (this.match("]")) {
          return true;
        }if (this.eat("-")) {
          if (this.match("]")) {
            return true;
          }return this.readClassAtom() && this.readClassRanges();
        }
        return this.readNonemptyClassRangesNoDash();
      }
      return false;
    }
  }, {
    key: "readClassAtom",
    value: function readClassAtom() {
      return this.eat("-") || this.readClassAtomNoDash();
    }
  }, {
    key: "readClassAtomNoDash",
    value: function readClassAtomNoDash() {
      return this.eatRegExp(/^[^\\\]-]$/) || this.eat("\\") && this.readClassEscape();
    }
  }, {
    key: "readClassEscape",
    value: function readClassEscape() {
      return this.readDecimalEscape() || this.eat("b") || this.u && this.eat("-") || this.readCharacterEscape() || this.readCharacterClassEscape();
    }
  }], [{
    key: "test",
    value: function test(pattern) {
      var u = arguments[1] === undefined ? false : arguments[1];

      var acceptor = new PatternAcceptor(pattern, u);
      return acceptor.readDisjunction() && acceptor.index === acceptor.length;
    }
  }]);

  return PatternAcceptor;
})();

var SUPER_CALL_ERROR = function SUPER_CALL_ERROR(node) {
  return new _EarlyErrorState$EarlyError.EarlyError(node, "Super calls must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
};

var EarlyErrorChecker = (function (_MonoidalReducer) {
  function EarlyErrorChecker() {
    _classCallCheck(this, EarlyErrorChecker);

    _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "constructor", this).call(this, _EarlyErrorState$EarlyError.EarlyErrorState);
  }

  _inherits(EarlyErrorChecker, _MonoidalReducer);

  _createClass(EarlyErrorChecker, [{
    key: "reduceArrowExpression",
    value: function reduceArrowExpression(node, _ref) {
      var params = _ref.params;
      var body = _ref.body;

      if (node.body.type === "FunctionBody" && isStrictFunctionBody(node.body)) {
        params = params.enforceStrictErrors();
        body = body.enforceStrictErrors();
      }
      return _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceArrowExpression", this).call(this, node, { params: params, body: body });
    }
  }, {
    key: "reduceCallExpression",
    value: function reduceCallExpression(node) {
      var s = _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceCallExpression", this).apply(this, arguments);
      if (node.callee.type === "Super") {
        s = s.observeSuperCallExpression(node);
      }
      return s;
    }
  }, {
    key: "reduceClassDeclaration",
    value: function reduceClassDeclaration(node, _ref) {
      var name = _ref.name;
      var _super = _ref["super"];
      var elements = _ref.elements;

      elements = elements.map(function (e) {
        return e.enforceStrictErrors();
      });
      if (_super != null) {
        elements = elements.map(function (e) {
          return e.clearSuperCallExpressionsInConstructorMethod();
        });
      }
      elements = elements.map(function (e) {
        return e.enforceSuperCallExpressions(SUPER_CALL_ERROR);
      });
      return _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceClassDeclaration", this).call(this, node, { name: name, "super": _super, elements: elements });
    }
  }, {
    key: "reduceClassExpression",
    value: function reduceClassExpression(node, _ref) {
      var name = _ref.name;
      var _super = _ref["super"];
      var elements = _ref.elements;

      elements = elements.map(function (e) {
        return e.enforceStrictErrors();
      });
      if (_super != null) {
        elements = elements.map(function (e) {
          return e.clearSuperCallExpressionsInConstructorMethod();
        });
      }
      elements = elements.map(function (e) {
        return e.enforceSuperCallExpressions(SUPER_CALL_ERROR);
      });
      return _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceClassExpression", this).call(this, node, { name: name, "super": _super, elements: elements });
    }
  }, {
    key: "reduceBindingIdentifier",
    value: function reduceBindingIdentifier(node) {
      var s = this.identity;
      var name = node.name;

      if (_isRestrictedWord$isStrictModeReservedWord.isRestrictedWord(name) || _isRestrictedWord$isStrictModeReservedWord.isStrictModeReservedWord(name)) {
        s = s.addStrictError(new _EarlyErrorState$EarlyError.EarlyError(node, "The identifier " + JSON.stringify(name) + " must not be in binding position in strict mode"));
      }
      s.bindName(name, node);
      return s;
    }
  }, {
    key: "reduceBindingPropertyIdentifier",
    value: function reduceBindingPropertyIdentifier(node) {
      var s = this.identity;
      var name = node.binding.name;

      if (_isRestrictedWord$isStrictModeReservedWord.isRestrictedWord(name) || _isRestrictedWord$isStrictModeReservedWord.isStrictModeReservedWord(name)) {
        s = s.addStrictError(new _EarlyErrorState$EarlyError.EarlyError(node, "The identifier " + JSON.stringify(name) + " must not be in binding position in strict mode"));
      }
      if (name === "yield") {
        s = s.observeYieldIdentifierExpression(node);
      }
      return s;
    }
  }, {
    key: "reduceBlock",
    value: function reduceBlock() {
      return _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceBlock", this).apply(this, arguments).observeLexicalBoundary();
    }
  }, {
    key: "reduceFunctionBody",
    value: function reduceFunctionBody(node) {
      var s = _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceFunctionBody", this).apply(this, arguments);
      if (isStrictFunctionBody(node)) {
        s = s.enforceStrictErrors();
      }
      return s;
    }
  }, {
    key: "reduceFunctionDeclaration",
    value: function reduceFunctionDeclaration(node, _ref) {
      var name = _ref.name;
      var params = _ref.params;
      var body = _ref.body;

      if (node.isGenerator) {
        if (params.boundNames.has("yield")) {
          params.boundNames.get("yield").forEach(function (yieldDecl) {
            return params = params.addError(new _EarlyErrorState$EarlyError.EarlyError(yieldDecl, "Generator functions must not have parameters named \"yield\""));
          });
        }
        body = body.enforceYieldIdentifierExpression(function (node) {
          return new _EarlyErrorState$EarlyError.EarlyError(node, "The identifier " + JSON.stringify(node.name) + " must not be in expression position in generator bodies");
        });
      }
      if (isStrictFunctionBody(node.body)) {
        params = params.enforceStrictErrors();
        body = body.enforceStrictErrors();
      }
      return _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceFunctionExpression", this).call(this, node, { name: name, params: params, body: body });
    }
  }, {
    key: "reduceFunctionExpression",
    value: function reduceFunctionExpression(node, _ref) {
      var name = _ref.name;
      var params = _ref.params;
      var body = _ref.body;

      if (node.isGenerator) {
        if (params.boundNames.has("yield")) {
          params.boundNames.get("yield").forEach(function (yieldDecl) {
            return params = params.addError(new _EarlyErrorState$EarlyError.EarlyError(yieldDecl, "Generator functions must not have parameters named \"yield\""));
          });
        }
        body = body.enforceYieldIdentifierExpression(function (node) {
          return new _EarlyErrorState$EarlyError.EarlyError(node, "The identifier " + JSON.stringify(node.name) + " must not be in expression position in generator bodies");
        });
      }
      if (isStrictFunctionBody(node.body)) {
        params = params.enforceStrictErrors();
        body = body.enforceStrictErrors();
      }
      return _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceFunctionExpression", this).call(this, node, { name: name, params: params, body: body });
    }
  }, {
    key: "reduceGetter",
    value: function reduceGetter(node, _ref) {
      var name = _ref.name;
      var body = _ref.body;

      body = body.enforceSuperCallExpressions(SUPER_CALL_ERROR);
      if (isStrictFunctionBody(node.body)) {
        body = body.enforceStrictErrors();
      }
      return _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceGetter", this).call(this, node, { name: name, body: body });
    }
  }, {
    key: "reduceIdentifierExpression",
    value: function reduceIdentifierExpression(node) {
      var s = this.identity;
      var name = node.name;

      if (_isRestrictedWord$isStrictModeReservedWord.isStrictModeReservedWord(name)) {
        s = s.addStrictError(new _EarlyErrorState$EarlyError.EarlyError(node, "The identifier " + JSON.stringify(name) + " must not be in expression position in strict mode"));
      }
      if (name === "yield") {
        s = s.observeYieldIdentifierExpression(node);
      }
      return s;
    }
  }, {
    key: "reduceLabeledStatement",
    value: function reduceLabeledStatement(node) {
      var s = _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceLabeledStatement", this).apply(this, arguments);
      var label = node.label;

      if (label === "yield") {
        s = s.addStrictError(new _EarlyErrorState$EarlyError.EarlyError(node, "The identifier " + JSON.stringify(label) + " must not be in label position in strict mode"));
      }
      return s;
    }
  }, {
    key: "reduceLiteralRegExpExpression",
    value: function reduceLiteralRegExpExpression(node) {
      var s = this.identity;
      var pattern = node.pattern;
      var flags = node.flags;

      if (!PatternAcceptor.test(pattern, flags.indexOf("u") >= 0)) {
        s = s.addError(new _EarlyErrorState$EarlyError.EarlyError(node, "Invalid regular expression pattern"));
      }
      if (!/^[igmyu]*$/.test(flags) || containsDuplicates(flags)) {
        s = s.addError(new _EarlyErrorState$EarlyError.EarlyError(node, "Invalid regular expression flags"));
      }
      return s;
    }
  }, {
    key: "reduceMethod",
    value: function reduceMethod(node, _ref) {
      var name = _ref.name;
      var params = _ref.params;
      var body = _ref.body;

      if (node.isGenerator) {
        if (params.boundNames.has("yield")) {
          params.boundNames.get("yield").forEach(function (yieldDecl) {
            return params = params.addError(new _EarlyErrorState$EarlyError.EarlyError(yieldDecl, "Generator methods must not have parameters named \"yield\""));
          });
        }
        body = body.enforceYieldIdentifierExpression(function (node) {
          return new _EarlyErrorState$EarlyError.EarlyError(node, "The identifier " + JSON.stringify(node.name) + " must not be in expression position in generator method bodies");
        });
      }
      if (node.name.type === "StaticPropertyName" && node.name.value === "constructor") {
        body = body.observeConstructorMethod();
        params = params.observeConstructorMethod();
      } else {
        body = body.enforceSuperCallExpressions(SUPER_CALL_ERROR);
        params = params.enforceSuperCallExpressions(SUPER_CALL_ERROR);
      }
      if (isStrictFunctionBody(node.body)) {
        params = params.enforceStrictErrors();
        body = body.enforceStrictErrors();
      }
      return _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceFunctionExpression", this).call(this, node, { name: name, params: params, body: body });
    }
  }, {
    key: "reduceModule",
    value: function reduceModule() {
      return _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceModule", this).apply(this, arguments).enforceStrictErrors().enforceSuperCallExpressions(SUPER_CALL_ERROR);
    }
  }, {
    key: "reduceObjectExpression",
    value: function reduceObjectExpression() {
      return _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceObjectExpression", this).apply(this, arguments).enforceSuperCallExpressionsInConstructorMethod(SUPER_CALL_ERROR);
    }
  }, {
    key: "reduceScript",
    value: function reduceScript() {
      return _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceScript", this).apply(this, arguments).enforceSuperCallExpressions(SUPER_CALL_ERROR);
    }
  }, {
    key: "reduceSetter",
    value: function reduceSetter(node, _ref) {
      var name = _ref.name;
      var param = _ref.param;
      var body = _ref.body;

      body = body.enforceSuperCallExpressions(SUPER_CALL_ERROR);
      param = param.enforceSuperCallExpressions(SUPER_CALL_ERROR);
      if (isStrictFunctionBody(node.body)) {
        param = param.enforceStrictErrors();
        body = body.enforceStrictErrors();
      }
      return _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceSetter", this).call(this, node, { name: name, param: param, body: body });
    }
  }, {
    key: "reduceVariableDeclaration",
    value: function reduceVariableDeclaration(node) {
      var s = _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceVariableDeclaration", this).apply(this, arguments);
      switch (node.kind) {
        case "let":
        case "const":
          s = s.observeLexicalDeclaration();
          break;
        case "var":
          s = s.observeVarDeclaration();
          break;
      }
      return s;
    }
  }], [{
    key: "check",
    value: function check(node) {
      return _reduce$MonoidalReducer["default"](new EarlyErrorChecker(), node).errors;
    }
  }]);

  return EarlyErrorChecker;
})(_reduce$MonoidalReducer.MonoidalReducer);

exports.EarlyErrorChecker = EarlyErrorChecker;