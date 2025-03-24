- Add functionality to the tree so it manages relative values properly
- Get it to display using sectors
- Add functionality to add children manually
- Add functionality to export and import trees to share graphs


- Color plan:
  - Root node is black
  - First layer is 100% saturation, 20% lightness, Hue is (360/parent ) * (position in parent)
  - First mode has hue of parent, 40% lightness, saturation (50/children of parent) + 50
  - Second mode has hue of parent, 60% lightness, saturation (50/children of parent)
  - Alternate between first and second mode
  
