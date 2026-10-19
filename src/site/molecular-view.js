const hex=x=>parseInt(x.slice(1),16);
export const viewerOptions=theme=>({layoutIsExpanded:false,layoutShowControls:false,layoutShowRemoteState:false,layoutShowSequence:false,layoutShowLog:false,layoutShowLeftPanel:false,collapseLeftPanel:true,viewportShowExpand:false,viewportShowControls:false,viewportShowSettings:false,viewportShowSelectionMode:false,viewportShowAnimation:false,viewportShowReset:false,viewportShowScreenshotControls:false,viewportShowToggleFullscreen:false,viewportShowTrajectoryControls:false,viewportFocusBehavior:'disabled',volumeStreamingDisabled:true,viewportBackgroundColor:theme.bg,illumination:false,extensions:['mvs'],resolutionMode:'native',pixelScale:1});
export function representations(plugin){return plugin.state.data.selectQ(x=>x.ofType(molstar.lib.plugin.PluginStateObject.Molecule.Structure.Representation3D));}
export async function illustrativeStyle(plugin,theme,{large=false}={}){
 plugin.canvas3d.setProps({transparentBackground:true,checkeredTransparentBackground:false,camera:{mode:'orthographic',helper:{axes:{name:'off',params:{}}}},renderer:{backgroundColor:hex(theme.bg),ambientIntensity:theme.mode==='dark'?.9:.85,light:[{inclination:140,azimuth:320,color:0xffffff,intensity:.32}]},postprocessing:{occlusion:{name:'on',params:{multiScale:{name:'off',params:{}},radius:4.5,bias:.8,blurKernelSize:7,blurDepthBias:.5,samples:64,resolutionScale:1,color:hex(theme.mode==='dark'?'#06151C':'#233B50'),transparentThreshold:.4}},outline:{name:'on',params:{scale:1,threshold:.45,color:hex(theme.outline|| (theme.mode==='dark'?theme.bg:theme.ink)),includeTransparent:false}},shadow:{name:'off',params:{}},background:{variant:{name:'off',params:{}}}},cameraFog:{name:'off',params:{}},multiSample:{mode:'off',sampleLevel:3},trackball:{animate:{name:'off',params:{}},autoAdjustMinMaxDistance:{name:'off',params:{}},maxDistance:1e150}});
 const cells=representations(plugin),update=plugin.state.data.build();for(const cell of cells){const v=cell.params.values;update.to(cell.transform.ref).update({...v,type:{name:v.type.name,params:{...v.type.params,quality:'high',...(v.type.name==='spacefill'?{lodLevels:[]}:{}),ignoreLight:false,material:{metalness:0,roughness:1,bumpiness:0}}}});}if(cells.length)await update.commit();for(const c of cells){c.obj.data.repr.setState({pickable:false});for(const r of c.obj.data.repr.renderObjects)r.state.pickable=false;}return cells;
}
export async function rendered(plugin,count=2){plugin.canvas3d.commit(true);plugin.canvas3d.notifyDidDraw=true;await new Promise(resolve=>{let n=0,armed=false;const sub=plugin.canvas3d.didDraw.subscribe(()=>{if(!armed)return;if(++n>=count){sub.unsubscribe();resolve();}else plugin.canvas3d.requestDraw();});armed=true;plugin.canvas3d.requestDraw();});}
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],unit=a=>{const n=Math.hypot(...a);return a.map(v=>v/n)},cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
// Orthographic silhouette fitting uses the actual rendered sphere/mesh positions.
// Physical dimensions do not set visual prominence. Padding includes atom radii and motion.
export function fitFootprint(plugin,cells,{box,artWidth=1440,artHeight=900,padding=5,radius=100}={}){
 // MVS camera snapshots can restore perspective after setProps; settle that reset first.
 const camera=plugin.canvas3d.camera;camera.transition.finish(camera.transition.target);camera.setState({mode:'orthographic'},0);camera.transition.finish(camera.transition.target);camera.update();const direction=unit(camera.state.position.map((v,k)=>v-camera.state.target[k])),right=unit(cross(camera.state.up,direction)),up=unit(cross(direction,right));let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity,count=0,points=[];
 for(const cell of cells)for(const obj of cell.obj.data.repr.renderObjects){const values=obj.values,spheres=values.tPositionGroup?.ref.value.array,mesh=values.aPosition?.ref.value,a=spheres||mesh;if(!a)continue;const stride=spheres?4:3,n=Math.min(a.length/stride,(values.uVertexCount?.ref.value||a.length/stride)/(spheres?6:1));for(let i=0;i<n;i++){const p=[a[i*stride],a[i*stride+1],a[i*stride+2]],x=dot(p,right),y=dot(p,up);if(!Number.isFinite(x+y))continue;points.push(...p);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);count++;}}
 if(!count)throw Error('Cannot frame an empty molecular scene');
 const old=camera.state.target,centre=old.map((v,k)=>v+right[k]*((x0+x1)/2-dot(old,right))+up[k]*((y0+y1)/2-dot(old,up)));
 const worldPerPixel=Math.max((x1-x0+padding*2)/(box.width*camera.viewport.width/artWidth),(y1-y0+padding*2)/(box.height*camera.viewport.height/artHeight)),current=camera.getPixelSize(centre),distance=Math.hypot(...camera.state.position.map((v,k)=>v-camera.state.target[k]))*worldPerPixel/current;
 camera.setState({target:centre,position:centre.map((v,k)=>v+direction[k]*distance),radius:radius+6,radiusMax:Math.max(camera.state.radiusMax,radius+6)},0);camera.transition.finish(camera.transition.target);camera.update();
 const projected=camera.project([0,0,0,0],centre),units=camera.getPixelSize(centre),dx=camera.viewport.x+(box.x+box.width/2)/artWidth*camera.viewport.width-projected[0],dy=camera.viewport.y+(1-(box.y+box.height/2)/artHeight)*camera.viewport.height-projected[1],offset=right.map((v,k)=>(-v*dx-up[k]*dy)*units);
 camera.setState({target:camera.state.target.map((v,k)=>v+offset[k]),position:camera.state.position.map((v,k)=>v+offset[k])},0);camera.transition.finish(camera.transition.target);camera.update();
 const result={width:x1-x0,height:y1-y0,count,padding,mode:camera.state.mode,centre,direction,up,radius};Object.defineProperty(result,'points',{value:Float32Array.from(points)});return result;
}

// Resolve contours in the final display pixel grid, with 3x spatial supersampling.
// Large canvases have a bounded physical pixel budget, not a blanket low-DPI mode.
export function trackResolution(plugin){
 const canvas=plugin.canvas3dContext.canvas;let lastScale;
 function sync(){const board=canvas.closest('#opening'),scale=board?board.getBoundingClientRect().width/Number(board.dataset.artWidth||1440):1;
  const gl=plugin.canvas3dContext.webgl.gl,limit=gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),dpr=Math.max(3,devicePixelRatio),w=canvas.clientWidth,h=canvas.clientHeight;
  const physical=Math.min(scale*dpr,Math.sqrt(12000000/(w*h)),limit/Math.max(w,h));
  const pixelScale=physical/devicePixelRatio;
  if(pixelScale===lastScale)return;lastScale=pixelScale;
  plugin.canvas3dContext.setProps({resolutionMode:'native',pixelScale});plugin.canvas3d.requestDraw();
  canvas.dataset.displaySampling=String(physical/scale);document.documentElement.dataset.renderScale=String(pixelScale);
 }
 sync();addEventListener('resize',sync);sync.dispose=()=>{removeEventListener('resize',sync);removeEventListener('pageshow',sync);};addEventListener('pagehide',e=>{if(!e.persisted)sync.dispose();});addEventListener('pageshow',sync);return sync;
}
// Move the camera framing rather than resampling a shrunken full-screen bitmap.
// The molecular geometry, view direction and elastic motion stay unchanged.
export function frameFootprintBox(plugin,fr,box){
 const camera=plugin.canvas3d.camera,artWidth=plugin.canvas3dContext.canvas.clientWidth,artHeight=plugin.canvas3dContext.canvas.clientHeight,units=Math.max((fr.width+fr.padding*2)/(box.width*camera.viewport.width/artWidth),(fr.height+fr.padding*2)/(box.height*camera.viewport.height/artHeight));
 const distance=Math.hypot(...camera.state.position.map((v,k)=>v-camera.state.target[k]))*units/camera.getPixelSize(camera.state.target);
 const right=unit(cross(fr.up,fr.direction)),dx=((box.x+box.width/2)/artWidth-.5)*camera.viewport.width,dy=(.5-(box.y+box.height/2)/artHeight)*camera.viewport.height;
 const target=fr.centre.map((v,k)=>v-(right[k]*dx+fr.up[k]*dy)*units);
 camera.setState({mode:'orthographic',target,position:target.map((v,k)=>v+fr.direction[k]*distance),up:fr.up,radius:fr.radius+6,radiusMax:Math.max(camera.state.radiusMax,fr.radius+6)},0);camera.transition.finish(camera.transition.target);camera.update();plugin.canvas3d.requestDraw();document.documentElement.dataset.heroRenderMethod='camera-framing';
}
