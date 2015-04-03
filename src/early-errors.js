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

  reduceClassDeclaration(node, {name, super: _super, elements}) {
    elements = elements.map(e => e.enforceStrictErrors());
    return super.reduceClassDeclaration(node, {name, super: _super, elements});
  }

  reduceClassExpression(node, {name, super: _super, elements}) {
    elements = elements.map(e => e.enforceStrictErrors());
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
    if (isStrictFunctionBody(node.body)) {
      params = params.enforceStrictErrors();
      body = body.enforceStrictErrors();
    }
    return super.reduceFunctionExpression(node, {name, params, body});
  }

  reduceModule() {
    return super.reduceModule(...arguments).enforceStrictErrors();
  }

  reduceSetter(node, {name, param, body}) {
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
