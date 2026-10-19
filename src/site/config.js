import{paletteDefaults}from'./palette.js';
import{processHeroSpecimens,generativeLoaders}from'./process-catalog.js';
export const defaultThemeKey='axiom-sans';
export const systems={'axiom-sans':{name:'Axiom Sans',font:'Hanken Grotesk',body:'Hanken Grotesk',headingSize:140,weight:500,tracking:'-.055em',layout:'split',defaultMode:'light',intent:'Blue, red and ivory, with restrained green and gold.',light:{bg:'#FCFCF4',ink:'#162D65',muted:'#4F5D79',a:'#4167C7',b:'#92AEDF',c:'#A83A42',d:'#FCFCF4',e:'#5F806B',f:'#C09A52',g:'#E8DDBF'}}};
export const newThemeKeys=[],exploratoryThemeKeys=[],referenceThemeKeys=[];
export const activeThemeKeys=[defaultThemeKey];
export const getTheme=()=>({...systems[defaultThemeKey],...systems[defaultThemeKey].light,...paletteDefaults,mode:'light'});
export const themes={'axiom-sans':getTheme()};
export const specimens={
 atcase:{name:'Aspartate Transcarbamoylase',file:'1D09-assembly1',format:'mmcif',category:'12-chain allosteric complex',source:'1D09 · biological assembly 1',rep:'illustrative',large:true,note:'Complete author-defined assembly, with catalytic and regulatory chains.'},
 atpase:{name:'F₁-ATPase',file:'1BMF',category:'Rotary enzyme complex',source:'1BMF',rep:'illustrative',large:true,note:'Catalytic head and central stalk of mitochondrial F₁-ATPase.'},
 packing:{name:'Aspirin · 3 × 3 × 2',file:'aspirin-packing',category:'Organic crystal',source:'COD 1515581',rep:'illustrative',note:'72 whole molecules. No cell boxes.'},
 cofolding:{name:'Barnase–barstar',file:'complex',category:'Protein–protein complex',source:'1BRS · chains A/D',rep:'illustrative',note:'Two interacting proteins. Experimental complex; not a generated prediction.'},
 myoglobin:{name:'Myoglobin',file:'1MBN',category:'Protein',source:'1MBN',rep:'illustrative',note:'Helical fold with a heme group.'},
 ubiquitin:{name:'Ubiquitin',file:'1UBQ',category:'Protein',source:'1UBQ',rep:'illustrative',note:'A compact mixed α/β fold.'},
};
export const widgetSpecimens=Object.fromEntries(['ubiquitin','myoglobin','cofolding'].map(k=>[k,specimens[k]]));
export const openingMolecules=Object.fromEntries(['atcase','atpase','packing'].map(k=>[k,specimens[k]]));
export const heroSpecimens={...openingMolecules,...processHeroSpecimens};
