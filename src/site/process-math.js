import {cosinePhase} from './motion-clock.js';
// Deterministic illustrative probability transports; not experimental paper outputs.
export const TAU=Math.PI*2;
export const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
export const cycle=cosinePhase;
export const mix=(a,b,t)=>a+(b-a)*t;
export const lerp3=(a,b,t)=>a.map((v,i)=>mix(v,b[i],t));
export const frac=x=>x-Math.floor(x);
export const quantile=(i,n,offset=0)=>.025+.95*frac((i+.5)/n+offset);
export function gaussian(x,m=0,s=1){return Math.exp(-.5*((x-m)/s)**2)/(s*Math.sqrt(TAU));}
export function normalCDF(x){const s=x<0?-1:1,z=Math.abs(x)/Math.sqrt(2),t=1/(1+.3275911*z),e=1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-.284496736)*t+.254829592)*t*Math.exp(-z*z);return .5*(1+s*e);}
export function normalInverse(p){let a=-6,b=6;for(let k=0;k<42;k++){const m=(a+b)/2;if(normalCDF(m)<p)a=m;else b=m;}return(a+b)/2;}
export function cdfTable(pdf,a=-2.1,b=2.1,n=600){const x=[],c=[0];let total=0;for(let i=0;i<=n;i++){x.push(mix(a,b,i/n));if(i){total+=(pdf(x[i-1])+pdf(x[i]))*(b-a)/(2*n);c.push(total);}}return{x,c:c.map(v=>v/total)};}
export function invertCDF(table,p){const {x,c}=table;p=clamp(p);let a=0,b=c.length-1;while(b-a>1){const m=(a+b)>>1;if(c[m]<p)a=m;else b=m;}return mix(x[a],x[b],(p-c[a])/Math.max(1e-12,c[b]-c[a]));}
export const quarticTables=[cdfTable(x=>Math.exp(-2.6*(x*x-1)**2)),cdfTable(y=>Math.exp(-2.0*(y*y-.65)**2)),cdfTable(z=>Math.exp(-2.2*z*z))];
export function latticeMap(p,t){return p.map((v,j)=>mix(v,invertCDF(quarticTables[j],normalCDF(v/.62)),t));}
export function loomPoint(p,t){return[(1-.18*t)*p[0],(.85-.3*t)*p[1]+.62*t*Math.sin(1.65*p[0]),(.85-.3*t)*p[2]];}
export function torusPoint(a,b,R=1.18,r=.43){return[(R+r*Math.cos(b))*Math.cos(a),r*Math.sin(b),(R+r*Math.cos(b))*Math.sin(a)];}
export function slerp(a,b,t){const dot=clamp(a.reduce((s,v,i)=>s+v*b[i],0),-.999999,.999999),angle=Math.acos(dot),s=Math.sin(angle);return a.map((v,i)=>(Math.sin((1-t)*angle)*v+Math.sin(t*angle)*b[i])/s);}
export function simplexPoint(i,n,t){const a=[.1+frac(i*.754877),.1+frac(i*.56984+.2),.1+frac(i*.43857+.4)],norm=Math.hypot(...a),q=a.map(v=>v/norm),k=i%3,j=Math.floor(i/3),target=[0,0,0];target[(k+1)%3]=.10+.30*(j%6)/5;target[(k+2)%3]=.10+.30*Math.floor(j/6)/5;target[k]=Math.sqrt(1-target[(k+1)%3]**2-target[(k+2)%3]**2);return slerp(q,target,t).map(v=>1.7*v-.65);}
export function annulusPoint(i,n,t){const a=TAU*i/n+.32*Math.sin(i*2.4),r0=.47+.93*frac(i*.618034),r=mix(r0,1.02,t),angle=a+4.7*t;return[r*Math.cos(angle),.18*Math.sin(2*angle)+.3*(frac(i*.754)-.5)*(1-t),r*Math.sin(angle)];}
export function torusTransport(i,n,t){const a=TAU*frac(i*.61803398875),b=TAU*frac(i*.754877666),target=.45*Math.sin(2*a)+(i%2)*Math.PI,delta=Math.atan2(Math.sin(target-b),Math.cos(target-b));return torusPoint(a+.4*t,b+delta*t);}
export const mixture=[{w:.36,m:[-1.05,-.62,-.4],s:[.34,.3,.3]},{w:.38,m:[.95,.72,-.1],s:[.35,.27,.34]},{w:.26,m:[.05,-.3,.9],s:[.3,.34,.26]}];
export function conditionalWeights(observed){const w=mixture.map(c=>c.w*observed.reduce((s,v,j)=>s*gaussian(v,c.m[j],c.s[j]),1)),sum=w.reduce((a,b)=>a+b,0);return w.map(v=>v/sum);}
export function conditionalPDF(x,j,observed=[]){const w=conditionalWeights(observed);return mixture.reduce((s,c,k)=>s+w[k]*gaussian(x,c.m[j],c.s[j]),0);}
export function conditionalQuantile(q,j,observed=[]){return invertCDF(cdfTable(x=>conditionalPDF(x,j,observed),-2,2,180),q);}
export function conditionalTarget(i,n){const p=[];for(let j=0;j<3;j++)p.push(conditionalQuantile(quantile(i,n,j*.371),j,p));return p;}
export function potential(x,z){return .14*(x*x+z*z)-1.1*Math.exp(-((x+.85)**2+(z+.4)**2)/.31)-.85*Math.exp(-((x-.8)**2+(z-.5)**2)/.37)-.72*Math.exp(-((x+.1)**2+(z-.9)**2)/.24);}
const normaliserEnergies=Array.from({length:48*48},(_,k)=>potential(-1.8+(Math.floor(k/48)+.5)*3.6/48,-1.8+(k%48+.5)*3.6/48));
export function densityNormaliser(beta){let sum=0;const dx=3.6/48;for(const energy of normaliserEnergies)sum+=Math.exp(-beta*energy)*dx*dx;return sum;}
export function loaderPoint(key,i,n,t){const q=quantile(i,n),a=normalInverse(q),b=normalInverse(quantile(i,n,.371)),c=normalInverse(quantile(i,n,.673)),start=[-1.05+.18*a,.28*b,.21*c],end=[1.0+.16*a,(i%2?1:-1)*.42+.1*b,.2*c];
 if(key==='orbit'){const angle=TAU*i/n+3.8*t,r=mix(.45+.5*frac(i*.618),.76,t);return[r*Math.cos(angle),.23*Math.sin(2*angle),r*Math.sin(angle)];}
 if(key==='geodesic'){const y=1-2*(i+.5)/n,r=Math.sqrt(1-y*y),aa=i*2.399963,p=[r*Math.cos(aa),y,r*Math.sin(aa)],angle=TAU*i/n,target=[.3*Math.cos(angle),Math.sqrt(1-.3**2),.3*Math.sin(angle)];return slerp(p,target,t);}
 if(key==='quantiles'){const target=invertCDF(loaderMixtureCDF,q);return[mix(-1,1,t),mix(.49*a,.59*target,t),.18*c+Math.sin(Math.PI*t)*.12*b];}
 const p=lerp3(start,end,t);if(key==='bridge'){for(let j=0;j<3;j++)for(let k=1;k<=6;k++)p[j]+=.16*Math.SQRT2*Math.sin((i+1)*(k+2)*(j+3)*1.83)*Math.sin(k*Math.PI*t)/(k*Math.PI);}
 else{p[1]+=.22*Math.sin(Math.PI*t)*Math.sin(i*.8);p[2]+=.26*Math.sin(Math.PI*t)*Math.cos(i*.8);}return p;
}
const loaderMixtureCDF=cdfTable(x=>.5*gaussian(x,-.7,.24)+.5*gaussian(x,.7,.24),-1.6,1.6,400);
export const processMetadata={illustrative:true,experimentalOutput:false,sources:{foundations:['https://arxiv.org/abs/2510.21608','https://arxiv.org/abs/2510.26645','https://arxiv.org/abs/2405.14664'],samplers:['https://arxiv.org/abs/2506.16471','https://arxiv.org/abs/2506.01158','https://arxiv.org/abs/2606.27361']}};

// A normalized toy autoregressive distribution. Displayed markers define the
// observations used by the following sheet; they are never decorative walkers.
export function ribbonConditionalPDF(x,j,observed=[]){if(j===0)return gaussian(x,0,.65);if(j===1)return gaussian(x,.85*Math.sin(1.7*observed[0]),.28);const w=1/(1+Math.exp(-3.2*observed[1])),shift=.28*observed[0];return w*gaussian(x,.65+shift,.23)+(1-w)*gaussian(x,-.65+shift,.23);}
export function ribbonConditionalQuantile(q,j,observed=[]){if(j===0)return .65*normalInverse(q);if(j===1)return .85*Math.sin(1.7*observed[0])+.28*normalInverse(q);return invertCDF(cdfTable(x=>ribbonConditionalPDF(x,j,observed),-2.5,2.5,420),q);}
