// NOVA mark geometry, traced from the contours of public/assets/nova-logo.png:
// the angular N (stem + diagonal) and the four-point star. Extruded with
// chamfered edges so the facets catch thin highlights. No external model.

// Logo pixel contours (1254 px artboard). Centre of the N bounding box: 602, 669.
const N_CONTOUR=[[318,452],[432,452],[887,886],[748,886],[432,582],[432,886],[318,886]];
const STAR={x:876,y:422,rx:86,ry:89,power:.62,samples:72};
const UNIT=217,CX=602,CY=669;
const toUnit=([x,y])=>[(x-CX)/UNIT,-(y-CY)/UNIT];

const normalize=a=>{const l=Math.hypot(...a)||1;return a.map(v=>v/l)};
const area=p=>p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-b[0]*a[1]},0)/2;
const edgeNormal=(a,b)=>normalize([b[1]-a[1],a[0]-b[0]]); // outward for CCW

function inset(points,d){
 return points.map((p,i)=>{
  const prev=points[(i+points.length-1)%points.length],next=points[(i+1)%points.length];
  const n1=edgeNormal(prev,p),n2=edgeNormal(p,next),m=normalize([n1[0]+n2[0],n1[1]+n2[1]]);
  const len=d/Math.max(.35,m[0]*n1[0]+m[1]*n1[1]);
  return [p[0]-m[0]*len,p[1]-m[1]*len];
 });
}

function earClip(points){
 const idx=points.map((_,i)=>i),tris=[];
 const cross=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);
 const inside=(p,a,b,c)=>cross(a,b,p)>=0&&cross(b,c,p)>=0&&cross(c,a,p)>=0;
 let guard=0;
 while(idx.length>3&&guard++<500){
  for(let k=0;k<idx.length;k++){
   const i0=idx[(k+idx.length-1)%idx.length],i1=idx[k],i2=idx[(k+1)%idx.length];
   const a=points[i0],b=points[i1],c=points[i2];
   if(cross(a,b,c)<=1e-9)continue;
   if(idx.some(j=>j!==i0&&j!==i1&&j!==i2&&inside(points[j],a,b,c)))continue;
   tris.push([i0,i1,i2]);idx.splice(k,1);break;
  }
 }
 tris.push(idx);return tris;
}

// Stride: position(3) normal(3) material(1) facet(1). Material 0 = N, 1 = star.
// Facet: 0 = face, 1 = chamfer, 2 = side wall.
function extrude(contour,{depth,bevel,material,smooth=false,dome=0},out){
 const {data,indices}=out;let base=data.length/8;
 const half=depth/2,outer=contour,inner=inset(contour,bevel);
 const push=(p,n,facet)=>{data.push(p[0],p[1],p[2],n[0],n[1],n[2],material,facet);return base++};
 const L=contour.length;
 const normals=contour.map((p,i)=>edgeNormal(p,contour[(i+1)%L]));
 const vertexNormal=i=>normalize([normals[i][0]+normals[(i+L-1)%L][0],normals[i][1]+normals[(i+L-1)%L][1]]);
 // Faces.
 for(const side of [1,-1]){
  const z=side*half;
  if(dome){
   const c=inner.reduce((s,p)=>[s[0]+p[0]/L,s[1]+p[1]/L],[0,0]);
   const apex=[c[0],c[1],z+side*dome];
   const ring=inner.map(p=>[p[0],p[1],z]);
   for(let i=0;i<L;i++){
    const a=ring[i],b=ring[(i+1)%L];
    const u=[a[0]-apex[0],a[1]-apex[1],a[2]-apex[2]],v=[b[0]-apex[0],b[1]-apex[1],b[2]-apex[2]];
    let n=normalize([u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]]);if(n[2]*side<0)n=n.map(x=>-x);
    const ia=push(apex,n,0),ib=push(a,n,0),ic=push(b,n,0);
    indices.push(...(side>0?[ia,ib,ic]:[ia,ic,ib]));
   }
  }else{
   const n=[0,0,side],ids=inner.map(p=>push([p[0],p[1],z],n,0));
   for(const [a,b,c] of earClip(inner))indices.push(...(side>0?[ids[a],ids[b],ids[c]]:[ids[a],ids[c],ids[b]]));
  }
 }
 // Chamfers and side walls.
 for(let i=0;i<L;i++){
  const j=(i+1)%L,n2=normals[i];
  const strips=[
   [[inner[i],half],[inner[j],half],[outer[j],half-bevel],[outer[i],half-bevel],[n2[0]*.72,n2[1]*.72,.7],1],
   [[outer[i],half-bevel],[outer[j],half-bevel],[outer[j],-half+bevel],[outer[i],-half+bevel],[n2[0],n2[1],0],2],
   [[outer[i],-half+bevel],[outer[j],-half+bevel],[inner[j],-half],[inner[i],-half],[n2[0]*.72,n2[1]*.72,-.7],1]
  ];
  for(const [a,b,c,d,flat,facet] of strips){
   const nf=normalize(flat);
   const nv=k=>{if(!smooth)return nf;const v=vertexNormal(k);return normalize([v[0]*Math.hypot(flat[0],flat[1]),v[1]*Math.hypot(flat[0],flat[1]),flat[2]])};
   const ia=push([a[0][0],a[0][1],a[1]],nv(i),facet),ib=push([b[0][0],b[0][1],b[1]],nv(j),facet),ic=push([c[0][0],c[0][1],c[1]],nv(j),facet),id=push([d[0][0],d[0][1],d[1]],nv(i),facet);
   indices.push(ia,id,ib,ib,id,ic);
  }
 }
}

function starContour(){
 const pts=[];
 for(let k=0;k<STAR.samples;k++){
  const t=k/STAR.samples*Math.PI*2,c=Math.cos(t),s=Math.sin(t);
  const x=Math.sign(c)*Math.abs(c)**(2/STAR.power),y=Math.sign(s)*Math.abs(s)**(2/STAR.power);
  pts.push(toUnit([STAR.x+x*STAR.rx,STAR.y-y*STAR.ry]));
 }
 return pts;
}

// Faceted four-point sparkle: a raised apex on both sides of a thin concave
// outline, so each lobe catches light like the star in the logo.
function sparkle(contour,{thickness,height,material},out){
 const {data,indices}=out;let base=data.length/8;
 const push=(p,n,facet)=>{data.push(p[0],p[1],p[2],n[0],n[1],n[2],material,facet);return base++};
 const L=contour.length,c=contour.reduce((s,p)=>[s[0]+p[0]/L,s[1]+p[1]/L],[0,0]);
 const tri=(a,b,c2,facet)=>{const u=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],v=[c2[0]-a[0],c2[1]-a[1],c2[2]-a[2]];const n=normalize([u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]]);indices.push(push(a,n,facet),push(b,n,facet),push(c2,n,facet))};
 for(let i=0;i<L;i++){
  const a=contour[i],b=contour[(i+1)%L];
  tri([c[0],c[1],thickness+height],[a[0],a[1],thickness],[b[0],b[1],thickness],0);
  tri([c[0],c[1],-thickness-height],[b[0],b[1],-thickness],[a[0],a[1],-thickness],0);
  const n=edgeNormal(a,b),wall=[n[0],n[1],0];
  const ia=push([a[0],a[1],thickness],wall,2),ib=push([b[0],b[1],thickness],wall,2),ic=push([b[0],b[1],-thickness],wall,2),id=push([a[0],a[1],-thickness],wall,2);
  indices.push(ia,id,ib,ib,id,ic);
 }
}

export function buildMark(){
 const out={data:[],indices:[]};
 let n=N_CONTOUR.map(toUnit);if(area(n)<0)n=n.reverse();
 extrude(n,{depth:.42,bevel:.055,material:0},out);
 const starStart=out.data.length;
 sparkle(starContour(),{thickness:.05,height:.16,material:1},out);
 // Centre the composition (N + star) on the origin.
 let x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity;
 for(let i=0;i<out.data.length;i+=8){x0=Math.min(x0,out.data[i]);x1=Math.max(x1,out.data[i]);y0=Math.min(y0,out.data[i+1]);y1=Math.max(y1,out.data[i+1])}
 const cx=(x0+x1)/2,cy=(y0+y1)/2,scale=2.1/(y1-y0);
 for(let i=0;i<out.data.length;i+=8){out.data[i]=(out.data[i]-cx)*scale;out.data[i+1]=(out.data[i+1]-cy)*scale;out.data[i+2]*=scale}
 const [sx,sy]=toUnit([STAR.x,STAR.y]),star=[(sx-cx)*scale,(sy-cy)*scale,0];
 return {data:new Float32Array(out.data),indices:new Uint16Array(out.indices),star};
}
