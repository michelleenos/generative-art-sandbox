import"../../../../modulepreload-polyfill-3cfb730f.js";import{p as C}from"../../../../p5.min-1799c8ea.js";import{L as M,l as P,s as p}from"../../../../lines-debug-dca59c32.js";import{D as F}from"../../../../data-view-d08f0f9a.js";import{G as y}from"../../../../lil-gui.esm-0b67869e.js";import{R as U}from"../../../../recorder-ad72569d.js";import{e as D}from"../../../../easings-ac43f515.js";import{n as L}from"../../../../05backgrounds-f2333f4e.js";import"../../../../_commonjsHelpers-725317a4.js";import"../../../../_commonjs-dynamic-modules-302442b1.js";import"../../../../index-168b6c61.js";import"../../../../trig-shapes-945d471b.js";import"../../../../utils-4e5d7968.js";import"../../../../utils-a01d8ce5.js";import"../../../../sort-colors-8885660c.js";import"../../../../dom-07b9d998.js";import"../../../../canvas-images-8b5f8d71.js";import"../../../../jszip.min-6cf760de.js";/* empty css                        */import"../../../../create-canvas-8d178fc0.js";import"../../../../simplex-noise-c4e77999.js";let h={bright:["#f9c80e","#fa9161","#ee5968","#73d2de","#e9d2f4","#a160dd"],blues:["#99dfff","#60ebca","#c4f5ed","#b8ccfc","#04996d","#4467ab"],candy:["#f398c3","#cf3895","#a0d28d","#06b4b0","#fed000","#FF8552"],blumagenta:["#f4bfdb","#87425d","#3c2e6b","#1e588d","#0081af"],autumn:["#dc5132","#a46589","#7a82b8","#8ad0a6","#c4f0a8","#a0bb07","#ffcf33","#ec9f05"],rainbow:["#533a71","#454a96","#6184d8","#50c5b7","#9cec5b","#f0f465","#ff4a1c","#ed254e"],gems:["#87425d","#3c2e6b","#0081af","#a7d6c3","#285943","#8a8fbd","#9a79b8","#fcee49"]},s={camShiftZ:200,camShiftY:0,upShiftX:.4},q=h.blues,N=`
${p}
precision mediump float;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform vec2 uNoiseFreq1;

attribute vec3 aPosition;
attribute vec2 aTexCoord;
varying vec2 vTexCoord;
varying float vWave;

uniform float uTime;

void main() {
  vTexCoord = aTexCoord;

//   vec3 noisePos = vec3(aTexCoord.x * 50.0, aTexCoord.y * 234.0, uTime);
vec3 noisePos = vec3(aTexCoord.x * uNoiseFreq1.x, aTexCoord.y * uNoiseFreq1.y, uTime);
    // float noisePos = sin(aTexCoord.x * 50.0) * 0.5 + cos(aTexCoord.y * 234.0) * 0.5 + uTime;
    float wave = snoise(noisePos);
    vWave = wave;
  vec4 positionVec4 = vec4(aPosition, 1.0);
  gl_Position = uProjectionMatrix * uModelViewMatrix * positionVec4;
}
`,A=`
precision mediump float;

${p}

float PI = 3.14159265359;

uniform sampler2D uTex;
uniform float uTime;
uniform float uStrokeWeight;
uniform vec2 uPixelSize;
uniform float uAngleMult;
uniform float uDistortion;
varying vec2 vTexCoord;
varying float vWave;

mat2 rotate2d(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
}
void main() {
    vec2 st = vTexCoord;

    vec2 st1 = st;
    float wave = vWave;
    float angle = uAngleMult * sin(st.x + uTime);
    // st *= (1.0 - 0.4 * uDistortion);
    float radius = snoise(vec3(st.x * 50.0 - uTime * 0.3, st.y * 7.3 - uTime * 0.6 , uTime * 0.3)) * 0.05;
    st.x += cos(angle) * radius * 0.2;
    st.y += sin(angle) * radius * 0.5;

    vec4 texColor = texture2D(uTex, st);
    gl_FragColor = texColor;
}
`,x=new F,n=new y;const k=e=>{e.stepRate=320,e.stepMult=3,e.alphaThreshold=54,e.lineWidth=5,e.longLineRatio=.05,e.newPixelRadius=136,e.newPixelMethod="circle",e.parallel=20,e.lookPointShare=!0,e.redraw=!1,e.len.minStart=217,e.len.minEnd=30,e.len.minReduceBy=1,e.len.max=500,e.len.maxForColor=500,e.colors.mixSpace="hsv",e.colors.pattern="step",e.colors.move=.00414,e.colors.sort="hue",e.colors.sortDir="+",e.colors.shadowAmt=0,e.colors.shadowAlpha=0,e.colors.shadowOffset[0]=0,e.colors.shadowOffset[1]=0,e.wiggle.withinLine=.95,e.wiggle.onLinePointFail=.95,e.wiggle.betweenLine=1.5,e.wiggle.dir=-1,e.wiggle.nLines=15,e.wiggle.max=2,e.failsUntil.stop=1e3,e.failsUntil.moveLook=100,e.failsUntil.forceMoveLook=300,e.failsUntil.reduceMinLen=200,e.tries.pixel=10,e.tries.linePoint=10,e.palette=h.blumagenta};new C(e=>{let t,r,o,l=0,u,c,f=0;function g(){e.camera(),e.push(),e.resetShader(),e.noStroke();let i=e.createGraphics(e.width,e.height),d=L(u,"#fcf5ff");i.drawingContext.drawImage(d,0,0,e.width,e.height),e.image(i,-e.width/2,-e.height/2,e.width,e.height),e.pop()}function v(){o.reset(),l=0,f=0,e.clear(),g()}e.setup=function(){let i=Math.min(window.innerWidth,window.innerHeight),d=e.createCanvas(i,i,e.WEBGL);u=Math.min(e.width,e.height)*.9,c=Math.floor(u*.7),r=e.createGraphics(c,c),o=new M(r,{palette:q,pd:e.pixelDensity()}),t=e.createShader(N,A),t.setUniform("uTime",0),t.setUniform("uTex",r),t.setUniform("uPixelSize",[1/r.width,1/r.height]),t.setUniform("uNoiseFreq1",[50,234]),t.setUniform("uAngleMult",1.9);const a={uNoiseFreq1:[50,234],uAngleMult:1.9},m=n.addFolder("shader");m.add(a.uNoiseFreq1,0,0,1).name("uNoiseFreq1.x"),m.add(a.uNoiseFreq1,1,0,1).name("uNoiseFreq1.y"),m.add(a,"uAngleMult",0,10,.1),m.onChange(()=>{t.setUniform("uNoiseFreq1",a.uNoiseFreq1),t.setUniform("uAngleMult",a.uAngleMult)}),new U({canvas:d.elt,fns:{drawRecord:b,draw:w,reset:v},gui:n}),g(),n.add(o,"palette",h),n.add(s,"camShiftZ",-500,500),n.add(s,"camShiftY",-500,500),n.add(s,"upShiftX",-1,1),k(o),o.reset(),P(o,n,x,v)};function b(i){return w(20)}function w(i){o.done||o.update(i),f>=1&&o.done||(f+=i/1e4,l+=i),t.setUniform("uTime",l/1e3),t.setUniform("uTex",r),t.setUniform("uDistortion",f),t.setUniform("uPixelSize",[1/r.width,1/r.height]),e.noStroke(),e.shader(t),e.circle(0,0,u);let a=D.outSine(Math.min(f,1)),m=850+a*s.camShiftZ,T=0+a*s.camShiftY,S=a*s.upShiftX;return e.camera(0,T,m,0,0,0,S,1,0),x.update(),!!(o.done&&f>=1)}e.draw=function(){}},document.getElementById("sketch")??void 0);
