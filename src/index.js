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

import {Parser} from "./parser";

function markLocation(node, location) {
  node.loc = {
    start: location,
    end: {
      line: this.lastLine + 1,
      column: this.lastIndex - this.lastLineStart,
      offset: this.lastIndex,
    },
    source: null
  };
  return node;
}

export function parseModule(code, {loc = false} = {}) {
  let parser = new Parser(code);
  if (loc) {
    parser.markLocation = markLocation;
  }
  return parser.parseModule();
}

export function parseScript(code, {loc = false} = {}) {
  let parser = new Parser(code);
  if (loc) {
    parser.markLocation = markLocation;
  }
  return parser.parseScript();
}

export default parseScript;
