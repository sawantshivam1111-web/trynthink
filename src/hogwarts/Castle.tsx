import { useEffect, useRef, useState } from 'react'

type V3 = [number, number, number]
const sub = (a: V3, b: V3): V3 => [a[0]-b[0], a[1]-b[1], a[2]-b[2]]
const cross = (a: V3, b: V3): V3 => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]
const norm = (a: V3): V3 => { const n = Math.hypot(...a) || 1; return a.map(v => v/n) as V3 }
const dot = (a: V3,b: V3) => a[0]*b[0]+a[1]*b[1]+a[2]*b[2]
function multiply(a: number[], b: number[]) {
  const c = Array(16).fill(0)
  for(let col=0;col<4;col++) for(let row=0;row<4;row++) for(let k=0;k<4;k++) c[col*4+row]+=a[k*4+row]*b[col*4+k]
  return c
}
function view(eye: V3, target: V3) {
  const z=norm(sub(eye,target)), x=norm(cross([0,1,0],z)), y=cross(z,x)
  return [x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]
}
function geometry() {
  const out: number[] = [], stone: V3=[.32,.38,.43], pale: V3=[.43,.47,.49], roof: V3=[.065,.17,.21], gold: V3=[1,.67,.25]
  const triangle=(a:V3,b:V3,c:V3,color:V3,emission=0) => {
    const n=norm(cross(sub(b,a),sub(c,a)))
    for(const p of [a,b,c]) out.push(...p,...n,...color,emission)
  }
  const quad=(a:V3,b:V3,c:V3,d:V3,color:V3,e=0) => {triangle(a,b,c,color,e);triangle(a,c,d,color,e)}
  const box=(x:number,y:number,z:number,w:number,h:number,d:number,color:V3=stone,e=0) => {
    const a=x-w/2,b=x+w/2,c=y-h/2,f=y+h/2,g=z-d/2,j=z+d/2
    quad([a,c,j],[b,c,j],[b,f,j],[a,f,j],color,e);quad([b,c,g],[a,c,g],[a,f,g],[b,f,g],color,e)
    quad([b,c,j],[b,c,g],[b,f,g],[b,f,j],color,e);quad([a,c,g],[a,c,j],[a,f,j],[a,f,g],color,e)
    quad([a,f,j],[b,f,j],[b,f,g],[a,f,g],color,e);quad([a,c,g],[b,c,g],[b,c,j],[a,c,j],color,e)
  }
  const cylinder=(x:number,y:number,z:number,r:number,h:number,color:V3=stone,top=r,steps=16) => {
    for(let i=0;i<steps;i++) {
      const a=i/steps*Math.PI*2,b=(i+1)/steps*Math.PI*2
      const p:V3=[x+Math.cos(a)*r,y-h/2,z+Math.sin(a)*r],q:V3=[x+Math.cos(b)*r,y-h/2,z+Math.sin(b)*r]
      const s:V3=[x+Math.cos(b)*top,y+h/2,z+Math.sin(b)*top],t:V3=[x+Math.cos(a)*top,y+h/2,z+Math.sin(a)*top]
      quad(q,p,t,s,color); if(top) triangle([x,y+h/2,z],s,t,color)
    }
  }
  const tower=(x:number,z:number,r:number,h:number) => {
    cylinder(x,h/2,z,r,h,pale);cylinder(x,h-.25,z,r*1.14,.45,stone)
    cylinder(x,h+1.7,z,r*1.5,3.5,roof,0);cylinder(x,h+3.65,z,.045,.5,gold,.012)
    for(let level=1.6;level<h-.5;level+=1.8) for(const a of [0,Math.PI/2,Math.PI,Math.PI*1.5]) {
      const xx=x+Math.cos(a)*(r+.015),zz=z+Math.sin(a)*(r+.015)
      box(xx,level,zz,a===0||a===Math.PI?.055:.22,.48,a===0||a===Math.PI?.22:.055,gold,1)
    }
  }
  const gable=(x:number,y:number,z:number,w:number,h:number,d:number) => {
    const a:V3=[x-w/2,y,z-d/2],b:V3=[x+w/2,y,z-d/2],c:V3=[x,y+h,z-d/2]
    const e:V3=[x-w/2,y,z+d/2],f:V3=[x+w/2,y,z+d/2],g:V3=[x,y+h,z+d/2]
    triangle(b,a,c,pale);triangle(e,f,g,pale);quad(a,e,g,c,roof);quad(f,b,c,g,roof)
  }
  quad([-70,-2.7,50],[70,-2.7,50],[70,-2.7,-90],[-70,-2.7,-90],[.035,.09,.14])
  for(let i=0;i<9;i++) cylinder(-33+i*8,-1,-28-(i%2)*5,7,12+(i%3)*6,[.09,.15,.19],0,5)
  cylinder(0,-1.4,0,10.5,2.5,[.14,.2,.23],11.2,24);cylinder(0,-.2,0,11.2,.3,[.19,.26,.25],11.2,32)
  box(0,2.6,1,7,5.2,4.4,pale);gable(0,5.2,1,7.7,2.5,5)
  box(-5,2,0,3.2,4,6);gable(-5,4,0,3.7,1.6,6.5)
  box(5,1.9,0,3.2,3.8,6);gable(5,3.8,0,3.7,1.6,6.5)
  box(0,1.5,-3.5,11,3,2.2);gable(0,3,-3.5,11.5,2,2.7)
  tower(-3.6,-3.5,1.25,10.2);tower(3,-3.3,1,8.2);tower(-6.7,2.2,1,6.6);tower(6.7,2.2,1,6.6)
  tower(-6.7,-3, .75,5.2);tower(6.7,-3,.75,5.2);tower(0,3.1,.82,7.2)
  for(let x=-2.8;x<=3;x+=1.1) for(let y=1.3;y<5;y+=1.5) {
    if(Math.abs(x)<.6&&y<2) continue
    box(x,y,3.23,.3,.75,.08,gold,1);box(x,y,-1.23,.3,.75,.08,gold,1)
  }
  for(const x of [-5,5]) for(let y=1.2;y<3.7;y+=1.4) for(let z=-1.7;z<3;z+=1.3) box(x+(x<0?-1.62:1.62),y,z,.06,.6,.25,gold,1)
  box(0,1.05,3.32,1.05,2.1,.15,[.08,.07,.06]);box(0,1.15,3.42,.68,1.6,.06,gold,1)
  for(let i=0;i<7;i++) box(0,.04-i*.17,4+i*.52,2.2+i*.12,.2,.65,pale)
  for(const x of [-8.5,8.5]) for(let z=-5;z<7;z+=2) cylinder(x,.4,z,.8,1.6,[.12,.24,.21],0,5)
  return new Float32Array(out)
}
const VERTEX=`attribute vec3 aPosition;attribute vec3 aNormal;attribute vec3 aColor;attribute float aGlow;
uniform mat4 uMatrix;uniform vec3 uEye;varying vec3 vColor;varying float vFog;varying vec3 vWorld;
void main(){float light=.36+max(dot(normalize(aNormal),normalize(vec3(-.5,.9,.7))),0.)*.7;
vColor=mix(aColor*light,aColor*1.28,aGlow);vFog=smoothstep(30.,85.,distance(aPosition,uEye));vWorld=aPosition;gl_Position=uMatrix*vec4(aPosition,1.);}`
const FRAGMENT=`precision mediump float;varying vec3 vColor;varying float vFog;varying vec3 vWorld;uniform float uTime;
void main(){vec3 c=vColor;if(vWorld.y < -2.65)c+=vec3(.025,.04,.05)*pow(max(0.,sin(vWorld.z*3.+vWorld.x*.5+uTime*.5)),12.);
gl_FragColor=vec4(mix(c,vec3(.027,.047,.075),vFog),1.);}`

export default function Castle({ motion = true }: { motion?: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [fallback,setFallback]=useState(false)
  useEffect(() => {
    const el=canvas.current
    if(!el) return
    let gl:WebGLRenderingContext|null=null
    try {gl=el.getContext('webgl',{alpha:true,antialias:true,powerPreference:'low-power'})} catch { /* fallback below */ }
    if(!gl) {setFallback(true);return}
    const ctx=gl, shaders:WebGLShader[]=[], buffers:WebGLBuffer[]=[]
    let program:WebGLProgram|null=null, frame=0, visible=true, disposed=false, last=0, yaw=-.4, target=-.4, pitch=0
    const cleanup=() => {disposed=true;cancelAnimationFrame(frame);buffers.forEach(b=>ctx.deleteBuffer(b));shaders.forEach(s=>ctx.deleteShader(s));if(program)ctx.deleteProgram(program)}
    try {
      const compile=(type:number,source:string) => {
        const s=ctx.createShader(type);if(!s)throw Error('Shader unavailable');shaders.push(s)
        ctx.shaderSource(s,source);ctx.compileShader(s);if(!ctx.getShaderParameter(s,ctx.COMPILE_STATUS))throw Error('Shader compilation failed');return s
      }
      program=ctx.createProgram();if(!program)throw Error('WebGL program unavailable')
      ctx.attachShader(program,compile(ctx.VERTEX_SHADER,VERTEX));ctx.attachShader(program,compile(ctx.FRAGMENT_SHADER,FRAGMENT));ctx.linkProgram(program)
      if(!ctx.getProgramParameter(program,ctx.LINK_STATUS))throw Error('WebGL linking failed')
      ctx.useProgram(program)
      const vertices=geometry(),buffer=ctx.createBuffer();if(!buffer)throw Error('WebGL buffer unavailable');buffers.push(buffer)
      ctx.bindBuffer(ctx.ARRAY_BUFFER,buffer);ctx.bufferData(ctx.ARRAY_BUFFER,vertices,ctx.STATIC_DRAW)
      for(const [name,size,offset] of [['aPosition',3,0],['aNormal',3,3],['aColor',3,6],['aGlow',1,9]] as [string,number,number][]) {
        const loc=ctx.getAttribLocation(program,name);if(loc>=0){ctx.enableVertexAttribArray(loc);ctx.vertexAttribPointer(loc,size,ctx.FLOAT,false,40,offset*4)}
      }
      const matrix=ctx.getUniformLocation(program,'uMatrix'),eyeUniform=ctx.getUniformLocation(program,'uEye'),timeUniform=ctx.getUniformLocation(program,'uTime')
      ctx.enable(ctx.DEPTH_TEST);ctx.clearColor(0,0,0,0)
      const draw=(now=0) => {
        if(disposed||ctx.isContextLost())return
        const w=el.clientWidth,h=el.clientHeight;if(!w||!h)return
        const dpr=Math.min(window.devicePixelRatio||1,w<600?1.3:1.6)
        const width=Math.round(w*dpr),height=Math.round(h*dpr)
        if(el.width!==width||el.height!==height){el.width=width;el.height=height}
        ctx.viewport(0,0,width,height);ctx.clear(ctx.COLOR_BUFFER_BIT|ctx.DEPTH_BUFFER_BIT)
        yaw+=(target-yaw)*.07
        const angle=yaw+(motion?Math.sin(now*.00012)*.045:0),distance=w/h<1.1?40:33
        const eye:V3=[Math.sin(angle)*distance,12+pitch,Math.cos(angle)*distance]
        const f=1/Math.tan(.64/2),near=.1,far=150,aspect=w/h
        const projection=[f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0]
        ctx.uniformMatrix4fv(matrix,false,new Float32Array(multiply(projection,view(eye,[0,3.4,0]))));ctx.uniform3fv(eyeUniform,eye);ctx.uniform1f(timeUniform,motion?now*.001:0)
        ctx.drawArrays(ctx.TRIANGLES,0,vertices.length/10)
      }
      const tick=(now:number) => {frame=0;if(disposed||!visible||document.hidden)return;if(now-last>33){draw(now);last=now}frame=requestAnimationFrame(tick)}
      const resume=() => {if(disposed)return;cancelAnimationFrame(frame);frame=0;draw();if(motion&&visible&&!document.hidden)frame=requestAnimationFrame(tick)}
      const move=(event:PointerEvent) => {if(!motion)return;const r=el.getBoundingClientRect();target=-.4+((event.clientX-r.left)/r.width-.5)*.8;pitch=((event.clientY-r.top)/r.height-.5)*3;resume()}
      const leave=() => {target=-.4;pitch=0;resume()}
      const key=(event:KeyboardEvent) => {if(!motion)return;if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();target+=event.key==='ArrowLeft'?-.14:.14;resume()}}
      const lost=(event:Event) => {event.preventDefault();cancelAnimationFrame(frame);setFallback(true)}
      const observer=typeof IntersectionObserver!=='undefined'?new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting??true;resume()}):null
      const resize=typeof ResizeObserver!=='undefined'?new ResizeObserver(resume):null
      observer?.observe(el);resize?.observe(el);window.addEventListener('resize',resume);document.addEventListener('visibilitychange',resume)
      el.addEventListener('pointermove',move);el.addEventListener('pointerleave',leave);el.addEventListener('keydown',key);el.addEventListener('webglcontextlost',lost)
      setFallback(false);resume()
      return () => {observer?.disconnect();resize?.disconnect();window.removeEventListener('resize',resume);document.removeEventListener('visibilitychange',resume);el.removeEventListener('pointermove',move);el.removeEventListener('pointerleave',leave);el.removeEventListener('keydown',key);el.removeEventListener('webglcontextlost',lost);cleanup()}
    } catch {cleanup();setFallback(true)}
  },[motion])
  return <figure className="hw-castle" aria-label="An original Hogwarts-inspired 3D castle">
    <div className="hw-moon" aria-hidden="true" />
    {fallback&&<svg className="hw-castle-fallback" viewBox="0 0 600 400" aria-hidden="true"><path fill="#243846" d="M60 360L90 300H130V200L155 140L180 200V280H210V140L235 60L260 140V230H310V190L345 110L380 190V280H420V200L450 130L480 200V310H520L550 360Z"/><path fill="#d9b16a" d="M226 170h12v23h-12zm104 52h12v20h-12zm-185 40h10v22h-10zm290-13h10v22h-10zm-170 65h18v44h-18z"/></svg>}
    <canvas ref={canvas} tabIndex={motion&&!fallback?0:-1} aria-label="Moonlit castle. Use left and right arrow keys to turn the view." style={{visibility:fallback?'hidden':'visible'}} />
    <figcaption>HOGWARTS AFTER HOURS <span>{motion?'Move to explore':'Stillness is a kind of magic'}</span></figcaption>
  </figure>
}