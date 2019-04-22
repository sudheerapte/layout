"use strict";

const [log, err] = require('./logerr.js');
const TL = require('../tree-layout.js');
const treeLayout = new TL;

const nodeList = [
  {id: 1, children: [2, 3, 4], width: 20, height: 20},
  {id: 2, children: [],        width: 20, height: 20},
  {id: 3, children: [],        width: 20, height: 20}, // missing id 4
];

let result;
result = treeLayout.setNodes(nodeList);
log(`result = ${result}`);
err(result === 1);

nodeList.push({id: 4, children: [],        width: 20, height: 20});
result = treeLayout.setNodes(nodeList);
err(result === null);

// -----------------

process.on('beforeExit', code => {
  if (code === 0) {
  }
});

