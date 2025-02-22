/**
  * Contains the information used to generate and display a sector
  * @constructor
  * @param {number} startAngle - The angle (in radians) of where to start drawing the sector
  * @param {number} endAngle - The angle (in radians) of where to stop drawing the sector
  * @param {number} innerRadius - The inner radius of the annulus sector
  * @param {number} outerRadius - the outer radius of the annulus sector
  */
function SectorInfo(startAngle, endAngle, innerRadius , outerRadius, value){
  this.startAngle = startAngle;
  this.endAngle = endAngle;
  this.innerRadius = innerRadius;
  this.outerRadius = outerRadius;
  this.value = value;
}
/** Partially applies functions, making them easier to read*/
function partial(func, ...args) {
  return function(...moreArgs) {
    return func(...args, ...moreArgs);
  };
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
function EFFECTdrawAnnulus(quantityArray, context, innerRadius, thickness, centerX, centerY) {
  function EFFECTdrawAnnulusSector(context, centerX, centerY, thickness, radius, startAngle, endAngle, color) {
    context.fillStyle = color;
    context.beginPath();
    context.arc(centerX, centerY, radius, -1*startAngle, -1*endAngle, true);
    context.lineTo(centerX + Math.cos(-1*endAngle)*(radius+thickness), centerY + Math.sin(-1*endAngle)*(radius+thickness));
    context.arc(centerX, centerY, radius+thickness, -1*endAngle, -1*startAngle, false);
    context.lineTo(centerX + Math.cos(-1*startAngle)*radius, centerY + Math.sin(-1*startAngle)*radius);
    context.stroke();
    context.fill();
  } 
  //drawApplied takes radius,startAngle,endAngle,color
  const EFFECTdrawApplied = partial(EFFECTdrawAnnulusSector, context, centerX, centerY, thickness);
  // Returns the an array with information about all the sectors
  function EFFECTdrawMultipleSectors(quantityArray, radius, thickness) {
    let total = 0;
    for (let i = 0; i < quantityArray.length; ++i) {
      total += quantityArray[i];
    }
    let currentAmount = 0;
    let sectorInfoArray = [];
    for (let i = 0; i < quantityArray.length; ++i) {
      color = (255/quantityArray.length) * i;
      sectorInfoArray.push(new SectorInfo((currentAmount/total)*2*Math.PI,((currentAmount+quantityArray[i])/total)*2*Math.PI,radius,radius+thickness,quantityArray[i]));
      EFFECTdrawApplied(radius, sectorInfoArray[i].startAngle, sectorInfoArray[i].endAngle, "rgb("+color+','+color+','+color+')');
      currentAmount = currentAmount+quantityArray[i];
    }
    return sectorInfoArray;
  } 
  return EFFECTdrawMultipleSectors(quantityArray, innerRadius, thickness);
}
/** 
  * Styles and creates the contents of a provided container for a tooltip
  * ERASES CONTENTS OF THE TOOLTOOLTIP CONTAINER
  * @param {number} x - The number of pixels the top left corner of the element is from the left of your screen
  * @param {number} y - The number of pixels the top left corner of the element is from the top of your screen
  * @param {Object} toolTipContainer - The container which we are modifying
  * @param {...string} innerTexts - The texts inside the tooltips
  */
function EFFECTcreateToolTip(x,y,toolTipContainer, ...innerTexts) {
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
function EFFECTdisplaySectorTooltip(centerX, centerY, sectorInfoContainer, sectorInfoArray, mouseX, mouseY) {
  //Takes in a point, this function f has the property that if you have a ray go from the origin to (cos(f(x,y)), sin(f(x,y))), then it will pass through (x,y)
  function rectifiedArctan(x,y) {
    if (x == 0){
      if (y > 0) {
        return Math.PI/2;
      }
      if (y < 0) {
        return 3*Math.PI/2;
      }
    }
    if (x>0) {
      if (y > 0) {
        return Math.atan(y/x);
      }
      if (y < 0) {
        return 2*Math.PI + Math.atan(y/x);
      }
    }
    else {
      return Math.PI + Math.atan(y/x);
    }
  }
  function isInsideSector(centerX, centerY, mouseX, mouseY, sectorInfo) {
    // Thanks pythagoras
    const distance = Math.sqrt((mouseX-centerX)*(mouseX-centerX) + (mouseY-centerY)*(mouseY-centerY));
    const mouseAngle = rectifiedArctan(mouseX-centerX, centerY-mouseY);//centerY-mouseX because the viewport is from top to bottom
    // If the distance of the mouse is between the inner and outer part of the annulus
    const inAnnulus = (sectorInfo.innerRadius < distance) && (distance < sectorInfo.outerRadius);
    // If the mouse is between the angles
    const inAngle = (sectorInfo.startAngle < mouseAngle) && (mouseAngle < sectorInfo.endAngle);
    // Then it's inside the sector
    return inAnnulus && inAngle;
  }
  //Takes sectorInfo
  const appliedIsInsideSector = partial(isInsideSector, centerX, centerY, mouseX, mouseY);
  //Takes an array of sectorInfo objects, iterates through the array and if the mouse is inside the sector then return the sector, and if the mouse isn't inside the sector then return false;
  function whichSector(sectorInfoArray) {
    for (i = 0; i < sectorInfoArray.length; ++i) {
      if (appliedIsInsideSector(sectorInfoArray[i])) {
        return sectorInfoArray[i];
      }
    }
    return false;
  }

  function EFFECTfinalize(sectorInfoContainer, sectorInfoArray, mouseX, mouseY) {
    const sector = whichSector(sectorInfoArray);
    if (sector) {
      return EFFECTcreateToolTip(mouseX, mouseY, sectorInfoContainer, sector.value);
    }
    else {
      sectorInfoContainer.innerHTML = "";
      return false;
    }
  }
  EFFECTfinalize(sectorInfoContainer, sectorInfoArray, mouseX, mouseY);
}
//Element and element properties definition
const canvas = document.getElementById("myCanvas");
const graphInfo = document.getElementById("graphInfo");
const graph = document.getElementById("graph");
const body = document.querySelector("body");
const sectorInfo = document.getElementById("sectorInfo")
const ctxt = canvas.getContext("2d");

// Parameters for the circle in the canvas
let middleWidth = canvas.width/2;
let middleHeight = canvas.height/2;
let distanceFromCenter = Math.min(canvas.width, canvas.height)/6;
let circleThickness = Math.min(canvas.width, canvas.height)/12;
const dollarAmount = [100,100,200,300,500,800,1300,2100];

let sectors = [];
/**
  * Sets up the size of the annulus using the dimensions of the graph (which are dependent on the dimensions of the window)
  */
function initialize() {
  ctxt.clearRect(0,0,canvas.width, canvas.height);
  canvas.width = 0;
  canvas.height = 0;
  canvas.width = graph.offsetWidth;
  canvas.height = graph.offsetHeight;
  middleWidth = canvas.width/2;
  middleHeight = canvas.height/2;
  distanceFromCenter = Math.min(canvas.width, canvas.height)/6;
  circleThickness = Math.min(canvas.width, canvas.height)/12;
  sectors = EFFECTdrawAnnulus(dollarAmount, ctxt, distanceFromCenter, circleThickness, middleWidth, middleHeight); 
}
window.addEventListener("load", function(event){
  initialize();
})
window.addEventListener("resize", function(event) {
  initialize();
})
window.addEventListener("mousemove", function(event){
  EFFECTdisplaySectorTooltip(graphInfo.offsetWidth+middleWidth, 
    middleHeight, 
    sectorInfo,
    sectors, 
    event.clientX, 
    event.clientY)
})

