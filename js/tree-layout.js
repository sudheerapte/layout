"use strict";

// node is an object:
// {id: 1, children: [2, 3, 4], width: 20, height: 20}

class TreeLayout {
  setNodes(nodelist, options) { // return null on success, else error msg
    this._nodes = {};
    nodelist.forEach( n => this._nodes[n.id] = n );
    // nodelist.forEach( n => log(JSON.stringify(n)) );
    const item = nodelist.find( n => (this.lostChild(n.id) !== null) );
    const result = item ? item.id : null;
    return result;
  }
  lostChild(id) { // return null if none are lost, else id of first lost
    if (! this.exists(id)) { return id; }
    const node = this._nodes[id];
    const pos = node.children.find( cid => { return ! this.exists(cid)} );
    // log(`lostChild(${id}): pos = ${pos}`);
    if (pos) {
      return node.children[pos];
    } else {
      return null;
    }
  }
  exists(id) {
    return !! this._nodes[id];
  }
  makeLayers() {
    
  }
}

// create logging function log(str). Copy and paste these lines.
const logger = {};
require('./debug-log.js')
  .registerLogger('tree-layout', logger);
function log(str) { logger.log(str); }


module.exports = TreeLayout;
