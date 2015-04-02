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

const proto = {
  __proto__: null,
  errors: [],
  strictErrors: [],
};

let identity; // initialised below EarlyErrorState

export class EarlyErrorState {

  constructor() { }

  clone(additionalProperties) {
    return objectAssign(objectAssign(new EarlyErrorState, this), additionalProperties);
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
