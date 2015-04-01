/**
 * Copyright 2015 Shape Security, Inc.
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

var testParse = require("../assertions").testParse;
var expr = require("../helpers").expr;

suite("Parser", function () {
  var emptyBody = { type: "FunctionBody", directives: [], statements: [] };

  suite("yield", function () {
    function yd(p) {
      return p.body.statements[0].body.statements.map(function (es) {
        return es.expression;
      });
    }

    function yde(p) {
      return p.body.statements[0].body.statements[0].expression.expression;
    }

    testParse("function*a(){yield\na}", yd, [{
      type: "YieldExpression",
      expression: null
    }, { type: "IdentifierExpression", name: "a" }]);

    // yield as an Identifier cannot show up in body of a generator or in strict mode.
    testParse("({set a(yield){}})", expr,
      {
        type: "ObjectExpression",
        properties: [{
          type: "Setter",
          name: { type: "StaticPropertyName", value: "a" },
          param: { type: "BindingIdentifier", name: "yield" },
          body: emptyBody
        }]
      });

    testParse("function *a(){yield 0}", yde, { type: "LiteralNumericExpression", value: 0 });
    testParse("function *a(){yield null}", yde, { type: "LiteralNullExpression" });
    testParse("function *a(){yield true}", yde, { type: "LiteralBooleanExpression", value: true });
    testParse("function *a(){yield false}", yde, { type: "LiteralBooleanExpression", value: false });
    testParse("function *a(){yield \"a\"}", yde, { type: "LiteralStringExpression", value: "a" });
    testParse("function *a(){yield a}", yde, { type: "IdentifierExpression", name: "a" });
    testParse("function *a(){yield+0}", yde, {
      type: "PrefixExpression",
      operator: "+",
      operand: { type: "LiteralNumericExpression", value: 0 }
    });
    testParse("function *a(){yield-0}", yde, {
      type: "PrefixExpression",
      operator: "-",
      operand: { type: "LiteralNumericExpression", value: 0 }
    });
    testParse("function *a(){yield 2e308}", yde, { type: "LiteralInfinityExpression" });
    testParse("function *a(){yield(0)}", yde, { type: "LiteralNumericExpression", value: 0 });
    testParse("function *a(){yield/a/}", yde, { type: "LiteralRegExpExpression", pattern: "a", flags: "" });
    testParse("function *a(){yield/=3/}", yde, { type: "LiteralRegExpExpression", pattern: "=3", flags: "" });
    testParse("function *a(){yield class{}}", yde, { type: "ClassExpression", name: null, super: null, elements: [] });

  });
});
