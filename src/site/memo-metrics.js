// Shared composition dimensions; every renderer uses this same visual box.
export const memoMetrics=Object.freeze({slotWidth:184,slotHeight:160,rowPitch:120,textGap:18,box:Object.freeze({x:12,y:4,width:160,height:152}),sequenceHeight:132,contourWidth:.5});

// Frame-2 terrain: .009 world radius projects to .74 CSS px at its184x160 slot.
export const terrainContourStyle=Object.freeze({radius:.009,width:.74,opacity:.42});
