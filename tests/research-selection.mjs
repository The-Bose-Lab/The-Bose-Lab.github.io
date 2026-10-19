import assert from 'node:assert/strict';
import {researchSelection} from '../src/site/research-selection.js';
let visible='';const state=researchSelection(id=>visible=id);
state.hover('science');assert.equal(visible,'science');
state.leave();assert.equal(visible,'','Leaving a card for empty space must close it');
state.focus('safety');assert.equal(visible,'safety');
state.pointer();state.hover('science');state.leave();
assert.equal(visible,'','Mouse focus must not resurrect an empty focused card');
state.select('sampling');state.leave();assert.equal(visible,'sampling','Touch selection survives pointer exit');
state.clear();assert.equal(visible,'','An outside tap dismisses touch selection');
state.focus('foundations');state.blur();assert.equal(visible,'');
for(let i=0;i<50;i++){state.hover('science');state.hover('safety');state.leave();assert.equal(visible,'');}
console.log('Research hover exit, stale focus, touch dismissal and rapid changes passed.');
