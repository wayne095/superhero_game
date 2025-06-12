'use client';

import { useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../styles/GameScreen.module.css';

/* ---------- 基本常量 ---------- */
const W = 640, H = 480;
const HERO = 32, MISSILE = 16, VILLAIN = 32;
const HERO_BASE = 4, HERO_INC = 0.2;
const HERO_MAX  = 12;                      /* ① 英雄最高速 */
const OVERLAY_MS = 1200;

/* ===== LEVELS：4 / 8 / 16 枚飛彈 ===== */
const LEVELS = [
  { bg: '/bg1.png', count: 4,  v0: 3.0, accel: 0.006 },
  { bg: '/bg2.png', count: 8,  v0: 3.3, accel: 0.008 },
  { bg: '/bg3.png', count: 16, v0: 3.6, accel: 0.010 },
];
const VILLAIN_SPEEDS = [3, 4, 5];
const MISSILE_MAX = [4, 5, 6];           /* ① 三關飛彈最高速 */

const BASE_ORIENT = (3 * Math.PI) / 4;
const SNAP_STEP   = Math.PI / 12;
const safePlay = a => a && a.play().catch(()=>{});

export default function GameScreen() {
  const router = useRouter();
  const canvasRef = useRef(null);

  const [level, setLevel] = useState(0);
  const [overlay, setOverlay] = useState(null);
  const ended = useRef(false);

  /* ---------- game state refs ---------- */
  const hero    = useRef({ x: W/2 - HERO/2, y: H - HERO - 10, speed: HERO_BASE, dir: null });
  const villain = useRef({ x: W/2 - VILLAIN/2, y: H / 3 });
  const vVel    = useRef({ dx: VILLAIN_SPEEDS[0], dy: 0 });
  const missiles   = useRef(createMissiles(LEVELS[0]));
  const explosions = useRef([]);

  /* ---------- audio refs ---------- */
  const bgm = useRef(null), boom = useRef(null), win = useRef(null);

  /* ---------- misc ---------- */
  const keys = useRef({}), imgs = useRef({});

  /* ---------- helper funcs ---------- */
  function createMissiles({ count, v0, accel }) {
    return Array.from({ length: count }, () => ({
      x: Math.random() * (W - MISSILE),
      y: -Math.random() * H,
      speed: v0, accel,
    }));
  }
  const collide = (a,ra,b,rb)=>(a.x+ra-(b.x+rb))**2+(a.y+ra-(b.y+rb))**2<=(ra+rb)**2;
  const snap = r => Math.round(r / SNAP_STEP) * SNAP_STEP;
  const resetLevel = lv => {
    hero.current = { x: W/2 - HERO/2, y: H - HERO - 10, speed: HERO_BASE, dir: null };
    villain.current = { x: W/2 - VILLAIN/2, y: H / 3 };
    vVel.current = { dx: VILLAIN_SPEEDS[lv], dy: 0 };
    missiles.current = createMissiles(LEVELS[lv]);
    explosions.current = [];
    ended.current = false;
  };

  /* ---------- preload ---------- */
  useEffect(() => {
    [...LEVELS.map(l=>l.bg),
     '/hero.png','/missile.png','/villain.png',
     '/victory.png','/game_over.png','/explosion.png'
    ].forEach(src=>{const im=new Image(); im.src=src; imgs.current[src]=im;});

    bgm.current  = new Audio('/audio/bg_loop.mp3'); bgm.current.loop=true; bgm.current.volume=0.35;
    boom.current = new Audio('/audio/boom.mp3');
    win.current  = new Audio('/audio/fanfare.mp3');
  }, []);

  useEffect(()=>{
    const d=e=>keys.current[e.code]=true,u=e=>keys.current[e.code]=false;
    window.addEventListener('keydown',d); window.addEventListener('keyup',u);
    return ()=>{window.removeEventListener('keydown',d);window.removeEventListener('keyup',u);};
  },[]);

  useEffect(()=>{
    const ctx=canvasRef.current.getContext('2d'); ctx.imageSmoothingEnabled=false;
    safePlay(bgm.current);
    let raf; const loop=()=>{update(); draw(ctx); raf=requestAnimationFrame(loop);};
    raf=requestAnimationFrame(loop);
    return()=>{cancelAnimationFrame(raf); bgm.current?.pause();};
  },[level]);

  /* ---------- update ---------- */
  function update(){
    if(ended.current) return;

    /* hero movement (限速 11) */
    let dir=null;
    if(keys.current['ArrowLeft'])dir='L'; else if(keys.current['ArrowRight'])dir='R';
    else if(keys.current['ArrowUp'])dir='U'; else if(keys.current['ArrowDown'])dir='D';

    if(dir){
      hero.current.speed = dir===hero.current.dir
        ? Math.min(HERO_MAX, hero.current.speed + HERO_INC)
        : (hero.current.dir = dir, HERO_BASE);
      if(dir==='L') hero.current.x -= hero.current.speed;
      if(dir==='R') hero.current.x += hero.current.speed;
      if(dir==='U') hero.current.y -= hero.current.speed;
      if(dir==='D') hero.current.y += hero.current.speed;
    }else{ hero.current.speed=HERO_BASE; hero.current.dir=null; }

    hero.current.x=Math.max(0,Math.min(W-HERO,hero.current.x));
    hero.current.y=Math.max(0,Math.min(H-HERO,hero.current.y));

    const hx=hero.current.x+HERO/2, hy=hero.current.y+HERO/2;

    /* villain 遠離 + 抖動（不變） */
    vVel.current.dx += (Math.random()-0.5)*0.4;
    vVel.current.dy += (Math.random()-0.5)*0.4;
    const ax=villain.current.x+VILLAIN/2-hx, ay=villain.current.y+VILLAIN/2-hy,
          lenA=Math.hypot(ax,ay)||1;
    vVel.current.dx += (ax/lenA)*0.15;
    vVel.current.dy += (ay/lenA)*0.15;
    const cap=Math.min(VILLAIN_SPEEDS[level],5),
          lenV=Math.hypot(vVel.current.dx,vVel.current.dy)||1;
    vVel.current.dx=(vVel.current.dx/lenV)*cap;
    vVel.current.dy=(vVel.current.dy/lenV)*cap;
    villain.current.x+=vVel.current.dx;
    villain.current.y+=vVel.current.dy;
    if(villain.current.x<0||villain.current.x>W-VILLAIN) vVel.current.dx=-vVel.current.dx;
    if(villain.current.y<0||villain.current.y>H-VILLAIN) vVel.current.dy=-vVel.current.dy;
    villain.current.x=Math.max(0,Math.min(W-VILLAIN,villain.current.x));
    villain.current.y=Math.max(0,Math.min(H-VILLAIN,villain.current.y));

    /* missiles homing + 限速 */
    missiles.current.forEach(m=>{
      const mx=m.x+MISSILE/2,my=m.y+MISSILE/2,
            dx=hx-mx,dy=hy-my,len=Math.hypot(dx,dy)||1;
      m.speed = Math.min(m.speed + m.accel, MISSILE_MAX[level]);   /* ② 封頂 */
      m.x += (dx/len)*m.speed;
      m.y += (dy/len)*m.speed;
      if(m.x<-MISSILE||m.x>W+MISSILE||m.y<-MISSILE||m.y>H+MISSILE){
        m.x=Math.random()*(W-MISSILE); m.y=-MISSILE; m.speed=LEVELS[level].v0;
      }
    });

    /* collision 判定（保持不變） */
    const rH=HERO*0.4,rM=MISSILE*0.4,rV=VILLAIN*0.4;
    for(const m of missiles.current){
      if(collide(hero.current,rH,m,rM)){
        safePlay(boom.current);
        explosions.current.push({x:hx,y:hy,start:Date.now()});
        return end('game_over');
      }
    }
    if(collide(hero.current,rH,villain.current,rV)){
      if(level<LEVELS.length-1){ const n=level+1; setLevel(n); resetLevel(n); }
      else{ safePlay(win.current); bgm.current?.pause(); return end('victory'); }
    }
    explosions.current = explosions.current.filter(e=>Date.now()-e.start<400);
  }

  /* ---------- draw ---------- */
  function draw(ctx){
    ctx.clearRect(0,0,W,H);
    imgs.current[LEVELS[level].bg]?.complete &&
      ctx.drawImage(imgs.current[LEVELS[level].bg],0,0,W,H);

    const mImg=imgs.current['/missile.png'];
    missiles.current.forEach(m=>{
      if(!mImg?.complete)return;
      const cx=m.x+MISSILE/2,cy=m.y+MISSILE/2,
            ang=Math.atan2((hero.current.y+HERO/2)-cy,(hero.current.x+HERO/2)-cx);
      ctx.save(); ctx.translate(cx,cy); ctx.rotate(snap(ang-BASE_ORIENT));
      ctx.drawImage(mImg,-MISSILE/2,-MISSILE/2,MISSILE,MISSILE); ctx.restore();
    });

    imgs.current['/hero.png']?.complete &&
      ctx.drawImage(imgs.current['/hero.png'],hero.current.x,hero.current.y,HERO,HERO);
    imgs.current['/villain.png']?.complete &&
      ctx.drawImage(imgs.current['/villain.png'],villain.current.x,villain.current.y,VILLAIN,VILLAIN);

    const exp=imgs.current['/explosion.png'];
    explosions.current.forEach(e=>{
      if(!exp?.complete)return;
      ctx.drawImage(exp,e.x-25,e.y-25,50,50);
    });
  }

  const end = type=>{
    if(ended.current)return;
    ended.current=true;
    setOverlay(type);
    setTimeout(()=>{ bgm.current?.pause(); router.push('/'); },OVERLAY_MS);
  };

  return (
    <div className={styles.wrapper}>
      <canvas ref={canvasRef} width={W} height={H} className={styles.canvas}/>
      {overlay && <img src={`/${overlay}.png`} alt={overlay} className={styles.overlay}/>}
    </div>
  );
}
