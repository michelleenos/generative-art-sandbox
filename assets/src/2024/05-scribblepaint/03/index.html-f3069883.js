import"../../../../modulepreload-polyfill-3cfb730f.js";import{G as x}from"../../../../lil-gui.esm-0b67869e.js";import{p}from"../../../../p5.min-1799c8ea.js";import{D as T}from"../../../../data-view-d08f0f9a.js";import{n as P}from"../../../../05backgrounds-f2333f4e.js";import{L as M,l as S,s as w}from"../../../../lines-debug-dca59c32.js";import{R as y}from"../../../../recorder-ad72569d.js";import"../../../../_commonjsHelpers-725317a4.js";import"../../../../_commonjs-dynamic-modules-302442b1.js";import"../../../../dom-07b9d998.js";/* empty css                        */import"../../../../create-canvas-8d178fc0.js";import"../../../../utils-4e5d7968.js";import"../../../../simplex-noise-c4e77999.js";import"../../../../index-168b6c61.js";import"../../../../easings-ac43f515.js";import"../../../../trig-shapes-945d471b.js";import"../../../../utils-a01d8ce5.js";import"../../../../sort-colors-8885660c.js";import"../../../../canvas-images-8b5f8d71.js";import"../../../../jszip.min-6cf760de.js";let C=["#f9c80e","#fa9161","#ee5968","#73d2de","#e9d2f4","#a160dd"],U=`
${w}
precision mediump float;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

attribute vec3 aPosition;
attribute vec2 aTexCoord;
varying vec2 vTexCoord;

uniform float uTime;

void main() {
  vTexCoord = aTexCoord;
  vec3 pos = aPosition;
  vec4 positionVec4 = vec4(pos, 1.0);
  gl_Position = uProjectionMatrix * uModelViewMatrix * positionVec4;
}
`,L=`
precision mediump float;

${w}

float PI = 3.14159265359;

uniform sampler2D uTex;
uniform float uTime;
uniform float uStrokeWeight;
uniform vec2 uPixelSize;
uniform float uProgress;
varying vec2 vTexCoord;

mat2 rotate2d(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
}
void main() {
    vec2 st = vTexCoord;

    float t = uTime * (1.0 - uProgress);
    
    float angle = 1.9 * atan(st.y, st.x);
    float radius = snoise(vec3(st.x * 50.0 - t * 0.3, st.y * 7.3 , t * 0.3)) * 0.03;

    float distort = uProgress;
    st.x -= cos(angle) * radius * distort;
    st.y += sin(angle) * radius * distort;

    float n = snoise(vec3(st.x * 3.5, st.y * 39.3, t)) * 0.3;
    st.x += n;
    st.y += n * 0.3;
    vec4 tex = texture2D(uTex, st );
    gl_FragColor = tex;
}
`,m=new T;m.hide();let h=new x().close();new p(e=>{let o,r,t,s=0,n,l,a=0,d;function f(){e.camera(),e.push(),e.resetShader(),e.noStroke();let i=e.createGraphics(e.width,e.height),g=P(n,"#fcf5ff");i.drawingContext.drawImage(g,0,0,e.width,e.height),e.image(i,-e.width/2,-e.height/2,e.width,e.height),e.pop()}function u(){t.reset(),s=0,a=0,e.clear(),f()}e.setup=function(){let i=Math.min(window.innerWidth,window.innerHeight);d=e.createCanvas(i,i,e.WEBGL),n=Math.min(e.width,e.height)*.9,l=Math.floor(n*.7),r=e.createGraphics(l,l),t=new M(r,{palette:C,pd:e.pixelDensity()}),t.parallel=3,t.stepRate=1e3,t.alphaThreshold=2,t.lineWidth=4,t.wiggle.withinLine=1,t.wiggle.betweenLine=1,t.wiggle.dir=1,t.wiggle.nLines=50,t.wiggle.max=1.5,t.colors.move=4e-4,t.len.minStart=100,t.len.minEnd=90,t.len.minReduceBy=1,t.lookPointShare=!0,t.newPixelRadius=50,t.newPixelMethod="circle",t.failsUntil.stop=700,t.failsUntil.moveLook=400,t.failsUntil.forceMoveLook=500,t.failsUntil.reduceMinLen=200,t.reset(),o=e.createShader(U,L),o.setUniform("uTime",0),o.setUniform("uTex",r),o.setUniform("uPixelSize",[1/r.width,1/r.height]),new y({canvas:d.elt,fns:{drawRecord:v,draw:c,reset:u},gui:h}),f(),S(t,h,m,u)};function v(i){return c(20)}function c(i){return t.update(i),a>=1&&t.done||(a+=i/1e4,s+=i),o.setUniform("uTime",s/1e3),o.setUniform("uTex",r),o.setUniform("uProgress",Math.min(a,1)),e.noStroke(),e.shader(o),e.plane(n,n),m.update(),!!(t.done&&a>=1)}e.draw=function(){}},document.getElementById("sketch")??void 0);
