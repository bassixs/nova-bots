import {createStudioCubemap} from './chrome-studio.js';
import {chromePosters} from './materials/posters.mjs';

// A folded signal ribbon, generated from our own geometry. No reference assets.
export function createScene(canvas,onReady,options={}){
 const forced=new URL(location.href).searchParams.get('renderer');
 if(forced==='svg'){onReady(false);return {setMode(){},setProgress(){},setPointer(){},setEnabled(){},dispose(){}}}
 if(options.staticOnly||forced==='canvas')return createCanvasScene(canvas,onReady);
 const gl=canvas.getContext('webgl',{alpha:true,antialias:true,powerPreference:'low-power'});
 if(!gl){canvas.dataset.fallbackReason='WebGL context unavailable';return createCanvasScene(canvas,onReady)}
 const precision=gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER,gl.HIGH_FLOAT)?.precision?'highp':'mediump';
 const vertex=`precision ${precision} float;attribute vec3 aPosition;attribute vec3 aNormal;attribute vec2 aUv;
 uniform float uAspect,uMode,uEnergy;uniform vec2 uPointer;varying vec3 vNormal,vPosition;varying vec2 vUv;
 mat3 rx(float a){float c=cos(a),s=sin(a);return mat3(1.,0.,0.,0.,c,s,0.,-s,c);}
 mat3 ry(float a){float c=cos(a),s=sin(a);return mat3(c,0.,-s,0.,1.,0.,s,0.,c);}
 mat3 rz(float a){float c=cos(a),s=sin(a);return mat3(c,s,0.,-s,c,0.,0.,0.,1.);}
 void main(){mat3 r=ry(-.42+uPointer.x*.16+uMode*.5)*rx(-.24+uPointer.y*.12)*rz(.13-uMode*.4);
 vec3 p=aPosition;p.z+=sin(aUv.x*12.)*uEnergy*.11;p=r*p;
 if(uAspect<.8){p*=mix(.8,.6,uMode);p.x+=mix(.08,-.6,uMode);p.y-=1.15;}else{p*=mix(1.35,.95,uMode);p.x+=mix(1.65,-.15,uMode);p.y+=mix(.02,.1,uMode);}p.z-=uMode*2.2;
 vPosition=p;vNormal=normalize(r*aNormal);vUv=aUv;
 float z=6.7-p.z;float f=2.42;gl_Position=vec4(p.x*f/uAspect,p.y*f,(z-.1)*1.002-.2,z);}`;
 const fragment=`precision ${precision} float;varying vec3 vNormal,vPosition;varying vec2 vUv;uniform samplerCube uStudio;
 void main(){vec3 n=normalize(vNormal);if(!gl_FrontFacing)n=-n;vec3 v=normalize(vec3(0.,0.,6.7)-vPosition);
 vec4 studio=textureCube(uStudio,reflect(-v,n),.6);vec3 radiance=studio.rgb*studio.a*12.;
 float grazing=pow(1.-clamp(dot(n,v),0.,1.),5.);vec3 f0=vec3(.82,.85,.9);
 vec3 c=radiance*(f0+(1.-f0)*grazing);
 c=clamp((c*(2.51*c+.03))/(c*(2.43*c+.59)+.14),0.,1.);
 gl_FragColor=vec4(pow(c,vec3(1./2.2)),1.);}`;
 const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s};
 let program;
 try{program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program))}catch(error){const replacement=canvas.cloneNode();replacement.dataset.fallbackReason=error.message;canvas.replaceWith(replacement);return createCanvasScene(replacement,onReady)}
 gl.useProgram(program);gl.enable(gl.DEPTH_TEST);gl.clearColor(0,0,0,0);
 const environmentStart=performance.now(),studio=createStudioCubemap(),studioTexture=gl.createTexture();
 gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_CUBE_MAP,studioTexture);
 studio.faces.forEach((pixels,i)=>gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X+i,0,gl.RGBA,studio.size,studio.size,0,gl.RGBA,gl.UNSIGNED_BYTE,pixels));
 gl.generateMipmap(gl.TEXTURE_CUBE_MAP);gl.texParameteri(gl.TEXTURE_CUBE_MAP,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_CUBE_MAP,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
 gl.texParameteri(gl.TEXTURE_CUBE_MAP,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_CUBE_MAP,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 gl.uniform1i(gl.getUniformLocation(program,'uStudio'),0);canvas.dataset.environmentMs=(performance.now()-environmentStart).toFixed(2);canvas.dataset.material='studio-chrome';
 const control=[[-1.25,-1.05,-.15],[-1.28,-.1,-.18],[-1.08,1.02,-.16],[-.72,.9,.18],[.68,-.9,.3],[1.08,-1.02,-.06],[1.28,.1,-.12],[1.25,1.05,.1]];
 const point=t=>{let f=t*(control.length-1),i=Math.min(control.length-2,Math.floor(f)),u=f-i;const p0=control[Math.max(0,i-1)],p1=control[i],p2=control[i+1],p3=control[Math.min(control.length-1,i+2)];return [0,1,2].map(k=>.5*((2*p1[k])+(-p0[k]+p2[k])*u+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*u*u+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*u*u*u))};
 const norm=a=>{const d=Math.hypot(...a)||1;return a.map(v=>v/d)},cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],sub=(a,b)=>a.map((v,i)=>v-b[i]);
 function surface(t,w){const p=point(t),tan=norm(sub(point(Math.min(1,t+.001)),point(Math.max(0,t-.001)))),side=norm(cross(tan,[0,0,1])),bin=norm(cross(tan,side));const twist=Math.sin(t*Math.PI*2)*.7+.2;const width=.48*(.83+.17*Math.sin(t*Math.PI));return p.map((v,i)=>v+side[i]*w*width*Math.cos(twist)+bin[i]*(w*width*Math.sin(twist)+.14*w*w))}
 const data=[],indices=[],length=196,breadth=32;
 for(let i=0;i<=length;i++)for(let j=0;j<=breadth;j++){const t=i/length,w=j/breadth*2-1,p=surface(t,w),a=sub(surface(Math.min(1,t+.001),w),surface(Math.max(0,t-.001),w)),b=sub(surface(t,w+.001),surface(t,w-.001)),n=norm(cross(a,b));data.push(...p,...n,t,j/breadth)}
 for(let i=0;i<length;i++)for(let j=0;j<breadth;j++){let a=i*(breadth+1)+j,b=a+breadth+1;indices.push(a,b,a+1,b,b+1,a+1)}
 const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);
 for(const [name,size,offset]of [['aPosition',3,0],['aNormal',3,12],['aUv',2,24]]){const loc=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,32,offset)}
 const indexBuffer=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);
 const uniforms=Object.fromEntries(['uAspect','uMode','uEnergy','uPointer'].map(n=>[n,gl.getUniformLocation(program,n)]));
 let frame=0,mode=0,targetMode=0,energy=.55,targetEnergy=0,px=0,py=0,tx=0,ty=0,enabled=true,disposed=false,last=0,delegate;
 function draw(now){frame=0;if(disposed||document.hidden)return;const started=performance.now(),dt=Math.min(40,now-last||16);last=now;const k=1-Math.exp(-dt/155);
  mode+=(targetMode-mode)*k;energy+=(targetEnergy-energy)*k;px+=(tx-px)*k;py+=(ty-py)*k;
  const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio,innerWidth<701?1.25:1.5),w=Math.round(rect.width*dpr),h=Math.round(rect.height*dpr);
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h)}
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.uniform1f(uniforms.uAspect,w/h);gl.uniform1f(uniforms.uMode,mode);gl.uniform1f(uniforms.uEnergy,energy);gl.uniform2f(uniforms.uPointer,px,py);gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);
  canvas.dataset.draws=String(Number(canvas.dataset.draws||0)+1);canvas.dataset.lastRenderMs=(performance.now()-started).toFixed(2);
  if(enabled&&(Math.abs(targetMode-mode)+Math.abs(targetEnergy-energy)+Math.abs(px-tx)+Math.abs(py-ty)>.001||targetEnergy>0))request()
 }
 function request(){if(!frame&&!disposed)frame=requestAnimationFrame(draw)}
 const resize=new ResizeObserver(request);resize.observe(canvas);const visibility=()=>{if(!document.hidden)request();else{cancelAnimationFrame(frame);frame=0}};document.addEventListener('visibilitychange',visibility);
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();disposed=true;cancelAnimationFrame(frame);resize.disconnect();document.removeEventListener('visibilitychange',visibility);const replacement=canvas.cloneNode();canvas.replaceWith(replacement);delegate=createCanvasScene(replacement,onReady);delegate.setEnabled(enabled);delegate.setProgress(targetMode)});
 onReady('webgl');request();
 return {setMode(value){this.setProgress(value)},setProgress(value){if(delegate){delegate.setProgress(value);return}if(Math.abs(targetMode-value)<.0005)return;mode=targetMode=value;energy=targetEnergy=0;request()},setPointer(x,y){if(delegate){delegate.setPointer(x,y);return}if(!enabled)return;tx=x;ty=y;request()},setEnabled(value){if(delegate){delegate.setEnabled(value);return}enabled=value;if(!value){mode=targetMode;energy=targetEnergy=0;px=py=tx=ty=0}request()},dispose(){delegate?.dispose();disposed=true;cancelAnimationFrame(frame);resize.disconnect();document.removeEventListener('visibilitychange',visibility);gl.deleteBuffer(buffer);gl.deleteBuffer(indexBuffer);gl.deleteTexture(studioTexture);gl.deleteProgram(program)}};
}

// Same interaction without GPU. A baked frame of this exact WebGL geometry.
function createCanvasScene(canvas,onReady){
 const ctx=canvas.getContext('2d',{alpha:true});
 if(!ctx){onReady(false);return {setMode(){},setProgress(){},setPointer(){},setEnabled(){},dispose(){}}}
 let enabled=true,frame=0,dead=false,cachedWidth=0,cachedHeight=0,cachedKey='';
 const images=new Map();canvas.dataset.material='studio-chrome';delete canvas.dataset.environmentMs;onReady(false);
 function imageFor(key){
  if(images.has(key))return images.get(key);
  const image=new Image();image.decoding='async';image.onload=request;image.onerror=()=>onReady(false);image.src=chromePosters[key].url;images.set(key,image);return image;
 }
 function render(){
  frame=0;if(dead||document.hidden)return;
  // The SVG stays visible until the image is decoded and the first frame is ready.
  const started=performance.now(),rect=canvas.parentElement.getBoundingClientRect(),dpr=Math.min(devicePixelRatio,1.25),W=Math.round(rect.width*dpr),H=Math.round(rect.height*dpr),key=W/H<.8?'mobile':'desktop';
  const image=imageFor(key);if(!image.complete||!image.naturalWidth)return;
  if(W===cachedWidth&&H===cachedHeight&&key===cachedKey)return;cachedWidth=W;cachedHeight=H;cachedKey=key;
  if(W!==canvas.width||H!==canvas.height){canvas.width=W;canvas.height=H}ctx.clearRect(0,0,W,H);
  const poster=chromePosters[key],crop=poster.crop,scale=H/poster.height;
  ctx.drawImage(image,W/2+(crop.x-poster.width/2)*scale,crop.y*scale,crop.width*scale,crop.height*scale);
  canvas.dataset.poster=key;canvas.dataset.draws=String(Number(canvas.dataset.draws||0)+1);canvas.dataset.lastRenderMs=(performance.now()-started).toFixed(2);onReady('canvas2d');
 }
 function request(){if(!frame&&!dead)frame=requestAnimationFrame(render)}
 const resize=new ResizeObserver(request);resize.observe(canvas.parentElement);const visibility=()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0}else request()};document.addEventListener('visibilitychange',visibility);request();
 let scrollProgress=0,pointX=0,pointY=0;
 function composite(){canvas.style.transform=`translate3d(${-80*scrollProgress}px,${-20*scrollProgress}px,0) scale(${1-.38*scrollProgress}) perspective(1000px) rotateY(${pointX*3*(1-scrollProgress)}deg) rotateX(${-pointY*2*(1-scrollProgress)}deg)`}
 return {setMode(value){this.setProgress(value)},setProgress(value){scrollProgress=value;composite()},setPointer(x,y){if(!enabled)return;pointX=x;pointY=y;composite()},setEnabled(value){enabled=value;pointX=pointY=0;composite()},dispose(){dead=true;cancelAnimationFrame(frame);resize.disconnect();document.removeEventListener('visibilitychange',visibility);for(const image of images.values()){image.onload=null;image.onerror=null}}};
}
