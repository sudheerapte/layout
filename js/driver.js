"use strict";

const TL = require('./tree-layout.js');
const treeLayout = new TL;

let nodeList, result, expectedPre, expectedOffsets;

nodeList = [
  {id: 1, children: [2, 3, 4], width: 20, height: 20},
  {id: 2, children: [5,6,7],    width: 20, height: 20},
  {id: 3, children: [],        width: 20, height: 20},
  {id: 4, children: [],        width: 20, height: 20},
  {id: 5, children: [],        width: 20, height: 20},
  {id: 6, children: [],        width: 20, height: 20},
  {id: 7, children: [],        width: 20, height: 20},
];

result = treeLayout.setNodes(nodeList);
if (result !== null) { throw(`error: ${result}`); }

expectedPre = [5, 2, 6, 7, 1, 3, 4];
console.log(JSON.stringify(treeLayout._pre));
if (! matchArray(treeLayout._pre, expectedPre)) {
  throw(`Expected: ${JSON.stringify(expectedPre)}`);
} else {
  console.log(`preorder is correct`);
}
expectedOffsets = [{id: 1, offset: 62}, {id: 4, offset: 87}, {id: 7, offset: 50}];
expectedOffsets.forEach( exp => {
  if (treeLayout._nodes[exp.id].offset !== exp.offset) {
    throw(`expected offset did not match: ${JSON.stringify(exp)}`);
  }
});
console.log(`offsets are correct`);

printOffsets(process.stdout, treeLayout._layers);

console.log(`--- test 2: 5,6,7 on right`);
nodeList = [
  {id: 1, children: [2, 3, 4], width: 20, height: 20},
  {id: 2, children: [],        width: 20, height: 20},
  {id: 3, children: [],        width: 20, height: 20},
  {id: 4, children: [5,6,7],    width: 20, height: 20},
  {id: 5, children: [],        width: 20, height: 20},
  {id: 6, children: [],        width: 20, height: 20},
  {id: 7, children: [],        width: 20, height: 20},
];

result = treeLayout.setNodes(nodeList);
if (result !== null) { throw(`error: ${result}`); }

expectedPre = [2, 1, 3, 5, 4, 6, 7];
console.log(JSON.stringify(treeLayout._pre));
if (! matchArray(treeLayout._pre, expectedPre)) {
  throw(`Expected: ${JSON.stringify(expectedPre)}`);
} else {
  console.log(`preorder is correct`);
}
expectedOffsets = [{id: 1, offset: 37}, {id: 4, offset: 50}, {id: 7, offset: 75}];
expectedOffsets.forEach( exp => {
  if (treeLayout._nodes[exp.id].offset !== exp.offset) {
    throw(`expected offset did not match: ${JSON.stringify(exp)}`);
  }
});
console.log(`offsets are correct`);
//printOffsets(process.stdout, treeLayout._layers);


console.log(`--- test 3: larger tree with missing node added later`);

function matchArray(one, two) {
  let clean = true;
  one.forEach( (o,i) => { if (o !== two[i]) {clean = false;} } );
  return clean;
}

nodeList = [
  {id: 1, children: [2, 3, 4], width: 20, height: 20},
  {id: 2, children: [8,9],      width: 20, height: 20},
  {id: 3, children: [5],        width: 20, height: 20}, // id 4 added later
  {id: 5, children: [6],        width: 20, height: 20},
  {id: 6, children: [7],        width: 20, height: 20},
  {id: 7, children: [],        width: 20, height: 20},
  {id: 8, children: [10,11,12], width: 20, height: 20},
  {id: 9, children: [],        width: 20, height: 20},
  {id: 10, children: [],        width: 20, height: 20},
  {id: 11, children: [],        width: 20, height: 20},
  {id: 12, children: [13],      width: 20, height: 20},
  {id: 13, children: [],        width: 20, height: 20},
];

result = treeLayout.setNodes(nodeList);
if (result !== 1) { throw(`expected setNodes failure`); }

nodeList.push({id: 4, children: [],        width: 20, height: 20});
result = treeLayout.setNodes(nodeList);
if (result !== null) { throw(`error: ${result}`); }

expectedOffsets = [{id: 1, offset: 80}, {id: 5, offset: 87}, {id: 7, offset: 87}];

expectedOffsets.forEach( exp => {
  if (treeLayout._nodes[exp.id].offset !== exp.offset) {
    throw(`expected offset did not match: ${JSON.stringify(exp)}`);
  }
});
console.log(`offsets are correct`);

//printOffsets(process.stdout, treeLayout._layers);
console.log(JSON.stringify(treeLayout._pre));

function printLayers(str, layers) {
  layers.forEach( (l, i) => {
    str.write(`layer ${i}:\n`);
    l.forEach( (s, j) => {
      str.write(` [`);
      if (s[0].parent) { str.write(`(${s[0].parent}) `); }
      s.forEach( node => str.write(` ${node.id}`) );
      str.write(`]`);
    });
    str.write(`\n`);
  });
}

function printTree(str, layers) {
  layers.forEach( (l, i) => {
    l.forEach( (s, j) => {
      str.write(` [`);
      if (s[0].parent) { str.write(`(${s[0].parent}) `); }
      s.forEach( node => str.write(` ${node.id}`) );
      str.write(`]`);
    });
    str.write(`\n`);
  });
}

function printOffsets(str, layers) {
  layers.forEach( (l, i) => {
    str.write(`layer ${i}:\n`);
    l.forEach( (s, j) => {
      str.write(` [`);
      if (s[0].parent) { str.write(`(${s[0].parent}) `); }
      s.forEach( node => str.write(` ${node.id}:${node.offset},`) );
      str.write(`]`);
    });
    str.write(`\n`);
  });
}

// -----------------

process.on('beforeExit', code => {
  if (code === 0) {
  }
});

