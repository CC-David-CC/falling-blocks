import assert from 'node:assert/strict';
import {createGame,command,tick,cells,ghost,snapshot,restore,WIDTH,HEIGHT,LOCK_TICKS,MAX_RESETS} from '../apps/system/falling-blocks/model.mjs';
const playing=()=>{const s=createGame({seed:123});command(s,'resume');return s;};
{
 const a=createGame({seed:42}),b=createGame({seed:42});assert.deepEqual(a,b);assert.equal(new Set([a.active.type,...a.bag]).size,7);
}
{
 const s=playing();s.board=Array.from({length:HEIGHT},(_,y)=>Array.from({length:WIDTH},(_,x)=>y>=20&&x!==4?'J':null));s.active={type:'I',rotation:1,x:3,y:20};command(s,'hard');assert.equal(s.lines,4);assert.equal(s.score,800);assert.ok(s.board.every(r=>r.every(c=>c===null)));assert.equal(s.phase,'playing');
}
{
 const s=playing();for(let i=0;i<30;i++)command(s,'left');for(let i=0;i<30;i++){command(s,'rotate-cw');assert.ok(cells(s.active).every(([x,y])=>x>=0&&x<WIDTH&&y>=0&&y<HEIGHT));}
}
{
 const s=playing();const original=s.active.type;command(s,'hold');const next=s.active.type;command(s,'hold');assert.equal(s.held,original);assert.equal(s.active.type,next);command(s,'hard');assert.equal(s.holdUsed,false);command(s,'hold');assert.equal(s.active.type,original);
}
{
 const s=playing();while(JSON.stringify(ghost(s))!==JSON.stringify(cells(s.active)))command(s,'soft');for(let i=0;i<7;i++)tick(s);assert.equal(s.lock,7);const saved=snapshot(s);for(let i=0;i<6;i++)tick(s);const restored=restore(saved);assert.equal(restored.phase,'paused');assert.equal(restored.lock,7);command(restored,'resume');for(let i=0;i<LOCK_TICKS-7;i++)tick(restored);assert.equal(restored.lock,0);assert.ok(restored.board.some(r=>r.some(Boolean)));
}
{
 const s=playing();s.active={type:'O',rotation:0,x:3,y:22};for(let i=0;i<MAX_RESETS+8;i++){tick(s);command(s,i%2?'left':'right');}assert.equal(s.resets,MAX_RESETS);for(let i=0;i<LOCK_TICKS;i++)tick(s);assert.ok(s.board.some(r=>r.some(Boolean)));
}
{
 const s=playing();s.board[3][0]='T';s.active={type:'O',rotation:0,x:3,y:22};command(s,'hard');assert.equal(s.phase,'lost');
 const sprint=playing();sprint.mode='sprint';sprint.lines=36;sprint.board=Array.from({length:HEIGHT},(_,y)=>Array.from({length:WIDTH},(_,x)=>y>=20&&x!==4?'J':null));sprint.active={type:'I',rotation:1,x:3,y:20};command(sprint,'hard');assert.equal(sprint.phase,'won');
}
{
 const s=playing(),before=structuredClone(s),doc=snapshot(s);assert.deepEqual(restore(doc),{...structuredClone(s),phase:'paused'});const a=restore(doc),b=restore(doc);command(a,'resume');command(b,'resume');for(let i=0;i<8;i++){command(a,'hard');command(b,'hard');}assert.deepEqual(a,b);for(const mutate of [d=>d.appId='other',d=>d.payload.board[0][0]='bogus',d=>d.payload.rng=0,d=>d.payload.lock=Infinity,d=>d.payload.bag=['I','I'],d=>d.payload.active.x=999]){const bad=structuredClone(doc);mutate(bad);assert.throws(()=>restore(bad));assert.deepEqual(s,before);}
}
console.log('PASS deterministic bag, rotations, hold, four-line clear, exact lock snapshot, bounded resets, top-out, sprint and invalid saves');
