// istanbul ignore next
"use strict";

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

// istanbul ignore next

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (descriptor.value) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

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
    value: function reduceArrowExpression() {
      return _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceArrowExpression", this).apply(this, arguments).enforceStrictErrors();
    }
  }, {
    key: "reduceClassExpression",
    value: function reduceClassExpression() {
      return _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceClassExpression", this).apply(this, arguments).enforceStrictErrors();
    }
  }, {
    key: "reduceClassDeclaration",
    value: function reduceClassDeclaration() {
      return _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceClassDeclaration", this).apply(this, arguments).enforceStrictErrors();
    }
  }, {
    key: "reduceBindingIdentifier",
    value: function reduceBindingIdentifier(node) {
      var s = this.identity;
      var name = node.name;

      if (_isRestrictedWord$isStrictModeReservedWord.isRestrictedWord(name) || _isRestrictedWord$isStrictModeReservedWord.isStrictModeReservedWord(name)) {
        s = s.addStrictError(new _EarlyErrorState$EarlyError.EarlyError(node, "The identifier " + JSON.stringify(name) + " must not be in binding position in strict mode"));
      }
      return s;
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
    value: function reduceFunctionDeclaration(node) {
      var s = _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceFunctionDeclaration", this).apply(this, arguments);
      if (node.isGenerator || isStrictFunctionBody(node.body)) {
        s = s.enforceStrictErrors();
      }
      return s;
    }
  }, {
    key: "reduceFunctionExpression",
    value: function reduceFunctionExpression(node) {
      var s = _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceFunctionExpression", this).apply(this, arguments);
      if (node.isGenerator || isStrictFunctionBody(node.body)) {
        s = s.enforceStrictErrors();
      }
      return s;
    }
  }, {
    key: "reduceGetter",
    value: function reduceGetter(node) {
      var s = _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceGetter", this).apply(this, arguments);
      if (isStrictFunctionBody(node.body)) {
        s = s.enforceStrictErrors();
      }
      return s;
    }
  }, {
    key: "reduceIdentifierExpression",
    value: function reduceIdentifierExpression(node) {
      var s = this.identity;
      var name = node.name;

      if (_isRestrictedWord$isStrictModeReservedWord.isStrictModeReservedWord(name)) {
        s = s.addStrictError(new _EarlyErrorState$EarlyError.EarlyError(node, "The identifier " + JSON.stringify(name) + " must not be in expression position in strict mode"));
      }
      return s;
    }
  }, {
    key: "reduceMethod",
    value: function reduceMethod(node) {
      return _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceMethod", this).apply(this, arguments).enforceStrictErrors();
    }
  }, {
    key: "reduceModule",
    value: function reduceModule() {
      return _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceModule", this).apply(this, arguments).enforceStrictErrors();
    }
  }, {
    key: "reduceSetter",
    value: function reduceSetter(node) {
      var s = _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceSetter", this).apply(this, arguments);
      if (isStrictFunctionBody(node.body)) {
        s = s.enforceStrictErrors();
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