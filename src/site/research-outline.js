import {memoMetrics} from './memo-metrics.js';
import * as T from 'three';
// Identical screen-space contours for atom surfaces, sphere and terrain.
// Width uses the shared composition pixel scale, independent of specimen dimensions.
export class ResearchOutline {
 constructor(renderer){this.renderer=renderer;this.colour=new T.WebGLRenderTarget(1,1,{depthBuffer:true,samples:4});this.colour.texture.colorSpace=T.SRGBColorSpace;this.colour.depthTexture=new T.DepthTexture(1,1,T.UnsignedIntType);this.normal=new T.WebGLRenderTarget(1,1,{depthBuffer:true,samples:4});this.normal.depthTexture=new T.DepthTexture(1,1,T.UnsignedIntType);this.normalMaterial=new T.MeshNormalMaterial({side:T.DoubleSide});this.scene=new T.Scene();this.camera=new T.OrthographicCamera(-1,1,1,-1,0,1);
  this.material=new T.ShaderMaterial({depthTest:false,depthWrite:false,transparent:true,uniforms:{colour:{value:this.colour.texture},depth:{value:this.normal.depthTexture},normal:{value:this.normal.texture},stepSize:{value:new T.Vector2()},ink:{value:new T.Color()},strength:{value:1},softMask:{value:0}},vertexShader:'varying vec2 uv0;void main(){uv0=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:`
   varying vec2 uv0;uniform sampler2D colour,depth,normal;uniform vec2 stepSize;uniform vec3 ink;uniform float softMask;
   void main(){vec4 c=texture2D(colour,uv0);vec4 surface=texture2D(normal,uv0);vec3 n=surface.rgb;float d=texture2D(depth,uv0).r;float edge=0.;
    for(int i=0;i<8;i++){float a=float(i)*.785398163;vec2 q=uv0+vec2(cos(a),sin(a))*stepSize;vec4 b=texture2D(colour,q);vec4 neighbour=texture2D(normal,q);vec3 m=neighbour.rgb;float e=texture2D(depth,q).r;
     float silhouette=smoothstep(.1,.6,abs(surface.a-neighbour.a));float crease=smoothstep(.65,.95,length(n-m))*step(.5,surface.a)*step(.5,neighbour.a);float opposite=texture2D(depth,uv0-vec2(cos(a),sin(a))*stepSize).r;float gap=smoothstep(.0018,.004,abs(e+opposite-2.*d))*step(.5,surface.a)*step(.5,neighbour.a);edge=max(edge,max(silhouette,max(crease,gap)));}
    if(softMask>.5&&c.a>.0001)c.rgb/=c.a;edge*=1.-softMask;gl_FragColor=vec4(mix(c.rgb,ink,edge),mix(max(c.a,edge),c.a,softMask));
    #include <colorspace_fragment>
   }`});this.quad=new T.Mesh(new T.PlaneGeometry(2,2),this.material);this.scene.add(this.quad);
 }
 render(scene,camera,width,height,ratio,theme){const r=this.renderer;this.colour.setSize(width,height);this.normal.setSize(width,height);r.setRenderTarget(this.colour);r.clear();r.render(scene,camera);const omitted=[];scene.traverse(o=>{if(o.visible&&o.userData.skipOutline){omitted.push(o);o.visible=false;}});const old=scene.overrideMaterial;scene.overrideMaterial=this.normalMaterial;r.setRenderTarget(this.normal);r.clear();r.render(scene,camera);scene.overrideMaterial=old;for(const o of omitted)o.visible=true;r.setRenderTarget(null);this.material.uniforms.stepSize.value.set( memoMetrics.contourWidth*ratio/width,memoMetrics.contourWidth*ratio/height);this.material.uniforms.softMask.value=scene.userData.softSurface?1:0;this.material.uniforms.ink.value.set(theme.outline||(theme.mode==='dark'?theme.bg:theme.ink));r.render(this.scene,this.camera);}
 dispose(){this.colour.dispose();this.normal.dispose();this.normalMaterial.dispose();this.material.dispose();this.quad.geometry.dispose();}
}
