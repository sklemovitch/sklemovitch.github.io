/**
  * Contains the information to display the element and store the information, will replace the sector info type
  * @param {String} label     -- Text saying what the element represents
  * @param {Number} value     -- The actual value of the node, is either a leaf or the sum of its children (EX: leaf node has value 10, siblings have value 20 and 30, parent value is 10+20+30=60)
  * @param {Object} children  -- The child nodes of the tree
  * @param {Object} parent    -- The parent of the node
  * @param {String} color     -- The color of the node
  */
class Tree {
  constructor(label, value, children = []) {
    this.label = label;
    this.value = value;
    this.children = children;
  }
  // NOTE: Maybe remove dependency on knowing the parent node?
  addChild(tree, rootNode) {
    //If the children of the current tree include the name of the tree we are trying to add, then don't add
    if (this.children.length == 0) {
      this.value = tree.value;
    }
    tree.parent = this;
    this.children.push(tree);
    cascadeValue(rootNode);
  }
}

// Recursion is cool
function getNthLayer(tree, layer) {
  if (layer <= 0) {
    return [tree];
  }
  else {
    return tree.children.reduce((acc, cur) => acc.concat(getNthLayer(cur, layer - 1)), []);
  }
}

// Contains some redundancy but that's fine (probably)
function cascadeValue(tree) {
  if (tree.children.length != 0) {
    realValue = tree.children.reduce((acc, cur) => acc + cascadeValue(cur), 0);
    tree.value = realValue;
  }
  return tree.value;
}

/* Partially applies functions, making them easier to read */
function partial(func, ...args) {
  return function(...moreArgs) {
    return func(...args, ...moreArgs);
  };
}

// Parses the first argument from a string in the form somefun(firstArg, secondArg...) where firstArg is a number
// Assumes it's in that form
function parseNthArg(string, argNum) {
  let stringPos = 0;
  for (stringPos; stringPos < string.length; ++stringPos){
    if (string[stringPos] == '('){
      break;
    }
  }
  stringPos += 1;
  let stringAcc = "";
  argAcc = 0;
  for (stringPos; argAcc < argNum; ++stringPos) {
    if (string[stringPos] == ','){
      argAcc += 1;
      continue;
    }
    if (argAcc == argNum-1) {
      stringAcc += string[stringPos];
    }
  }
  return stringAcc;
}

function getChildsPosInParent(parent, child) {
  for (i = 0; i < parent.children.length; ++i) {
    if (parent.children[i] == child) {
      return i;
    }
  }
  return false;
}

/*
 * Empties the listElement and fills it with information about the tree object
 */
function displayTreeChildren(listElement, tree, unit) {
  function createListElement(container, valueName, value) {
    const newListElement = document.createElement("li");
    newListElement.innerHTML = valueName.concat(value);
    container.append(newListElement);
  }
  function resultFunc(listElement, tree, unit) {
    listElement.innerHTML = "";
    const treeChildren = tree.children;
    for (const index in tree.children) {
      const child = treeChildren[index];
      const newTreeList = document.createElement("ul");
      createListElement(newTreeList, "Label: ", child.label);
      // Why the fuck are dollars, like, the only unit written on the left side
      if (unit == "$") {
        createListElement(newTreeList, "Value: ", unit.concat(child.value.toString()));
      }
      else {
        createListElement(newTreeList, "Value: ", child.value.toString().concat(unit));
      }

      createListElement(newTreeList, "Is leaf: ", child.children.length == 0)
      const newList = document.createElement("li");
      newList.class = "no-bullet";
      newList.append(newTreeList);
      listElement.append(newList);
    }
  }
  resultFunc(listElement, tree, unit);
}
/**
  * Draws an annulus with a center at (centerX, centerY) with an innerRadius of innerRadius
  * @param {Object[]} treeLayer     -- The layer we're drawing
  * @param {Number} layerNum        -- Which layer (relative to root)
  * @param {Number} curValue        -- The value of the selected node
  * @param {Object} context         -- The canvas 2d context that we are drawing on
  * @param {Number} radius          -- The inner radius of the annulus for all the sectors
  * @param {Number} thickness       -- Used to calclate the outer radius, inner radius + thickness = outer radius
  * @param {Number} centerX         -- The x value of the center point of the annulus
  * @param {Number} centerY         -- The y value of the center point of the annulus
  */
function drawAnnulus(treeLayer, layerNum, curValue, context, radius, thickness, centerX, centerY, rootNode) {
  function drawAnnulusSector(context, centerX, centerY, thickness, radius, startAngle, endAngle, color) {
    context.fillStyle = color;
    context.beginPath();
    context.arc(centerX, centerY, radius, -1 * startAngle, -1 * endAngle, true);
    context.lineTo(centerX + Math.cos(-1 * endAngle) * (radius + thickness), centerY + Math.sin(-1 * endAngle) * (radius + thickness));
    context.arc(centerX, centerY, radius + thickness, -1 * endAngle, -1 * startAngle, false);
    context.lineTo(centerX + Math.cos(-1 * startAngle) * radius, centerY + Math.sin(-1 * startAngle) * radius);
    context.stroke();
    context.fill();
  }
  //drawApplied takes radius,startAngle,endAngle,color
  const drawApplied = partial(drawAnnulusSector, context, centerX, centerY, thickness);
  //Draws a layer
  function drawMultipleSectors(treeLayer, rootNode, layerNum, curValue, radius) {
    let accumulatedValue = 0
    let color = "";
    for (let i = 0; i < treeLayer.length; ++i) {
      const startAngle = (accumulatedValue / curValue) * (2 * Math.PI);
      const endAngle = ((treeLayer[i].value + accumulatedValue) / curValue) * (2 * Math.PI);
      accumulatedValue += treeLayer[i].value;
      if (layerNum == 0) {
        color = "rgb(0,0,0)";
      }
      else if (layerNum == 1) {
        hue = Math.floor((360/getNthLayer(rootNode,1).length)*getChildsPosInParent(rootNode, treeLayer[i]))
        color = "hsl("+hue+",100%,50%)";
      }
      else if (layerNum % 2 == 0) {
        hue = parseNthArg(treeLayer[i].parent.color,1)
        lighting = Math.floor((50/treeLayer[i].parent.children.length)*getChildsPosInParent(treeLayer[i].parent, treeLayer[i]))+20
        color = "hsl("+hue+",50%,"+lighting+"%)"; 
      }
      else if (layerNum % 2 == 1) {
        hue = parseNthArg(treeLayer[i].parent.color,1)
        lighting = Math.floor((50/treeLayer[i].parent.children.length)*getChildsPosInParent(treeLayer[i].parent, treeLayer[i]))
        color = "hsl("+hue+",25%,"+lighting+"%)"; 
      }
      treeLayer[i].color = color;
      drawApplied(radius, startAngle, endAngle, treeLayer[i].color);
    }
  }
  return drawMultipleSectors(treeLayer, rootNode, layerNum, curValue, radius);
}
/** 
  * Styles and creates the contents of a provided container for a tooltip
  * ERASES CONTENTS OF THE TOOLTIP CONTAINER
  * @param {Number} x                 - The number of pixels the top left corner of the element is from the left of your screen
  * @param {Number} y                 - The number of pixels the top left corner of the element is from the top of your screen
  * @param {Object} toolTipContainer  - The container which we are modifying
  * @param {...String} innerTexts     - The texts inside the tooltips
  */
function createToolTip(x, y, toolTipContainer, ...innerTexts) {
  toolTipContainer.innerHTML = "";
  toolTipContainer.style.left = x + "px";
  toolTipContainer.style.top = y + "px";
  let element;
  for (const text of innerTexts) {
    element = document.createElement("p");
    element.textContent = text;
    toolTipContainer.appendChild(element);
  }
}
/**
  * The function that handles displaying the tooltip when hovering over a sector and clicking on one
  * @param {Number} centerX             -- The x value of the center of the annulus
  * @param {Number} centerY             -- The y value of the center of the annulus
  * @param {Object} sectorInfoContainer -- The container for the tooltip of the sector info
  * @param {Number} innerRadius         -- The radius of the negative space in the circle
  * @param {Number} mouseX              -- The x component of the coordinates of the mouse
  * @param {Number} mouseY              -- The y component of the coordinates of the mouse
  * @param {Number} layerStart          -- The layer that we are starting the calculation from
  * @param {Number} layerEnd            -- The layer that we are ending the calculation from
  * @param {Bool} isClick               -- 
  */
function hoverHandler(centerX, centerY, sectorInfoContainer, innerRadius, thickness, tree, mouseX, mouseY, layerStart, depth, isClick) {
  // Thanks pythagoras
  const distance = Math.sqrt((mouseX - centerX) * (mouseX - centerX) + (mouseY - centerY) * (mouseY - centerY));
  let mouseAngle = Math.atan2(centerY - mouseY, mouseX - centerX); //centerY-mouseX because the viewport is from top to bottom
  if (mouseAngle < 0) {
    mouseAngle += 2 * (Math.PI);
  }
  function isInsideSector(mouseAngle, startAngle, endAngle) {
    // If the distance of the mouse is between the inner and outer part of the annulus (which we already checked in the which sector part)
    // and if the mouse is between the angles
    const inAngle = (startAngle < mouseAngle) && (mouseAngle < endAngle);
    // Then it's inside the sector
    return inAngle;
  }

  function whichSector(tree, innerRadius, thickness, distance, mouseAngle, depth) {
    for (i = 0; i < depth; ++i) {
      const distanceIsCorrect = ((innerRadius + thickness * (i)) < distance) && (distance < (innerRadius + (i + 1) * thickness));
      if (!distanceIsCorrect) {
        continue;
      }
      sectors = getNthLayer(tree, i);
      if (sectors.length == 0) {
        return false;
      }
      // NOTE: Could probably implement binary search here, but too lazy
      let accumulatedValue = 0;
      for (let j = 0; j < sectors.length; ++j) {
        const startAngle = (accumulatedValue/tree.value)*2*Math.PI;
        const endAngle = ((accumulatedValue+sectors[j].value)/tree.value)*2*Math.PI;
        accumulatedValue += sectors[j].value;
        if (isInsideSector(mouseAngle, startAngle, endAngle)) {
          return [sectors[j], i];
        }
      }
    }
  }
  function finalize(tree, innerRadius, thickness, distance, mouseAngle, layerStart, depth, isClick) {
    const sectorInfo = whichSector(tree, innerRadius, thickness, distance, mouseAngle, depth);
    if (sectorInfo) {
      sectorInfo[1] += layerStart;
      createToolTip(mouseX, mouseY, sectorInfoContainer, sectorInfo[0].value);
    }
    else {
      sectorInfoContainer.innerHTML = "";
      return false;
    }
    if (isClick) {
      return sectorInfo;
    }
    else {
      return [tree, layerStart];
    }
  }

  return finalize(tree, innerRadius, thickness, distance, mouseAngle, layerStart, depth, isClick);
}
//Element and element properties definition
const canvas = document.getElementById("myCanvas");
const graphInfo = document.getElementById("graphInfo");
const childList = document.getElementById("childList");
const graph = document.getElementById("graph");
const sectorInfo = document.getElementById("sectorInfo");
const ctxt = canvas.getContext("2d");

const unit = "$";
const rootNode = new Tree("Main", 0);
let selectedNode = rootNode;
{
  const childTree1 = new Tree("Child1", 0);
  const childTree2 = new Tree("Child2", 0);
  const childTree3 = new Tree("Child3", 0);
  rootNode.addChild(childTree1, rootNode);
  rootNode.addChild(childTree2, rootNode);
  rootNode.addChild(childTree3, rootNode);
  childTree1.addChild(new Tree("Child1", 5), rootNode);
  childTree1.addChild(new Tree("Child2", 5), rootNode);
  childTree2.addChild(new Tree("Child1", 5), rootNode);
  childTree2.addChild(new Tree("Child2", 5), rootNode);
  childTree3.addChild(new Tree("Child1", 5), rootNode);
  childTree3.addChild(new Tree("Child2", 20), rootNode);
  displayTreeChildren(childList, rootNode, unit);
}

let layerStart = 0;
const displayDepth = 3;

/**
  * Sets up the size of the annulus using the dimensions of the graph (which are dependent on the dimensions of the window)
  */
function initialize() {
  ctxt.clearRect(0, 0, canvas.width, canvas.height);
  canvas.width = 0;
  canvas.height = 0;
  canvas.width = graph.offsetWidth;
  canvas.height = graph.offsetHeight;
  middleWidth = canvas.width / 2;
  middleHeight = canvas.height / 2;
  distanceFromCenter = Math.min(canvas.width, canvas.height) / 6;
  annulusThickness = Math.min(canvas.width, canvas.height) / 12;
  for (let i = 0; i < displayDepth; ++i) {
    drawAnnulus(getNthLayer(selectedNode, i), layerStart+i, selectedNode.value, ctxt, distanceFromCenter + (annulusThickness * i), annulusThickness, middleWidth, middleHeight, rootNode);
  }
}
globalThis.addEventListener("load", function() {
  initialize();
})
globalThis.addEventListener("resize", function() {
  initialize();
})
globalThis.addEventListener("mousemove", function(event) {
  // Change layer start and end later to be dynamic with current tree. 
  // Preferably, we distribute all this information with a few datatypes in order to reduce the length of this function

  result = hoverHandler(graphInfo.offsetWidth + middleWidth, middleHeight, sectorInfo, distanceFromCenter, annulusThickness, selectedNode, event.clientX, event.clientY, layerStart, layerStart+displayDepth, false);
  if (result) {
    selectedNode = result[0];
  }
})
globalThis.addEventListener("mousedown", function(event) {
  result = hoverHandler(graphInfo.offsetWidth + middleWidth, middleHeight, sectorInfo, distanceFromCenter, annulusThickness, selectedNode, event.clientX, event.clientY, layerStart, layerStart+displayDepth, true);
  console.log(result);
  if (result) {
    selectedNode = result[0];
    layerStart = result[1];
  }
  initialize();
})

