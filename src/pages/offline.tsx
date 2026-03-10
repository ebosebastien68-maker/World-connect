// ============================================================================
// WORLD CONNECT — OFFLINE.TSX
// Jeu de course 3D : cycle jour/nuit, oiseaux, avion, train, maisons,
// montagnes, désert, forêt, piétons animés — online & offline
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────────────────────
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Exo+2:wght@300;400;600;700&display=swap');

:root {
  --ng: #00ff88; --nb: #00d4ff; --np: #ff2d78; --ny: #ffe600;
  --d0: #050811; --d1: #0a0f1e; --d2: #111827; --d3: #1c2540;
  --glass: rgba(255,255,255,0.04); --gb: rgba(255,255,255,0.10);
  --txt: #e8eaf0; --tdim: rgba(232,234,240,0.5);
}
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body{width:100%;height:100%;overflow:hidden;background:var(--d0);
  font-family:'Exo 2',sans-serif;color:var(--txt)}
canvas#rc{display:block;position:fixed;inset:0;width:100vw;height:100vh}

.panel{
  background:linear-gradient(135deg,rgba(17,24,39,.96) 0%,rgba(10,15,30,.99) 100%);
  border:1px solid var(--gb);border-radius:20px;
  backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);
  box-shadow:0 25px 80px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.07)
}

/* ── MENU ── */
#menuScreen{
  position:fixed;inset:0;z-index:200;
  display:flex;align-items:center;justify-content:center;
  background:radial-gradient(ellipse at 50% 0%,rgba(0,212,255,.12) 0%,transparent 60%),
             radial-gradient(ellipse at 80% 100%,rgba(0,255,136,.08) 0%,transparent 50%),
             var(--d0);
  transition:opacity .5s ease,transform .5s ease
}
#menuScreen.hide{opacity:0;transform:scale(1.05);pointer-events:none}
.menu-inner{width:min(480px,92vw);padding:44px 40px}
.logo-row{display:flex;align-items:center;gap:14px;margin-bottom:8px}
.logo-icon{width:52px;height:52px;background:linear-gradient(135deg,var(--nb),var(--ng));
  border-radius:14px;display:flex;align-items:center;justify-content:center;
  font-size:24px;box-shadow:0 0 24px rgba(0,212,255,.4)}
.logo-txt{font-family:'Orbitron',sans-serif;font-size:1.1rem;font-weight:400;
  color:var(--tdim);letter-spacing:3px;text-transform:uppercase}
.game-title{font-family:'Orbitron',sans-serif;font-size:clamp(2rem,6vw,2.8rem);
  font-weight:900;line-height:1;margin-bottom:32px;
  background:linear-gradient(135deg,#fff 30%,var(--nb) 70%,var(--ng));
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.conn-badge{display:inline-flex;align-items:center;gap:8px;padding:8px 16px;
  border-radius:40px;background:var(--glass);border:1px solid var(--gb);
  font-size:.8rem;font-weight:600;letter-spacing:.5px;text-transform:uppercase;
  margin-bottom:28px;transition:all .3s}
.conn-dot{width:8px;height:8px;border-radius:50%;background:var(--np);
  box-shadow:0 0 8px var(--np);animation:pdot 1.5s infinite}
.conn-badge.online .conn-dot{background:var(--ng);box-shadow:0 0 8px var(--ng);animation:none}
.conn-badge.online{border-color:rgba(0,255,136,.25)}
@keyframes pdot{0%,100%{opacity:1}50%{opacity:.3}}
.sec-lbl{font-size:.75rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;
  color:var(--nb);margin-bottom:12px;display:flex;align-items:center;gap:8px}
.sec-lbl::before{content:'';display:block;width:16px;height:2px;background:var(--nb)}
.car-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:28px}
.car-opt{aspect-ratio:1;border-radius:12px;border:2px solid transparent;cursor:pointer;
  transition:all .25s;display:flex;flex-direction:column;align-items:center;
  justify-content:center;gap:4px;background:var(--glass);position:relative;overflow:hidden}
.car-opt:hover{border-color:var(--gb);transform:translateY(-3px)}
.car-opt.sel{border-color:var(--nb);background:rgba(0,212,255,.08);
  box-shadow:0 0 20px rgba(0,212,255,.2),inset 0 0 20px rgba(0,212,255,.05)}
.car-opt svg{width:38px;height:26px}
.car-opt .cn{font-size:.55rem;font-weight:700;letter-spacing:.5px;
  text-transform:uppercase;color:var(--tdim)}
.car-opt.sel .cn{color:var(--nb)}
.diff-row{display:flex;gap:8px;margin-bottom:28px}
.diff-btn{flex:1;padding:10px 6px;border-radius:10px;border:1px solid var(--gb);
  background:var(--glass);color:var(--tdim);font-family:'Exo 2',sans-serif;
  font-size:.75rem;font-weight:700;letter-spacing:.5px;text-transform:uppercase;cursor:pointer;
  transition:all .2s}
.diff-btn:hover{color:var(--txt);border-color:rgba(255,255,255,.2)}
.diff-btn.act{background:rgba(0,255,136,.1);border-color:var(--ng);color:var(--ng)}
.btn-play{width:100%;padding:18px;
  background:linear-gradient(135deg,var(--nb) 0%,var(--ng) 100%);
  color:var(--d0);font-family:'Orbitron',sans-serif;font-size:1rem;font-weight:700;
  letter-spacing:2px;border:none;border-radius:12px;cursor:pointer;
  transition:all .3s;margin-bottom:12px;box-shadow:0 8px 32px rgba(0,212,255,.3)}
.btn-play:hover{transform:translateY(-3px);box-shadow:0 14px 40px rgba(0,212,255,.45)}
.btn-sec{width:100%;padding:13px;background:transparent;color:var(--tdim);
  font-family:'Exo 2',sans-serif;font-size:.85rem;font-weight:600;
  border:1px solid var(--gb);border-radius:12px;cursor:pointer;
  transition:all .2s;letter-spacing:.5px}
.btn-sec:hover{border-color:rgba(255,255,255,.25);color:var(--txt)}

/* ── HUD ── */
#hud{position:fixed;inset:0;z-index:50;pointer-events:none;display:none}
.hud-top{position:absolute;top:0;left:0;right:0;padding:16px 20px;
  display:flex;align-items:flex-start;gap:12px;
  background:linear-gradient(to bottom,rgba(5,8,17,.85) 0%,transparent 100%)}
.hc{padding:10px 16px;border-radius:12px;background:rgba(10,15,30,.7);
  border:1px solid var(--gb);backdrop-filter:blur(12px);
  display:flex;flex-direction:column;align-items:center;gap:2px}
.hl{font-size:.62rem;font-weight:700;letter-spacing:1.5px;
  text-transform:uppercase;color:var(--tdim)}
.hv{font-family:'Orbitron',sans-serif;font-size:1.3rem;font-weight:700;
  color:#fff;line-height:1}
.hv.ac{color:var(--ng)} .hv.sp{color:var(--nb)}
.sbw{flex:1;display:flex;flex-direction:column;justify-content:center;
  gap:6px;min-width:0}
.sbl{display:flex;justify-content:space-between;font-size:.62rem;
  font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--tdim)}
.sbt{height:6px;border-radius:3px;background:rgba(255,255,255,.07);position:relative}
.sbf{height:100%;border-radius:3px;
  background:linear-gradient(90deg,var(--ng),var(--nb));transition:width .3s ease;position:relative}
.sbf::after{content:'';position:absolute;right:-1px;top:-3px;width:12px;height:12px;
  border-radius:50%;background:var(--nb);box-shadow:0 0 8px var(--nb)}
.hud-btn{padding:10px 14px;border-radius:12px;background:rgba(10,15,30,.7);
  border:1px solid var(--gb);color:var(--tdim);font-size:1rem;cursor:pointer;
  pointer-events:all;transition:all .2s}
.hud-btn:hover{color:var(--txt);border-color:rgba(255,255,255,.25)}
.combo{position:absolute;top:80px;right:20px;padding:8px 14px;border-radius:40px;
  background:rgba(0,255,136,.1);border:1px solid rgba(0,255,136,.3);
  font-family:'Orbitron',sans-serif;font-size:.9rem;font-weight:700;
  color:var(--ng);display:none;animation:cpop .3s cubic-bezier(.34,1.56,.64,1)}
@keyframes cpop{from{transform:scale(.6)}to{transform:scale(1)}}

/* Day/night indicator */
.time-badge{position:absolute;top:16px;right:80px;
  padding:6px 12px;border-radius:20px;
  background:rgba(10,15,30,.7);border:1px solid var(--gb);
  font-size:.7rem;font-weight:700;letter-spacing:1px;color:var(--tdim)}

/* ── CONTROLS ── */
#controls{position:fixed;bottom:0;left:0;right:0;z-index:60;
  padding:16px 20px 24px;display:none;align-items:flex-end;
  justify-content:space-between;
  background:linear-gradient(to top,rgba(5,8,17,.9) 0%,transparent 100%);
  pointer-events:all}
.ctrl-side{display:flex;gap:10px}
.ctrl-btn{width:72px;height:72px;border-radius:50%;
  background:rgba(10,15,30,.8);border:2px solid var(--gb);
  backdrop-filter:blur(12px);color:#fff;font-size:1.6rem;
  display:flex;align-items:center;justify-content:center;
  cursor:pointer;user-select:none;transition:all .15s;
  box-shadow:0 6px 24px rgba(0,0,0,.5)}
.ctrl-btn:active,.ctrl-btn.pr{background:rgba(0,212,255,.15);
  border-color:var(--nb);box-shadow:0 0 20px rgba(0,212,255,.3);transform:scale(.93)}
.ctrl-center{display:flex;flex-direction:column;align-items:center;gap:10px}
.spd-disp{font-family:'Orbitron',sans-serif;font-size:.8rem;font-weight:700;
  color:var(--nb);letter-spacing:1px;background:rgba(10,15,30,.8);
  border:1px solid rgba(0,212,255,.2);padding:6px 14px;border-radius:20px;
  text-align:center;min-width:80px}
.ctrl-spd-row{display:flex;gap:10px}
.ctrl-spd-btn{width:56px;height:56px;border-radius:14px;
  background:rgba(10,15,30,.8);border:1.5px solid var(--gb);
  color:var(--txt);font-size:1.4rem;font-weight:700;
  display:flex;align-items:center;justify-content:center;
  cursor:pointer;transition:all .15s;user-select:none}
.ctrl-spd-btn:active{background:rgba(0,255,136,.1);
  border-color:var(--ng);transform:scale(.9)}

/* ── GAME OVER ── */
#goScreen{position:fixed;inset:0;z-index:150;
  display:none;align-items:center;justify-content:center;
  background:rgba(5,8,17,.9);backdrop-filter:blur(16px)}
#goScreen.show{display:flex}
.go-inner{width:min(420px,90vw);padding:44px 36px;text-align:center}
.crash-ico{font-size:3.5rem;margin-bottom:12px;
  animation:shake .5s cubic-bezier(.36,.07,.19,.97)}
@keyframes shake{10%,90%{transform:translateX(-4px)}
  20%,80%{transform:translateX(6px)}30%,50%,70%{transform:translateX(-6px)}
  40%,60%{transform:translateX(6px)}}
.go-title{font-family:'Orbitron',sans-serif;font-size:1.6rem;font-weight:900;
  margin-bottom:28px;background:linear-gradient(135deg,#fff,var(--np));
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.stats-g{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:28px}
.stat-b{padding:14px 10px;border-radius:12px;background:var(--glass);border:1px solid var(--gb)}
.stat-n{font-family:'Orbitron',sans-serif;font-size:1.4rem;font-weight:700;color:#fff;line-height:1}
.stat-l{font-size:.6rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;
  color:var(--tdim);margin-top:4px}
.best-b{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;
  border-radius:40px;margin-bottom:24px;background:rgba(255,230,0,.08);
  border:1px solid rgba(255,230,0,.25);font-size:.8rem;font-weight:700;
  color:var(--ny);letter-spacing:.5px}

/* ── PAUSE ── */
#pauseScreen{position:fixed;inset:0;z-index:120;
  display:none;align-items:center;justify-content:center;
  background:rgba(5,8,17,.85);backdrop-filter:blur(20px)}
#pauseScreen.show{display:flex}
.pause-inner{width:min(360px,88vw);padding:44px 36px;text-align:center}
.pause-title{font-family:'Orbitron',sans-serif;font-size:2rem;font-weight:900;
  color:var(--nb);margin-bottom:28px;text-shadow:0 0 30px rgba(0,212,255,.4)}

/* ── COUNTDOWN ── */
#cdScreen{position:fixed;inset:0;z-index:180;
  display:none;align-items:center;justify-content:center;pointer-events:none}
#cdScreen.show{display:flex}
.cdn{font-family:'Orbitron',sans-serif;font-size:min(25vw,180px);font-weight:900;
  color:#fff;text-shadow:0 0 60px rgba(0,212,255,.6);
  animation:cdpop .8s cubic-bezier(.34,1.56,.64,1) forwards}
@keyframes cdpop{from{opacity:0;transform:scale(2)}60%{opacity:1;transform:scale(1)}
  90%{opacity:1}to{opacity:0;transform:scale(.8)}}

/* ── FLASH ── */
#flash{position:fixed;inset:0;z-index:300;pointer-events:none;opacity:0;
  background:rgba(255,45,120,.3);transition:opacity .1s}
#flash.on{opacity:1}

/* responsive */
@media(max-width:768px){
  .hud-top{gap:8px;padding:12px}
  .hv{font-size:1rem}
  .ctrl-btn{width:64px;height:64px;font-size:1.4rem}
}
`;

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const CAR_MODELS = [
  { id:'ferrari', name:'Ferrari', color:0xcc0000, accent:0xffcc00, roof:0x880000 },
  { id:'lambo',   name:'Lambo',   color:0xf5c300, accent:0x222222, roof:0xaa8800 },
  { id:'mclaren', name:'McLaren', color:0xff5500, accent:0x111111, roof:0xcc4400 },
  { id:'bmw',     name:'BMW M4',  color:0x0033aa, accent:0x00aaff, roof:0x002288 },
  { id:'porsche', name:'Porsche', color:0xdddddd, accent:0x888888, roof:0xaaaaaa },
];

const ENEMY_COLORS = [
  0x880000,0x006600,0x000088,0x886600,0x660088,0x008888,0x994400,0x004499,0x669900
];

const DIFFICULTIES = {
  easy:   { spawn:.013, maxSpd:12, ramp:.0012 },
  medium: { spawn:.02,  maxSpd:18, ramp:.002  },
  hard:   { spawn:.03,  maxSpd:25, ramp:.0035 },
};

const ROAD_W = 9;
const LANE_X = [-3, 0, 3];
const MOVE_SPD = 0.13;

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
type Diff = 'easy'|'medium'|'hard';
interface CarCfg { id:string; name:string; color:number; accent:number; roof:number }
interface Bird { group:THREE.Group; lW:THREE.Mesh; rW:THREE.Mesh; phase:number }
interface Ped  { group:THREE.Group; lL:THREE.Mesh; rL:THREE.Mesh; lA:THREE.Mesh; rA:THREE.Mesh; phase:number; baseX:number; baseZ:number; dir:number }
interface ScrObj { obj:THREE.Object3D; resetAt:number; ahead:number; spd:number }
interface NavLight { mesh:THREE.Mesh; phase:number }

// ─────────────────────────────────────────────────────────────────────────────
// THREE.JS BUILDERS  (outside component — pure functions)
// ─────────────────────────────────────────────────────────────────────────────

function mat(color:number, rough=.5, metal=.5, opts:any={}): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness:rough, metalness:metal, ...opts });
}
function box(w:number,h:number,d:number){ return new THREE.BoxGeometry(w,h,d); }
function cyl(rt:number,rb:number,h:number,s=12){ return new THREE.CylinderGeometry(rt,rb,h,s); }

// ── Car ──────────────────────────────────────────────────────────────────────
function buildCar(cfg:CarCfg, isPlayer:boolean): THREE.Group {
  const g = new THREE.Group();
  const bM  = mat(cfg.color, .25, .85);
  const blk = mat(0x111111, .5, .2);
  const gls = mat(0x112244, .05, .1, { transparent:true, opacity:.55 });
  const chr = mat(0xcccccc, .15, .95);
  const lgt = mat(0xffffcc, .1, .1, { emissive:0xffffcc, emissiveIntensity:1.2 });
  const bLt = mat(0xff2200, .1, .1, { emissive:0xff2200, emissiveIntensity:isPlayer?.0:.4 });

  // body
  const body = new THREE.Mesh(box(1.06,.28,2.2), bM); body.position.y=.2; body.castShadow=true; g.add(body);
  // sills
  for(const sx of [-0.6,0.6]){
    const s=new THREE.Mesh(box(.1,.16,2.1),blk); s.position.set(sx,.08,0); g.add(s);
  }
  // cab
  const cab = new THREE.Mesh(box(.9,.34,.98), bM); cab.position.set(0,.5,-.04); cab.castShadow=true; g.add(cab);
  const roof= new THREE.Mesh(box(.78,.12,.78), mat(cfg.roof,.3,.8)); roof.position.set(0,.69,-.04); g.add(roof);
  // windscreen
  const ws = new THREE.Mesh(new THREE.PlaneGeometry(.78,.72), gls); ws.rotation.x=.38; ws.position.set(0,.62,-.46); g.add(ws);
  const rw = new THREE.Mesh(new THREE.PlaneGeometry(.74,.62), gls); rw.rotation.x=-.34; rw.position.set(0,.57,.42); g.add(rw);
  // side windows
  for(const [wx,si] of [[-0.46,0],[0.46,1]] as [number,number][]){
    const sw = new THREE.Mesh(new THREE.PlaneGeometry(.82,.56), gls);
    sw.rotation.y = si===0 ? -Math.PI/2 : Math.PI/2;
    sw.position.set(wx,.56,-.04); g.add(sw);
  }
  // hood/trunk
  const hd=new THREE.Mesh(box(.96,.14,.72),bM); hd.position.set(0,.32,-1.0); hd.rotation.x=-.06; g.add(hd);
  const tr=new THREE.Mesh(box(.9,.12,.56),bM);  tr.position.set(0,.3, .84); tr.rotation.x=.05; g.add(tr);
  // bumpers
  const fb=new THREE.Mesh(box(.98,.16,.14),bM); fb.position.set(0,.14,-1.16); g.add(fb);
  const rb=new THREE.Mesh(box(.98,.16,.14),bM); rb.position.set(0,.14, 1.16); g.add(rb);
  // grille
  g.add(Object.assign(new THREE.Mesh(box(.58,.1,.04),blk),{position:new THREE.Vector3(0,.14,-1.18)}));
  g.add(Object.assign(new THREE.Mesh(box(.64,.16,.03),chr),{position:new THREE.Vector3(0,.14,-1.17)}));
  // headlights
  for(const lx of [-.29,.29]){
    const hl=new THREE.Mesh(box(.22,.1,.04),lgt); hl.position.set(lx,.22,-1.16); g.add(hl);
    const drl=new THREE.Mesh(box(.2,.025,.03),mat(0xffffff,.1,.1,{emissive:0xffffff,emissiveIntensity:2}));
    drl.position.set(lx,.3,-1.14); g.add(drl);
  }
  // taillights
  for(const lx of [-.3,.3]){
    const tl=new THREE.Mesh(box(.24,.1,.04),bLt); tl.position.set(lx,.22,1.16); g.add(tl);
  }
  // mirrors
  for(const [mx,si] of [[-0.57,0],[0.57,1]] as [number,number][]){
    const mir=new THREE.Mesh(box(.06,.07,.14),bM);
    mir.position.set(mx+(si===0?-.04:.04),.58,-.44); g.add(mir);
  }
  // spoiler
  const sp=new THREE.Mesh(box(.88,.05,.14),bM); sp.position.set(0,.34,1.14); g.add(sp);
  for(const ex of [-.4,.4]){
    const ep=new THREE.Mesh(box(.05,.18,.16),bM); ep.position.set(ex,.26,1.14); g.add(ep);
  }
  // exhausts
  for(const ex of [-.22,.22]){
    const p=new THREE.Mesh(cyl(.045,.05,.18,8),chr); p.rotation.x=Math.PI/2; p.position.set(ex,.12,1.2); g.add(p);
  }
  // plate
  g.add(Object.assign(new THREE.Mesh(box(.36,.1,.02),mat(0xffffcc,.5,.1)),{position:new THREE.Vector3(0,.14,1.22)}));
  // wheels
  const wPos:number[][] = [[-0.56,.3,.68],[0.56,.3,.68],[-0.56,.3,-.66],[0.56,.3,-.66]];
  wPos.forEach(([wx,wy,wz],wi)=>{
    const wg=new THREE.Group();
    const tyre=new THREE.Mesh(cyl(.3,.3,.26,20),mat(0x111111,.9,.1)); tyre.rotation.z=Math.PI/2; tyre.castShadow=true; wg.add(tyre);
    const rim=new THREE.Mesh(cyl(.21,.21,.27,20),mat(cfg.id==='porsche'?0xcacaca:0x2a2a2a,.15,.95)); rim.rotation.z=Math.PI/2; wg.add(rim);
    for(let s=0;s<5;s++){
      const sp2=new THREE.Mesh(box(.04,.15,.04),mat(0x888888,.2,.9));
      sp2.rotation.z=s/5*Math.PI*2; wg.add(sp2);
    }
    const disc=new THREE.Mesh(cyl(.18,.18,.08,16),mat(0x444444,.6,.8)); disc.rotation.z=Math.PI/2; disc.position.x=wi%2===0?-.06:.06; wg.add(disc);
    const calip=new THREE.Mesh(box(.07,.11,.14),mat(cfg.color,.4,.7)); calip.position.set(wi%2===0?-.13:.13,-.04,0); wg.add(calip);
    wg.position.set(wx,wy,wz); wg.userData.isWheel=true; g.add(wg);
  });
  return g;
}

// ── House ─────────────────────────────────────────────────────────────────────
function buildHouse(wallC:number, roofC:number): { group:THREE.Group; windows:THREE.Mesh[] } {
  const g = new THREE.Group();
  const windows: THREE.Mesh[] = [];
  const wM = mat(wallC, .9, 0);
  // body
  const body=new THREE.Mesh(box(3.8,3.2,3.2),wM); body.position.y=1.6; body.castShadow=true; body.receiveShadow=true; g.add(body);
  // roof (two slopes)
  const rM=mat(roofC,.9,.05);
  const r1=new THREE.Mesh(box(4.2,.1,3.6),rM); r1.position.y=3.25; g.add(r1);
  const ridgeGeo=new THREE.CylinderGeometry(.12,.12,4.2,6); ridgeGeo.applyMatrix4(new THREE.Matrix4().makeRotationZ(Math.PI/2));
  const ridge=new THREE.Mesh(ridgeGeo,rM); ridge.position.set(0,4.5,0); g.add(ridge);
  // roof panels (angled)
  for(const [rz,ry] of [[-1,3.9],[1,3.9]] as [number,number][]){
    const rp=new THREE.Mesh(box(4.0,.08,2.1),rM); rp.rotation.x=rz*.42; rp.position.set(0,ry,rz*.84); g.add(rp);
  }
  // chimney
  const ch=new THREE.Mesh(box(.5,.9,.5),mat(0x884444,.9,.05)); ch.position.set(.9,4.4,.5); g.add(ch);
  // door
  const dr=new THREE.Mesh(box(.8,1.6,.06),mat(0x4a3520,.9,0)); dr.position.set(0,.8,-1.63); g.add(dr);
  const knob=new THREE.Mesh(cyl(.04,.04,.06,8),mat(0xd4aa00,.2,.9)); knob.rotation.z=Math.PI/2; knob.position.set(.28,.88,-1.7); g.add(knob);
  // windows — bright at night
  const wCols=[[-.95,2.0],[.95,2.0],[-.95,1.1],[.95,1.1]];
  wCols.forEach(([wx,wy])=>{
    const frame=new THREE.Mesh(box(.74,.74,.05),mat(0xffffff,.5,0)); frame.position.set(wx,wy,-1.64); g.add(frame);
    const glass=new THREE.Mesh(box(.58,.58,.06),mat(0xffffee,.05,.1,{emissive:0xfff8bb,emissiveIntensity:.1})); glass.position.set(wx,wy,-1.65); g.add(glass); windows.push(glass);
    // window bars
    const hbar=new THREE.Mesh(box(.62,.04,.07),mat(0x888888,.4,.5)); hbar.position.set(wx,wy,-1.63); g.add(hbar);
    const vbar=new THREE.Mesh(box(.04,.62,.07),mat(0x888888,.4,.5)); vbar.position.set(wx,wy,-1.63); g.add(vbar);
    // back windows
    const bw=glass.clone(); bw.position.set(wx,wy,1.64); g.add(bw); windows.push(bw);
    const fw=frame.clone(); fw.position.set(wx,wy,1.64); g.add(fw);
  });
  return { group:g, windows };
}

// ── Mountain ──────────────────────────────────────────────────────────────────
function buildMountain(r:number, h:number, snow:boolean): THREE.Group {
  const g=new THREE.Group();
  const baseC=new THREE.Color().setHSL(.35,.3,.18+Math.random()*.08);
  const geo=new THREE.ConeGeometry(r,h,10); const m=new THREE.MeshStandardMaterial({color:baseC,roughness:.95});
  const cone=new THREE.Mesh(geo,m); cone.position.y=h/2; cone.castShadow=true; g.add(cone);
  // secondary peak
  const g2=new THREE.ConeGeometry(r*.6,h*.7,8); const c2=new THREE.Mesh(g2,m); c2.position.set(r*.3,h*.55,r*.2); g.add(c2);
  if(snow){
    const sg=new THREE.ConeGeometry(r*.35,h*.28,8); const sm=new THREE.Mesh(sg,mat(0xeef0ff,.9,0)); sm.position.y=h*.9; g.add(sm);
    const sg2=new THREE.ConeGeometry(r*.2,h*.2,8,1,false); const sm2=new THREE.Mesh(sg2,mat(0xeef0ff,.9,0)); sm2.position.set(r*.3,h*.95,r*.2); g.add(sm2);
  }
  return g;
}

// ── Bird ──────────────────────────────────────────────────────────────────────
function buildBird(): Bird {
  const g=new THREE.Group();
  const bM=mat(0x222222,.8,.1);
  const body=new THREE.Mesh(new THREE.SphereGeometry(.12,7,5),bM); body.scale.set(1.6,1,.8); g.add(body);
  const lW=new THREE.Mesh(new THREE.PlaneGeometry(.7,.22),mat(0x1a1a1a,.9,0)); lW.position.set(-.4,0,0); g.add(lW);
  const rW=new THREE.Mesh(new THREE.PlaneGeometry(.7,.22),mat(0x1a1a1a,.9,0)); rW.position.set(.4,0,0); g.add(rW);
  return { group:g, lW, rW, phase:Math.random()*Math.PI*2 };
}

// ── Airplane ──────────────────────────────────────────────────────────────────
function buildAirplane(): { group:THREE.Group; navLights:NavLight[] } {
  const g=new THREE.Group();
  const whtM=mat(0xfafafa,.2,.5);
  // fuselage
  const fus=new THREE.Mesh(cyl(.6,.55,10,12),whtM); fus.rotation.z=Math.PI/2; fus.castShadow=true; g.add(fus);
  // nose cone
  const nose=new THREE.Mesh(new THREE.ConeGeometry(.55,2.2,12),whtM); nose.rotation.z=Math.PI/2; nose.position.x=6; g.add(nose);
  // tail cone
  const tail=new THREE.Mesh(new THREE.ConeGeometry(.55,.8,12),whtM); tail.rotation.z=-Math.PI/2; tail.position.x=-5.4; g.add(tail);
  // wings
  const wings=new THREE.Mesh(box(12,.3,2.4),whtM); wings.position.set(0,-.1,0); g.add(wings);
  const wTip=new THREE.Mesh(box(2,.2,.8),mat(0xdd3333,.2,.4)); wTip.position.set(0,-.1,0);
  // winglets
  const wlL=new THREE.Mesh(box(.18,.8,.6),whtM); wlL.position.set(-6.1,.4,0); g.add(wlL);
  const wlR=wlL.clone(); wlR.position.set(6.1,.4,0); g.add(wlR);
  // horizontal stabilizer
  const hs=new THREE.Mesh(box(5,.2,1.2),whtM); hs.position.set(-4.5,.1,0); g.add(hs);
  // vertical fin
  const vf=new THREE.Mesh(box(.2,1.8,1.4),whtM); vf.position.set(-4.6,.9,0); g.add(vf);
  // engines
  for(const ex of [-3,3]){
    const eng=new THREE.Mesh(cyl(.5,.5,1.8,10),mat(0xaaaaaa,.3,.8)); eng.rotation.z=Math.PI/2; eng.position.set(ex,-.5,.8); g.add(eng);
    const inlet=new THREE.Mesh(cyl(.44,.44,.12,10),mat(0x111111,.5,.2)); inlet.rotation.z=Math.PI/2; inlet.position.set(ex+.95,-.5,.8); g.add(inlet);
  }
  // windows strip
  for(let i=-4;i<4;i++){
    const w=new THREE.Mesh(box(.04,.3,.35),mat(0xaad4ff,.05,.1,{emissive:0xaad4ff,emissiveIntensity:.3}));
    w.position.set(i*.88+.4,.22,.58); g.add(w);
  }
  // nav lights
  const lR=new THREE.Mesh(new THREE.SphereGeometry(.14,7,7),mat(0xff2200,.1,.1,{emissive:0xff2200,emissiveIntensity:2}));
  lR.position.set(-6.2,0,0); g.add(lR);
  const lG=new THREE.Mesh(new THREE.SphereGeometry(.14,7,7),mat(0x00ff44,.1,.1,{emissive:0x00ff44,emissiveIntensity:2}));
  lG.position.set(6.2,0,0); g.add(lG);
  const lW2=new THREE.Mesh(new THREE.SphereGeometry(.18,7,7),mat(0xffffff,.1,.1,{emissive:0xffffff,emissiveIntensity:2}));
  lW2.position.set(0,.5,0); g.add(lW2);
  return { group:g, navLights:[{mesh:lR,phase:0},{mesh:lG,phase:Math.PI},{mesh:lW2,phase:.5}] };
}

// ── Pedestrian ────────────────────────────────────────────────────────────────
function buildPedestrian(): Ped {
  const g=new THREE.Group();
  const skinC=[0xffccaa,0xcc9966,0x8b5a2b,0xf5d5a3][Math.floor(Math.random()*4)];
  const shirtC=[0x2244aa,0xaa2244,0x224422,0xaa6622,0x226688][Math.floor(Math.random()*5)];
  const pantsC=[0x222244,0x224422,0x333333,0x442222][Math.floor(Math.random()*4)];
  const skinM=mat(skinC,.8,0); const shirtM=mat(shirtC,.9,0); const pantsM=mat(pantsC,.9,0);
  // torso
  const torso=new THREE.Mesh(box(.38,.52,.26),shirtM); torso.position.y=1.24; torso.castShadow=true; g.add(torso);
  // head
  const head=new THREE.Mesh(new THREE.SphereGeometry(.19,8,8),skinM); head.position.y=1.76; head.castShadow=true; g.add(head);
  // hair
  const hair=new THREE.Mesh(new THREE.SphereGeometry(.2,8,8),mat(Math.random()>.5?0x111111:0x8b4513,.9,0)); hair.position.set(0,.02,0); hair.scale.set(1,.7,1); head.add(hair);
  // arms
  const lA=new THREE.Mesh(box(.14,.42,.14),shirtM); lA.position.set(-.28,.1,0); g.add(lA);
  const rA=new THREE.Mesh(box(.14,.42,.14),shirtM); rA.position.set(.28,.1,0); g.add(rA);
  // legs
  const lL=new THREE.Mesh(box(.16,.52,.16),pantsM); lL.position.set(-.11,-.26,0); g.add(lL);
  const rL=new THREE.Mesh(box(.16,.52,.16),pantsM); rL.position.set(.11,-.26,0); g.add(rL);
  // shoes
  for(const [sx,sy] of [[-.11,-.56],[.11,-.56]] as [number,number][]){
    const shoe=new THREE.Mesh(box(.2,.1,.3),mat(0x111111,.9,0)); shoe.position.set(sx,sy,.04); g.add(shoe);
  }
  g.scale.set(.95,.95+Math.random()*.15,.95);
  return { group:g, lL, rL, lA, rA, phase:Math.random()*Math.PI*2, baseX:0, baseZ:0, dir:1 };
}

// ── Train ─────────────────────────────────────────────────────────────────────
function buildTrain(): THREE.Group {
  const g=new THREE.Group();
  const colors=[0x2233aa,0xaa2222,0x228833,0x886622];
  const bodyC=colors[Math.floor(Math.random()*colors.length)];
  const bM=mat(bodyC,.3,.7); const wM=mat(0x111111,.8,.2); const chrM=mat(0xbbbbbb,.2,.9);
  // engine
  const eng=new THREE.Group();
  const ebody=new THREE.Mesh(box(2.8,2.6,5.4),bM); ebody.position.y=1.3; ebody.castShadow=true; eng.add(ebody);
  const cab=new THREE.Mesh(box(2.6,1.4,2.2),mat(bodyC,.3,.7)); cab.position.set(0,2.4,1.0); cab.castShadow=true; eng.add(cab);
  const cwin=new THREE.Mesh(box(2.4,.7,2.0),mat(0x88bbff,.1,.1,{emissive:0x88bbff,emissiveIntensity:.2,transparent:true,opacity:.6})); cwin.position.set(0,2.55,1.0); eng.add(cwin);
  const front=new THREE.Mesh(box(2.8,2.4,.4),mat(0xdddddd,.4,.6)); front.position.set(0,1.2,-2.9); eng.add(front);
  const buffer=new THREE.Mesh(box(2.4,.3,.28),chrM); buffer.position.set(0,.44,-3.12); eng.add(buffer);
  const chimney=new THREE.Mesh(cyl(.26,.32,.8,8),mat(0x111111,.9,.2)); chimney.position.set(0,2.8,-1.6); eng.add(chimney);
  // headlight
  const hl=new THREE.Mesh(new THREE.SphereGeometry(.22,8,8),mat(0xffffcc,.1,.1,{emissive:0xffffcc,emissiveIntensity:1.5})); hl.position.set(0,1.8,-3.12); eng.add(hl);
  // wheels (3 axles)
  for(let z=-1.6;z<=1.6;z+=1.6){
    for(const wx of [-1.6,1.6]){
      const w=new THREE.Mesh(cyl(.5,.5,.26,16),wM); w.rotation.z=Math.PI/2; w.position.set(wx,.5,z); eng.add(w);
      const r=new THREE.Mesh(cyl(.3,.3,.27,16),chrM); r.rotation.z=Math.PI/2; r.position.set(wx,.5,z); eng.add(r);
    }
  }
  g.add(eng);
  // wagons
  for(let i=0;i<3;i++){
    const wag=new THREE.Group();
    const wb=new THREE.Mesh(box(2.6,2.2,6.2),mat(bodyC,.3,.6)); wb.position.y=1.1; wb.castShadow=true; wag.add(wb);
    const wroof=new THREE.Mesh(box(2.7,.22,6.4),mat(0x111111,.8,.1)); wroof.position.y=2.3; wag.add(wroof);
    // windows
    for(let wi=0;wi<4;wi++){
      for(const wx2 of [-1.35,1.35]){
        const wwin=new THREE.Mesh(box(.04,.6,1.0),mat(0xaaccff,.1,.1,{emissive:0xaaccff,emissiveIntensity:.15})); wwin.position.set(wx2,1.3,-2+wi*1.36); wag.add(wwin);
      }
    }
    // coupler
    const coup=new THREE.Mesh(box(.4,.3,.4),chrM); coup.position.set(0,.44,-3.24); wag.add(coup);
    const coup2=coup.clone(); coup2.position.z=3.24; wag.add(coup2);
    // wheels
    for(const wz2 of [-2,2]){
      for(const wx3 of [-1.4,1.4]){
        const tw=new THREE.Mesh(cyl(.48,.48,.26,12),wM); tw.rotation.z=Math.PI/2; tw.position.set(wx3,.48,wz2); wag.add(tw);
      }
    }
    wag.position.z=-(i+1)*7.2;
    g.add(wag);
  }
  return g;
}

// ── Cactus ────────────────────────────────────────────────────────────────────
function buildCactus(): THREE.Group {
  const g=new THREE.Group();
  const cM=mat(0x2d5a1b,.9,.05);
  const stem=new THREE.Mesh(cyl(.22,.26,3.2,8),cM); stem.position.y=1.6; g.add(stem);
  for(const [ax,az,ay] of [[-1,0,1.4],[.9,0,1.0]] as [number,number,number][]){
    const arm=new THREE.Mesh(cyl(.14,.16,1.4,8),cM); arm.position.set(ax,ay,az); g.add(arm);
    const top=new THREE.Mesh(cyl(.14,.14,.6,8),cM); top.position.set(ax,ay+.9,az); g.add(top);
  }
  return g;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const OfflinePage: React.FC = () => {

  // ── React UI state ────────────────────────────────────────────────────────
  const [selCar,  setSelCar]  = useState(0);
  const [selDiff, setSelDiff] = useState<Diff>('easy');
  const [online,  setOnline]  = useState(navigator.onLine);
  const [cdNum,   setCdNum]   = useState('3');
  const [screen,  setScreen]  = useState<'menu'|'countdown'|'game'|'pause'|'over'>('menu');
  const [goData,  setGoData]  = useState({ score:0, dist:0, spd:0, best:0 });

  // ── HUD DOM refs (updated directly — no re-render) ───────────────────────
  const rScore  = useRef<HTMLSpanElement>(null);
  const rSpeed  = useRef<HTMLSpanElement>(null);
  const rDist   = useRef<HTMLSpanElement>(null);
  const rBar    = useRef<HTMLDivElement>(null);
  const rCtrlSpd= useRef<HTMLDivElement>(null);
  const rCombo  = useRef<HTMLDivElement>(null);
  const rTime   = useRef<HTMLDivElement>(null);

  // ── Canvas ────────────────────────────────────────────────────────────────
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ── Three.js core ─────────────────────────────────────────────────────────
  const sceneRef    = useRef<THREE.Scene|null>(null);
  const camRef      = useRef<THREE.PerspectiveCamera|null>(null);
  const rendRef     = useRef<THREE.WebGLRenderer|null>(null);
  const sunRef      = useRef<THREE.DirectionalLight|null>(null);
  const moonRef     = useRef<THREE.DirectionalLight|null>(null);
  const ambRef      = useRef<THREE.AmbientLight|null>(null);
  const starsRef    = useRef<THREE.Points|null>(null);
  const moonSphRef  = useRef<THREE.Mesh|null>(null);
  const sunSphRef   = useRef<THREE.Mesh|null>(null);

  // ── Game objects ──────────────────────────────────────────────────────────
  const playerRef   = useRef<THREE.Group|null>(null);
  const enemiesRef  = useRef<THREE.Group[]>([]);
  const markersRef  = useRef<{m:THREE.Mesh,bz:number}[]>([]);
  const scrObjsRef  = useRef<ScrObj[]>([]);
  const birdsRef    = useRef<{flock:THREE.Group,birds:Bird[],vel:THREE.Vector3,respawn:boolean}[]>([]);
  const planeRef    = useRef<{group:THREE.Group,navLights:NavLight[],active:boolean,timer:number,dir:number}|null>(null);
  const trainRef    = useRef<{group:THREE.Group,z:number,speed:number,active:boolean,cooldown:number}|null>(null);
  const pedestRef   = useRef<Ped[]>([]);
  const winGlassRef = useRef<THREE.Mesh[][]>([]); // per-house window glass arrays

  // ── Game state refs ───────────────────────────────────────────────────────
  const activeRef   = useRef(false);
  const pausedRef   = useRef(false);
  const overRef     = useRef(false);
  const speedRef    = useRef(1);
  const pxRef       = useRef(0);
  const scoreRef    = useRef(0);
  const distRef     = useRef(0);
  const maxSpdRef   = useRef(1);
  const leftRef     = useRef(false);
  const rightRef    = useRef(false);
  const dayRef      = useRef(0.35); // start at mid-morning
  const lastTRef    = useRef(0);
  const rafRef      = useRef(0);
  const bestRef     = useRef(parseInt(localStorage.getItem('wcr_best')||'0'));
  const diffRef     = useRef(DIFFICULTIES.easy);
  const comboTimRef = useRef<ReturnType<typeof setTimeout>|null>(null);
  const selCarRef   = useRef(0);
  const initDoneRef = useRef(false);

  // ── CSS + fonts injection ─────────────────────────────────────────────────
  useEffect(() => {
    const s = document.createElement('style');
    s.id = 'offline-styles'; s.textContent = STYLES;
    document.head.appendChild(s);
    document.title = 'World Connect Racing';
    return () => { document.getElementById('offline-styles')?.remove(); };
  }, []);

  // ── Connection status ─────────────────────────────────────────────────────
  useEffect(() => {
    const upd = () => setOnline(navigator.onLine);
    window.addEventListener('online', upd); window.addEventListener('offline', upd);
    return () => { window.removeEventListener('online',upd); window.removeEventListener('offline',upd); };
  }, []);

  // ── THREE.JS INIT ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current || initDoneRef.current) return;
    initDoneRef.current = true;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x87ceeb, 0.006);

    const cam = new THREE.PerspectiveCamera(65, innerWidth/innerHeight, .1, 600);
    cam.position.set(0,5.5,-12); cam.lookAt(0,.5,15);
    camRef.current = cam;

    const rend = new THREE.WebGLRenderer({ canvas:canvasRef.current!, antialias:true });
    rend.setSize(innerWidth,innerHeight);
    rend.setPixelRatio(Math.min(devicePixelRatio,2));
    rend.shadowMap.enabled = true;
    rend.shadowMap.type = THREE.PCFSoftShadowMap;
    rend.toneMapping = THREE.ACESFilmicToneMapping;
    rend.toneMappingExposure = 1.1;
    rendRef.current = rend;

    // Lights
    const amb = new THREE.AmbientLight(0x8899cc, 0.8); scene.add(amb); ambRef.current = amb;
    const sun = new THREE.DirectionalLight(0xfff8e1, 1.5);
    sun.position.set(80,80,-30); sun.castShadow=true;
    sun.shadow.mapSize.width=sun.shadow.mapSize.height=2048;
    Object.assign(sun.shadow.camera,{left:-50,right:50,top:50,bottom:-50,near:1,far:250});
    scene.add(sun); sunRef.current=sun;
    const moon = new THREE.DirectionalLight(0x4466aa, 0.0); moon.position.set(-80,60,30); scene.add(moon); moonRef.current=moon;
    scene.add(new THREE.DirectionalLight(0x4466aa,.3).position.set(-20,20,10) as any);

    // Sun/Moon visible spheres
    const sunSph=new THREE.Mesh(new THREE.SphereGeometry(3,12,12),mat(0xffee99,.1,.1,{emissive:0xffee99,emissiveIntensity:1.2}));
    sunSph.position.set(80,80,-60); scene.add(sunSph); sunSphRef.current=sunSph;
    const moonSph=new THREE.Mesh(new THREE.SphereGeometry(2.5,12,12),mat(0xdde8ff,.1,.1,{emissive:0xddddff,emissiveIntensity:.3}));
    moonSph.position.set(-80,60,-60); scene.add(moonSph); moonSphRef.current=moonSph;

    // Stars
    const sPos=new Float32Array(3000*3);
    for(let i=0;i<3000*3;i+=3){ sPos[i]=(Math.random()-.5)*600; sPos[i+1]=60+Math.random()*120; sPos[i+2]=(Math.random()-.5)*600; }
    const sGeo=new THREE.BufferGeometry(); sGeo.setAttribute('position',new THREE.BufferAttribute(sPos,3));
    const sMat=new THREE.PointsMaterial({color:0xffffff,size:.5,transparent:true,opacity:0});
    const stars=new THREE.Points(sGeo,sMat); scene.add(stars); starsRef.current=stars;

    // Scene background placeholder
    scene.background=new THREE.Color(0x87ceeb);

    buildSceneRoad(scene);
    buildSceneEnv(scene);
    buildSceneTrain(scene);
    setupBirds(scene);
    setupAirplane(scene);

    // Resize
    const onResize=()=>{
      cam.aspect=innerWidth/innerHeight; cam.updateProjectionMatrix();
      rend.setSize(innerWidth,innerHeight);
    };
    window.addEventListener('resize',onResize);

    // Idle render (menu)
    let idle=true;
    const idleLoop=()=>{
      if(!activeRef.current){
        dayRef.current=(performance.now()/90000)%1;
        updateDayNight();
        rend.render(scene,cam);
      }
      if(idle) requestAnimationFrame(idleLoop);
    };
    idleLoop();

    return ()=>{
      idle=false;
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize',onResize);
      rend.dispose();
    };
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // BUILD ROAD
  // ─────────────────────────────────────────────────────────────────────────
  function buildSceneRoad(scene:THREE.Scene) {
    const RL=700;
    // tarmac
    const road=new THREE.Mesh(new THREE.PlaneGeometry(ROAD_W,RL),mat(0x111118,.85,.15));
    road.rotation.x=-Math.PI/2; road.position.set(0,0,RL/2-50); road.receiveShadow=true; scene.add(road);
    // white borders
    const bordM=mat(0xffffff,.1,.1,{emissive:0xffffff,emissiveIntensity:.8});
    for(const bx of [-ROAD_W/2,ROAD_W/2]){
      const b=new THREE.Mesh(box(.12,.04,RL),bordM); b.position.set(bx,.02,RL/2-50); scene.add(b);
    }
    // kerb stripes
    for(const kx of [-ROAD_W/2-.4,ROAD_W/2+.4]){
      for(let z=-50;z<RL-50;z+=2.4){
        const kc=z%4.8<2.4?0xff3333:0xfafafa;
        const k=new THREE.Mesh(box(.7,.08,1.1),mat(kc,.9,.05)); k.position.set(kx,.04,z); scene.add(k);
      }
    }
    // lane dashes
    for(let z=-50;z<RL-50;z+=7){
      const lM=mat(0xffffff,.1,.1,{emissive:0xffffff,emissiveIntensity:.6});
      for(const lx of [0,-3,3]){
        const l=new THREE.Mesh(box(.15,.03,3.5),lM); l.position.set(lx,.015,z); scene.add(l);
        markersRef.current.push({m:l,bz:z});
      }
    }
    // shoulder
    const shdM=mat(0x1a2a10,1,.0);
    for(const side of [-1,1]){
      const sh=new THREE.Mesh(new THREE.PlaneGeometry(40,RL),shdM);
      sh.rotation.x=-Math.PI/2; sh.position.set(side*(ROAD_W/2+20),-.01,RL/2-50); sh.receiveShadow=true; scene.add(sh);
    }
    // sidewalk
    const swM=mat(0x999988,.9,.05);
    for(const side of [-1,1]){
      const sw=new THREE.Mesh(box(1.4,.1,RL),swM); sw.position.set(side*(ROAD_W/2+1),.05,RL/2-50); sw.receiveShadow=true; scene.add(sw);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BUILD ENVIRONMENT
  // ─────────────────────────────────────────────────────────────────────────
  function buildSceneEnv(scene:THREE.Scene) {
    const RL=400;

    // Mountains — far background both sides
    const mtnColors:Array<[number,number,boolean]>=[
      [22,30,true],[30,40,true],[18,22,false],[25,35,true],[20,28,false]
    ];
    mtnColors.forEach(([r,h,snow],i)=>{
      const m=buildMountain(r,h,snow);
      const side=i%2===0?-1:1;
      m.position.set(side*(55+Math.random()*20), 0, 100+i*60+Math.random()*40);
      scene.add(m);
      scrObjsRef.current.push({obj:m,resetAt:-100,ahead:600,spd:.06});
    });

    // Trees (dense both sides)
    for(let z=-30;z<RL;z+=5+Math.random()*4){
      for(const side of [-1,1]){
        buildEnvTree(scene, side*(8+Math.random()*8), z+Math.random()*2);
      }
    }

    // Forest zone — right side extra dense
    for(let z=0;z<RL;z+=3+Math.random()*3){
      buildEnvTree(scene, 18+Math.random()*8, z+Math.random()*2, true);
    }

    // Desert zone — left patches (with cacti)
    for(let i=0;i<8;i++){
      const dz=50+i*45;
      const dp=new THREE.Mesh(new THREE.PlaneGeometry(18,30),mat(0xd4a96a,.9,.05,{emissive:0x5a3a10,emissiveIntensity:.02}));
      dp.rotation.x=-Math.PI/2; dp.position.set(-28,.005,dz); scene.add(dp);
      for(let c=0;c<3;c++){
        const cc=buildCactus(); cc.position.set(-22-Math.random()*10,0,dz-12+c*10+Math.random()*4); scene.add(cc);
        scrObjsRef.current.push({obj:cc,resetAt:-60,ahead:450,spd:1});
      }
    }

    // Houses — both sides
    const houseWalls=[0xf5e6d0,0xd4c5a0,0xb5c4a8,0xe8d4c4,0xc8d4b8,0xd4b8a8,0xe4d8c0,0xb8c8d4];
    const houseRoofs=[0x8b4513,0x6b3a2a,0x4a3520,0x773322,0x553322,0x884444,0x664433];
    for(let z=0;z<RL;z+=22+Math.random()*12){
      for(const side of [-1,1]){
        const wc=houseWalls[Math.floor(Math.random()*houseWalls.length)];
        const rc=houseRoofs[Math.floor(Math.random()*houseRoofs.length)];
        const { group, windows }=buildHouse(wc,rc);
        group.position.set(side*(14+Math.random()*4),0,z+Math.random()*4);
        if(side<0) group.rotation.y=Math.PI;
        scene.add(group);
        winGlassRef.current.push(windows);
        scrObjsRef.current.push({obj:group,resetAt:-80,ahead:RL+50,spd:1});
      }
    }

    // Streetlamps
    for(let z=-20;z<RL;z+=28){
      for(const side of [-1,1]){
        buildLamp(scene, side*(ROAD_W/2+2), z);
      }
    }

    // Pedestrians on both sidewalks
    for(let i=0;i<12;i++){
      const ped=buildPedestrian();
      const side=i%2===0?-1:1;
      const bx=side*(ROAD_W/2+1.1);
      const bz=-20+i*30+Math.random()*10;
      ped.group.position.set(bx,0,bz);
      ped.group.rotation.y=side>0?Math.PI:0;
      ped.baseX=bx; ped.baseZ=bz; ped.dir=Math.random()>.5?1:-1;
      scene.add(ped.group);
      pedestRef.current.push(ped);
    }
  }

  function buildEnvTree(scene:THREE.Scene, x:number, z:number, big=false) {
    const g=new THREE.Group();
    const h=big?7+Math.random()*4:3.5+Math.random()*3;
    const trunkM=mat(0x3d2a10,.95,0);
    const leavesM=mat(new THREE.Color().setHSL(.3,.5,.14+Math.random()*.1) as any,.9,0);
    const trunk=new THREE.Mesh(cyl(.14+Math.random()*.08,.18+Math.random()*.08,h,7),trunkM); trunk.position.y=h/2; trunk.castShadow=true; g.add(trunk);
    for(let i=0;i<3;i++){
      const r=(big?1.4:1.1)-i*.2; const l=new THREE.Mesh(new THREE.SphereGeometry(r,7,7),leavesM); l.position.y=h+i*.5; l.castShadow=true; g.add(l);
    }
    g.position.set(x,0,z); scene.add(g);
    scrObjsRef.current.push({obj:g,resetAt:-60,ahead:440,spd:1});
  }

  function buildLamp(scene:THREE.Scene, x:number, z:number) {
    const g=new THREE.Group();
    const pM=mat(0x445566,.6,.8);
    const post=new THREE.Mesh(cyl(.06,.08,5.5,8),pM); post.position.y=2.75; post.castShadow=true; g.add(post);
    const arm=new THREE.Mesh(cyl(.04,.04,.8,8),pM); arm.rotation.z=Math.PI/2; arm.position.set(x<0?.45:-.45,5.4,0); g.add(arm);
    const glowMat=mat(0xffeebb,.1,.1,{emissive:0xffeebb,emissiveIntensity:.8});
    const glow=new THREE.Mesh(new THREE.SphereGeometry(.2,8,8),glowMat); glow.position.set(x<0?.9:-.9,5.4,0); g.add(glow);
    const cover=new THREE.Mesh(cyl(.3,.3,.16,8),pM); cover.position.set(x<0?.9:-.9,5.48,0); g.add(cover);
    g.position.set(x,0,z); scene.add(g);
    scrObjsRef.current.push({obj:g,resetAt:-60,ahead:440,spd:1});
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BUILD TRAIN TRACK
  // ─────────────────────────────────────────────────────────────────────────
  function buildSceneTrain(scene:THREE.Scene) {
    const TX=-22; // train track X position
    const railM=mat(0x888888,.3,.9); const tieM=mat(0x3a2510,.95,.05);
    // Rails (static scrollable)
    for(const rx of [TX-.6,TX+.6]){
      for(let z=-60;z<450;z+=.1){
        // just two long rails
      }
      const rail=new THREE.Mesh(box(.12,.16,600),railM); rail.position.set(rx,.08,250); scene.add(rail);
    }
    // Crossties
    for(let z=-60;z<450;z+=1.8){
      const tie=new THREE.Mesh(box(2.6,.14,.6),tieM); tie.position.set(TX,.04,z); scene.add(tie);
      scrObjsRef.current.push({obj:tie,resetAt:-80,ahead:500,spd:.8});
    }
    // Ground under track
    const tgrd=new THREE.Mesh(new THREE.PlaneGeometry(4,600),mat(0x2a2018,.9,0));
    tgrd.rotation.x=-Math.PI/2; tgrd.position.set(TX,-.005,250); scene.add(tgrd);

    // Build the train object
    const trainGroup=buildTrain();
    trainGroup.position.set(TX,0,200); trainGroup.rotation.y=Math.PI/2;
    scene.add(trainGroup);
    trainRef.current={ group:trainGroup, z:200, speed:1.2, active:true, cooldown:0 };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BIRDS SETUP
  // ─────────────────────────────────────────────────────────────────────────
  function setupBirds(scene:THREE.Scene) {
    for(let f=0;f<4;f++){
      const flock=new THREE.Group();
      const birds:Bird[]=[];
      const count=5+Math.floor(Math.random()*4);
      for(let i=0;i<count;i++){
        const b=buildBird();
        // V formation
        const row=Math.floor(i/2); const side=i%2===0?-1:1;
        b.group.position.set(side*row*.9,Math.random()*.4,(i===0?0:row*.6+.4));
        b.phase=Math.random()*Math.PI*2;
        flock.add(b.group); birds.push(b);
      }
      flock.position.set(-80+f*40,35+Math.random()*20,f*60+20);
      scene.add(flock);
      birdsRef.current.push({flock,birds,vel:new THREE.Vector3(1.8+Math.random()*.8,0,-.4+Math.random()*.2),respawn:false});
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // AIRPLANE SETUP
  // ─────────────────────────────────────────────────────────────────────────
  function setupAirplane(scene:THREE.Scene) {
    const { group, navLights }=buildAirplane();
    group.position.set(-200,65,60);
    group.rotation.y=Math.PI/2; // fly left to right
    group.scale.set(1.5,1.5,1.5);
    scene.add(group);
    planeRef.current={ group, navLights, active:false, timer:30, dir:1 };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DAY/NIGHT UPDATE
  // ─────────────────────────────────────────────────────────────────────────
  function updateDayNight() {
    const t=dayRef.current; // 0=midnight, 0.5=noon
    const sin2=Math.sin(t*Math.PI*2-Math.PI/2); // -1 night, +1 noon

    // ── Sky color
    const nightC=new THREE.Color(0x01060f);
    const dawnC =new THREE.Color(0xf4a261);
    const dayC  =new THREE.Color(0x6ab4e8);
    const duskC =new THREE.Color(0xe76f51);
    let skyC:THREE.Color;
    if(t<.18)       skyC=nightC.clone().lerp(dawnC, t/.18);
    else if(t<.28)  skyC=dawnC .clone().lerp(dayC,(t-.18)/.10);
    else if(t<.72)  skyC=dayC;
    else if(t<.82)  skyC=dayC .clone().lerp(duskC,(t-.72)/.10);
    else if(t<.92)  skyC=duskC.clone().lerp(nightC,(t-.82)/.10);
    else            skyC=nightC;

    const sc=sceneRef.current!;
    sc.background=skyC;
    (sc.fog as THREE.FogExp2).color.set(skyC);

    // ── Sun
    const sunAngle=(t-.25)*Math.PI*2;
    const sx=Math.cos(sunAngle)*100, sy=Math.sin(sunAngle)*100;
    sunRef.current!.position.set(sx+40,sy,-40);
    sunRef.current!.intensity=Math.max(0,sy/80)*1.6;
    sunRef.current!.color.set(t>.22&&t<.78?0xfff8e1:0xff8844);
    sunSphRef.current!.position.set(sx+40,sy,-60);
    (sunSphRef.current!.material as THREE.MeshStandardMaterial).emissiveIntensity=Math.max(0,sy/80)*2+.3;

    // ── Moon
    const moonAngle=sunAngle+Math.PI;
    const mx=Math.cos(moonAngle)*90, my=Math.sin(moonAngle)*90;
    moonRef.current!.position.set(mx,my,-40);
    moonRef.current!.intensity=Math.max(0,my/80)*.4;
    moonSphRef.current!.position.set(mx,my,-60);
    (moonSphRef.current!.material as THREE.MeshStandardMaterial).emissiveIntensity=Math.max(0,my/80)*.8+.1;

    // ── Ambient
    ambRef.current!.intensity=.15+Math.max(0,sin2)*.7;
    const ambC=t<.45||t>.55?
      (sin2<0?new THREE.Color(0x1a2a4a):new THREE.Color(0xf4a261).lerp(new THREE.Color(0x8899cc),Math.max(0,-sin2))):
      new THREE.Color(0xaabbdd);
    ambRef.current!.color.set(ambC);

    // ── Stars
    const starsM=starsRef.current!.material as THREE.PointsMaterial;
    starsM.opacity=Math.max(0,(-sin2-.1)*1.3);

    // ── Window glow (night)
    const nightFactor=Math.max(0,-sin2-.1);
    winGlassRef.current.forEach(ws=>ws.forEach(w=>{
      (w.material as THREE.MeshStandardMaterial).emissiveIntensity=.05+nightFactor*.9;
    }));

    // ── Time badge
    if(rTime.current){
      if(t>.28&&t<.72) rTime.current.textContent='☀️ Jour';
      else if(t<.20||t>.82) rTime.current.textContent='🌙 Nuit';
      else if(t<.28) rTime.current.textContent='🌅 Aube';
      else rTime.current.textContent='🌇 Crépuscule';
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SPAWN ENEMY
  // ─────────────────────────────────────────────────────────────────────────
  function spawnEnemy() {
    const lx=LANE_X[Math.floor(Math.random()*3)];
    if(enemiesRef.current.some(e=>Math.abs(e.position.x-lx)<1.2&&e.position.z>70)) return;
    const cfg:CarCfg={id:'enemy',name:'',color:ENEMY_COLORS[Math.floor(Math.random()*ENEMY_COLORS.length)],accent:0xcccccc,roof:0};
    cfg.roof=cfg.color;
    const ec=buildCar(cfg,false);
    ec.position.set(lx,0,100); ec.rotation.y=Math.PI;
    ec.userData.counted=false;
    sceneRef.current!.add(ec); enemiesRef.current.push(ec);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GAME LOOP
  // ─────────────────────────────────────────────────────────────────────────
  const gameLoop = (now:number) => {
    if(!activeRef.current||overRef.current) return;
    if(pausedRef.current){ rafRef.current=requestAnimationFrame(gameLoop); return; }
    const dt=Math.min((now-lastTRef.current)/16.67,3);
    lastTRef.current=now;

    // Day/night (real time)
    dayRef.current=(performance.now()/90000)%1;
    updateDayNight();

    // ── Speed ramp
    const diff=diffRef.current;
    speedRef.current=Math.min(speedRef.current+diff.ramp*dt,diff.maxSpd);
    if(speedRef.current>maxSpdRef.current) maxSpdRef.current=speedRef.current;

    // ── Player X
    if(leftRef.current)  pxRef.current-=MOVE_SPD*dt;
    if(rightRef.current) pxRef.current+=MOVE_SPD*dt;
    pxRef.current=Math.max(-ROAD_W/2+.7,Math.min(ROAD_W/2-.7,pxRef.current));
    const p=playerRef.current!;
    p.position.x=pxRef.current;
    p.rotation.z=leftRef.current?.06:rightRef.current?-.06:0;
    // wheel spin
    p.children.forEach(c=>{ if(c.userData.isWheel) c.rotation.x-=speedRef.current*.05*dt; });

    const scroll=speedRef.current*.12*dt;

    // ── Lane markers scroll
    markersRef.current.forEach(({m})=>{
      m.position.z+=scroll*1.6;
      if(m.position.z>30) m.position.z-=200;
      if(m.position.z<-50) m.position.z+=200;
    });

    // ── Scrollable env objects
    scrObjsRef.current.forEach(s=>{
      s.obj.position.z-=scroll*s.spd;
      if(s.obj.position.z<s.resetAt) s.obj.position.z+=s.ahead;
    });

    // ── Enemies
    for(let i=enemiesRef.current.length-1;i>=0;i--){
      const e=enemiesRef.current[i];
      e.position.z-=scroll*1.4;
      e.children.forEach(c=>{ if(c.userData.isWheel) c.rotation.x+=speedRef.current*.05*dt; });
      if(!e.userData.counted&&e.position.z<p.position.z-3){
        e.userData.counted=true; scoreRef.current++;
        showComboFx(scoreRef.current);
      }
      if(e.position.z<-25){ sceneRef.current!.remove(e); enemiesRef.current.splice(i,1); continue; }
      // collision
      if(Math.abs(e.position.x-pxRef.current)<.85&&Math.abs(e.position.z-p.position.z)<2.1){ triggerCrash(); return; }
    }
    if(Math.random()<diff.spawn*dt*1.5) spawnEnemy();

    // ── Distance
    distRef.current+=speedRef.current*.04*dt;

    // ── Train
    const tr=trainRef.current;
    if(tr){
      if(tr.active){
        tr.z-=tr.speed*dt;
        tr.group.position.z=tr.z;
        if(tr.z<-80){ tr.active=false; tr.cooldown=180+Math.random()*120; tr.z=300; tr.group.position.z=300; }
      } else {
        tr.cooldown-=dt;
        if(tr.cooldown<=0){ tr.active=true; tr.z=300; tr.speed=1.5+Math.random()*1.5; }
      }
    }

    // ── Birds (day only)
    const isDay=dayRef.current>.20&&dayRef.current<.82;
    birdsRef.current.forEach(fd=>{
      if(!isDay){ fd.flock.visible=false; return; }
      fd.flock.visible=true;
      fd.flock.position.addScaledVector(fd.vel,dt*.16);
      // wrap
      if(fd.flock.position.x>100){ fd.flock.position.x=-100; fd.flock.position.z=10+Math.random()*80; fd.flock.position.y=30+Math.random()*25; }
      if(fd.flock.position.x<-100){ fd.flock.position.x=100; }
      // flap wings
      fd.birds.forEach(b=>{
        b.phase+=.08*dt;
        b.lW.rotation.z=Math.sin(b.phase*3.5)*.7;
        b.rW.rotation.z=-Math.sin(b.phase*3.5)*.7;
      });
    });

    // ── Airplane (day only)
    const pl=planeRef.current;
    if(pl){
      pl.group.visible=isDay;
      if(isDay){
        if(!pl.active){
          pl.timer-=dt;
          if(pl.timer<=0){
            pl.active=true; pl.dir=Math.random()>.5?1:-1;
            pl.group.position.set(pl.dir*-200,60+Math.random()*20,40+Math.random()*60);
            pl.group.rotation.y=pl.dir>0?Math.PI/2:-Math.PI/2;
          }
        } else {
          pl.group.position.x+=pl.dir*.5*dt;
          if(Math.abs(pl.group.position.x)>220){ pl.active=false; pl.timer=30+Math.random()*30; }
          // blink nav lights
          pl.navLights.forEach(nl=>{
            nl.phase+=.08*dt;
            (nl.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity=Math.sin(nl.phase*6)>.4?2:.3;
          });
        }
      }
    }

    // ── Pedestrians
    pedestRef.current.forEach(ped=>{
      ped.phase+=.06*dt; // walk speed
      const walk=Math.sin(ped.phase);
      ped.lL.rotation.x=walk*.4; ped.rL.rotation.x=-walk*.4;
      ped.lA.rotation.x=-walk*.3; ped.rA.rotation.x=walk*.3;
      // move along sidewalk
      ped.group.position.z+=ped.dir*.04*dt;
      if(ped.group.position.z>200) ped.group.position.z=-40;
      if(ped.group.position.z<-40) ped.group.position.z=200;
      // slight bob
      ped.group.position.y=Math.abs(Math.sin(ped.phase))*0.04;
    });

    // ── HUD
    const spd=Math.round(speedRef.current*18);
    if(rScore.current)   rScore.current.textContent=String(scoreRef.current);
    if(rSpeed.current)   rSpeed.current.textContent=String(spd);
    if(rDist.current)    rDist.current.textContent=Math.floor(distRef.current)+'m';
    if(rBar.current)     rBar.current.style.width=(speedRef.current/diff.maxSpd*100)+'%';
    if(rCtrlSpd.current) rCtrlSpd.current.textContent=spd+' km/h';

    rendRef.current!.render(sceneRef.current!, camRef.current!);
    rafRef.current=requestAnimationFrame(gameLoop);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // CRASH
  // ─────────────────────────────────────────────────────────────────────────
  function triggerCrash() {
    activeRef.current=false; overRef.current=true;
    cancelAnimationFrame(rafRef.current);
    const fx=document.getElementById('flash')!;
    fx.classList.add('on'); setTimeout(()=>fx.classList.remove('on'),130);
    let sf=0;
    const shk=()=>{ sf++;
      camRef.current!.position.x=(Math.random()-.5)*.9;
      camRef.current!.position.y=5.5+(Math.random()-.5)*.6;
      rendRef.current!.render(sceneRef.current!,camRef.current!);
      if(sf<22) requestAnimationFrame(shk);
      else { camRef.current!.position.set(0,5.5,-12);
        const best=Math.max(scoreRef.current,bestRef.current);
        if(scoreRef.current>bestRef.current){ bestRef.current=scoreRef.current; localStorage.setItem('wcr_best',String(scoreRef.current)); }
        setGoData({score:scoreRef.current,dist:Math.floor(distRef.current),spd:Math.round(maxSpdRef.current*18),best});
        setScreen('over');
      }
    };
    shk();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // COMBO FX
  // ─────────────────────────────────────────────────────────────────────────
  function showComboFx(score:number) {
    if(score<2||!rCombo.current) return;
    const el=rCombo.current;
    el.textContent=score>=10?`🔥 ${score} ESQUIVÉES`:`×${Math.min(score,5)} COMBO`;
    el.style.display='inline-flex'; el.style.animation='none';
    requestAnimationFrame(()=>{ el.style.animation='cpop .3s cubic-bezier(.34,1.56,.64,1)'; });
    if(comboTimRef.current) clearTimeout(comboTimRef.current);
    comboTimRef.current=setTimeout(()=>{ if(rCombo.current) rCombo.current.style.display='none'; },1500);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CONTROLS SETUP (called once per game start)
  // ─────────────────────────────────────────────────────────────────────────
  const ctrlSetupDone=useRef(false);
  function setupControls() {
    if(ctrlSetupDone.current) return; ctrlSetupDone.current=true;
    const hold=(id:string,set:(v:boolean)=>void)=>{
      const el=document.getElementById(id)!;
      if(!el) return;
      ['touchstart','mousedown'].forEach(ev=>el.addEventListener(ev,(e:Event)=>{e.preventDefault();set(true);el.classList.add('pr');},{passive:false}));
      ['touchend','touchcancel','mouseup','mouseleave'].forEach(ev=>el.addEventListener(ev,()=>{set(false);el.classList.remove('pr');}));
    };
    hold('btnL',v=>leftRef.current=v); hold('btnR',v=>rightRef.current=v);
    document.getElementById('btnU')?.addEventListener('click',()=>speedRef.current=Math.min(speedRef.current+1,diffRef.current.maxSpd));
    document.getElementById('btnD')?.addEventListener('click',()=>speedRef.current=Math.max(speedRef.current-1,1));
    // Swipe
    let tx=0;
    canvasRef.current?.addEventListener('touchstart',(e:TouchEvent)=>{ if(!(e.target as HTMLElement).closest('#controls')) tx=e.touches[0].clientX; },{passive:true});
    canvasRef.current?.addEventListener('touchmove',(e:TouchEvent)=>{
      if(!(e.target as HTMLElement).closest('#controls')){
        pxRef.current+=(e.touches[0].clientX-tx)*.022;
        pxRef.current=Math.max(-ROAD_W/2+.7,Math.min(ROAD_W/2-.7,pxRef.current));
        tx=e.touches[0].clientX;
      }
    },{passive:true});
    // Keyboard
    const kd=(e:KeyboardEvent)=>{
      if(!activeRef.current) return;
      if(e.key==='ArrowLeft'||e.key==='a') leftRef.current=true;
      if(e.key==='ArrowRight'||e.key==='d') rightRef.current=true;
      if(e.key==='ArrowUp'||e.key==='+') speedRef.current=Math.min(speedRef.current+1,diffRef.current.maxSpd);
      if(e.key==='ArrowDown'||e.key==='-') speedRef.current=Math.max(speedRef.current-1,1);
      if(e.key===' '||e.key==='Escape') togglePause();
    };
    const ku=(e:KeyboardEvent)=>{
      if(e.key==='ArrowLeft'||e.key==='a') leftRef.current=false;
      if(e.key==='ArrowRight'||e.key==='d') rightRef.current=false;
    };
    window.addEventListener('keydown',kd); window.addEventListener('keyup',ku);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GAME ACTIONS
  // ─────────────────────────────────────────────────────────────────────────
  function startCountdown() {
    setScreen('countdown');
    const nums=['3','2','1','GO!'];
    let i=0;
    const tick=()=>{
      setCdNum(nums[i]); i++;
      if(i<nums.length) setTimeout(tick,900);
      else setTimeout(launchGame,600);
    };
    tick();
  }

  function launchGame() {
    selCarRef.current=selCar;
    diffRef.current=DIFFICULTIES[selDiff];
    speedRef.current=selDiff==='easy'?1:selDiff==='medium'?2:3;
    scoreRef.current=0; distRef.current=0; maxSpdRef.current=speedRef.current;
    pxRef.current=0; leftRef.current=false; rightRef.current=false;
    activeRef.current=true; pausedRef.current=false; overRef.current=false;
    enemiesRef.current.forEach(e=>sceneRef.current?.remove(e)); enemiesRef.current=[];
    if(playerRef.current) sceneRef.current?.remove(playerRef.current);
    const cfg=CAR_MODELS[selCar];
    const pc=buildCar(cfg,true); pc.position.set(0,0,0); sceneRef.current?.add(pc); playerRef.current=pc;
    setScreen('game');
    setupControls();
    lastTRef.current=performance.now();
    rafRef.current=requestAnimationFrame(gameLoop);
  }

  function togglePause() {
    if(screen==='over') return;
    pausedRef.current=!pausedRef.current;
    setScreen(pausedRef.current?'pause':'game');
    if(!pausedRef.current){ lastTRef.current=performance.now(); rafRef.current=requestAnimationFrame(gameLoop); }
  }

  function restartGame() { setScreen('menu'); setTimeout(()=>startCountdown(),50); }

  function backToMenu() {
    cancelAnimationFrame(rafRef.current);
    activeRef.current=false; overRef.current=false; pausedRef.current=false;
    enemiesRef.current.forEach(e=>sceneRef.current?.remove(e)); enemiesRef.current=[];
    setScreen('menu');
    // Idle render restart
    const idleLoop=()=>{
      if(!activeRef.current){
        dayRef.current=(performance.now()/90000)%1;
        updateDayNight();
        rendRef.current?.render(sceneRef.current!,camRef.current!);
      }
      if(!activeRef.current) requestAnimationFrame(idleLoop);
    };
    idleLoop();
  }

  function retryConnection() {
    if(navigator.onLine) window.location.reload();
    else alert('Toujours hors ligne — continuez à jouer !');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // JSX
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <canvas ref={canvasRef} id="rc" />
      <div id="flash" />

      {/* ── COUNTDOWN ── */}
      <div id="cdScreen" className={screen==='countdown'?'show':''}>
        <div className="cdn" key={cdNum}>{cdNum}</div>
      </div>

      {/* ── MENU ── */}
      <div id="menuScreen" className={screen!=='menu'?'hide':''}>
        <div className="menu-inner panel">
          <div className="logo-row">
            <div className="logo-icon">🏁</div>
            <div className="logo-txt">World Connect</div>
          </div>
          <div className="game-title">Racing</div>

          <div className={`conn-badge${online?' online':''}`}>
            <div className="conn-dot" />
            <span>{online?'En ligne':'Hors ligne – mode local'}</span>
          </div>

          <div className="sec-lbl">Votre voiture</div>
          <div className="car-grid">
            {CAR_MODELS.map((c,i)=>(
              <div key={c.id} className={`car-opt${selCar===i?' sel':''}`} onClick={()=>setSelCar(i)}>
                <svg viewBox="0 0 60 40">
                  <rect x="6"  y="18" width="48" height="14" rx="3" fill={`#${c.color.toString(16).padStart(6,'0')}`}/>
                  <rect x="14" y="10" width="32" height="14" rx="5" fill={`#${c.roof.toString(16).padStart(6,'0')}`}/>
                  <circle cx="14" cy="32" r="5" fill="#222"/><circle cx="14" cy="32" r="2.5" fill="#888"/>
                  <circle cx="46" cy="32" r="5" fill="#222"/><circle cx="46" cy="32" r="2.5" fill="#888"/>
                  <rect x="2"  y="22" width="8"  height="6" rx="2" fill={`#${c.accent.toString(16).padStart(6,'0')}`} opacity=".7"/>
                  <rect x="50" y="22" width="8"  height="6" rx="2" fill={`#${c.accent.toString(16).padStart(6,'0')}`} opacity=".7"/>
                </svg>
                <span className="cn">{c.name}</span>
              </div>
            ))}
          </div>

          <div className="sec-lbl">Difficulté</div>
          <div className="diff-row">
            {(['easy','medium','hard'] as Diff[]).map(d=>(
              <button key={d} className={`diff-btn${selDiff===d?' act':''}`} onClick={()=>setSelDiff(d)}>
                {d==='easy'?'Facile':d==='medium'?'Normal':'Difficile'}
              </button>
            ))}
          </div>

          <button className="btn-play" onClick={startCountdown}>⚡ DÉMARRER</button>
          <button className="btn-sec"  onClick={retryConnection}>🔄 Réessayer connexion</button>
        </div>
      </div>

      {/* ── HUD ── */}
      <div id="hud" style={{display:screen==='game'||screen==='pause'?'block':'none'}}>
        <div className="hud-top">
          <div className="hc">
            <div className="hl">Score</div>
            <div className="hv ac" ref={rScore}>0</div>
          </div>
          <div className="hc">
            <div className="hl">Vitesse</div>
            <div className="hv sp" ref={rSpeed}>0</div>
          </div>
          <div className="sbw">
            <div className="sbl"><span>0</span><span>km/h</span><span>{DIFFICULTIES[selDiff].maxSpd*18}</span></div>
            <div className="sbt"><div className="sbf" ref={rBar} style={{width:'5%'}} /></div>
          </div>
          <div className="hc">
            <div className="hl">Dist.</div>
            <div className="hv" ref={rDist}>0m</div>
          </div>
          <button className="hud-btn" onClick={togglePause}>⏸</button>
        </div>
        <div className="combo" ref={rCombo} />
        <div className="time-badge" ref={rTime}>☀️ Jour</div>
      </div>

      {/* ── CONTROLS ── */}
      <div id="controls" style={{display:screen==='game'?'flex':'none'}}>
        <div className="ctrl-side"><div className="ctrl-btn" id="btnL">◀</div></div>
        <div className="ctrl-center">
          <div className="spd-disp" ref={rCtrlSpd}>1 km/h</div>
          <div className="ctrl-spd-row">
            <div className="ctrl-spd-btn" id="btnD">−</div>
            <div className="ctrl-spd-btn" id="btnU">＋</div>
          </div>
        </div>
        <div className="ctrl-side"><div className="ctrl-btn" id="btnR">▶</div></div>
      </div>

      {/* ── PAUSE ── */}
      <div id="pauseScreen" className={screen==='pause'?'show':''}>
        <div className="pause-inner panel">
          <div className="pause-title">PAUSE</div>
          <button className="btn-play" onClick={togglePause}>▶ REPRENDRE</button>
          <br/><br/>
          <button className="btn-sec" onClick={backToMenu}>← Menu principal</button>
        </div>
      </div>

      {/* ── GAME OVER ── */}
      <div id="goScreen" className={screen==='over'?'show':''}>
        <div className="go-inner panel">
          <div className="crash-ico">💥</div>
          <div className="go-title">COURSE TERMINÉE</div>
          <div className="stats-g">
            <div className="stat-b"><div className="stat-n">{goData.score}</div><div className="stat-l">Esquivées</div></div>
            <div className="stat-b"><div className="stat-n">{goData.dist}</div><div className="stat-l">Mètres</div></div>
            <div className="stat-b"><div className="stat-n">{goData.spd}</div><div className="stat-l">km/h max</div></div>
          </div>
          <div className="best-b">🏆 Meilleur : {goData.best}</div>
          <button className="btn-play" onClick={restartGame}>🔄 REJOUER</button>
          <br/><br/>
          <button className="btn-sec" onClick={backToMenu}>← Menu</button>
        </div>
      </div>
    </>
  );
};

export default OfflinePage;
