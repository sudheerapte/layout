"use strict";

// node is an object:
// {id: 1, children: [2, 3, 4], width: 20, height: 20}
// setNodes will add a "parent" field.

// "layers" is an array of layer, 0..N-1.
// each layer is an array of sibli.
// each sibli is the list of children of the same parent.
// layer 0 contains a single sibli containing the root node.

// "preorder" is an array of {layer, sibli} number pairs, such that
// the first element is the left-most set of children, and the
// last element is the right-most set of children.

class TreeLayout {
  setNodes(nodelist, options) { // return null on success, else error msg
    this._nodes = {};
    this._root = null;
    nodelist.forEach( n => this._nodes[n.id] = n );
    const item = nodelist.find( n => (this.lostChild(n.id) !== null) );
    if (item) { return item.id; } // some ID was not found. Error

    let parent = {}; // map: child -> parent
    nodelist.forEach( n => {
      n.children.forEach( cid => { parent[cid] = n.id } );
    });
    // Now find root node, which must not have a parent entry.
    let errDuplicateRoots = false; // we allow only one root
    nodelist.forEach( n => {
      if (errDuplicateRoots) { return; }
      if (parent[n.id]) {
        this._nodes[n.id].parent = parent[n.id];
      } else {
        if (this._root) {
          errDuplicateRoots = true;
        } else {
          this._root = n.id;
        }
      }
    });
    // log(`setNodes: root = ${this._root}`);
    //    log(`nodes = ${JSON.stringify(this._nodes)}`);
    if (errDuplicateRoots) { return `only one root allowed`; }
    this._layers = this.makeLayers(); // layer and rank of each node
    this._pre = this.makePreorder(); // sequence of node id's
    this.computeOffsets();
    return null;
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
    const layers = [];
    let currLayer = 0;
    let node = this._nodes[this._root];
    // log(`adding layer 0`);
    layers.push([]);
    layers[currLayer].push([]);
    layers[currLayer][0].push(node);
    node.layer = currLayer;
    node.offset = 0;
    node.sibli = 0;
    node.rank = 0;
    this.addChildrenLayer(node, currLayer, layers);
    return layers;
  }
  // addChildrenLayer: add my children to the layer below me.
  // Recursively add descendants.
  addChildrenLayer(node, currLayer, layers) {
    if (node && node.children.length > 0) {
      if (layers.length < (currLayer+2)) {
        // log(`adding layer ${currLayer+1}`);
        layers.push([]);
      }
      const sibli = node.children.map( (cid, i) => {
        const child = this._nodes[cid];
        child.layer = currLayer+1;
        child.rank = i;
        child.offset = i;
        return child;
      });
      layers[currLayer+1].push(sibli);
      const sibliNum = layers[currLayer+1].length - 1;
      sibli.forEach( s => {
        s.sibli = sibliNum;
        this.addChildrenLayer(s, currLayer+1, layers);
      });
    }
  }
  makePreorder() {
    const me = this;
    let node = this._nodes[this._root];
    let pre = [];
    addPre(node, 0, pre);
    return pre;

    function addPre(node, childNum, pre) {
      if (childNum < node.children.length) {
        addPre(me._nodes[node.children[childNum]], 0, pre);
      }
      pre.push(node.id);
      for (let i=childNum+1; i<node.children.length; i++) {
        addPre(me._nodes[node.children[i]], 0, pre);
      }
    }
  }

  computeOffsets() {
    let again;
    let tries = 0;
    do {
      again = false;
      this._pre.forEach( id => {
        const node = this._nodes[id];
        if (node.children.length > 0) { // children have been ironed
          const result = this.centerParent(node.id);
          if (result !== 0) {
            again = true;
          }
        } else if (node.rank <= 0) { // iron my siblings for my parent
          const result = this.ironAfter(node.id);
          if (result > 0) {
            log(`ironed after ${node.id}:${node.offset}`);
            again = true;
          }
        }
      });
      tries++;
      if (tries > 2) {
        log(`computeFinal: retry was needed`);
      }
    } while (again && tries < 5);
    return again;
  }

  // applyToLayerNodes() - apply func to node and subsequent nodes in layer.
  // func should take a node object.
  // It will be called once for each node starting with the given id.
  applyToLayerNodes(id, func) {
    const node = this._nodes[id];
    const layer = this._layers[node.layer]
    let i = node.sibli;
    let j = node.rank;
    for (; j<layer[i].length; j++) {
      func(layer[i][j]);
    }
    for (i++; i<layer.length; i++) {
      for (j=0; j<layer[i].length; j++) {
        func(layer[i][j]);
      }
    }
  }

  moveSubtree(id, delta) {
    const node = this._nodes[id];
    if (node && node.hasOwnProperty("offset")) {
      node.offset += delta;
      node.children.forEach(cid => this.moveSubtree(cid, delta) );
    }
  }

  ironAfter(id) { // iron the layer after this node
    let offset, width;
    let moved = 0;
    this.applyToLayerNodes(id, node => {
      if (node.id === id) { // first node
        offset = node.offset;
        width = node.width;
      } else {              // subsequent nodes
        const targetOffset = offset + width + TreeLayout.STRUT;
        if (node.offset < targetOffset) {
          moved += targetOffset - node.offset;
          node.offset = targetOffset;
        }
        offset = node.offset;
        width = node.width;
      }
    });
    return moved;
  }

  centerParent(parentId) { // move parent so it lines up with its children
    // if the children's average is lower than the parent, then
    // the children will have to be moved.
    const parent = this._nodes[parentId];
    let childMin = null;
    let childMax = null;
    parent.children.forEach( cid => {
      const child = this._nodes[cid];
      if (! childMin) { // first time: initialize
        childMin = child.offset;
        childMax = child.offset;
      }
      if (child.offset > childMax) {
        childMax = child.offset;
      }
      if (child.offset < childMin) {
        childMin = child.offset;
      }
    });
    let childAvg = Math.floor((childMin + childMax)/2);
    const delta = childAvg - parent.offset;
    if (delta === 0) { return 0; }
    if (delta !== 0) {
      log(`${parentId}:${parent.offset}, childAvg ${childAvg}, delta ${delta}`);
    }
    if (delta < 0) { // move children instead
      this.moveSubtree(parent.children[0], (0 - delta));
      this.ironAfter(parent.children[0]);
    } else {
      parent.offset += delta;
      this.ironAfter(parent.id);
    }
    return delta;
  }
}

TreeLayout.STRUT = 5; // minimum separation between nodes


// create logging function log(str). Copy and paste these lines.
const logger = {};
require('./debug-log.js')
  .registerLogger('tree-layout', logger);
function log(str) { logger.log(str); }


module.exports = TreeLayout;
