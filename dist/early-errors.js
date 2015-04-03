// istanbul ignore next
"use strict";

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

// istanbul ignore next

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

// istanbul ignore next

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

// istanbul ignore next

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

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

var EarlyErrorChecker = (function (_MonoidalReducer) {
  function EarlyErrorChecker() {
    _classCallCheck(this, EarlyErrorChecker);

    _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "constructor", this).call(this, _EarlyErrorState$EarlyError.EarlyErrorState);
  }

  _inherits(EarlyErrorChecker, _MonoidalReducer);

  _createClass(EarlyErrorChecker, [{
    key: "reduceArrowExpression",
    value: function reduceArrowExpression(node, _ref2) {
      var params = _ref2.params;
      var body = _ref2.body;

      if (node.body.type === "FunctionBody" && isStrictFunctionBody(node.body)) {
        params = params.enforceStrictErrors();
        body = body.enforceStrictErrors();
      }
      return _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceArrowExpression", this).call(this, node, { params: params, body: body });
    }
  }, {
    key: "reduceClassDeclaration",
    value: function reduceClassDeclaration(node, _ref3) {
      var name = _ref3.name;
      var _super = _ref3["super"];
      var elements = _ref3.elements;

      elements = elements.map(function (e) {
        return e.enforceStrictErrors();
      });
      return _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceClassDeclaration", this).call(this, node, { name: name, "super": _super, elements: elements });
    }
  }, {
    key: "reduceClassExpression",
    value: function reduceClassExpression(node, _ref4) {
      var name = _ref4.name;
      var _super = _ref4["super"];
      var elements = _ref4.elements;

      elements = elements.map(function (e) {
        return e.enforceStrictErrors();
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
    value: function reduceFunctionDeclaration(node, _ref5) {
      var name = _ref5.name;
      var params = _ref5.params;
      var body = _ref5.body;

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
    value: function reduceFunctionExpression(node, _ref6) {
      var name = _ref6.name;
      var params = _ref6.params;
      var body = _ref6.body;

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
    value: function reduceGetter(node, _ref7) {
      var name = _ref7.name;
      var body = _ref7.body;

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
    key: "reduceMethod",
    value: function reduceMethod(node, _ref8) {
      var name = _ref8.name;
      var params = _ref8.params;
      var body = _ref8.body;

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
      if (isStrictFunctionBody(node.body)) {
        params = params.enforceStrictErrors();
        body = body.enforceStrictErrors();
      }
      return _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceFunctionExpression", this).call(this, node, { name: name, params: params, body: body });
    }
  }, {
    key: "reduceModule",
    value: function reduceModule() {
      return _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceModule", this).apply(this, arguments).enforceStrictErrors();
    }
  }, {
    key: "reduceSetter",
    value: function reduceSetter(node, _ref9) {
      var name = _ref9.name;
      var param = _ref9.param;
      var body = _ref9.body;

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