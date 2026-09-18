const n=(t,f)=>{let r={...t};return Object.keys(t).forEach(e=>{typeof t[e]=="number"&&(r[e]=t[e]*f)}),r};function s(t,f){let r={...t};for(let e of f)r[e]=t[e];return r}export{s as g,n as m};
