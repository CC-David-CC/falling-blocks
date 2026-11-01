// App-local synthesized cues. No network, audio files or shared audio service.
export function createGameAudio({contextFactory}={}){
 let context=null,master=null,enabled=false,disposed=false,level=.35;
 const makeContext=contextFactory||(()=>new (globalThis.AudioContext||globalThis.webkitAudioContext)());
 function connect(){
  if(disposed)return false;
  if(!context){
   context=makeContext();
   master=context.createGain();
   master.gain.value=enabled?level:0;
   master.connect(context.destination);
  }
  return true;
 }
 function tone({frequency,endFrequency=frequency,duration=.08,type='sine',gain=.18,delay=0}){
  if(!enabled||disposed||!connect())return;
  const start=context.currentTime+delay,end=start+duration,oscillator=context.createOscillator(),envelope=context.createGain();
  oscillator.type=type;oscillator.frequency.setValueAtTime(frequency,start);
  if(endFrequency!==frequency)oscillator.frequency.exponentialRampToValueAtTime(Math.max(1,endFrequency),end);
  envelope.gain.setValueAtTime(.0001,start);envelope.gain.exponentialRampToValueAtTime(Math.max(.0001,gain),start+.008);envelope.gain.exponentialRampToValueAtTime(.0001,end);
  oscillator.connect(envelope);envelope.connect(master);oscillator.start(start);oscillator.stop(end+.01);
 }
 function play(name,{count=1}={}){
  if(!enabled||disposed)return;
  if(context?.state==='suspended')void context.resume();
  if(name==='left'||name==='right')tone({frequency:130,duration:.025,type:'square',gain:.035});
  else if(name==='soft')tone({frequency:100,endFrequency:80,duration:.03,type:'triangle',gain:.04});
  else if(name==='rotate')tone({frequency:250,endFrequency:360,duration:.055,type:'triangle',gain:.09});
  else if(name==='hold')tone({frequency:520,duration:.07,type:'sine',gain:.1});
  else if(name==='drop')tone({frequency:120,endFrequency:55,duration:.1,type:'sine',gain:.16});
  else if(name==='clear'){
   const notes=Math.min(4,Math.max(1,count));
   for(let i=0;i<notes;i++)tone({frequency:330*Math.pow(1.22,i),endFrequency:390*Math.pow(1.22,i),duration:.12,type:'triangle',gain:.13,delay:i*.035});
  }else if(name==='resume')tone({frequency:220,endFrequency:330,duration:.1,type:'sine',gain:.07});
  else if(name==='won'){[392,494,587,784].forEach((frequency,i)=>tone({frequency,duration:.2,type:'triangle',gain:.12,delay:i*.1}));}
  else if(name==='lost'){[275,220,165].forEach((frequency,i)=>tone({frequency,duration:.22,type:'sawtooth',gain:.07,delay:i*.12}));}
 }
 return {
  play,
  async enable(value){
   if(disposed)return;
   enabled=!!value;
   if(!enabled&&!context)return;
   if(!connect())return;
   master.gain.value=enabled?level:0;
   if(enabled)await context.resume();
   else if(context.state==='running')await context.suspend();
  },
  setVolume(value){
   if(disposed)return;
   const volume=Math.max(0,Math.min(1,Number(value)||0));
   level=volume;
   if(master)master.gain.value=enabled?volume:0;
   return volume;
  },
  async suspend(){
   if(context?.state==='running'&&!disposed)await context.suspend();
  },
  async resume(){
   if(enabled&&context?.state==='suspended'&&!disposed)await context.resume();
  },
  dispose(){
   if(disposed)return;
   disposed=true;enabled=false;
   if(master){try{master.disconnect()}catch{}master=null}
   if(context){const closing=context;context=null;try{void closing.close().catch(()=>{})}catch{}}
  }
 };
}
