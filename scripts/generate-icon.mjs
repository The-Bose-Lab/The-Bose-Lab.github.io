import {writeFile} from 'node:fs/promises';
import {molecularMark} from '../src/site/motifs.js';
const mix=(a,b,t)=>'#'+[0,1,2].map(i=>Math.round(parseInt(a.slice(i*2+1,i*2+3),16)*t+parseInt(b.slice(i*2+1,i*2+3),16)*(1-t)).toString(16).padStart(2,'0')).join('');
const blue='#4167C7',bg='#FCFCF4',ink='#162D65',palette={a:blue,b:mix(blue,bg,.6),c:mix(blue,bg,.8),d:mix(blue,bg,.7)};
let svg=molecularMark('publication').replace('viewBox="-17 -17 34 34"','viewBox="-15 -15 30 30" width="64" height="64"').replace(' aria-hidden="true"','').replace(/<title>.*?<\/title>/,'<title>Bose Lab</title>').replaceAll('var(--outline,var(--ink))',ink).replace(/var\(--([abcd])\)/g,(_,slot)=>palette[slot]);
svg=svg.replace(/color-mix\(in srgb,(#[\da-f]+) ([\d.]+)%,(white|#[\da-f]+)\)/gi,(_,a,t,b)=>mix(a,b==='white'?'#FFFFFF':b,Number(t)/100));
await writeFile('public/favicon.svg',svg+'\n');
