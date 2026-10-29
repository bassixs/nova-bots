// Original, image-free studio lighting. No HDR download or reflection render pass.
// Five softboxes and a dark studio are baked once into a small RGBM cubemap.
const normalize=a=>{const l=Math.hypot(...a);return a.map(v=>v/l)};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const boxes=[
 {direction:[-1.7,1.6,2.4],width:.42,height:1.3,color:[1.3,1.4,1.55]},
 {direction:[1.8,.3,1.6],width:.22,height:1.1,color:[.28,.4,.65]},
 {direction:[0,2.2,.6],width:1.4,height:.3,color:[.6,.67,.78]},
 {direction:[-.4,-1.3,1.7],width:1.5,height:.4,color:[.065,.08,.13]},
 {direction:[1.6,.8,-2],width:.42,height:1.4,color:[.12,.09,.25]}
].map(box=>{const direction=normalize(box.direction),right=normalize(cross([0,1,0],direction)),up=cross(direction,right);return {...box,direction,right,up}});

export function studioRadiance(x,y,z,out){
 const horizon=Math.exp(-Math.pow((y+.12)/.38,2)),front=Math.max(0,z)**2;
 out[0]=.006+front*.018+horizon*.012;
 out[1]=.008+front*.023+horizon*.016;
 out[2]=.013+front*.035+horizon*.024;
 for(const box of boxes){
  const facing=x*box.direction[0]+y*box.direction[1]+z*box.direction[2];if(facing<=.05)continue;
  const u=Math.abs((x*box.right[0]+y*box.right[1]+z*box.right[2])/facing);
  const v=Math.abs((x*box.up[0]+y*box.up[1]+z*box.up[2])/facing);
  const power=Math.exp(-.8*(u/box.width)**2-.5*(v/box.height)**4);
  out[0]+=power*box.color[0];out[1]+=power*box.color[1];out[2]+=power*box.color[2];
 }
 return out;
}

export function createStudioCubemap(size=128){
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
 return {size,faces};
}

