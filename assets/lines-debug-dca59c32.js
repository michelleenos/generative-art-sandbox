var $=Object.defineProperty;var R=(t,e,i)=>e in t?$(t,e,{enumerable:!0,configurable:!0,writable:!0,value:i}):t[e]=i;var a=(t,e,i)=>(R(t,typeof e!="symbol"?e+"":e,i),i);import{c as P}from"./index-168b6c61.js";import{e as S}from"./easings-ac43f515.js";import{R as C}from"./trig-shapes-945d471b.js";import{r as M}from"./utils-4e5d7968.js";import{b as L,r as b,a as y,p as F,s as A}from"./utils-a01d8ce5.js";import{s as U}from"./sort-colors-8885660c.js";const D=({x:t,y:e,angle:i,wiggle:s=.1,wiggleMax:o,maxTries:n=20,lenMax:l=100,lenMin:u=10,checkPoint:g,mult:d=1})=>{let h=t,c=e,r=0,w=i,m=[];for(;m.length<l&&r<n;){let f=h+Math.cos(w)*d,p=c+Math.sin(w)*d,{valid:v,stop:k}=g(f,p);if(k)break;if(!v){r++,w+=L(s*2);continue}m.push([f,p]),h=f,c=p,r=0;let x=w-i;o&&Math.abs(x)>o?w+=L(o,x>0?-1:1):w+=L(s)}return m.length<u?!1:m};function I(t,e){return Math.pow(t[0]-e[0],2)+Math.pow(t[1]-e[1],2)}const O=()=>({done:!1,doneAdding:!1,colorIndex:[],linesDrawn:0,longLines:[],failsCount:0,longLinesSaved:[],redrawing:!1,redrawnCount:0,_currentLines:[],_currentLineLengths:[]});class q{constructor(e,i){a(this,"g");a(this,"width");a(this,"height");a(this,"rect");a(this,"pd");a(this,"palette");a(this,"currentPalette");a(this,"stepRate",2e3);a(this,"stepMult",1);a(this,"alphaThreshold",150);a(this,"longLineRatio",.4);a(this,"lineWidth",3);a(this,"newPixelRadius",50);a(this,"newPixelMethod","random");a(this,"parallel",1);a(this,"lookPointShare",!1);a(this,"len",{minStart:20,minEnd:10,minReduceBy:2,maxForColor:500,max:500});a(this,"redraw",!1);a(this,"wiggle",{withinLine:.05,onLinePointFail:.05,betweenLine:.05,nLines:100,max:0,dir:void 0});a(this,"failsUntil",{stop:1e3,moveLook:150,forceMoveLook:300,reduceMinLen:200});a(this,"tries",{pixel:10,linePoint:10});a(this,"colors",{sort:"none",pattern:"step",move:1e-4,mixSpace:"hsl",sortDir:"+",shadowAmt:0,shadowAlpha:0,shadowOffset:[0,0]});a(this,"state",{_currentLineLengths:[],_currentLines:[],linesDrawn:0,lineLookPoint:[],longLines:[],angle:0,redrawnCount:0,redrawing:!1,longLinesSaved:[],done:!1,doneAdding:!1,colorIndex:[],failsCount:0,currentMinLen:this.len.minStart});this.width=e.width,this.height=e.height,this.rect=new C(0,0,this.width,this.height),this.pd=i.pd,this.g=e,this.g.pixelDensity(this.pd),this.loadPixels(),this.state.angle=Math.random()*Math.PI*2,this.state.lineLookPoint=[];for(let s=0;s<this.parallel;s++)this.state.lineLookPoint[s]=[Math.floor(M(this.width)),Math.floor(M(this.height))];this.palette=i.palette,this.sortColors();for(let s=0;s<this.parallel;s++)this.state._currentLines.push([]),this.state._currentLineLengths.push(0)}get done(){return this.state.done}setLine(e,i=[],s=!1){!s&&i.length>2&&I(i[0],i[i.length-1])>(this.width*this.longLineRatio)**2&&(this.state.longLines.push([...i]),this.state.longLinesSaved.push([...i])),this.state._currentLines[e]=[...i],this.state._currentLineLengths[e]=i.length,this.state.failsCount=0}sortColors(){this.currentPalette=[...this.palette],this.colors.sort!=="none"&&(this.currentPalette=U(this.currentPalette,this.colors.sort,this.colors.sortDir))}maybeGetNewPixel(e){let i,s;this.lookPointShare?[i,s]=this.state.lineLookPoint[0]:(this.state.lineLookPoint[e]||(this.state.lineLookPoint[e]=this.rect.getRandom()),[i,s]=this.state.lineLookPoint[e]);let o=0;for(;o<this.tries.pixel;){let[n,l]=this.newPixelMethod==="circle"?b(i,s,this.newPixelRadius):this.newPixelMethod==="rect"?y(i,s,this.newPixelRadius):this.rect.getRandom();if(this.isBlankIshPx(n,l))return[n,l];o++}return!1}isBlankIshPx(e,i){let s=F(Math.round(e),Math.round(i),this.width,this.pd);return this.g.pixels[s+3]<this.alphaThreshold}getLinePoints(e,i){return D({x:e,y:i,angle:this.state.angle,wiggle:this.wiggle.withinLine,wiggleMax:this.wiggle.max??void 0,lenMax:this.len.max,lenMin:this.state.currentMinLen,mult:this.stepMult,maxTries:this.tries.linePoint,checkPoint:(s,o)=>{if(this.rect.contains(s,o)){if(!this.isBlankIshPx(s,o))return{valid:!1,stop:!1}}else return{valid:!1,stop:!0};return{valid:!0,stop:!1}}})}addFail(e){let i=this.state;if(i.failsCount++,i.failsCount>this.failsUntil.moveLook&&i.longLines.length){let s=i.longLines.shift();this.lookPointShare?i.lineLookPoint[0]=s[Math.floor(s.length/2)]:i.lineLookPoint[e]=s[Math.floor(s.length/2)]}else i.failsCount>this.failsUntil.forceMoveLook&&(this.lookPointShare?i.lineLookPoint[0]=this.rect.getRandom():i.lineLookPoint[e]=this.rect.getRandom());i.failsCount>this.failsUntil.reduceMinLen&&(this.state.currentMinLen=Math.max(this.state.currentMinLen-this.len.minReduceBy,this.len.minEnd)),i.failsCount>this.failsUntil.stop&&this.state.currentMinLen===this.len.minEnd&&(i.doneAdding=!0,i.done=!0,i.longLinesSaved.sort((s,o)=>o.length-s.length),i.redrawnCount=0)}maybeGetNewLine(e){for(;;){let i=this.maybeGetNewPixel(e);if(!i)break;let[s,o]=i,n=this.getLinePoints(s,o);if(!n)break;return this.setLine(e,n),!0}return this.addFail(e),!1}finishLine(e){this.state.linesDrawn++,this.loadPixels(),this.setLine(e),this.state.linesDrawn%this.wiggle.nLines===0&&this.getNewAngle(),this.redraw&&this.state.linesDrawn>this.redraw.after&&this.state.linesDrawn%this.redraw.rate===0&&this.state.redrawnCount<this.state.longLinesSaved.length*this.redraw.maxMult&&this.doRedraw(e)}getNewAngle(){this.state.angle+=L(this.wiggle.betweenLine,this.wiggle.dir)}doRedraw(e){this.state.redrawing=!0,this.state.redrawnCount++,this.setLine(e,this.state.longLinesSaved[this.state.redrawnCount%this.state.longLinesSaved.length],!0)}setColor(e){let i,s=this.state.colorIndex;if(this.colors.pattern==="step"){s[e]===void 0&&(s[e]=0),s[e]+=this.colors.move,s[e]>=this.currentPalette.length&&(s[e]=0);let o=this.currentPalette[Math.floor(s[e])],n=this.currentPalette[Math.ceil(s[e])];n||(n=this.currentPalette[0]),i=P.mix(o,n,s[e]%1,this.colors.mixSpace)}else{let o=this.state._currentLineLengths[e],n=Math.min(this.len.maxForColor,this.len.max),l=(o-this.len.minEnd)/(n-this.len.minEnd);l=S.outQuart(l),i=P(this.currentPalette[Math.floor(l*(this.currentPalette.length-1))])}if(this.colors.shadowAmt){let o=i.alpha(this.colors.shadowAlpha).hex();A(this.g,o,this.lineWidth*this.colors.shadowAmt,this.colors.shadowOffset)}this.g.stroke(i.hex()),this.g.strokeWeight(this.lineWidth)}lineStep(e){let i=this.state._currentLines[e];if(i.length<2)return;let[s,o]=i[0];this.setColor(e);let[n,l]=i[1];this.g.line(s,o,n,l),i.shift(),i.length<2&&this.finishLine(e)}update(e){let i=Math.round(e/1e3*this.stepRate);for(;i>0&&!this.state.done;){let s=0;for(;s<this.parallel&&!this.state.done;){let o=this.state._currentLines[s];o&&o.length>=2?(this.lineStep(s),s++):this.maybeGetNewLine(s)}if(i--,this.state.done)break}return this.state.done}loadPixels(){this.g.loadPixels()}reset(e){this.g.clear(),this.loadPixels(),this.sortColors();let i=e||Math.random()*Math.PI*2,s=[...this.state.lineLookPoint];for(let o=0;o<this.parallel;o++)s[o]=this.rect.getRandom();this.state={...O(),angle:i,lineLookPoint:s,currentMinLen:this.len.minStart}}}const X=`
vec3 random3(vec3 c) {
    float j = 4096.0 * sin(dot(c, vec3(17.0, 59.4, 15.0)));
    vec3 r;
    r.z = fract(512.0 * j);
    j *= .125;
    r.x = fract(512.0 * j);
    j *= .125;
    r.y = fract(512.0 * j);
    return r - 0.5;
}
// https://thebookofshaders.com/edit.php#11/iching-03.frag
const float F3 = 0.3333333;
const float G3 = 0.1666667;
float snoise(vec3 p) {

  vec3 s = floor(p + dot(p, vec3(F3)));
  vec3 x = p - s + dot(s, vec3(G3));

  vec3 e = step(vec3(0.0), x - x.yzx);
  vec3 i1 = e * (1.0 - e.zxy);
  vec3 i2 = 1.0 - e.zxy * (1.0 - e);

  vec3 x1 = x - i1 + G3;
  vec3 x2 = x - i2 + 2.0 * G3;
  vec3 x3 = x - 1.0 + 3.0 * G3;

  vec4 w, d;

  w.x = dot(x, x);
  w.y = dot(x1, x1);
  w.z = dot(x2, x2);
  w.w = dot(x3, x3);

  w = max(0.6 - w, 0.0);

  d.x = dot(random3(s), x);
  d.y = dot(random3(s + i1), x1);
  d.z = dot(random3(s + i2), x2);
  d.w = dot(random3(s + 1.0), x3);

  w *= w;
  w *= w;
  d *= w;

  return dot(d, vec4(52.0));
}

`;let E=["rgb","hsl","hsv","hsi","lab","oklab","lch","oklch","hcl","lrgb"];const N=t=>{let e="";e+=`lines.stepRate = ${t.stepRate}
`,e+=`lines.stepMult = ${t.stepMult}
`,e+=`lines.alphaThreshold = ${t.alphaThreshold}
`,e+=`lines.lineWidth = ${t.lineWidth}
`,e+=`lines.longLineRatio = ${t.longLineRatio}
`,e+=`lines.newPixelRadius = ${t.newPixelRadius}
`,e+=`lines.newPixelMethod = '${t.newPixelMethod}'
`,e+=`lines.parallel = ${t.parallel}
`,e+=`lines.lookPointShare = ${t.lookPointShare}
`,t.redraw?(e+=`lines.redraw = {
`,e+=`rate: ${t.redraw.rate}
`,e+=`maxMult: ${t.redraw.maxMult}
`,e+=`after: ${t.redraw.after}
`,e+=`}
`):e+=`lines.redraw = false
`,e+=`lines.len.minStart = ${t.len.minStart}
`,e+=`lines.len.minEnd = ${t.len.minEnd}
`,e+=`lines.len.minReduceBy = ${t.len.minReduceBy}
`,e+=`lines.len.max = ${t.len.max}
`,e+=`lines.len.maxForColor = ${t.len.maxForColor}
`,e+=`lines.colors.mixSpace = '${t.colors.mixSpace}'
`,e+=`lines.colors.pattern = '${t.colors.pattern}'
`,e+=`lines.colors.move = ${t.colors.move}
`,e+=`lines.colors.sort = '${t.colors.sort}'
`,e+=`lines.colors.sortDir = '${t.colors.sortDir}'
`,e+=`lines.colors.shadowAmt = ${t.colors.shadowAmt}
`,e+=`lines.colors.shadowAlpha = ${t.colors.shadowAlpha}
`,e+=`lines.colors.shadowOffset[0] = ${t.colors.shadowOffset[0]}
`,e+=`lines.colors.shadowOffset[1] = ${t.colors.shadowOffset[1]}
`,e+=`lines.wiggle.withinLine = ${t.wiggle.withinLine}
`,e+=`lines.wiggle.onLinePointFail = ${t.wiggle.onLinePointFail}
`,e+=`lines.wiggle.betweenLine = ${t.wiggle.betweenLine}
`,e+=`lines.wiggle.dir = ${t.wiggle.dir}
`,e+=`lines.wiggle.nLines = ${t.wiggle.nLines}
`,e+=`lines.wiggle.max = ${t.wiggle.max}
`,e+=`lines.failsUntil.stop = ${t.failsUntil.stop}
`,e+=`lines.failsUntil.moveLook = ${t.failsUntil.moveLook}
`,e+=`lines.failsUntil.forceMoveLook = ${t.failsUntil.forceMoveLook}
`,e+=`lines.failsUntil.reduceMinLen = ${t.failsUntil.reduceMinLen}
`,e+=`lines.tries.pixel = ${t.tries.pixel}
`,e+=`lines.tries.linePoint = ${t.tries.linePoint}
`,navigator.clipboard.writeText(e)},Y=(t,e,i,s)=>{let o=e.addFolder("general").close();o.add(t,"stepRate",0,5e3,1),o.add(t,"stepMult",1,30,1),o.add(t,"alphaThreshold",0,255,1),o.add(t,"lineWidth",1,20,.5),o.add(t,"longLineRatio",0,3,.01),o.add(t,"newPixelRadius",5,2e3,1),o.add(t,"newPixelMethod",["random","rect","circle"]),o.add(t,"parallel",1,100,1),o.add(t,"lookPointShare");let n={doRedraw:t.redraw!==!1,redraw:{rate:50,maxMult:2,after:300},reset:()=>{s&&s(),t.reset()},export:()=>N(t)},l=e.addFolder("redraw").close(),u=l.add(n,"doRedraw");l.add(n.redraw,"rate",0,1e3,1),l.add(n.redraw,"maxMult",1,10,.1),l.add(n.redraw,"after",0,1e3,1),l.onChange(({value:w,controller:m})=>{m===u&&(w?(t.redraw=n.redraw,l.controllersRecursive().forEach(f=>{f!==u&&f.enable()})):(t.redraw=!1,l.controllersRecursive().forEach(f=>{f!==u&&f.disable()})))});let g=e.addFolder("lengths").close();g.add(t.len,"minStart",0,500,1).name("minStart"),g.add(t.len,"minEnd",0,500,1).name("minEnd"),g.add(t.len,"minReduceBy",0,500,1).name("minReduce"),g.add(t.len,"max",0,1e3,1).name("max"),g.add(t.len,"maxForColor",0,1e3,1).name("maxForColor");let d=e.addFolder("colors").close();d.add(t.colors,"mixSpace",E),d.add(t.colors,"pattern",["length","step"]),d.add(t.colors,"move",0,.005,1e-6),d.add(t.colors,"sort",["none","hue","saturation","lightness","luminance","lightness-saturation"]),d.add(t.colors,"sortDir",["+","-"]),d.add(t.colors,"shadowAmt",0,10,.01),d.add(t.colors,"shadowAlpha",0,1,.01),d.add(t.colors.shadowOffset,"0",-1,1,.01).name("shadowOffset.x"),d.add(t.colors.shadowOffset,"1",-1,1,.01).name("shadowOffset.y");let h=e.addFolder("wiggle").close();h.add(t.wiggle,"withinLine",0,5,.001),h.add(t.wiggle,"onLinePointFail",0,5,.001),h.add(t.wiggle,"betweenLine",0,5,.001),h.add(t.wiggle,"dir",[1,-1,void 0]),h.add(t.wiggle,"nLines",0,1e3,1),h.add(t.wiggle,"max",0,5,.01);let c=e.addFolder("fails").close();c.add(t.failsUntil,"stop",0,1e4,1),c.add(t.failsUntil,"moveLook",0,1e4,1),c.add(t.failsUntil,"forceMoveLook",0,1e4,1),c.add(t.failsUntil,"reduceMinLen",0,1e4,1),c.add(t.tries,"pixel",0,1e3,1).name("tries.pixel"),c.add(t.tries,"linePoint",0,1e3,1).name("tries.linePoint"),e.add(n,"reset"),e.add(n,"export");let r=i.createSection("lines");r.addNested(t.state,"linesDrawn"),r.addNested(t.state,"failsCount"),r.addNested(t.state,"angle"),r.addNested(t.state,"longLines.length","longLines len",0),r.add(t.state,"currentMinLen",1,"length min current"),r.add(t.state,"redrawnCount",0),r.addNested(t,"state.longLinesSaved.length","longLines saved",0),r.add(t.state,"done"),r.add(t.state,"doneAdding"),window.lines=t};export{q as L,Y as l,X as s};
