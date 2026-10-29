import {createStudioCubemap} from './chrome-studio.js';
import {chromePosters} from './materials/posters.mjs';
import {buildMark} from './mark-geometry.js';

// The NOVA mark — angular N and four-point star from the logo — in dark polished
// gunmetal. Lit by a baked studio of narrow cool strips and brand-coloured rims.
export function createScene(canvas,onReady,options={}){
 const forced=new URL(location.href).searchParams.get('renderer');
 if(forced==='svg'){onReady(false);return {setMode(){},setProgress(){},setPointer(){},setEnabled(){},dispose(){}}}
 if(options.staticOnly||forced==='canvas')return createCanvasScene(canvas,onReady);
 const gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:true,powerPreference:'low-power'});
 if(!gl){canvas.dataset.fallbackReason='WebGL context unavailable';return createCanvasScene(canvas,onReady)}
 const precision=gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER,gl.HIGH_FLOAT)?.precision?'highp':'mediump';
const placement=`uniform float uAspect,uMode,uEnergy;uniform vec2 uPointer;
 mat3 rx(float a){float c=cos(a),s=sin(a);return mat3(1.,0.,0.,0.,c,s,0.,-s,c);}
 mat3 ry(float a){float c=cos(a),s=sin(a);return mat3(c,0.,-s,0.,1.,0.,s,0.,c);}
 mat3 rz(float a){float c=cos(a),s=sin(a);return mat3(c,s,0.,-s,c,0.,0.,0.,1.);}
 mat3 rotation(){return ry(-.5+uPointer.x*.2+uMode*.55)*rx(-.16+uPointer.y*.12)*rz(.05-uMode*.25);}
 vec3 place(vec3 p){if(uAspect<.8){p*=mix(.6,.55,uMode);p.x+=mix(.12,-.6,uMode);p.y-=1.13;}else{p*=mix(1.28,.9,uMode);p.x+=mix(1.62,2.35,uMode);p.y+=mix(-.02,.28,uMode);}p.z-=uMode*2.2;return p;}
 vec4 project(vec3 p){float z=6.7-p.z;return vec4(p.x*2.42/uAspect,p.y*2.42,(z-.1)*1.002-.2,z);}`;
 const vertex=`precision ${precision} float;attribute vec3 aPosition;attribute vec3 aNormal;attribute vec2 aUv;
 varying vec3 vNormal,vPosition,vLocal;varying vec2 vUv;${placement}
 void main(){mat3 r=rotation();vec3 p=place(r*aPosition);
 vPosition=p;vLocal=aPosition;vNormal=normalize(r*aNormal);vUv=aUv;gl_Position=project(p);}`;
 const fragment=`precision ${precision} float;varying vec3 vNormal,vPosition,vLocal;varying vec2 vUv;uniform samplerCube uStudio;
 vec3 env(vec3 r,float bias){vec4 s=textureCube(uStudio,r,bias);return s.rgb*s.a*12.;}
 void main(){vec3 n=normalize(vNormal);if(!gl_FrontFacing)n=-n;vec3 v=normalize(vec3(0.,0.,6.7)-vPosition);
 vec3 r=reflect(-v,n);float ndv=clamp(dot(n,v),0.,1.),fr=pow(1.-ndv,5.);
 float star=step(.5,vUv.x),chamfer=step(.5,vUv.y)*step(vUv.y,1.5);
 vec3 sharp=env(r,.15),soft=env(r,2.6);
 vec3 f0=mix(vec3(.24,.26,.31),vec3(.9,.92,.98),star);vec3 F=f0+(1.-f0)*fr;
 vec3 sh=pow(sharp,vec3(1.7));vec3 so=pow(soft,vec3(1.6));
 vec3 c=vec3(.006,.007,.011)+so*F*mix(.3,.6,chamfer)+sh*F*mix(.9,1.4,chamfer);
 vec3 brand=mix(vec3(.42,.49,1.),vec3(.61,.42,1.),clamp(.5-vLocal.y*.35+vLocal.x*.12,0.,1.));
 c+=brand*pow(1.-ndv,4.)*.32*(1.-star);
 float face=step(vUv.y,.5)*(1.-star);float sweep=smoothstep(-1.4,1.3,vLocal.y*.8-vLocal.x*.55+r.x*1.6);
 c+=face*mix(vec3(.004,.005,.01),vec3(.07,.08,.13),sweep*sweep);
 c+=star*(vec3(.8,.85,1.)*.42+brand*.3*fr);
 c=clamp((c*(2.51*c+.03))/(c*(2.43*c+.59)+.14),0.,1.);
 gl_FragColor=vec4(pow(c,vec3(1./2.2)),1.);}`;
 const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s};
 let program;
 try{program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program))}catch(error){const replacement=canvas.cloneNode();replacement.dataset.fallbackReason=error.message;canvas.replaceWith(replacement);return createCanvasScene(replacement,onReady)}
 const {data,indices,star:starCenter}=buildMark();
 // Soft halo around the star, drawn additively after the metal.
 let glow;
 try{glow=gl.createProgram();gl.attachShader(glow,shader(gl.VERTEX_SHADER,`precision ${precision} float;attribute vec2 aCorner;uniform vec3 uStar;varying vec2 vCorner;${placement}
 void main(){vCorner=aCorner;vec4 c=project(place(rotation()*uStar));float size=uAspect<.8?.8:.62;c.xy+=aCorner*size*mix(1.,.7,uMode)*vec2(1./uAspect,1.)*c.w*.42;gl_Position=c;}`));
  gl.attachShader(glow,shader(gl.FRAGMENT_SHADER,`precision ${precision} float;varying vec2 vCorner;uniform float uMode;
 void main(){float d=length(vCorner);float core=exp(-d*d*10.)*.34+exp(-d*d*2.6)*.14;float rays=exp(-abs(vCorner.x)*28.)*exp(-abs(vCorner.y)*2.2)+exp(-abs(vCorner.y)*28.)*exp(-abs(vCorner.x)*2.2);
 float edge=smoothstep(1.,.55,max(abs(vCorner.x),abs(vCorner.y)));vec3 c=(vec3(.55,.6,1.)*core+vec3(.75,.8,1.)*rays*.22)*edge;c*=1.-.5*uMode;gl_FragColor=vec4(c,max(c.r,max(c.g,c.b)));}`));
  gl.linkProgram(glow);if(!gl.getProgramParameter(glow,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(glow))}catch(error){glow=null;canvas.dataset.glowError=error.message}
 const quad=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,quad);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
 gl.useProgram(program);gl.enable(gl.DEPTH_TEST);gl.clearColor(0,0,0,0);
 const environmentStart=performance.now(),studio=createStudioCubemap(),studioTexture=gl.createTexture();
 gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_CUBE_MAP,studioTexture);
 studio.faces.forEach((pixels,i)=>gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X+i,0,gl.RGBA,studio.size,studio.size,0,gl.RGBA,gl.UNSIGNED_BYTE,pixels));
 gl.generateMipmap(gl.TEXTURE_CUBE_MAP);gl.texParameteri(gl.TEXTURE_CUBE_MAP,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_CUBE_MAP,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
 gl.uniform1i(gl.getUniformLocation(program,'uStudio'),0);canvas.dataset.environmentMs=(performance.now()-environmentStart).toFixed(2);canvas.dataset.material='nova-gunmetal';
 canvas.dataset.vertices=String(data.length/8);canvas.dataset.triangles=String(indices.length/3);
 const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);
  const indexBuffer=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indices,gl.STATIC_DRAW);
 const uniforms=Object.fromEntries(['uAspect','uMode','uEnergy','uPointer'].map(n=>[n,gl.getUniformLocation(program,n)]));
 let frame=0,mode=0,targetMode=0,energy=.55,targetEnergy=0,px=0,py=0,tx=0,ty=0,enabled=true,disposed=false,last=0,delegate;
 const attributes=[['aPosition',3,0],['aNormal',3,12],['aUv',2,24]].map(([name,size,offset])=>[gl.getAttribLocation(program,name),size,offset]).filter(a=>a[0]>=0);
 const glowUniforms=glow&&Object.fromEntries(['uAspect','uMode','uPointer','uStar'].map(n=>[n,gl.getUniformLocation(glow,n)])),glowCorner=glow&&gl.getAttribLocation(glow,'aCorner');
 function paint(w,h){
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);
  for(const [loc,size,offset] of attributes){gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,32,offset)}
  gl.enable(gl.DEPTH_TEST);gl.disable(gl.BLEND);
  gl.uniform1f(uniforms.uAspect,w/h);gl.uniform1f(uniforms.uMode,mode);gl.uniform1f(uniforms.uEnergy,energy);gl.uniform2f(uniforms.uPointer,px,py);gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);
  for(const [loc] of attributes)gl.disableVertexAttribArray(loc);
  if(glow){gl.useProgram(glow);gl.bindBuffer(gl.ARRAY_BUFFER,quad);gl.enableVertexAttribArray(glowCorner);gl.vertexAttribPointer(glowCorner,2,gl.FLOAT,false,8,0);
   gl.disable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);
   gl.uniform1f(glowUniforms.uAspect,w/h);gl.uniform1f(glowUniforms.uMode,mode);gl.uniform2f(glowUniforms.uPointer,px,py);gl.uniform3f(glowUniforms.uStar,...starCenter);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
   gl.disableVertexAttribArray(glowCorner);gl.disable(gl.BLEND)}
 }
 function draw(now){frame=0;if(disposed||document.hidden)return;const started=performance.now(),dt=Math.min(40,now-last||16);last=now;const k=1-Math.exp(-dt/155);
  mode+=(targetMode-mode)*k;energy+=(targetEnergy-energy)*k;px+=(tx-px)*k;py+=(ty-py)*k;
  const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio,innerWidth<701?1.25:1.5),w=Math.round(rect.width*dpr),h=Math.round(rect.height*dpr);
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h)}
  paint(w,h);
  canvas.dataset.draws=String(Number(canvas.dataset.draws||0)+1);canvas.dataset.lastRenderMs=(performance.now()-started).toFixed(2);
  if(enabled&&(Math.abs(targetMode-mode)+Math.abs(targetEnergy-energy)+Math.abs(px-tx)+Math.abs(py-ty)>.003||targetEnergy>0))request()
 }
 function request(){if(!frame&&!disposed)frame=requestAnimationFrame(draw)}
 const resize=new ResizeObserver(request);resize.observe(canvas);const visibility=()=>{if(!document.hidden)request();else{cancelAnimationFrame(frame);frame=0}};document.addEventListener('visibilitychange',visibility);
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();disposed=true;cancelAnimationFrame(frame);resize.disconnect();document.removeEventListener('visibilitychange',visibility);const replacement=canvas.cloneNode();canvas.replaceWith(replacement);delegate=createCanvasScene(replacement,onReady);delegate.setEnabled(enabled);delegate.setProgress(targetMode)});
 onReady('webgl');request();
 return {redraw(){paint(canvas.width,canvas.height)},setMode(value){this.setProgress(value)},setProgress(value){if(delegate){delegate.setProgress(value);return}if(Math.abs(targetMode-value)<.0005)return;mode=targetMode=value;energy=targetEnergy=0;request()},setPointer(x,y){if(delegate){delegate.setPointer(x,y);return}if(!enabled)return;tx=x;ty=y;request()},setEnabled(value){if(delegate){delegate.setEnabled(value);return}enabled=value;if(!value){mode=targetMode;energy=targetEnergy=0;px=py=tx=ty=0}request()},dispose(){delegate?.dispose();disposed=true;cancelAnimationFrame(frame);resize.disconnect();document.removeEventListener('visibilitychange',visibility);gl.deleteBuffer(buffer);gl.deleteBuffer(indexBuffer);gl.deleteBuffer(quad);if(glow)gl.deleteProgram(glow);gl.deleteTexture(studioTexture);gl.deleteProgram(program)}};
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
