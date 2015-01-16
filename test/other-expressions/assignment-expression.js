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

var assertEsprimaEquiv = require('../assertions').assertEsprimaEquiv;

describe("Parser", function () {
  describe("assignment expression", function () {
    // Assignment Operators
    assertEsprimaEquiv("a=2;");
    assertEsprimaEquiv("x = 42");
    assertEsprimaEquiv("eval = 42");
    assertEsprimaEquiv("arguments = 42");
    assertEsprimaEquiv("x *= 42");
    assertEsprimaEquiv("x /= 42");
    assertEsprimaEquiv("x %= 42");
    assertEsprimaEquiv("x += 42");
    assertEsprimaEquiv("x -= 42");
    assertEsprimaEquiv("x <<= 42");
    assertEsprimaEquiv("x >>= 42");
    assertEsprimaEquiv("x >>>= 42");
    assertEsprimaEquiv("x &= 42");
    assertEsprimaEquiv("x ^= 42");
    assertEsprimaEquiv("x |= 42");
    assertEsprimaEquiv("'use strict'; eval[0] = 42");
    assertEsprimaEquiv("'use strict'; arguments[0] = 42");
  });
});