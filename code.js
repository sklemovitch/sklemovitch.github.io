
/**
  * Contains the information to display the element and store the information, will replace the sector info type
  * @param {String} label -- Text saying what the element represents
  * @param {Number} value -- The actual value of the node, is either a leaf or the sum of its children (EX: leaf node has value 10, siblings have value 20 and 30, parent value is 10+20+30=60)
  * @param {Number} relativeValue -- Used to determine position in sector drawing, is equal to relative value of the parent plus the value of the previous tree nodes in the array
  * @param {Object} children -- The child nodes of the tree
  */
class Tree {
  constructor(label, value) {
    this.label = label;
    this.value = value;
    this.relativeValue = 0;
    this.children = [];
  }
  addChild(tree, rootNode) {
    //If the children of the current tree include the name of the tree we are trying to add, then don't add
    if (this.children.length == 0) {
      this.value = tree.value;
    }
    this.children.push(tree);
    cascadeValue(rootNode);
    cascadeRelativeValue(rootNode, 0);
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
// NOTE: Could probably use a more efficient algorithm, but this is the easiest implementation
function getLayerCount(tree, layer) {
  if (getNthLayer(tree, layer).length == 0) {
    return layer;
  }
  else {
    return getLayerCount(tree, layer + 1);
  }
}
/**
  * Used to propopgate the correct relative values (as defined in the docs for the tree type)
  * @param {Object} tree -- The tree in the current step in the process
  * @param {number} inputRelativeValue -- The relative value that the tree should be assigned
  */
function cascadeRelativeValue(tree, inputRelativeValue) {
  tree.relativeValue = inputRelativeValue;
  tree.children.reduce((acc, cur) => acc + cascadeRelativeValue(cur, acc), inputRelativeValue);
  return tree.value;
}
function cascadeValue(tree) {
  if (tree.children.length != 0) {
    realValue = tree.children.reduce((acc, cur) => acc + cascadeValue(cur), 0);
    tree.value = realValue;
  }
  return tree.value;
}

/** Partially applies functions, making them easier to read*/
function partial(func, ...args) {
  return function(...moreArgs) {
    return func(...args, ...moreArgs);
  };
}

/*
 * Empties the listElement and fills it with information about the tree object
 */
function displayTreeChildren(listElement, tree, unit) {
  function createListElement(container, valueName, value) {
    let newListElement = document.createElement("li");
    newListElement.innerHTML = valueName.concat(value);
    container.append(newListElement);
  }
  function resultFunc(listElement, tree, unit) {
    listElement.innerHTML = "";
    const treeChildren = tree.children;
    for (let index in tree.children) {
      const child = treeChildren[index];
      let newTreeList = document.createElement("ul");
      createListElement(newTreeList, "Label: ", child.label);
      // Why the fuck are dollars, like, the only unit written on the left side
      if (unit == "$") {
        createListElement(newTreeList, "Value: ", unit.concat(child.value.toString()));
      }
      else {
        createListElement(newTreeList, "Value: ", child.value.toString().concat(unit));
      }

      createListElement(newTreeList, "Is leaf: ", child.children.length == 0)
      let newList = document.createElement("li");
      newList.class = "no-bullet";
      newList.append(newTreeList);
      listElement.append(newList);
    }
  }
  resultFunc(listElement, tree, unit);
}
/**
  * Draws an annulus with a center at (centerX, centerY) with an innerRadius of innerRadius
  * @param {number[]} quantityArray - The numbers that determine the size of each sector, 2pi*(quantityArray[i]/total(quantityArray))
  * @param {Object} context - The canvas 2d context that we are drawing on
  * @param {number} innerRadius - The inner radius of the annulus for all the sectors
  * @param {number} thickness - Used to calclate the outer radius, inner radius + thickness = outer radius
  * @param {number} centerX - The x value of the center point of the annulus
  * @param {number} centerY - The y value of the center point of the annulus
  */
function drawAnnulus(treeLayer, rootValue, context, innerRadius, thickness, centerX, centerY) {
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
  // Returns the an array with information about all the sectors
  function drawMultipleSectors(treeLayer, rootValue, radius) {
    for (let i = 0; i < treeLayer.length; ++i) {
      let startAngle = (treeLayer[i].relativeValue / rootValue) * (2 * Math.PI);
      let endAngle = ((treeLayer[i].value + treeLayer[i].relativeValue) / rootValue) * (2 * Math.PI);
      let colorValue = ((255 / treeLayer.length) * i).toString();
      let color = "rgb(".concat(colorValue, ",", colorValue, ",", colorValue, ")");
      console.log(startAngle, endAngle, color);
      drawApplied(radius, startAngle, endAngle, color);
    }
  }
  return drawMultipleSectors(treeLayer, rootValue, innerRadius);
}
/** 
  * Styles and creates the contents of a provided container for a tooltip
  * ERASES CONTENTS OF THE TOOLTIP CONTAINER
  * @param {number} x - The number of pixels the top left corner of the element is from the left of your screen
  * @param {number} y - The number of pixels the top left corner of the element is from the top of your screen
  * @param {Object} toolTipContainer - The container which we are modifying
  * @param {...string} innerTexts - The texts inside the tooltips
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
  * The function that handles displaying the tooltip when hovering over a sector
  * @param {number} centerX - The x value of the center of the annulus
  * @param {number} centerY - The y value of the center of the annulus
  * @param {Object} sectorInfoContainer - The container for the tooltip of the sector info
  * @param {Object[]} sectorInfoArray - The array of sectorInfo objects used to determine what info the sector info should display
  * @param {number} mouseX - The x component of the coordinates of the mouse
  * @param {number} mouseY - The y component of the coordinates of the mouse
  */
function displaySectorTooltip(centerX, centerY, sectorInfoContainer, innerRadius, thickness, tree, mouseX, mouseY) {
  //Takes in a point, this function f has the property that if you have a ray go from the origin to (cos(f(x,y)), sin(f(x,y))), then it will pass through (x,y)
  // Thanks pythagoras
  const distance = Math.sqrt((mouseX - centerX) * (mouseX - centerX) + (mouseY - centerY) * (mouseY - centerY));
  const mouseAngle = atan2(mouseX - centerX, centerY - mouseY); //centerY-mouseX because the viewport is from top to bottom

  function atan2(x, y) {
    if (x == 0) {
      if (y > 0) {
        return Math.PI / 2;
      }
      if (y < 0) {
        return 3 * Math.PI / 2;
      }
    }
    if (x > 0) {
      if (y > 0) {
        return Math.atan(y / x);
      }
      if (y < 0) {
        return 2 * Math.PI + Math.atan(y / x);
      }
    }
    else {
      return Math.PI + Math.atan(y / x);
    }
  }

  function isInsideSector(mouseAngle, startAngle, endAngle) {
    // If the distance of the mouse is between the inner and outer part of the annulus (which we already checked in the which sector part)
    // and if the mouse is between the angles
    const inAngle = (startAngle < mouseAngle) && (mouseAngle < endAngle);
    // Then it's inside the sector
    return inAngle;
  }

  function whichSector(tree, innerRadius, thickness, distance, mouseAngle) {
    i = 0
    while (i < 4) {
      if (((innerRadius + thickness * i) < distance) && (distance < (innerRadius + (i + 1) * thickness))) { //If the mouse's distance is between the expected distance for that layer, makes sure we don't check unnecessarily
        sectors = getNthLayer(tree, i)
        if (sectors.length == 0) {
          return false;
        }
        // Maps the subtree to its start and end angles in order to input it into the isInsideSector
        sectorsAngles = sectors.map((subTree) => [(subTree.relativeValue / tree.value) * Math.PI * 2, ((subTree.relativeValue + subTree.value) / tree.value) * Math.PI * 2]);
        // NOTE: Could probably implement binary search here, but too lazy
        for (let j = 0; j < sectors.length; ++j) {
          if (isInsideSector(mouseAngle, sectorsAngles[j][0], sectorsAngles[j][1])) {
            return sectors[j];
          }
        }
      }
      ++i;
    }

  }

  function finalize(tree, innerRadius, thickness, distance, mouseAngle) {
    const sector = whichSector(tree, innerRadius, thickness, distance, mouseAngle);
    if (sector) {
      return createToolTip(mouseX, mouseY, sectorInfoContainer, sector.value);
    }
    else {
      sectorInfoContainer.innerHTML = "";
      return false;
    }
  }
  finalize(tree, innerRadius, thickness, distance, mouseAngle);
}
//Element and element properties definition
const canvas = document.getElementById("myCanvas");
const graphInfo = document.getElementById("graphInfo");
const childList = document.getElementById("childList");
const graph = document.getElementById("graph");
const body = document.querySelector("body");
const sectorInfo = document.getElementById("sectorInfo");
const ctxt = canvas.getContext("2d");

// Parameters for the circle in the canvas
let middleWidth = canvas.width / 2;
let middleHeight = canvas.height / 2;
let distanceFromCenter = Math.min(canvas.width, canvas.height) / 6;
let circleThickness = Math.min(canvas.width, canvas.height) / 12;

const unit = "$";
let tempTree = new Tree("Main", 0);
let childTree1 = new Tree("Child1", 0);
let childTree2 = new Tree("Child2", 0);
let childTree3 = new Tree("Child3", 0);
tempTree.addChild(childTree1, tempTree);
tempTree.addChild(childTree2, tempTree);
tempTree.addChild(childTree3, tempTree);
childTree1.addChild(new Tree("Child1", 5), tempTree);
childTree1.addChild(new Tree("Child2", 5), tempTree);
childTree2.addChild(new Tree("Child1", 5), tempTree);
childTree2.addChild(new Tree("Child2", 5), tempTree);
childTree3.addChild(new Tree("Child1", 5), tempTree);
childTree3.addChild(new Tree("Child2", 5), tempTree);
displayTreeChildren(childList, tempTree, unit);
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
  for (let i = 0; i < getLayerCount(tempTree, 0); ++i) {
    drawAnnulus(getNthLayer(tempTree, i), tempTree.value, ctxt, distanceFromCenter + (annulusThickness * i), annulusThickness, middleWidth, middleHeight);
  }
}
window.addEventListener("load", function() {
  initialize();
})
window.addEventListener("resize", function() {
  initialize();
})
window.addEventListener("mousemove", function(event) {
  displaySectorTooltip(graphInfo.offsetWidth + middleWidth, middleHeight, sectorInfo, distanceFromCenter, annulusThickness, tempTree, event.clientX, event.clientY);
})

