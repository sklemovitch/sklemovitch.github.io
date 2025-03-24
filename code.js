/**
  * Contains the information to display the element and store the information, will replace the sector info type
  * @param {String} label         -- Text saying what the element represents
  * @param {Number} value         -- The actual value of the node, is either a leaf or the sum of its children (EX: leaf node has value 10, siblings have value 20 and 30, parent value is 10+20+30=60)
  * @param {Object} children      -- The child nodes of the tree
  */
class Tree {
  constructor(label, value) {
    this.label = label;
    this.value = value;
    this.children = [];
  }
  addChild(tree, rootNode) {
    //If the children of the current tree include the name of the tree we are trying to add, then don't add
    if (this.children.length == 0) {
      this.value = tree.value;
    }
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
// NOTE: Could probably use a more efficient algorithm, but this is the easiest implementation
function getLayerCount(tree, layer) {
  if (getNthLayer(tree, layer).length == 0) {
    return layer;
  }
  else {
    return getLayerCount(tree, layer + 1);
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
  * @param {Number[]} quantityArray -- The numbers that determine the size of each sector, 2pi*(quantityArray[i]/total(quantityArray))
  * @param {Object} context         -- The canvas 2d context that we are drawing on
  * @param {Number} innerRadius     -- The inner radius of the annulus for all the sectors
  * @param {Number} thickness       -- Used to calclate the outer radius, inner radius + thickness = outer radius
  * @param {Number} centerX         -- The x value of the center point of the annulus
  * @param {Number} centerY         -- The y value of the center point of the annulus
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
    let accumulatedValue = 0
    for (let i = 0; i < treeLayer.length; ++i) {
      let startAngle = (accumulatedValue / rootValue) * (2 * Math.PI);
      let endAngle = ((treeLayer[i].value + accumulatedValue) / rootValue) * (2 * Math.PI);
      accumulatedValue += treeLayer[i].value

      let colorValue = ((255 / treeLayer.length) * i).toString();
      let color = "rgb(".concat(colorValue, ",", colorValue, ",", colorValue, ")");
      drawApplied(radius, startAngle, endAngle, color);
    }
  }
  return drawMultipleSectors(treeLayer, rootValue, innerRadius);
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
  * The function that handles displaying the tooltip when hovering over a sector
  * @param {Number} centerX             - The x value of the center of the annulus
  * @param {Number} centerY             - The y value of the center of the annulus
  * @param {Object} sectorInfoContainer - The container for the tooltip of the sector info
  * @param {Number} innerRadius         - The radius of the negative space in the circle
  * @param {Number} mouseX              - The x component of the coordinates of the mouse
  * @param {Number} mouseY              - The y component of the coordinates of the mouse
  * @param {Number} layerStart          - The layer that we are starting the calculation from
  * @param {Number} layerEnd            - The layer that we are ending the calculation from
  */
function displaySectorTooltip(centerX, centerY, sectorInfoContainer, innerRadius, thickness, tree, mouseX, mouseY, layerStart, layerEnd) {
  //Takes in a point, this function f has the property that if you have a ray go from the origin to (cos(f(x,y)), sin(f(x,y))), then it will pass through (x,y)
  // Thanks pythagoras
  const distance = Math.sqrt((mouseX - centerX) * (mouseX - centerX) + (mouseY - centerY) * (mouseY - centerY));
  const mouseAngle = Math.PI + Math.atan2(mouseX - centerX, centerY - mouseY); //centerY-mouseX because the viewport is from top to bottom

  function isInsideSector(mouseAngle, startAngle, endAngle) {
    // If the distance of the mouse is between the inner and outer part of the annulus (which we already checked in the which sector part)
    // and if the mouse is between the angles
    const inAngle = (startAngle < mouseAngle) && (mouseAngle < endAngle);
    // Then it's inside the sector
    return inAngle;
  }

  function whichSector(tree, innerRadius, thickness, distance, mouseAngle, layerStart, layerEnd) {
    for (i = layerStart; i <= layerEnd; ++i) {
      distanceIsCorrect = ((innerRadius + thickness * (i-layerStart)) < distance) && (distance < (innerRadius + (i - layerStart + 1) * thickness));
      if (distanceIsCorrect) {
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
    }
  }
  

  function finalize(tree, innerRadius, thickness, distance, mouseAngle, layerStart, layerEnd) {
    const sector = whichSector(tree, innerRadius, thickness, distance, mouseAngle, layerStart, layerEnd);
    if (sector) {
      return createToolTip(mouseX, mouseY, sectorInfoContainer, sector.value);
    }
    else {
      sectorInfoContainer.innerHTML = "";
      return false;
    }
  }
  finalize(tree, innerRadius, thickness, distance, mouseAngle, layerStart, layerEnd);
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

startLayer = 0;
endLayer = 2;

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
  for (let i = startLayer; i <= endLayer; ++i) {
    drawAnnulus(getNthLayer(tempTree, i), tempTree.value, ctxt, distanceFromCenter + (annulusThickness * (i-startLayer)), annulusThickness, middleWidth, middleHeight);
  }
}
window.addEventListener("load", function() {
  initialize();
})
window.addEventListener("resize", function() {
  initialize();
})
window.addEventListener("mousemove", function(event) {
  // Change layer start and end later to be dynamic with current tree.
  // Preferably, we distribute all this information with a few datatypes in order to reduce the length of this function
  displaySectorTooltip(graphInfo.offsetWidth + middleWidth, middleHeight, sectorInfo, distanceFromCenter, annulusThickness, tempTree, event.clientX, event.clientY, startLayer, endLayer);
})

