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

var Shift = require("shift-ast");
var ShiftParser = require("../../");

var testParseFailure = require("../assertions").testParseFailure;
var testParseModule = require("../assertions").testParseModule;
var testParseModuleFailure = require("../assertions").testParseModuleFailure;

var moduleItem = require("../helpers").moduleItem;
var locationSanityCheck = require("../helpers").locationSanityCheck;

function locationSanityTest(source) {
  test(source, function() {
    var tree = ShiftParser.parseModule(source, {loc: true});
    locationSanityCheck(tree);
  });
}

function testImportDecl(code, tree) {
  testParseModule(code, moduleItem, tree);
  locationSanityTest(code);
}

suite("Parser", function () {
  suite("import declaration", function () {

    testImportDecl("import 'a'", new Shift.Import(null, [], "a"));

    testImportDecl(
      "import * as a from 'a'",
            new Shift.ImportNamespace(
        null,
        { type: "BindingIdentifier", name: "a" },
        "a"));

    testImportDecl(
      "import a from 'c'",
      new Shift.Import("a", [], "c"));

    testImportDecl(
      "import a, {} from 'c'",
      new Shift.Import("a", [], "c"));

    testImportDecl(
      "import {} from 'a'",
            new Shift.Import(null, [], "a"));

    testImportDecl(
      "import a, * as b from 'a'",
            new Shift.ImportNamespace(
        "a",
        { type: "BindingIdentifier", name: "b" },
        "a"));

    testImportDecl(
      "import a, {b} from 'c'",
            new Shift.Import(
        "a",
        [new Shift.ImportSpecifier(null, { type: "BindingIdentifier", name: "b" })],
        "c"));

    testImportDecl(
      "import a, {b as c} from 'c'",
            new Shift.Import(
        "a",
        [new Shift.ImportSpecifier("b", { type: "BindingIdentifier", name: "c" })],
        "c"));

    testImportDecl(
      "import a, {function as c} from 'c'",
            new Shift.Import(
        "a",
        [new Shift.ImportSpecifier("function", { type: "BindingIdentifier", name: "c" })],
        "c"));

    testImportDecl(
      "import a, {as} from 'c'",
            new Shift.Import(
        "a",
        [new Shift.ImportSpecifier(null, { type: "BindingIdentifier", name: "as" })],
        "c"));

    testImportDecl(
      "import a, {as as c} from 'c'",
            new Shift.Import(
        "a",
        [new Shift.ImportSpecifier("as", { type: "BindingIdentifier", name: "c" })],
        "c"));

    testImportDecl(
      "import {as as as} from 'as'",
            new Shift.Import(
        null,
        [new Shift.ImportSpecifier("as", { type: "BindingIdentifier", name: "as" })],
        "as"));

    testImportDecl(
      "import a, {b,} from 'c'",
            new Shift.Import(
        "a",
        [new Shift.ImportSpecifier(null, { type: "BindingIdentifier", name: "b" })],
        "c"));

    testImportDecl(
      "import a, {b,c} from 'd'",
            new Shift.Import(
        "a",
        [
          new Shift.ImportSpecifier(null, { type: "BindingIdentifier", name: "b" }),
          new Shift.ImportSpecifier(null, { type: "BindingIdentifier", name: "c" })
        ],
        "d"));

    testImportDecl(
      "import a, {b,c,} from 'd'",
            new Shift.Import(
        "a",
        [
          new Shift.ImportSpecifier(null, { type: "BindingIdentifier", name: "b" }),
          new Shift.ImportSpecifier(null, { type: "BindingIdentifier", name: "c" })
        ],
        "d"));

    testParseFailure("import 'a'", "Unexpected token import");
    testParseModuleFailure("import", "Unexpected end of input");
    testParseModuleFailure("import;", "Unexpected token ;");
    testParseModuleFailure("import {}", "Unexpected end of input");
    testParseModuleFailure("import {};", "Unexpected token ;");
    testParseModuleFailure("import {} from;", "Unexpected token ;");
    testParseModuleFailure("import {,} from 'a';", "Unexpected token ,");
    testParseModuleFailure("import {b,,} from 'a';", "Unexpected token ,");
    testParseModuleFailure("import {b as,} from 'a';", "Unexpected token ,");
    testParseModuleFailure("import {function} from 'a';", "Unexpected token }");
    testParseModuleFailure("import {a as function} from 'a';", "Unexpected token function");
    testParseModuleFailure("import {b,,c} from 'a';", "Unexpected token ,");
    testParseModuleFailure("import {b,c,,} from 'a';", "Unexpected token ,");
    testParseModuleFailure("import * As a from 'a'", "Unexpected identifier");
    testParseModuleFailure("import / as a from 'a'", "Unexpected token /");
    testParseModuleFailure("import * as b, a from 'a'", "Unexpected token ,");
    testParseModuleFailure("import a as b from 'a'", "Unexpected identifier");
    testParseModuleFailure("import a, b from 'a'", "Unexpected identifier");

  });
});
