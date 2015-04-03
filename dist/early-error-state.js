// istanbul ignore next
"use strict";

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

// istanbul ignore next

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

// istanbul ignore next

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

// istanbul ignore next

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

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

var _import = require("object-assign");

var objectAssign = _import;

var _import2 = require("multimap");

var MultiMap = _import2;

// FIXME: remove this when collections/multi-map is working
MultiMap.prototype.addEach = function (otherMap) {
  var _this = this;

  otherMap.forEachEntry(function (v, k) {
    _this.set.apply(_this, [k].concat(v));
  });
  return this;
};

var proto = {
  __proto__: null,
  errors: [],
  strictErrors: [],
  boundNames: new MultiMap(),
  lexicallyDeclaredNames: new MultiMap(),
  varDeclaredNames: new MultiMap(),
  yieldIdentifierExpressions: [] };

var identity = undefined; // initialised below EarlyErrorState

var EarlyErrorState = (function () {
  function EarlyErrorState() {
    _classCallCheck(this, EarlyErrorState);
  }

  _createClass(EarlyErrorState, [{
    key: "clone",
    value: function clone(additionalProperties) {
      return objectAssign(objectAssign(new EarlyErrorState(), this), additionalProperties);
    }
  }, {
    key: "bindName",
    value: function bindName(name, node) {
      var newBoundNames = new MultiMap().addEach(this.boundNames);
      newBoundNames.set(name, node);
      return this.clone({
        boundNames: newBoundNames });
    }
  }, {
    key: "observeLexicalDeclaration",
    value: function observeLexicalDeclaration() {
      return this.clone({
        boundNames: new MultiMap(),
        lexicallyDeclaredNames: new MultiMap().addEach(this.lexicallyDeclaredNames).addEach(this.boundNames) });
    }
  }, {
    key: "observeLexicalBoundary",
    value: function observeLexicalBoundary() {
      return this.clone({
        lexicallyDeclaredNames: new MultiMap() });
    }
  }, {
    key: "observeVarDeclaration",
    value: function observeVarDeclaration() {
      return this.clone({
        boundNames: new MultiMap(),
        varDeclaredNames: new MultiMap().addEach(this.varDeclaredNames).addEach(this.boundNames) });
    }
  }, {
    key: "observeVarBoundary",
    value: function observeVarBoundary() {
      return this.clone({
        lexicallyDeclaredNames: new MultiMap(),
        varDeclaredNames: new MultiMap() });
    }
  }, {
    key: "observeYieldIdentifierExpression",
    value: function observeYieldIdentifierExpression(node) {
      return this.clone({
        yieldIdentifierExpressions: this.yieldIdentifierExpressions.concat([node]) });
    }
  }, {
    key: "enforceYieldIdentifierExpression",
    value: function enforceYieldIdentifierExpression(createError) {
      return this.clone({
        errors: this.errors.concat(this.yieldIdentifierExpressions.map(createError)),
        yieldIdentifierExpressions: [] });
    }
  }, {
    key: "addError",
    value: function addError(e) {
      return this.clone({
        errors: this.errors.concat([e]) });
    }
  }, {
    key: "addStrictError",
    value: function addStrictError(e) {
      return this.clone({
        strictErrors: this.strictErrors.concat([e]) });
    }
  }, {
    key: "enforceStrictErrors",
    value: function enforceStrictErrors() {
      return this.clone({
        errors: this.errors.concat(this.strictErrors),
        strictErrors: [] });
    }
  }, {
    key: "concat",
    value: function concat(s) {
      if (this === identity) {
        return s;
      }if (s === identity) {
        return this;
      }return this.clone({
        errors: this.errors.concat(s.errors),
        strictErrors: this.strictErrors.concat(s.strictErrors),
        boundNames: new MultiMap().addEach(this.boundNames).addEach(s.boundNames),
        lexicallyDeclaredNames: new MultiMap().addEach(this.lexicallyDeclaredNames).addEach(s.lexicallyDeclaredNames),
        varDeclaredNames: new MultiMap().addEach(this.varDeclaredNames).addEach(s.varDeclaredNames),
        yieldIdentifierExpressions: this.yieldIdentifierExpressions.concat(s.yieldIdentifierExpressions) });
    }
  }], [{
    key: "empty",

    // MONOID IMPLEMENTATION

    value: function empty() {
      return identity;
    }
  }]);

  return EarlyErrorState;
})();

exports.EarlyErrorState = EarlyErrorState;

identity = new EarlyErrorState();
objectAssign(identity, proto);

var EarlyError = (function (_Error) {
  function EarlyError(node, message) {
    _classCallCheck(this, EarlyError);

    _get(Object.getPrototypeOf(EarlyError.prototype), "constructor", this).call(this, message);
    this.node = node;
    this.message = message;
  }

  _inherits(EarlyError, _Error);

  return EarlyError;
})(Error);

exports.EarlyError = EarlyError;