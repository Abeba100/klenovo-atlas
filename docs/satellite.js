/* World Imagery is requested only when the visitor selects Satellite. */
window.KlenovoImagery = (() => {
 const service='https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer';
 const copyright='© Esri, Vantor, Earthstar Geographics, GIS User Community';
 function tileLat(y,n){return Math.atan(Math.sinh(Math.PI*(1-2*y/n)))*180/Math.PI}
 function tileY(lat,n){const r=lat*Math.PI/180;return (1-Math.asinh(Math.tan(r))/Math.PI)/2*n}
 function layout(view,width,height){
  const resolution=Math.max(view.w/width,view.h/height);
  const z=Math.max(14,Math.min(19,Math.round(Math.log2(360*63360/(256*resolution))))),n=2**z;
  const cx=view.x+view.w/2,cy=view.y+view.h/2,w=width*resolution,h=height*resolution;
  const west=37.35+(cx-w/2)/63360,east=37.35+(cx+w/2)/63360;
  const north=55.323-(cy-h/2)/111320,south=55.323-(cy+h/2)/111320;
  const x0=Math.floor((west+180)/360*n),x1=Math.floor((east+180)/360*n);
  const y0=Math.floor(tileY(north,n)),y1=Math.floor(tileY(south,n)),tiles=[];
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
   const left=(x/n*360-180-37.35)*63360,right=((x+1)/n*360-180-37.35)*63360;
   const top=(55.323-tileLat(y,n))*111320,bottom=(55.323-tileLat(y+1,n))*111320;
   tiles.push({key:`${z}/${y}/${x}`,x:left,y:top,width:right-left,height:bottom-top,url:`${service}/tile/${z}/${y}/${x}`});
  }
  return tiles;
 }
 function create(getView){
  let mode='map',frame=null,current=new Set(),nodes=new Map(),waitTimer=null;
  const wrap=document.querySelector('#map-wrap'),status=document.querySelector('#imagery-status');
  const credit=document.querySelector('#imagery-credit'),buttons=[...document.querySelectorAll('[data-layer]')];
  function report(){
   if(mode!=='satellite')return;
   const states=[...current].map(k=>nodes.get(k)?.state),pending=states.filter(s=>s==='loading').length,failed=states.filter(s=>s==='failed').length;
   if(!states.length||pending){status.textContent='Загрузка спутниковых снимков…';status.hidden=false;return}
   clearTimeout(waitTimer);
   status.hidden=failed===0;
   if(failed){status.innerHTML='Не все снимки загрузились. <button id="retry-imagery">Повторить</button><button id="back-to-map">Карта</button>';document.querySelector('#retry-imagery').onclick=retry;document.querySelector('#back-to-map').onclick=()=>setMode('map')}
  }
  function retry(){for(const[key,node]of nodes)if(node.state==='failed'){node.image.remove();nodes.delete(key)}render()}
  function render(){
   frame=null;if(mode!=='satellite')return;
   const layer=document.querySelector('#satellite-tiles'),box=document.querySelector('#map-container');if(!layer||!box.clientWidth||!box.clientHeight)return;
   const tiles=layout(getView(),box.clientWidth,box.clientHeight);current=new Set(tiles.map(t=>t.key));
   for(const[key,node]of nodes)if(!current.has(key)){node.image.remove();nodes.delete(key)}
   for(const t of tiles){if(nodes.has(t.key))continue;const image=document.createElementNS('http://www.w3.org/2000/svg','image');
    for(const[k,v]of Object.entries({x:t.x,y:t.y,width:t.width+.03,height:t.height+.03,preserveAspectRatio:'none','pointer-events':'none'}))image.setAttribute(k,v);
    const node={image,state:'loading'};nodes.set(t.key,node);
    image.addEventListener('load',()=>{node.state='loaded';report()});image.addEventListener('error',()=>{node.state='failed';report()});
    layer.appendChild(image);image.setAttribute('href',t.url);
   }
   report();clearTimeout(waitTimer);waitTimer=setTimeout(()=>{if(mode==='satellite'&&[...current].some(k=>nodes.get(k)?.state==='loading')){status.innerHTML='Снимки загружаются медленно. <button id="back-to-map">Вернуться к карте</button>';status.hidden=false;document.querySelector('#back-to-map').onclick=()=>setMode('map')}},15000);
  }
  function update(){if(mode==='satellite'&&frame===null)frame=requestAnimationFrame(render)}
  function setMode(next){
   mode=next==='satellite'?'satellite':'map';wrap.classList.toggle('satellite-mode',mode==='satellite');
   buttons.forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.layer===mode));b.classList.toggle('active',b.dataset.layer===mode)});
   credit.hidden=mode!=='satellite';document.querySelector('.map-badge').textContent=mode==='satellite'?'СПУТНИК':'КАРТА МЕСТ';
   document.querySelector('#map').setAttribute('aria-label',mode==='satellite'?'Спутниковая карта Клёново с кликабельными контурами зданий':'Карта улиц и зданий Клёново. Для выбора мест также используйте список слева.');
   status.hidden=true;clearTimeout(waitTimer);if(mode==='satellite')update();
  }
  buttons.forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.layer)));
  credit.textContent=copyright;credit.href=service;
  return {update,setMode};
 }
 return {create,layout};
})();
