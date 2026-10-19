import {motionRate,cosinePhase} from './motion-clock.js';
import {T,BaseScene,Beads} from './visual-primitives.js';
// Deposited coordinates, shared atom radii and palette, without cell boxes.
export class AtlasMolecularScene extends BaseScene{
 constructor(text,view,theme,crystal=false,{chainColours,format}={}){
  super(theme,{view:view.direction.map(x=>x*8)});this.camera.up.set(...view.up);this.camera.lookAt(0,0,0);this.camera.updateMatrixWorld();
  let atoms;
  if(format==='mmcif'){
   const lines=text.split('\n'),headers=lines.filter(l=>l.startsWith('_atom_site.')).map(l=>l.trim().slice(11)),at=name=>headers.indexOf(name);
   atoms=lines.filter(l=>(crystal?/^(ATOM|HETATM)\s/.test(l):/^ATOM\s/.test(l))).map(l=>l.trim().split(/\s+/)).filter(a=>!['H','D'].includes(a[at('type_symbol')])).map(a=>({p:['Cartn_x','Cartn_y','Cartn_z'].map(k=>Number(a[at(k)])),element:a[at('type_symbol')],chain:a[at('label_asym_id')]}));
  }else atoms=text.split('\n').filter(l=>(crystal?/^(ATOM  |HETATM)/.test(l):/^ATOM  /.test(l))&&!['H','D'].includes(l.slice(76,78).trim())).map(l=>({p:[30,38,46].map(i=>Number(l.slice(i,i+8))),element:l.slice(76,78).trim(),chain:l.slice(21,22)}));
  const box=new T.Box3();atoms.forEach(a=>box.expandByPoint(new T.Vector3(...a.p)));const centre=box.getCenter(new T.Vector3()),scale=3.4/box.getSize(new T.Vector3()).length();this.atoms=atoms.map(a=>({...a,p:a.p.map((x,k)=>(x-centre.getComponent(k))*scale),radius:({O:1.52,N:1.55,S:1.8,C:1.7}[a.element]||1.7)*scale*(crystal?.76:1)}));
  this.root=new T.Group();this.scene.add(this.root);this.beads=new Beads(this.root,atoms.length,theme,.055,atoms.length>5000?[12,8]:[24,16]);this.beads.update(this.atoms.map(a=>a.p),this.atoms.map(a=>a.radius),this.atoms.map(a=>crystal?(a.element==='O'?theme.c:a.element==='N'?theme.d:theme.a):chainColours?.[a.chain]??(a.chain==='D'?theme.d:theme.a)));this.measure();const up=new T.Vector3().setFromMatrixColumn(this.camera.matrixWorld,1);this.anchor=this.atoms.reduce((a,b)=>new T.Vector3(...b.p).dot(up)-b.radius<new T.Vector3(...a.p).dot(up)-a.radius?b:a);this.update(0);
 }
 measure(){const box=new T.Box3();for(const a of this.atoms){const p=new T.Vector3(...a.p).applyMatrix4(this.camera.matrixWorldInverse);box.expandByPoint(p.clone().addScalar(a.radius+.10));box.expandByPoint(p.clone().addScalar(-a.radius-.10));}this.envelope={x0:box.min.x,x1:box.max.x,y0:box.min.y,y1:box.max.y};}
 fit(w,h){const e=this.envelope,unit=Math.max((e.x1-e.x0)/w,(e.y1-e.y0)/h)*1.14,cx=(e.x0+e.x1)/2,cy=(e.y0+e.y1)/2;this.camera.left=cx-w*unit/2;this.camera.right=cx+w*unit/2;this.camera.top=cy+h*unit/2;this.camera.bottom=cy-h*unit/2;this.camera.updateProjectionMatrix();}
 connectorPoint(){this.root.updateMatrixWorld(true);let bottom;for(const atom of this.atoms){const p=new T.Vector3(...atom.p).applyMatrix4(this.root.matrixWorld).applyMatrix4(this.camera.matrixWorldInverse);p.y-=atom.radius;if(!bottom||p.y<bottom.y)bottom=p;}bottom.y-=.015;return{x:(bottom.x-this.camera.left)/(this.camera.right-this.camera.left)*2-1,y:(bottom.y-this.camera.bottom)/(this.camera.top-this.camera.bottom)*2-1};}

 update(t){this.elapsed=t;this.phase=cosinePhase(t);this.root.rotation.set(.05*Math.sin(t*motionRate),.16*Math.sin(t*motionRate+.3),.025*Math.sin(t*motionRate+.7));}
}
