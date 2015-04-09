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

import reduce, {MonoidalReducer} from "shift-reducer";
import {isRestrictedWord, isStrictModeReservedWord} from "./utils";

import {EarlyErrorState, EarlyError} from "./early-error-state";

function isStrictFunctionBody({directives}) {
  return directives.some(directive => directive.rawValue === "use strict");
}

function containsDuplicates(list) {
  let uniqs = [];
  for (let i = 0, l = list.length; i < l; ++i) {
    let item = list[i];
    if (uniqs.indexOf(item) >= 0) {
      return true;
    }
    uniqs.push(item);
  }
  return false;
}


class PatternAcceptor {
  constructor(pattern, u = false) {
    this.index = 0;
    // constants
    this.length = pattern.length;
    this.pattern = pattern;
    this.u = u;
  }

  static test(pattern, u = false) {
    let acceptor = new PatternAcceptor(pattern, u);
    return acceptor.readDisjunction() && acceptor.index === acceptor.length;
  }

  eat(ch) {
    if(this.index >= this.length || this.pattern[this.index] !== ch) return false;
    ++this.index;
    return true;
  }

  eatRegExp(r) {
    if (this.index >= this.length || !r.test(this.pattern[this.index])) return false;
    ++this.index;
    return true;
  }

  match(ch) {
    return this.index < this.length && this.pattern[this.index] === ch;
  }


  readDisjunction() {
    return this.readAlternative() && (this.eat("|") ? this.readDisjunction() : true);
  }

  readAlternative() {
    let savedIndex = this.index;
    while (this.readTerm()) {
      savedIndex = this.index;
    }
    this.index = savedIndex;
    return true;
  }

  readTerm() {
    return this.readAssertion() || this.readAtom() && (this.readQuantifier(), true);
  }

  readAssertion() {
    let start = this.index;
    if (this.eat("^") || this.eat("$")) return true;
    if (this.eat("\\")) {
      let b = this.eat("b") || this.eat("B");
      if (!b) this.index = start;
      return b;
    }
    if (this.index + 3 <= this.length && /^\(\?[=!]$/.test(this.pattern.slice(this.index, this.index + 3))) {
      this.index += 3;
      return this.readDisjunction() && this.eat(")");
    }
    return false;
  }

  readQuantifier() {
    return this.readQuantifierPrefix() && (this.eat("?"), true);
  }

  readQuantifierPrefix() {
    if (this.eat("*") || this.eat("+") || this.eat("?")) return true;
    if (this.eat("{") && this.readDecimalDigits()) {
      if (this.eat(",")) this.readDecimalDigits();
      return this.eat("}");
    }
    return false;
  }

  readDecimalDigits() {
    let start = this.index;
    while (this.eatRegExp(/^\d$/));
    return this.index > start;
  }

  readAtom() {
    if (this.readPatternCharacter() || this.eat(".")) return true;
    if (this.eat("\\")) return this.readAtomEscape();
    if (this.readCharacterClass()) return true;
    if (this.eat("(")) {
      if (this.eat("?") && !this.eat(":")) return false;
      return this.readDisjunction() && this.eat(")");
    }
    return false;
  }

  readSyntaxCharacter() {
    return this.eatRegExp(/^[\^$\\.*+?()[\]{}|]$/);
  }

  readPatternCharacter() {
    return this.eatRegExp(/^[^\^$\\.*+?()[\]{}|]$/);
  }

  readAtomEscape() {
    return this.readDecimalEscape() || this.readCharacterEscape() || this.readCharacterClassEscape();
  }

  readCharacterEscape() {
    return this.readControlEscape() ||
      this.eat("c") && this.readControlLetter() ||
      this.readHexEscapeSequence() ||
      this.readRegExpUnicodeEscapeSequence() ||
      this.readIdentityEscape();
  }

  readControlEscape() {
    return this.eatRegExp(/^[fnrtv]$/);
  }

  readControlLetter() {
    return this.eatRegExp(/^[a-zA-Z]$/);
  }

  readHexEscapeSequence() {
    return this.eat("x") && this.readHexDigit() && this.readHexDigit();
  }

  readHexDigit() {
    return this.eatRegExp(/^[a-fA-F0-9]$/);
  }

  readRegExpUnicodeEscapeSequence() {
    if (!this.eat("u")) return false;
    if (this.u) {
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

  readHex4Digits() {
    let k = 4;
    while (k > 0) {
      --k;
      if (!this.readHexDigit()) return false;
    }
    return true;
  }

  readHexDigits() {
    let start = this.index;
    while (this.readHexDigit());
    return this.index > start;
  }

  readIdentityEscape() {
    if (this.u) {
      return this.readSyntaxCharacter() || this.eat("/");
    } else {
      return this.eatRegExp(/^[^a-zA-Z0-9_]$/); // TODO: SourceCharacter but not UnicodeIDContinue
    }
  }

  readDecimalEscape() {
    if (this.eat("0")) return this.index <=this.length && !/^\d$/.test(this.pattern[this.index]);
    let start = this.index;
    while (this.eatRegExp(/^\d$/));
    return this.index > start;
  }

  readCharacterClassEscape() {
    return this.eatRegExp(/^[dDsSwW]$/);
  }

  readCharacterClass() {
    return this.eat("[") && (this.eat("^"), true) && this.readClassRanges() && this.eat("]");
  }

  readClassRanges() {
    let start = this.index;
    if (!this.readNonemptyClassRanges()) {
      this.index = start;
    }
    return true;
  }

  readNonemptyClassRanges() {
    if (this.readClassAtom()) {
      if (this.match("]")) return true;
      if (this.eat("-")) {
        if (this.match("]")) return true;
       return this.readClassAtom() && this.readClassRanges();
      }
      return this.readNonemptyClassRangesNoDash();
    }
    return false;
  }

  readNonemptyClassRangesNoDash() {
    if (this.eat("-")) return true;
    if (this.readClassAtomNoDash()) {
      if (this.match("]")) return true;
      if (this.eat("-")) {
        if (this.match("]")) return true;
       return this.readClassAtom() && this.readClassRanges();
      }
      return this.readNonemptyClassRangesNoDash();
    }
    return false;
  }

  readClassAtom() {
    return this.eat("-") || this.readClassAtomNoDash();
  }

  readClassAtomNoDash() {
    return this.eatRegExp(/^[^\\\]-]$/) || this.eat("\\") && this.readClassEscape();
  }

  readClassEscape() {
    return this.readDecimalEscape() || this.eat("b") || this.u && this.eat("-") || this.readCharacterEscape() || this.readCharacterClassEscape();
  }

}


const SUPER_CALL_ERROR = node => new EarlyError(node, `Super calls must be in the "constructor" method of a class expression or class declaration that has a superclass`);

export class EarlyErrorChecker extends MonoidalReducer {
  constructor() {
    super(EarlyErrorState);
  }

  reduceArrowExpression(node, {params, body}) {
    if (node.body.type === "FunctionBody" && isStrictFunctionBody(node.body)) {
      params = params.enforceStrictErrors();
      body = body.enforceStrictErrors();
    }
    return super.reduceArrowExpression(node, {params, body});
  }

  reduceCallExpression(node) {
    let s = super.reduceCallExpression(...arguments);
    if (node.callee.type === "Super") {
      s = s.observeSuperCallExpression(node);
    }
    return s;
  }

  reduceClassDeclaration(node, {name, super: _super, elements}) {
    elements = elements.map(e => e.enforceStrictErrors());
    if (_super != null) {
      elements = elements.map(e => e.clearSuperCallExpressionsInConstructorMethod());
    }
    elements = elements.map(e => e.enforceSuperCallExpressions(SUPER_CALL_ERROR));
    return super.reduceClassDeclaration(node, {name, super: _super, elements});
  }

  reduceClassExpression(node, {name, super: _super, elements}) {
    elements = elements.map(e => e.enforceStrictErrors());
    if (_super != null) {
      elements = elements.map(e => e.clearSuperCallExpressionsInConstructorMethod());
    }
    elements = elements.map(e => e.enforceSuperCallExpressions(SUPER_CALL_ERROR));
    return super.reduceClassExpression(node, {name, super: _super, elements});
  }

  reduceBindingIdentifier(node) {
    let s = this.identity;
    let {name} = node;
    if (isRestrictedWord(name) || isStrictModeReservedWord(name)) {
      s = s.addStrictError(new EarlyError(node, `The identifier ${JSON.stringify(name)} must not be in binding position in strict mode`));
    }
    s.bindName(name, node)
    return s;
  }

  reduceBindingPropertyIdentifier(node) {
    let s = this.identity;
    let {binding: {name}} = node;
    if (isRestrictedWord(name) || isStrictModeReservedWord(name)) {
      s = s.addStrictError(new EarlyError(node, `The identifier ${JSON.stringify(name)} must not be in binding position in strict mode`));
    }
    if (name === "yield") {
      s = s.observeYieldIdentifierExpression(node);
    }
    return s;
  }

  reduceBlock() {
    return super.reduceBlock(...arguments).observeLexicalBoundary();
  }

  reduceFunctionBody(node) {
    let s = super.reduceFunctionBody(...arguments);
    if (isStrictFunctionBody(node)) {
      s = s.enforceStrictErrors();
    }
    return s;
  }

  reduceFunctionDeclaration(node, {name, params, body}) {
    if (node.isGenerator) {
      if (params.boundNames.has("yield")) {
        params.boundNames.get("yield").forEach(yieldDecl =>
          params = params.addError(new EarlyError(yieldDecl, `Generator functions must not have parameters named "yield"`))
        );
      }
      body = body.enforceYieldIdentifierExpression(node =>
        new EarlyError(node, `The identifier ${JSON.stringify(node.name)} must not be in expression position in generator bodies`)
      );
    }
    if (isStrictFunctionBody(node.body)) {
      params = params.enforceStrictErrors();
      body = body.enforceStrictErrors();
    }
    return super.reduceFunctionExpression(node, {name, params, body});
  }

  reduceFunctionExpression(node, {name, params, body}) {
    if (node.isGenerator) {
      if (params.boundNames.has("yield")) {
        params.boundNames.get("yield").forEach(yieldDecl =>
          params = params.addError(new EarlyError(yieldDecl, `Generator functions must not have parameters named "yield"`))
        );
      }
      body = body.enforceYieldIdentifierExpression(node =>
        new EarlyError(node, `The identifier ${JSON.stringify(node.name)} must not be in expression position in generator bodies`)
      );
    }
    if (isStrictFunctionBody(node.body)) {
      params = params.enforceStrictErrors();
      body = body.enforceStrictErrors();
    }
    return super.reduceFunctionExpression(node, {name, params, body});
  }

  reduceGetter(node, {name, body}) {
    body = body.enforceSuperCallExpressions(SUPER_CALL_ERROR);
    if (isStrictFunctionBody(node.body)) {
      body = body.enforceStrictErrors();
    }
    return super.reduceGetter(node, {name, body});
  }

  reduceIdentifierExpression(node) {
    let s = this.identity;
    let {name} = node;
    if (isStrictModeReservedWord(name)) {
      s = s.addStrictError(new EarlyError(node, `The identifier ${JSON.stringify(name)} must not be in expression position in strict mode`));
    }
    if (name === "yield") {
      s = s.observeYieldIdentifierExpression(node);
    }
    return s;
  }

  reduceLabeledStatement(node) {
    let s = super.reduceLabeledStatement(...arguments);
    let {label} = node;
    if (label === "yield") {
      s = s.addStrictError(new EarlyError(node, `The identifier ${JSON.stringify(label)} must not be in label position in strict mode`));
    }
    return s;
  }

  reduceLiteralRegExpExpression(node) {
    let s = this.identity;
    let {pattern, flags} = node;
    if (!PatternAcceptor.test(pattern, flags.indexOf("u") >= 0)) {
      s = s.addError(new EarlyError(node, "Invalid regular expression pattern"));
    }
    if (!/^[igmyu]*$/.test(flags) || containsDuplicates(flags)) {
      s = s.addError(new EarlyError(node, "Invalid regular expression flags"));
    }
    return s;
  }

  reduceMethod(node, {name, params, body}) {
    if (node.isGenerator) {
      if (params.boundNames.has("yield")) {
        params.boundNames.get("yield").forEach(yieldDecl =>
          params = params.addError(new EarlyError(yieldDecl, `Generator methods must not have parameters named "yield"`))
        );
      }
      body = body.enforceYieldIdentifierExpression(node =>
        new EarlyError(node, `The identifier ${JSON.stringify(node.name)} must not be in expression position in generator method bodies`)
      );
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
    return super.reduceFunctionExpression(node, {name, params, body});
  }

  reduceModule() {
    return super.reduceModule(...arguments)
      .enforceStrictErrors()
      .enforceSuperCallExpressions(SUPER_CALL_ERROR);
  }

  reduceObjectExpression() {
    return super.reduceObjectExpression(...arguments)
      .enforceSuperCallExpressionsInConstructorMethod(SUPER_CALL_ERROR);
  }

  reduceScript() {
    return super.reduceScript(...arguments)
      .enforceSuperCallExpressions(SUPER_CALL_ERROR);
  }

  reduceSetter(node, {name, param, body}) {
    body = body.enforceSuperCallExpressions(SUPER_CALL_ERROR);
    param = param.enforceSuperCallExpressions(SUPER_CALL_ERROR);
    if (isStrictFunctionBody(node.body)) {
      param = param.enforceStrictErrors();
      body = body.enforceStrictErrors();
    }
    return super.reduceSetter(node, {name, param, body});
  }

  reduceVariableDeclaration(node) {
    let s = super.reduceVariableDeclaration(...arguments);
    switch(node.kind) {
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


  static check(node) {
    return reduce(new EarlyErrorChecker, node).errors;
  }
}
