// Original, image-free studio lighting. No HDR download or reflection render pass.
// A near-black studio with narrow cool strips and two brand-coloured rim lights
// (#6B7CFF blue, #9C6BFF violet), baked once into a small RGBM cubemap.
const normalize=a=>{const l=Math.hypot(...a);return a.map(v=>v/l)};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const boxes=[
 {direction:[-2.0,1.0,.54],width:.1,height:1.5,color:[1.9,2.0,2.25]},   // key strip, cool white
 {direction:[-.2,2.3,.9],width:1.3,height:.08,color:[.9,.95,1.1]},       // top edge line
 {direction:[2.1,.35,.5],width:.16,height:1.4,color:[.75,.88,1.8]},      // blue rim
 {direction:[1.2,-1.3,-1.4],width:.4,height:1.1,color:[1.0,.68,1.65]},   // violet rim, low back
 {direction:[-2.2,-.4,-.6],width:.18,height:1.2,color:[.45,.52,1.2]},    // blue kicker, left back
 {direction:[-1.0,.42,.95],width:.5,height:.35,color:[.03,.035,.06]},     // broad sheen on the front plane
 {direction:[.3,.1,2.4],width:1.4,height:1.0,color:[.035,.04,.06]}       // faint front fill
].map(box=>{const direction=normalize(box.direction),right=normalize(cross([0,1,0],direction)),up=cross(direction,right);return {...box,direction,right,up}});

export function studioRadiance(x,y,z,out){
 const horizon=Math.exp(-Math.pow((y+.08)/.22,2));
 out[0]=.003+horizon*.012;
 out[1]=.004+horizon*.014;
 out[2]=.007+horizon*.03;
 for(const box of boxes){
  const facing=x*box.direction[0]+y*box.direction[1]+z*box.direction[2];if(facing<=.05)continue;
  const u=Math.abs((x*box.right[0]+y*box.right[1]+z*box.right[2])/facing);
  const v=Math.abs((x*box.up[0]+y*box.up[1]+z*box.up[2])/facing);
  const power=Math.exp(-1.2*(u/box.width)**2-.6*(v/box.height)**6);
  out[0]+=power*box.color[0];out[1]+=power*box.color[1];out[2]+=power*box.color[2];
 }
 return out;
}

// The hero and the final CTA bake the same studio; the second scene reuses the result
// instead of repeating ~35ms of CPU work (several times longer on slow laptops) mid-scroll.
let baked;
export function createStudioCubemap(size=128){
 if(baked?.size===size)return baked;
 const faces=[],color=[0,0,0];
 for(let face=0;face<6;face++){
  const pixels=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
   const u=(x+.5)/size*2-1,v=(y+.5)/size*2-1;
   let a,b,c;
   if(face===0){a=1;b=-v;c=-u}else if(face===1){a=-1;b=-v;c=u}
   else if(face===2){a=u;b=1;c=v}else if(face===3){a=u;b=-1;c=-v}
   else if(face===4){a=u;b=-v;c=1}else{a=-u;b=-v;c=-1}
   const length=Math.hypot(a,b,c);studioRadiance(a/length,b/length,c/length,color);
   const multiplier=Math.max(1/255,Math.min(1,Math.ceil(Math.max(...color)/12*255)/255)),offset=(y*size+x)*4;
   for(let channel=0;channel<3;channel++)pixels[offset+channel]=Math.min(255,Math.round(color[channel]/(multiplier*12)*255));
   pixels[offset+3]=Math.round(multiplier*255);
  }
  faces.push(pixels);
 }
 return baked={size,faces};
}
