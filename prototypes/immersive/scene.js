// A folded signal ribbon, generated from our own geometry. No reference assets.
export function createScene(canvas,onReady,options={}){
 const forced=new URL(location.href).searchParams.get('renderer');
 if(forced==='svg'){onReady(false);return {setMode(){},setProgress(){},setPointer(){},setEnabled(){},dispose(){}}}
 if(options.staticOnly||forced==='canvas')return createCanvasScene(canvas,onReady);
 const gl=canvas.getContext('webgl',{alpha:true,antialias:true,powerPreference:'low-power'});
 if(!gl){canvas.dataset.fallbackReason='WebGL context unavailable';return createCanvasScene(canvas,onReady)}
 const vertex=`precision mediump float;attribute vec3 aPosition;attribute vec3 aNormal;attribute vec2 aUv;
 uniform float uAspect,uMode,uEnergy;uniform vec2 uPointer;varying vec3 vNormal,vPosition;varying vec2 vUv;
 mat3 rx(float a){float c=cos(a),s=sin(a);return mat3(1.,0.,0.,0.,c,s,0.,-s,c);}
 mat3 ry(float a){float c=cos(a),s=sin(a);return mat3(c,0.,-s,0.,1.,0.,s,0.,c);}
 mat3 rz(float a){float c=cos(a),s=sin(a);return mat3(c,s,0.,-s,c,0.,0.,0.,1.);}
 void main(){mat3 r=ry(-.42+uPointer.x*.16+uMode*.5)*rx(-.24+uPointer.y*.12)*rz(.13-uMode*.4);
 vec3 p=aPosition;p.z+=sin(aUv.x*12.)*uEnergy*.11;p=r*p;
 if(uAspect<.8){p*=mix(.8,.6,uMode);p.x+=mix(.08,-.6,uMode);p.y-=1.15;}else{p*=mix(1.35,.95,uMode);p.x+=mix(1.65,-.15,uMode);p.y+=mix(.02,.1,uMode);}p.z-=uMode*2.2;
 vPosition=p;vNormal=normalize(r*aNormal);vUv=aUv;
 float z=6.7-p.z;float f=2.42;gl_Position=vec4(p.x*f/uAspect,p.y*f,(z-.1)*1.002-.2,z);}`;
 const fragment=`precision mediump float;varying vec3 vNormal,vPosition;varying vec2 vUv;uniform float uEnergy,uPulse;
 void main(){vec3 n=normalize(vNormal);if(!gl_FrontFacing)n=-n;vec3 v=normalize(vec3(0.,0.,6.7)-vPosition);
 vec3 l=normalize(vec3(-.7,1.4,2.4));float diffuse=max(dot(n,l),0.);float rim=pow(1.-abs(dot(n,v)),3.);
 float spec=pow(max(dot(n,normalize(l+v)),0.),65.);float wide=pow(max(dot(n,normalize(vec3(1.,.4,2.)+v)),0.),9.);
 float edge=pow(abs(vUv.y*2.-1.),14.);float groove=smoothstep(.025,.065,abs(fract(vUv.y*48.)-.5));
 vec3 titanium=vec3(.075,.105,.17)*(.5+diffuse*.8)+wide*vec3(.14,.19,.29);
 vec3 c=titanium*mix(.48,1.,groove)+spec*vec3(.8,.87,1.)+rim*vec3(.1,.17,.38)+edge*vec3(.22,.3,.55);
 float pulse=exp(-pow((vUv.x-uPulse)*8.,2.))*uEnergy;c+=pulse*vec3(.2,.3,.7);
 float grain=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);c+=(grain-.5)*.012;
 gl_FragColor=vec4(pow(max(c,0.),vec3(.8)),1.);}`;
 const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s};
 let program;
 try{program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program))}catch(error){const replacement=canvas.cloneNode();replacement.dataset.fallbackReason=error.message;canvas.replaceWith(replacement);return createCanvasScene(replacement,onReady)}
 gl.useProgram(program);gl.enable(gl.DEPTH_TEST);gl.clearColor(0,0,0,0);
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
 const uniforms=Object.fromEntries(['uAspect','uMode','uEnergy','uPointer','uPulse'].map(n=>[n,gl.getUniformLocation(program,n)]));
 let frame=0,mode=0,targetMode=0,energy=.55,targetEnergy=0,px=0,py=0,tx=0,ty=0,pulse=0,enabled=true,disposed=false,last=0,delegate;
 function draw(now){frame=0;if(disposed||document.hidden)return;const started=performance.now(),dt=Math.min(40,now-last||16);last=now;const k=1-Math.exp(-dt/155);
  mode+=(targetMode-mode)*k;energy+=(targetEnergy-energy)*k;px+=(tx-px)*k;py+=(ty-py)*k;pulse=(pulse+dt*.0005)%1.25;
  const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio,innerWidth<701?1.25:1.5),w=Math.round(rect.width*dpr),h=Math.round(rect.height*dpr);
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h)}
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.uniform1f(uniforms.uAspect,w/h);gl.uniform1f(uniforms.uMode,mode);gl.uniform1f(uniforms.uEnergy,energy);gl.uniform2f(uniforms.uPointer,px,py);gl.uniform1f(uniforms.uPulse,pulse);gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);
  canvas.dataset.draws=String(Number(canvas.dataset.draws||0)+1);canvas.dataset.lastRenderMs=(performance.now()-started).toFixed(2);
  if(enabled&&(Math.abs(targetMode-mode)+Math.abs(targetEnergy-energy)+Math.abs(px-tx)+Math.abs(py-ty)>.001||targetEnergy>0))request()
 }
 function request(){if(!frame&&!disposed)frame=requestAnimationFrame(draw)}
 const resize=new ResizeObserver(request);resize.observe(canvas);const visibility=()=>{if(!document.hidden)request();else{cancelAnimationFrame(frame);frame=0}};document.addEventListener('visibilitychange',visibility);
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();disposed=true;cancelAnimationFrame(frame);resize.disconnect();document.removeEventListener('visibilitychange',visibility);const replacement=canvas.cloneNode();canvas.replaceWith(replacement);delegate=createCanvasScene(replacement,onReady);delegate.setEnabled(enabled);delegate.setProgress(targetMode)});
 onReady('webgl');request();
 return {setMode(value){this.setProgress(value)},setProgress(value){if(delegate){delegate.setProgress(value);return}if(Math.abs(targetMode-value)<.0005)return;mode=targetMode=value;energy=targetEnergy=0;request()},setPointer(x,y){if(delegate){delegate.setPointer(x,y);return}if(!enabled)return;tx=x;ty=y;request()},setEnabled(value){if(delegate){delegate.setEnabled(value);return}enabled=value;if(!value){mode=targetMode;energy=targetEnergy=0;px=py=tx=ty=0}request()},dispose(){delegate?.dispose();disposed=true;cancelAnimationFrame(frame);resize.disconnect();document.removeEventListener('visibilitychange',visibility);gl.deleteBuffer(buffer);gl.deleteBuffer(indexBuffer);gl.deleteProgram(program)}};
}

// Same interaction without GPU. A small CPU mesh, rendered only while changing.
function createCanvasScene(canvas,onReady){
 const ctx=canvas.getContext('2d',{alpha:true});
 if(!ctx){onReady(false);return {setMode(){},setProgress(){},setPointer(){},setEnabled(){},dispose(){}}}
 const control=[[-1.25,-1.05,-.15],[-1.28,-.1,-.18],[-1.08,1.02,-.16],[-.72,.9,.18],[.68,-.9,.3],[1.08,-1.02,-.06],[1.28,.1,-.12],[1.25,1.05,.1]];
 const point=t=>{const f=t*7,i=Math.min(6,Math.floor(f)),u=f-i,p0=control[Math.max(0,i-1)],p1=control[i],p2=control[i+1],p3=control[Math.min(7,i+2)];return [0,1,2].map(k=>.5*(2*p1[k]+(-p0[k]+p2[k])*u+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*u*u+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*u*u*u))};
 const norm=a=>{const d=Math.hypot(...a)||1;return a.map(n=>n/d)},sub=(a,b)=>a.map((v,i)=>v-b[i]),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
 function surface(t,w){const p=point(t),tan=norm(sub(point(Math.min(1,t+.001)),point(Math.max(0,t-.001)))),side=norm(cross(tan,[0,0,1])),bin=norm(cross(tan,side)),twist=Math.sin(t*Math.PI*2)*.7+.2,width=.48*(.83+.17*Math.sin(t*Math.PI));return p.map((v,i)=>v+side[i]*w*width*Math.cos(twist)+bin[i]*(w*width*Math.sin(twist)+.14*w*w))}
 const points=[],faces=[],length=120,breadth=18;
 for(let i=0;i<=length;i++)for(let j=0;j<=breadth;j++){const t=i/length,w=j/breadth*2-1,p=surface(t,w),n=norm(cross(sub(surface(Math.min(1,t+.001),w),surface(Math.max(0,t-.001),w)),sub(surface(t,w+.001),surface(t,w-.001))));points.push({p,n,t,w})}
 for(let i=0;i<length;i++)for(let j=0;j<breadth;j++){const a=i*(breadth+1)+j,b=a+breadth+1;faces.push([a,b,a+1],[b,b+1,a+1])}
 let mode=0,target=0,px=0,py=0,tx=0,ty=0,enabled=true,frame=0,last=0,dead=false;
 const rotate=(p,x,y,z)=>{const c=Math.cos,s=Math.sin;let a=[p[0]*c(z)-p[1]*s(z),p[0]*s(z)+p[1]*c(z),p[2]];a=[a[0],a[1]*c(x)-a[2]*s(x),a[1]*s(x)+a[2]*c(x)];return [a[0]*c(y)+a[2]*s(y),a[1],-a[0]*s(y)+a[2]*c(y)]};
 const light=norm([-.7,1.4,2.4]),wideLight=norm([1,.4,3]);
 function render(now){frame=0;if(dead||document.hidden)return;const started=performance.now(),dt=Math.min(40,now-last||16);last=now;const k=1-Math.exp(-dt/155);mode+=(target-mode)*k;px+=(tx-px)*k;py+=(ty-py)*k;
  const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio,1.25),W=Math.round(rect.width*dpr),H=Math.round(rect.height*dpr);if(W===canvas.width&&H===canvas.height&&canvas.dataset.draws)return;if(W!==canvas.width||H!==canvas.height){canvas.width=W;canvas.height=H}ctx.clearRect(0,0,W,H);
  const aspect=W/H,mobile=aspect<.8,s=mobile?.8-mode*.2:1.35-mode*.4,ox=mobile?.08-mode*.68:1.65-mode*2.75,oy=mobile?-1.15:.02+mode*.08;
  const transformed=points.map(p=>{const r=rotate(p.p,-.24+py*.12,-.42+px*.16+mode*.5,.13-mode*.4).map(n=>n*s);r[0]+=ox;r[1]+=oy;const z=6.7-r[2];return {x:(r[0]*2.42/aspect/z+1)*W/2,y:(1-r[1]*2.42/z)*H/2,z:r[2],n:rotate(p.n,-.24+py*.12,-.42+px*.16+mode*.5,.13-mode*.4),t:p.t,w:p.w}});
  const sorted=faces.map(face=>({face,z:face.reduce((s,i)=>s+transformed[i].z,0)})).sort((a,b)=>a.z-b.z);
  for(const item of sorted){const [a,b,c]=item.face.map(i=>transformed[i]);let n=norm(a.n.map((v,i)=>(v+b.n[i]+c.n[i])/3));if(n[2]<0)n=n.map(v=>-v);const diffuse=Math.max(0,dot(n,light)),spec=Math.pow(Math.max(0,dot(n,norm([light[0],light[1],light[2]+1]))),65),wide=Math.pow(Math.max(0,dot(n,wideLight)),9),rim=Math.pow(1-Math.abs(n[2]),3),edge=Math.pow(Math.abs((a.w+b.w+c.w)/3),14);
   const color=[.075,.105,.17].map((v,i)=>Math.round(Math.min(1,Math.pow(v*(.5+diffuse*.8)+wide*[.14,.19,.29][i]+spec*[.8,.87,1][i]+rim*[.1,.17,.38][i]+edge*[.22,.3,.55][i],.8))*255));
   ctx.fillStyle=`rgb(${color.join(',')})`;ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=.65;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.closePath();ctx.fill();ctx.stroke();
  }
  // Hairline machining along the folded surface gives the material real scale.
  ctx.lineWidth=.6*dpr;ctx.strokeStyle='rgba(183,204,248,.17)';for(let j=0;j<=breadth;j+=2){ctx.beginPath();for(let i=0;i<=length;i++){const p=transformed[i*(breadth+1)+j];if(!i)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y)}ctx.stroke()}
  canvas.dataset.draws=String(Number(canvas.dataset.draws||0)+1);canvas.dataset.lastRenderMs=(performance.now()-started).toFixed(2);
  if(enabled&&Math.abs(target-mode)+Math.abs(px-tx)+Math.abs(py-ty)>.001)request();
 }
 function request(){if(!frame&&!dead)frame=requestAnimationFrame(render)}
 const resize=new ResizeObserver(request);resize.observe(canvas);const visibility=()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0}else request()};document.addEventListener('visibilitychange',visibility);onReady('canvas2d');request();
 let scrollProgress=0,pointX=0,pointY=0;
 function composite(){canvas.style.transform=`translate3d(${-80*scrollProgress}px,${-20*scrollProgress}px,0) scale(${1-.38*scrollProgress}) perspective(1000px) rotateY(${pointX*3*(1-scrollProgress)}deg) rotateX(${-pointY*2*(1-scrollProgress)}deg)`}
 return {setMode(value){this.setProgress(value)},setProgress(value){scrollProgress=value;composite()},setPointer(x,y){if(!enabled)return;pointX=x;pointY=y;composite()},setEnabled(value){enabled=value;pointX=pointY=0;composite()},dispose(){dead=true;cancelAnimationFrame(frame);resize.disconnect();document.removeEventListener('visibilitychange',visibility)}};
}
