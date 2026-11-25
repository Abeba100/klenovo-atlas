import * as THREE from './vendor/three.module.js';
let renderer,scene,camera,group,footprintGroup,frame,angle=.7,elevation=.42,distance=39,auto=!matchMedia('(prefers-reduced-motion: reduce)').matches,drag=null;
const stage=document.querySelector('#model-stage'),dialog=document.querySelector('#model-dialog');
export function startModel(data){if(!renderer){init()}setBuilding(data);resize();cancelAnimationFrame(frame);animate()}
function init(){renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.setClearColor(0xe9eedf,1);stage.appendChild(renderer.domElement);document.querySelector('#model-status').hidden=true;document.querySelector('#model-status').style.display='none';scene=new THREE.Scene();scene.background=new THREE.Color(0xe9eedf);camera=new THREE.PerspectiveCamera(36,1,.1,150);scene.add(new THREE.HemisphereLight(0xffffff,0x7d8e68,3));const light=new THREE.DirectionalLight(0xfff6dd,4);light.position.set(-15,30,12);light.castShadow=true;light.shadow.mapSize.set(2048,2048);light.shadow.camera.left=-20;light.shadow.camera.right=20;light.shadow.camera.top=20;light.shadow.camera.bottom=-20;light.shadow.normalBias=.03;scene.add(light);
 const ivory=new THREE.MeshStandardMaterial({color:0xe6dcc0,roughness:.9}),trim=new THREE.MeshStandardMaterial({color:0xf7eed4,roughness:.9}),roof=new THREE.MeshStandardMaterial({color:0x536c58,roughness:.7}),dark=new THREE.MeshStandardMaterial({color:0x52604e,roughness:.9}),gold=new THREE.MeshStandardMaterial({color:0xb29954,roughness:.5,metalness:.4});group=new THREE.Group();scene.add(group);
 function mesh(geo,mat,x,y,z){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;group.add(m);return m}
 function box(w,h,d,x,y,z,mat=ivory){return mesh(new THREE.BoxGeometry(w,h,d),mat,x,y,z)}
 function cylinder(rt,rb,h,n,x,y,z,mat=ivory){return mesh(new THREE.CylinderGeometry(rt,rb,h,n),mat,x,y,z)}
 box(20,.4,12,0,.2,0,trim);box(7,5,6,3.5,2.9,0);box(7.5,.35,6.5,3.5,5.55,0,trim);cylinder(3.1,3.1,3.2,8,3.5,7.2,0);cylinder(1.2,3.6,1.4,8,3.5,9.5,0,roof);cylinder(.9,.9,1.5,16,3.5,10.95,0);const dome=mesh(new THREE.SphereGeometry(1.05,24,16,0,Math.PI*2,0,Math.PI/2),roof,3.5,11.7,0);dome.scale.y=1.15;cylinder(0,.34,.6,12,3.5,13.05,0,gold);cross(3.5,13.8,0);
 box(7.5,3.7,5,-3,2.25,0);box(7.8,.3,5.4,-3,4.25,0,trim);const hallRoof=cylinder(0,1,1,4,-3,4.8,0,roof);hallRoof.scale.set(5.6,1,4);hallRoof.rotation.y=Math.PI/4;
 box(3.4,5.5,3.5,-7,3.15,0);box(3.8,.3,3.9,-7,5.95,0,trim);box(2.8,3.6,2.9,-7,7.9,0);box(3.2,.3,3.3,-7,9.85,0,trim);cylinder(0,2.3,3.4,4,-7,11.65,0,roof).rotation.y=Math.PI/4;cylinder(.25,.25,.5,12,-7,13.6,0,gold);cross(-7,14.3,0);
 function cross(x,y,z){box(.1,1.2,.1,x,y,z,gold);box(.65,.1,.1,x,y+.18,z,gold)}
 for(const z of [-3.04,3.04])for(const x of [1.5,3.5,5.5]){box(.72,1.65,.08,x,3.1,z,dark);box(1,.13,.15,x,2.2,z,trim);box(.08,1.65,.12,x,3.1,z,trim)}
 for(const z of [-2.54,2.54])for(const x of [-4.8,-2.7,-.7])box(.8,1.5,.08,x,2.5,z,dark);
 for(const z of [-1.49,1.49])box(1.15,2.3,.08,-7,8,z,dark);for(const x of [-8.45,-5.55])box(.08,2.3,1.15,x,8,0,dark);box(.1,2,1.4,-8.75,1.6,0,dark);
 for(const x of [.2,6.8])for(const z of [-3.1,3.1])box(.35,4.9,.35,x,2.95,z,trim);
 const ground=new THREE.Mesh(new THREE.CylinderGeometry(15,15,.45,96),new THREE.MeshStandardMaterial({color:0xd2ddc0,roughness:1}));ground.position.y=-.25;ground.receiveShadow=true;scene.add(ground);const path=new THREE.Mesh(new THREE.BoxGeometry(28,.03,2.3),new THREE.MeshStandardMaterial({color:0xe7ddbe}));path.position.set(0,.02,6);scene.add(path);
 let seed=42;function rand(){seed=(seed*16807)%2147483647;return(seed-1)/2147483646}for(let i=0;i<14;i++){const a=rand()*Math.PI*2,r=10.5+rand()*2.5,x=Math.cos(a)*r,z=Math.sin(a)*r;if(x<-8&&Math.abs(z)<3)continue;const tree=new THREE.Group();const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.1,.16,1.8,7),dark);trunk.position.y=.9;tree.add(trunk);const leaves=new THREE.Mesh(new THREE.IcosahedronGeometry(.9+rand()*.6,1),new THREE.MeshStandardMaterial({color:i%2?0x879e71:0x9caf83,roughness:1}));leaves.position.y=2.5;leaves.scale.y=1.3;leaves.castShadow=true;tree.add(leaves);tree.position.set(x,0,z);scene.add(tree)}
 stage.addEventListener('pointerdown',e=>{stage.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY};auto=false;updateAuto()});stage.addEventListener('pointermove',e=>{if(!drag)return;angle-=(e.clientX-drag.x)*.008;elevation=Math.max(.12,Math.min(1.2,elevation+(e.clientY-drag.y)*.006));drag={x:e.clientX,y:e.clientY}});stage.addEventListener('pointerup',()=>drag=null);stage.addEventListener('pointercancel',()=>drag=null);stage.addEventListener('wheel',e=>{e.preventDefault();distance=Math.max(23,Math.min(65,distance+e.deltaY*.035))},{passive:false});document.querySelector('#model-reset').onclick=()=>{angle=.7;elevation=.42;distance=39};document.querySelector('#auto-rotate').onclick=()=>{auto=!auto;updateAuto()};dialog.addEventListener('close',()=>cancelAnimationFrame(frame));new ResizeObserver(resize).observe(stage);updateAuto()}
function updateAuto(){const b=document.querySelector('#auto-rotate');b.setAttribute('aria-pressed',String(auto));b.textContent=auto?'Пауза ⏸':'Вращать ↻'}
function resize(){if(!renderer||!stage.clientWidth||!stage.clientHeight)return;renderer.setSize(stage.clientWidth,stage.clientHeight);camera.aspect=stage.clientWidth/stage.clientHeight;camera.updateProjectionMatrix()}
let lastTime=0;function animate(time=0){if(!dialog.open)return;if(auto)angle+=Math.min((time-lastTime)||16,40)*.00012;lastTime=time;camera.position.set(Math.cos(angle)*distance*Math.cos(elevation),Math.sin(elevation)*distance+5,Math.sin(angle)*distance*Math.cos(elevation));camera.lookAt(0,5,0);renderer.render(scene,camera);frame=requestAnimationFrame(animate)}

function setBuilding(data){
 if(footprintGroup){scene.remove(footprintGroup);footprintGroup.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material)o.material.dispose()});footprintGroup=null}
 group.visible=!data;
 if(!data)return;
 const points=data.geometry.map(p=>[(p.lon-data.geometry[0].lon)*63360,(data.geometry[0].lat-p.lat)*111320]);
 const xs=points.map(p=>p[0]),zs=points.map(p=>p[1]),cx=(Math.min(...xs)+Math.max(...xs))/2,cz=(Math.min(...zs)+Math.max(...zs))/2;
 const span=Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...zs)-Math.min(...zs),5),scale=16/span;
 const shape=new THREE.Shape();points.forEach((p,i)=>{const x=(p[0]-cx)*scale,z=(p[1]-cz)*scale;if(i===0)shape.moveTo(x,-z);else shape.lineTo(x,-z)});shape.closePath();
 const measured=parseFloat(data.tags.height),levels=parseFloat(data.tags['building:levels']);const height=(Number.isFinite(measured)?measured:Number.isFinite(levels)?levels*3:6)*scale;
 const geometry=new THREE.ExtrudeGeometry(shape,{depth:Math.max(.7,Math.min(17,height)),bevelEnabled:false});geometry.rotateX(-Math.PI/2);
 const mat=new THREE.MeshStandardMaterial({color:0xe4d6b4,roughness:.9});const building=new THREE.Mesh(geometry,mat);building.castShadow=true;building.receiveShadow=true;
 footprintGroup=new THREE.Group();footprintGroup.add(building);scene.add(footprintGroup);angle=.7;elevation=.5;distance=39;
}
