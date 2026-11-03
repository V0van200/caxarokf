import * as THREE from './vendor/three.module.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const mobile = matchMedia('(max-width: 650px)').matches;
let enabled = !reduced.matches;
let scene, camera, renderer, stars, core, ringGroup, frame = 0, visible = true;
const pointer = new THREE.Vector2();
const clock = new THREE.Clock();
let elapsed = 0;

function mount() {
  const canvas = document.getElementById('universe');
  if (!canvas) return;
  const toggle = document.getElementById('fx-toggle');
  try {
    renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:!mobile, powerPreference:'low-power'});
    renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.2 : 1.6));
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(50, innerWidth/innerHeight, .1, 100);
    camera.position.set(0,0,12);
    const positions = new Float32Array((mobile?450:1100)*3);
    for(let i=0;i<positions.length;i+=3){positions[i]=(Math.random()-.5)*35;positions[i+1]=(Math.random()-.5)*25;positions[i+2]=(Math.random()-.5)*22;}
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
    stars = new THREE.Points(geometry,new THREE.PointsMaterial({color:0x80bcff,size:.024,transparent:true,opacity:.3,blending:THREE.AdditiveBlending,depthWrite:false}));
    scene.add(stars);
    core = new THREE.Group();
    core.position.set(mobile?1.5:4,1,-4);
    const wire = new THREE.Mesh(new THREE.IcosahedronGeometry(2.5,1),new THREE.MeshBasicMaterial({color:0x287ee4,wireframe:true,transparent:true,opacity:.035}));
    core.add(wire);
    const vertices=new THREE.Points(new THREE.IcosahedronGeometry(2.5,1),new THREE.PointsMaterial({color:0x8cecff,size:.055,transparent:true,opacity:.18}));
    core.add(vertices);scene.add(core);
    ringGroup=new THREE.Group();ringGroup.position.set(-5,-1,-5);
    for(let i=0;i<4;i++){
      const ring=new THREE.Mesh(new THREE.TorusGeometry(3+i*.34,.008,4,128),new THREE.MeshBasicMaterial({color:i%2?0x4177ff:0x73daff,transparent:true,opacity:.025,blending:THREE.AdditiveBlending}));
      ring.rotation.set(.8+i*.17,.35+i*.2,i*.12);ringGroup.add(ring);
    }
    scene.add(ringGroup);
    const resize=()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);if(!enabled)render();};
    window.addEventListener('resize',resize,{passive:true});resize();
    window.addEventListener('pointermove',e=>{pointer.set(e.clientX/innerWidth-.5,e.clientY/innerHeight-.5);},{passive:true});
    const sync=()=>{toggle.textContent=enabled?'✦ FX ON':'✦ FX OFF';toggle.setAttribute('aria-pressed',String(enabled));};
    toggle.addEventListener('click',()=>{enabled=!enabled;clock.getDelta();sync();if(enabled)animate();else{cancelAnimationFrame(frame);render();}});
    reduced.addEventListener('change',e=>{enabled=!e.matches;sync();cancelAnimationFrame(frame);if(enabled)animate();else render();});
    document.addEventListener('visibilitychange',()=>{visible=!document.hidden;cancelAnimationFrame(frame);clock.getDelta();if(visible&&enabled)animate();});
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();enabled=false;cancelAnimationFrame(frame);toggle.hidden=true;canvas.style.opacity='0';});
    sync();if(enabled)animate();else render();
  } catch(error) {canvas.style.display='none';toggle.hidden=true;}
}
function render(){renderer.render(scene,camera);}
function animate(){
  cancelAnimationFrame(frame);
  if(!enabled||!visible)return;
  elapsed+=Math.min(clock.getDelta(),.05);
  stars.rotation.y=elapsed*.012;stars.rotation.x=elapsed*.004;
  core.rotation.y=elapsed*.09;core.rotation.x=Math.sin(elapsed*.14)*.25;
  ringGroup.rotation.z=elapsed*.035;
  camera.position.x+=(pointer.x*.45-camera.position.x)*.025;
  camera.position.y+=(-pointer.y*.3-camera.position.y)*.025;
  camera.lookAt(0,0,0);
  render();frame=requestAnimationFrame(animate);
}

function enhance(){
  const targets=document.querySelectorAll('.about-section,.section-heading,.panel,.broadcast-info,.english-section,.channel-section,.support-section,.social-list,.faq-section');
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}}),{threshold:.08});
  targets.forEach((el,index)=>{el.classList.add('reveal-ready');el.style.transitionDelay=`${(index%3)*70}ms`;observer.observe(el);});
  const progress=document.querySelector('.scroll-progress');
  let queued=false;
  const update=()=>{const range=document.documentElement.scrollHeight-innerHeight;progress.style.transform=`scaleX(${range>0?scrollY/range:0})`;queued=false;};
  addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(update);}},{passive:true});update();
  if(!mobile&&!reduced.matches){
    document.querySelectorAll('.panel').forEach(panel=>{
      panel.addEventListener('pointermove',e=>{const r=panel.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;panel.style.setProperty('--mx',x+'px');panel.style.setProperty('--my',y+'px');panel.style.transform=`rotateX(${(y/r.height-.5)*-1.8}deg) rotateY(${(x/r.width-.5)*1.8}deg)`;});
      panel.addEventListener('pointerleave',()=>{panel.style.transform='';});
    });
  }
  mount();
}
if(document.getElementById('universe'))enhance();
else document.addEventListener('site-ready',enhance,{once:true});
