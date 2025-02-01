function SectorInfo(startAngle, endAngle, lowerRadius, upperRadius, value){
  this.startAngle = startAngle;
  this.endAngle = endAngle;
  this.lowerRadius = lowerRadius;
  this.upperRadius = upperRadius;
  this.value = value;
}
//Partially applies functions
function partial(func, ...args) {
  return function(...moreArgs) {
    return func(...args, ...moreArgs);
  };
}

function EFFECTdrawConcentricRings(quantityArray, context, initialRadius, thickness, centerX, centerY) {
  function EFFECTdrawRingSector(context, centerX, centerY, thickness, radius , startAngle, endAngle, color) {
    context.fillStyle = color;
    context.beginPath();
    context.arc(centerX, centerY, radius, -1*startAngle, -1*endAngle, true);
    context.stroke()
    context.lineTo(centerX + Math.cos(-1*endAngle)*(radius+thickness), centerY + Math.sin(-1*endAngle)*(radius+thickness));
    context.stroke()
    context.arc(centerX, centerY, radius+thickness, -1*endAngle, -1*startAngle, false);
    context.stroke()
    context.lineTo(centerX + Math.cos(-1*startAngle)*radius, centerY + Math.sin(-1*startAngle)*radius);
    context.stroke()
    context.fill()
  } 
  //drawApplied takes radius,startAngle,endAngle,color
  const EFFECTdrawApplied = partial(EFFECTdrawRingSector, context, centerX, centerY, thickness);
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
  return EFFECTdrawMultipleSectors(quantityArray, initialRadius, thickness);
}
// Handles displaying the tooltip when you hover over a sector, giving you information about the sector
//ERASES CONTENTS OF THE TOOLTOOLTIP CONTAINER
function EFFECTcreateToolTip(x,y,toolTipContainer, ...args) {
  toolTipContainer.innerHTML = "";
  toolTipContainer.style.left = x + "px";
  toolTipContainer.style.top = y + "px";
  let element;
  let i = 0;
  for (const arg of args) {
    element = document.createElement("p");
    element.textContent = arg;
    toolTipContainer.appendChild(element);
    ++i;
  }
}
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
    const inAnnulus = (sectorInfo.lowerRadius < distance) && (distance < sectorInfo.upperRadius);
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
    console.log(sector);
    if (sector) {
      return EFFECTcreateToolTip(mouseX, mouseY, sectorInfoContainer, sector.value);
    }
    else {
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

canvas.width = graph.offsetWidth;
canvas.height = graph.offsetHeight;
const distanceFromCenter = Math.min(canvas.width, canvas.height)/6;
const circleThickness = Math.min(canvas.width, canvas.height)/12;

// Parameters for the middle of the circle in the canvas
let middleWidth = canvas.width/2;
let middleHeight = canvas.height/2;

const dollarAmount = [100,100,200,300,500,800,1300,2100];

let sectors = [];
window.addEventListener("load", function(event){
  middleWidth = canvas.width/2;
  middleHeight = canvas.height/2;
  sectors = EFFECTdrawConcentricRings(dollarAmount, ctxt, distanceFromCenter, circleThickness, middleWidth, middleHeight);
  EFFECTcreateToolTip(100, 100, document.getElementById("sectorInfo"), "Welcome to CostCo", "I love you");
  
})
window.addEventListener("mousemove", function(event){
  EFFECTdisplaySectorTooltip(graphInfo.offsetWidth+middleWidth, 
    middleHeight, 
    sectorInfo,
    sectors, 
    event.clientX, 
    event.clientY)
})

