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

  reduceArrowExpression() {
    return super.reduceArrowExpression(...arguments).enforceStrictErrors();
  }

  reduceClassExpression() {
    return super.reduceClassExpression(...arguments).enforceStrictErrors();
  }

  reduceClassDeclaration() {
    return super.reduceClassDeclaration(...arguments).enforceStrictErrors();
  }

  reduceBindingIdentifier(node) {
    let s = this.identity;
    let {name} = node;
    if (isRestrictedWord(name) || isStrictModeReservedWord(name)) {
      s = s.addStrictError(new EarlyError(node, `The identifier ${JSON.stringify(name)} must not be in binding position in strict mode`));
    }
    return s;
  }

  reduceFunctionBody(node) {
    let s = super.reduceFunctionBody(...arguments);
    if (isStrictFunctionBody(node)) {
      s = s.enforceStrictErrors();
    }
    return s;
  }

  reduceFunctionDeclaration(node) {
    let s = super.reduceFunctionDeclaration(...arguments)
    if (node.isGenerator || isStrictFunctionBody(node.body)) {
      s = s.enforceStrictErrors();
    }
    return s;
  }

  reduceFunctionExpression(node) {
    let s = super.reduceFunctionExpression(...arguments)
    if (node.isGenerator || isStrictFunctionBody(node.body)) {
      s = s.enforceStrictErrors();
    }
    return s;
  }

  reduceGetter(node) {
    let s = super.reduceGetter(...arguments)
    if (isStrictFunctionBody(node.body)) {
      s = s.enforceStrictErrors();
    }
    return s;
  }

  reduceIdentifierExpression(node) {
    let s = this.identity;
    let {name} = node;
    if (isStrictModeReservedWord(name)) {
      s = s.addStrictError(new EarlyError(node, `The identifier ${JSON.stringify(name)} must not be in expression position in strict mode`));
    }
    return s;
  }

  reduceMethod(node) {
    return super.reduceMethod(...arguments).enforceStrictErrors();
  }

  reduceModule() {
    return super.reduceModule(...arguments).enforceStrictErrors();
  }

  reduceSetter(node) {
    let s = super.reduceSetter(...arguments)
    if (isStrictFunctionBody(node.body)) {
      s = s.enforceStrictErrors();
    }
    return s;
  }

  static check(node) {
    return reduce(new EarlyErrorChecker, node).errors;
  }
}
