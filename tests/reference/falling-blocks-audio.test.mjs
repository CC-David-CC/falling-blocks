import assert from 'node:assert/strict';
import {createGameAudio} from '../apps/system/falling-blocks/audio.mjs';

class Param{
 value=1;
 setValueAtTime(value){this.value=value}
 exponentialRampToValueAtTime(value){this.value=value}
}
class Node{
 connections=0;
 connect(){this.connections++}
 disconnect(){this.connections=0}
}
class FakeContext{
 state='suspended';
 currentTime=0;
 created=0;
 closes=0;
 destination=new Node();
 createGain(){this.created++;return Object.assign(new Node(),{gain:new Param()})}
 createOscillator(){this.created++;return Object.assign(new Node(),{type:'sine',frequency:new Param(),start(){},stop(){}})}
 async resume(){this.state='running'}
 async suspend(){this.state='suspended'}
 async close(){this.closes++;this.state='closed'}
}

let contexts=0,context=null;
const audio=createGameAudio({contextFactory:()=>{contexts++;context=new FakeContext();return context}});
assert.equal(contexts,0,'construction must not create an audio context');
audio.play('left');
assert.equal(contexts,0,'muted play must not create an audio context');
await audio.enable(false);
assert.equal(contexts,0,'explicitly disabling a fresh instance must stay lazy');
await audio.enable(true);
assert.equal(contexts,1);

audio.play('left');
audio.play('rotate');
audio.play('drop');
audio.play('clear',{count:4});
audio.play('won');
audio.play('lost');
assert.ok(context.created>0,'enabled cues should allocate audio nodes');

audio.setVolume(.62);
await audio.suspend();
assert.equal(context.state,'suspended');
await audio.resume();
assert.equal(context.state,'running');
audio.dispose();
audio.dispose();
assert.equal(contexts,1,'dispose must be idempotent and not create another context');
assert.equal(context.closes,1);
console.log('PASS lazy muted default, synthesized cues, volume and idempotent disposal');

// Each window must control and dispose only its own sound resources.
const firstContext = new FakeContext(), secondContext = new FakeContext();
const first = createGameAudio({contextFactory: () => firstContext});
const second = createGameAudio({contextFactory: () => secondContext});
await first.enable(true); await second.enable(true);
first.setVolume(.2); second.setVolume(.8);
await first.enable(false);
assert.equal(firstContext.state, 'suspended');
assert.equal(secondContext.state, 'running', 'muting one window leaves the other running');
first.dispose();
assert.equal(firstContext.closes, 1);
assert.equal(secondContext.closes, 0, 'closing one window must not close another window’s audio');
second.play('rotate');
second.dispose();
assert.equal(secondContext.closes, 1);
console.log('PASS independent per-window mute and disposal');
