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

import * as objectAssign from "object-assign";
import * as MultiMap from "multimap";

// FIXME: remove this when collections/multi-map is working
MultiMap.prototype.addEach = function(otherMap) {
  otherMap.forEachEntry((v, k) => {
    this.set.apply(this, [k].concat(v));
  });
  return this;
}


const proto = {
  __proto__: null,

  errors: [],
  // errors that are only errors in strict mode code
  strictErrors: [],

  // BindingIdentifiers
  boundNames: new MultiMap,
  // BindingIdentifiers that were found to be in a lexical binding position
  lexicallyDeclaredNames: new MultiMap,
  // BindingIdentifiers that were found to be in a variable binding position
  varDeclaredNames: new MultiMap,

  // IdentifierExpressions with name "yield"
  yieldIdentifierExpressions: [],

  // CallExpressions with Super callee
  superCallExpressions: [],
  // SuperCall expressions in the context of a Method named "constructor"
  superCallExpressionsInConstructorMethod: [],
};

let identity; // initialised below EarlyErrorState

export class EarlyErrorState {

  constructor() { }

  clone(additionalProperties) {
    return objectAssign(objectAssign(new EarlyErrorState, this), additionalProperties);
  }


  observeSuperCallExpression(node) {
    return this.clone({
      superCallExpressions: this.superCallExpressions.concat([node]),
    });
  }

  observeConstructorMethod() {
    return this.clone({
      superCallExpressions: [],
      superCallExpressionsInConstructorMethod: this.superCallExpressions,
    });
  }

  clearSuperCallExpressionsInConstructorMethod() {
    return this.clone({
      superCallExpressionsInConstructorMethod: [],
    });
  }

  enforceSuperCallExpressions(createError) {
    return this.clone({
      errors:
        this.errors.concat(
          this.superCallExpressions.map(createError),
          this.superCallExpressionsInConstructorMethod.map(createError)
        ),
      superCallExpressions: [],
      superCallExpressionsInConstructorMethod: [],
    });
  }

  enforceSuperCallExpressionsInConstructorMethod(createError) {
    return this.clone({
      errors: this.errors.concat(this.superCallExpressionsInConstructorMethod.map(createError)),
      superCallExpressionsInConstructorMethod: [],
    });
  }


  bindName(name, node) {
    let newBoundNames = new MultiMap().addEach(this.boundNames);
    newBoundNames.set(name, node);
    return this.clone({
      boundNames: newBoundNames,
    });
  }

  observeLexicalDeclaration() {
    return this.clone({
      boundNames: new MultiMap,
      lexicallyDeclaredNames: new MultiMap().addEach(this.lexicallyDeclaredNames).addEach(this.boundNames),
    });
  }

  observeLexicalBoundary() {
    return this.clone({
      lexicallyDeclaredNames: new MultiMap,
    });
  }

  observeVarDeclaration() {
    return this.clone({
      boundNames: new MultiMap,
      varDeclaredNames: new MultiMap().addEach(this.varDeclaredNames).addEach(this.boundNames),
    });
  }

  observeVarBoundary() {
    return this.clone({
      lexicallyDeclaredNames: new MultiMap,
      varDeclaredNames: new MultiMap,
    });
  }


  observeYieldIdentifierExpression(node){
    return this.clone({
      yieldIdentifierExpressions: this.yieldIdentifierExpressions.concat([node]),
    });
  }

  enforceYieldIdentifierExpression(createError){
    return this.clone({
      errors: this.errors.concat(this.yieldIdentifierExpressions.map(createError)),
      yieldIdentifierExpressions: [],
    });
  }


  addError(e) {
    return this.clone({
      errors: this.errors.concat([e]),
    });
  }

  addStrictError(e) {
    return this.clone({
      strictErrors: this.strictErrors.concat([e]),
    });
  }

  enforceStrictErrors() {
    return this.clone({
      errors: this.errors.concat(this.strictErrors),
      strictErrors: [],
    });
  }


  // MONOID IMPLEMENTATION

  static empty() {
    return identity;
  }

  concat(s) {
    if (this === identity) return s;
    if (s === identity) return this;
    return this.clone({
      errors: this.errors.concat(s.errors),
      strictErrors: this.strictErrors.concat(s.strictErrors),
      boundNames: new MultiMap().addEach(this.boundNames).addEach(s.boundNames),
      lexicallyDeclaredNames: new MultiMap().addEach(this.lexicallyDeclaredNames).addEach(s.lexicallyDeclaredNames),
      varDeclaredNames: new MultiMap().addEach(this.varDeclaredNames).addEach(s.varDeclaredNames),
      yieldIdentifierExpressions: this.yieldIdentifierExpressions.concat(s.yieldIdentifierExpressions),
      superCallExpressions: this.superCallExpressions.concat(s.superCallExpressions),
      superCallExpressionsInConstructorMethod: this.superCallExpressionsInConstructorMethod.concat(s.superCallExpressionsInConstructorMethod),
    });
  }

}

identity = new EarlyErrorState;
objectAssign(identity, proto);

export class EarlyError extends Error {
  constructor(node, message) {
    super(message);
    this.node = node;
    this.message = message;
  }
}
