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

var expect = require("expect.js");
var SHIFT_SPEC = require("shift-spec").default;

function stmt(program) {
  return program.body.statements[0];
}

function expr(program) {
  return stmt(program).expression;
}

function schemaCheckUnion(node, spec) {
  if (spec.typeName === 'Union') {
    return spec.arguments.some(function (argument) {
      return schemaCheckUnion(node, argument);
    });
  } else if (spec.typeName === node.type) {
    schemaCheck(node, spec);
    return true;
  } else {
    return false;
  }
}

var fieldDatabase = Object.create(null);
for (var type in SHIFT_SPEC) {
  fieldDatabase[type] = {};
  SHIFT_SPEC[type].fields.forEach(function (field) {
    fieldDatabase[type][field] = true;
  });
}

function schemaCheck(node, spec) {
  switch (spec.typeName) {
    case "List":
      if (!Array.isArray(node)) {
        expect().fail("node must be an array, but it is: " + JSON.stringify(node, null, 2));
      }
      node.forEach(function (n) {
        schemaCheck(n, spec.argument);
      });
      return;
    case "Union":
      if (!schemaCheckUnion(node, spec)) {
        expect().fail("node cannot exist in this position.");
      }
      return;
    case "Maybe":
      if (node) {
        schemaCheck(node, spec.argument);
      }
      return;
    case "Enum":
      if (typeof node !== "string") {
        expect().fail("enum must be of string type.");
      }
      if (spec.values.indexOf(node) < 0) {
        expect().fail("illegal enum value '" + node + "'. accepted values: [" + spec.values + "]");
      }
      return;
    case "Boolean":
      if (typeof node !== "boolean") {
        expect(typeof node).eql("boolean");
      }
      return;
    case "Number":
      if (typeof node !== "number") {
        expect(typeof node).eql("number");
      }
      return;
    case "String":
      if (typeof node !== "string") {
        expect(typeof node).eql("string");
      }
      return;
  }

  spec.fields.forEach(function (field) {
    if (field.name === "type") {
      if (node.type !== field.value) {
        expect(node.type).eql(field.value);
      }
    } else {
      if (!node.hasOwnProperty(field.name)) {
        expect(node).to.have.key(field.name);
      }
      schemaCheck(node[field.name], field.type);
    }
  });
}

var LT = -1, EQ = 0, GT = 1;

function sourceLocationCompare(loc1, loc2) {
  if (loc1.offset < loc2.offset) {
    if (loc1.line < loc2.line || loc1.line === loc2.line && loc1.column < loc2.column) {
      return LT;
    }
  } else if (loc1.offset === loc2.offset) {
    if (loc1.line === loc2.line && loc1.column === loc2.column) {
      return EQ;
    }
  } else {
    if (loc1.line > loc2.line || loc1.line === loc2.line && loc1.column > loc2.column) {
      return GT;
    }
  }
  expect().fail("inconsistent location information.");
}

function expectSourceSpanContains(parent, loc) {
  if (sourceLocationCompare(parent.start, loc.start) > EQ || sourceLocationCompare(parent.end, loc.end) < EQ) {
    expect().fail("Parent does not include child");
  }
}

function moduleItem(mod) {
  return mod.items[0];
}

function checkLocation(loc) {
  if (!loc) {
    expect().fail("Node has no location");
  }
  if (loc.start.column < 0 ||
    loc.start.line < 0 ||
    loc.start.offset < 0 ||
    loc.end.column < 0 ||
    loc.end.line < 0 ||
    loc.end.offset < 0) {
    expect().fail("Illegal location information");
  }
}

function locationSanityCheck(node, parentSpan, prevLocation) {
  var loc = node.loc;

  checkLocation(node.loc);

  var compareEnds = sourceLocationCompare(node.loc.start, node.loc.end);
  if (compareEnds === GT) {
    expect().fail("Location information indicates that the node has negative length");
  }

  if (prevLocation) {
    if (sourceLocationCompare(prevLocation, loc.start) > EQ) {
      expect().fail("Nodes overlap");
    }
  }
  if (parentSpan) {
    expectSourceSpanContains(parentSpan, loc);
  }
  var last = null;
  var spec = SHIFT_SPEC[node.type].fields;
  for (var i = 0; i < spec.length; i++) {
    var field = spec[i];
    if (node[field.name] === null) return;
    if (typeof node[field.name].type === "string") {  // subnode
      locationSanityCheck(node[field.name], loc, last);
      last = node[field.name].loc.end;
    } else if (Array.isArray(node[field.name])) {
      var childList = node[field.name];
      for (var j = 0; j < childList.length; j++) {
        var child = childList[j];
        if (!child) return;
        locationSanityCheck(child, loc, last);
        last = child.loc.end;
      }
    }
  }
}

exports.moduleItem = moduleItem;
exports.expr = expr;
exports.stmt = stmt;
exports.locationSanityCheck = locationSanityCheck;
exports.schemaCheck = schemaCheck;
