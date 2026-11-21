import {Rive,RuntimeLoader} from '@rive-app/canvas';
RuntimeLoader.setWasmUrl(new URL('./node_modules/@rive-app/canvas/rive.wasm',import.meta.url).href);
RuntimeLoader.setWasmFallbackUrl(new URL('./node_modules/@rive-app/canvas/rive_fallback.wasm',import.meta.url).href);
import {createGame,command,tick,cells,ghost,nextPieces,snapshot,restore,HIDDEN,WIDTH} from './model.mjs';
import {createGameAudio} from './audio.mjs';
import './style.css';

export function mount(host){
 const {make,textButton,appInput}=host.ui,{mirrorFileContext,signedInSubject}=host.storage,owner=signedInSubject(),windowState=host.w?.fallingBlocks??{dirty:false};if(host.w){host.w.fallingBlocks=windowState;host.w.ownerSub=owner;}
 const body=make('div','window-content blocks-app'),toolbar=make('div','blocks-toolbar'),stage=make('div','blocks-stage'),info=make('div','blocks-info'),controls=make('div','blocks-controls'),status=make('div','app-status'),coachWrap=make('div','blocks-coach'),coachCanvas=document.createElement('canvas'),coachNotice=make('span','blocks-coach-notice');
 coachCanvas.width=180;coachCanvas.height=180;coachCanvas.setAttribute('aria-hidden','true');coachWrap.append(coachCanvas,coachNotice);
 const motionMedia=matchMedia('(prefers-reduced-motion: reduce)'),motionMode=document.createElement('select');motionMode.setAttribute('aria-label','Coach motion');for(const [value,label] of [['system','Use device setting'],['reduce','Reduce motion'],['full','Full motion']]){const option=document.createElement('option');option.value=value;option.textContent=label;motionMode.append(option);}const reducedMotion=()=>motionMode.value==='reduce'||(motionMode.value==='system'&&motionMedia.matches);
 const filename=appInput('Game save path','/Falling Blocks.game.json'),mode=document.createElement('select');mode.setAttribute('aria-label','Mode for new game');for(const [v,label] of [['tutorial','Tutorial (2 lines)'],['endless','Endless'],['sprint','40-line sprint']]){const o=document.createElement('option');o.value=v;o.textContent=label;mode.append(o);}
 const audio=createGameAudio(),audioKey='falling-blocks-audio:'+owner;let audioPrefs={enabled:false,volume:.35};try{const saved=JSON.parse(localStorage.getItem(audioKey));if(saved&&typeof saved.enabled==='boolean'&&Number.isFinite(saved.volume))audioPrefs={enabled:saved.enabled,volume:Math.max(0,Math.min(1,saved.volume))};}catch{}
 audio.setVolume(audioPrefs.volume);
 const seed=()=>{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]||1;};let model=createGame({seed:seed()}),stageCanvas=null,ctx=null,animId=0,lastTime=performance.now(),resizeObserver=null,windowObserver=null,disposed=false,busy=false,version=null,savedPath=null,dirty=false,revision=0,accumulator=0,heldTimer=null,heldPointer=null,unwatch=()=>{},watchSerial=0,nextKey='',nextLabel='',coach=null,coachValues=null,lastCoachLines=0,lastCoachPhase='paused';
 const valid=()=>!disposed&&!host.signal.aborted&&body.isConnected&&owner===signedInSubject();
 const say=message=>{if(valid())status.textContent=message;};
 const stopHeld=()=>{if(heldTimer!==null)clearInterval(heldTimer);heldTimer=null;heldPointer=null;};
 const watch=(c,p)=>{unwatch();const serial=++watchSerial,check=async()=>{const expected=version;if(!valid()||!expected||savedPath!==p)return;try{const current=await c.files.read(p);if(valid()&&serial===watchSerial&&savedPath===p&&version===expected&&(current.status==='conflict'||current.version!==expected))say(current.status==='conflict'?'Save conflict: your game is on this device. Resolve the copies in Files.':'The saved game changed. Your current game is still open; save a copy or reopen it.');}catch(e){if(valid()&&serial===watchSerial&&savedPath===p&&version===expected)say('The saved game is unavailable. Your current game is still open.');}};unwatch=c.files.subscribe?.(check)||(()=>{});queueMicrotask(check);};
 const setDirty=value=>{dirty=value;windowState.dirty=value;};const mark=()=>{setDirty(true);revision++;};
 const syncCoach=()=>{if(!coachValues)return;const top=model.board.findIndex(row=>row.some(Boolean));const danger=top<0?0:Math.min(1,(24-top)/20),menu=model.phase==='won'||model.phase==='lost'?'result':model.phase;if(coachValues.danger.value!==danger)coachValues.danger.value=danger;if(coachValues.combo.value!==model.combo)coachValues.combo.value=model.combo;if(coachValues.motion.value!==reducedMotion())coachValues.motion.value=reducedMotion();if(coachValues.menu.value!==menu)coachValues.menu.value=menu;if(!reducedMotion()&&model.lines>lastCoachLines)coachValues.celebrate.trigger();if(!reducedMotion()&&model.phase==='lost'&&lastCoachPhase!=='lost')coachValues.topOut.trigger();lastCoachLines=model.lines;lastCoachPhase=model.phase;};
 const show=()=>{syncCoach();const key=model.rng+':'+model.bag.join(',');if(key!==nextKey){nextKey=key;nextLabel=nextPieces(model).join(' ');}const phase=model.phase==='won'?(model.mode==='tutorial'?'Tutorial complete! Choose New game to keep playing.':'You cleared 40 lines! Choose New game to play again.'):model.phase==='lost'?'Game over. Choose New game to try again.':model.phase==='playing'?'Playing':'Paused',progress=model.mode==='tutorial'?'Tutorial: '+Math.min(2,model.lines)+'/2 lines':model.mode==='sprint'?'Sprint: '+model.lines+'/40 lines':'Lines: '+model.lines;const text=`${progress} · Score: ${model.score} · Hold: ${model.held||'—'} · Next: ${nextLabel} · ${phase}`;if(info.textContent!==text)info.textContent=text;pause.disabled=model.phase==='won'||model.phase==='lost';pause.textContent=model.phase==='playing'?'Pause':'Resume';pause.setAttribute('aria-label',pause.textContent);};
 const act=action=>{if(!valid())return;const was=model.phase,lines=model.lines;command(model,action);if(action!=='pause'&&action!=='resume'&&was==='playing')mark();if(action==='resume'&&audioPrefs.enabled){void audio.enable(true).then(()=>audio.play('resume')).catch(()=>say('Sound is unavailable in this browser.'));}else if(model.phase==='lost'&&was!=='lost')audio.play('lost');else if(model.phase==='won'&&was!=='won')audio.play('won');else if(model.lines>lines)audio.play('clear',{count:model.lines-lines});else if(['left','right','soft','rotate-cw','rotate-ccw','hard','hold'].includes(action))audio.play(action==='rotate-cw'||action==='rotate-ccw'?'rotate':action==='hard'?'drop':action);show();};
 const pause=textButton('Resume',()=>{accumulator=0;stopHeld();act(model.phase==='playing'?'pause':'resume');});
 let newGameBusy=false;const newGame=textButton('New game',async()=>{if(newGameBusy||!valid())return;newGameBusy=true;try{if(dirty){stopHeld();command(model,'pause');accumulator=0;show();const before=revision,previous=model,selectedMode=mode.value;if(!await host.ui.confirm('Start a new game and discard unsaved progress?',{title:'Unsaved progress',confirmLabel:'Start new game',cancelLabel:'Keep game',danger:true,signal:host.signal})){say('Game paused. Press Resume when ready.');return;}if(!valid())return;if(before!==revision||previous!==model||mode.value!==selectedMode){say('Game or mode changed while confirming. Try again.');return;}}stopHeld();model=createGame({seed:seed(),mode:mode.value});lastCoachLines=0;lastCoachPhase='paused';unwatch();watchSerial++;version=null;savedPath=null;if(host.w)delete host.w.launchContext;setDirty(false);revision++;accumulator=0;show();say('New game ready. Press Resume to play.');}catch(e){say('Could not start a new game: '+e.message);}finally{newGameBusy=false;}});
 async function save(){if(busy||!valid())return;busy=true;try{stopHeld();command(model,'pause');accumulator=0;show();const captured=revision,capturedModel=model,requestedName=filename.value,priorPath=savedPath,priorVersion=version,data=new TextEncoder().encode(JSON.stringify(snapshot(model))),c=await mirrorFileContext(),p=c.path(requestedName);if(!p.endsWith('.game.json'))throw Error('Save name must end in .game.json');let expected=p===priorPath?priorVersion:null;if(expected){const existing=await c.files.read(p);if(existing.status==='conflict')throw Error('Resolve the conflict in Files first.');if(existing.version!==expected)throw Error('The saved game changed. Save a copy or reopen it.');}if(!expected){try{const existing=await c.files.read(p);if(existing.status==='conflict')throw Error('Resolve the conflict in Files first.');if(!await host.ui.confirm('Replace '+p+'?',{title:'Replace saved game',confirmLabel:'Replace',cancelLabel:'Cancel',danger:true,signal:host.signal})){say('Save cancelled.');return;}expected=existing.version;}catch(e){if(e.message!=='File not found.')throw e;}}if(!valid()||!c.valid())return;const result=await c.files.write(p,data,expected);if(!valid()||!c.valid())return;if(model!==capturedModel){say('Previous game saved to '+p+'; the current game is separate.');return;}savedPath=p;if(filename.value===requestedName)filename.value=p;version=result.version;setDirty(result.status==='conflict'||revision!==captured);if(host.w){host.w.launchContext=Object.freeze({version:1,storage:'mirror',path:p,owner});host.w.title=p.split('/').pop()+' — Falling Blocks';}say(result.status==='conflict'?'Game saved on this device, but it has conflicting copies. Resolve them in Files.':dirty?'Saved earlier progress to '+p+'; newer changes remain unsaved.':'Saved on this device to '+p+'; syncing with server.');watch(c,p);}catch(e){say('Could not save: '+e.message);}finally{busy=false;}}
 async function open(selected,initialLoad=false){if(busy||!valid())return;busy=true;stopHeld();command(model,'pause');accumulator=0;show();const startingRevision=revision,startingModel=model;let opened=false;try{if(dirty&&!await host.ui.confirm('Discard unsaved progress and open a saved game?',{title:'Unsaved progress',confirmLabel:'Discard progress',cancelLabel:'Keep game',danger:true,signal:host.signal})){say('Game paused. Press Resume when ready.');return;}if(!valid())return;if(revision!==startingRevision||model!==startingModel)throw Error('The current game changed while confirming; try again.');const choice=selected||await host.storage.pickFile({extensions:['.json'],signal:host.signal});if(!choice)return;const c=await mirrorFileContext(),p=c.path(choice),file=await c.files.read(p);if(file.status==='conflict')throw Error('Resolve the conflict in Files first.');if(file.data.byteLength>1024*1024)throw Error('Save file is too large.');const replacement=restore(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(file.data)));if(!valid()||!c.valid())return;if(revision!==startingRevision)throw Error('The current game changed while opening; try again.');stopHeld();model=replacement;lastCoachLines=model.lines;lastCoachPhase=model.phase;mode.value=model.mode;filename.value=p;savedPath=p;version=file.version;if(host.w){host.w.launchContext=Object.freeze({version:1,storage:'mirror',path:p,owner});host.w.title=p.split('/').pop()+' — Falling Blocks';}setDirty(false);revision++;accumulator=0;show();say('Game loaded and paused. Press Resume to play.');watch(c,p);opened=true;}catch(e){say('Could not open game: '+e.message);}finally{if(initialLoad&&!opened&&valid()&&host.w?.launchContext?.path===selected){delete host.w.launchContext;host.w.title='Falling Blocks';filename.value='/Falling Blocks.game.json';}busy=false;}}
 const folder=textButton('Choose folder',async()=>{try{const dir=await host.storage.pickFolder({signal:host.signal});if(dir===null||!valid())return;const c=await mirrorFileContext();if(!valid()||!c.valid())return;filename.value=c.path((dir==='/'?'':dir)+'/'+c.name(filename.value.split('/').pop()||'Falling Blocks.game.json'));}catch(e){say('Could not choose folder: '+e.message);}});
 const modeLabel=make('label','blocks-mode-label','Mode for new game ');modeLabel.append(mode);toolbar.append(modeLabel,newGame,pause,textButton('Open',()=>open()),textButton('Save',save));const saveLocation=document.createElement('details'),saveSummary=make('summary','','Save location'),saveFields=make('div','blocks-save-fields');saveLocation.className='blocks-save-location';saveFields.append(filename,folder);saveLocation.append(saveSummary,saveFields);
 const repeat=(label,action)=>{const b=textButton(label,()=>{});b.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();stopHeld();b.setPointerCapture(e.pointerId);heldPointer=e.pointerId;act(action);heldTimer=setInterval(()=>act(action),120);});for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,e=>{if(e.pointerId===heldPointer)stopHeld();});b.addEventListener('click',e=>{if(e.detail===0)act(action);});return b;};
 controls.append(repeat('◀ Left','left'),textButton('Rotate ↶',()=>act('rotate-ccw')),textButton('Rotate ↷',()=>act('rotate-cw')),repeat('Right ▶','right'),repeat('↓ Soft drop','soft'),textButton('Drop',()=>act('hard')),textButton('Hold',()=>act('hold')));
 stage.tabIndex=0;stage.addEventListener('pointerdown',()=>stage.focus({preventScroll:true}));stage.setAttribute('aria-label','Falling Blocks play area. Arrow keys move, up or Z rotates, space drops, C holds, Escape pauses.');stage.addEventListener('keydown',e=>{const actions={ArrowLeft:'left',ArrowRight:'right',ArrowDown:'soft',ArrowUp:'rotate-cw',z:'rotate-ccw',Z:'rotate-ccw',' ':'hard',c:'hold',C:'hold',Escape:'pause'};const action=actions[e.key];if(!action||e.repeat&&['hard','hold','rotate-cw','rotate-ccw','pause'].includes(action))return;e.preventDefault();act(action);});
 const suspend=()=>{stopHeld();accumulator=0;void audio.suspend();if(model.phase==='playing'){command(model,'pause');show();say('Game paused. Press Resume when ready.');}};const visibility=()=>{if(document.hidden){suspend();coach?.pause();}else if(!body.closest('.window')?.hidden&&!body.closest('.window')?.classList.contains('rolled')&&(!body.closest('.window')||body.closest('.window').classList.contains('focused')))coach?.play();};window.addEventListener('blur',suspend);document.addEventListener('visibilitychange',visibility);
 const settings=document.createElement('details'),settingsSummary=make('summary','','Settings'),contrastLabel=make('label','','Contrast '),contrast=document.createElement('select');contrast.setAttribute('aria-label','Board contrast');for(const [value,label] of [['standard','Standard'],['high','High contrast']]){const option=document.createElement('option');option.value=value;option.textContent=label;contrast.append(option);}contrastLabel.append(contrast);const motionLabel=make('label','','Coach motion ');motionLabel.append(motionMode);const soundLabel=make('label','blocks-audio-control','Sound effects '),soundToggle=document.createElement('input'),volumeLabel=make('label','blocks-audio-control','Volume '),volume=document.createElement('input');soundToggle.type='checkbox';soundToggle.setAttribute('aria-label','Sound effects');soundToggle.checked=audioPrefs.enabled;volume.type='range';volume.min='0';volume.max='100';volume.step='5';volume.value=String(Math.round(audioPrefs.volume*100));volume.setAttribute('aria-label','Sound volume');volume.disabled=!soundToggle.checked;soundLabel.prepend(soundToggle);volumeLabel.append(volume);const audioNotice=make('span','blocks-audio-notice','');audioNotice.setAttribute('role','status');const saveAudioPrefs=()=>{audioPrefs={enabled:soundToggle.checked,volume:Number(volume.value)/100};audio.setVolume(audioPrefs.volume);try{localStorage.setItem(audioKey,JSON.stringify(audioPrefs))}catch{}};soundToggle.addEventListener('change',async()=>{saveAudioPrefs();volume.disabled=!soundToggle.checked;audioNotice.textContent='';try{await audio.enable(soundToggle.checked);if(soundToggle.checked)audio.play('resume');}catch{soundToggle.checked=false;saveAudioPrefs();volume.disabled=true;audioNotice.textContent='Sound unavailable in this browser.';}});volume.addEventListener('input',()=>{saveAudioPrefs();audio.play('rotate');});settings.className='blocks-settings';settings.append(settingsSummary,contrastLabel,motionLabel,soundLabel,volumeLabel,audioNotice);motionMode.addEventListener('change',syncCoach);motionMedia.addEventListener('change',syncCoach);const help=document.createElement('details'),summary=make('summary','','How to play'),instructions=make('p','','Fill a whole row to clear it. Move and rotate pieces to fit; Drop places a piece immediately. Hold saves one piece for later. The faint outline shows where your piece will land. Choose a mode and select New game to switch modes. Sound effects are off by default and can be enabled under Settings. Save and Open use My files. On a keyboard, focus the board: arrows move, Up or Z rotates, Space drops, C holds, and Escape pauses.');help.className='blocks-help';help.append(summary,instructions);const playArea=make('div','blocks-play-area');playArea.append(stage,coachWrap);body.append(toolbar,info,playArea,controls,help,settings,saveLocation,status);show();status.textContent='Press Resume to play. Choose a mode and New game to switch modes.';

 const colors={I:'#4dd7e8',O:'#f0ce50',T:'#b68aef',S:'#7cda8d',Z:'#f17b82',J:'#739be9',L:'#f4a564'};
 stageCanvas=document.createElement('canvas');stageCanvas.className='blocks-canvas';stageCanvas.setAttribute('role','img');stageCanvas.setAttribute('aria-label','Falling polyomino playfield');stage.append(stageCanvas);ctx=stageCanvas.getContext('2d');

 const renderPlayfield=()=>{
  if(disposed||!ctx)return;
  const rect=stage.getBoundingClientRect();
  const w=Math.max(180,rect.width||300);
  const h=Math.max(260,rect.height||600);
  const dpr=Math.min(window.devicePixelRatio||1,4);
  const targetW=Math.round(w*dpr);
  const targetH=Math.round(h*dpr);
  if(stageCanvas.width!==targetW||stageCanvas.height!==targetH){stageCanvas.width=targetW;stageCanvas.height=targetH;}
  stageCanvas.style.width=`${w}px`;stageCanvas.style.height=`${h}px`;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,w,h);

  const visibleRows=model.board.length-HIDDEN;
  const cellW=Math.floor((w-16)/WIDTH);
  const cellH=Math.floor((h-16)/visibleRows);
  const cellSize=Math.max(8,Math.min(cellW,cellH));
  const boardW=cellSize*WIDTH;
  const boardH=cellSize*visibleRows;
  const offsetX=Math.floor((w-boardW)/2);
  const offsetY=Math.floor((h-boardH)/2);

  ctx.fillStyle='#111c2d';
  ctx.fillRect(offsetX,offsetY,boardW,boardH);

  ctx.strokeStyle='#1b2a41';
  ctx.lineWidth=1;
  for(let c=0;c<=WIDTH;c++){ctx.beginPath();ctx.moveTo(offsetX+c*cellSize,offsetY);ctx.lineTo(offsetX+c*cellSize,offsetY+boardH);ctx.stroke();}
  for(let r=0;r<=visibleRows;r++){ctx.beginPath();ctx.moveTo(offsetX,offsetY+r*cellSize);ctx.lineTo(offsetX+boardW,offsetY+r*cellSize);ctx.stroke();}

  ctx.strokeStyle=contrast.value==='high'?'#ffffff':'#324a6e';
  ctx.lineWidth=2;
  ctx.strokeRect(offsetX,offsetY,boardW,boardH);

  const block=(x,y,colorHex,alpha=1)=>{
   if(y<HIDDEN)return;
   const bx=offsetX+x*cellSize,by=offsetY+(y-HIDDEN)*cellSize;
   const inset=Math.max(1,Math.floor(cellSize*0.06));
   const bw=cellSize-inset*2,bh=cellSize-inset*2;
   ctx.globalAlpha=alpha;
   ctx.fillStyle=colorHex;
   ctx.fillRect(bx+inset,by+inset,bw,bh);
   if(alpha>=0.8&&bw>6){
    ctx.fillStyle='rgba(255,255,255,0.35)';
    ctx.fillRect(bx+inset,by+inset,bw,Math.max(1,Math.floor(cellSize*0.12)));
    ctx.fillRect(bx+inset,by+inset,Math.max(1,Math.floor(cellSize*0.12)),bh);
    ctx.fillStyle='rgba(0,0,0,0.35)';
    ctx.fillRect(bx+inset,by+inset+bh-Math.max(1,Math.floor(cellSize*0.12)),bw,Math.max(1,Math.floor(cellSize*0.12)));
    ctx.fillRect(bx+inset+bw-Math.max(1,Math.floor(cellSize*0.12)),by+inset,Math.max(1,Math.floor(cellSize*0.12)),bh);
   }
   if(contrast.value==='high'){
    ctx.strokeStyle='#ffffff';
    ctx.lineWidth=Math.max(1,Math.floor(cellSize*0.08));
    ctx.strokeRect(bx+inset,by+inset,bw,bh);
   }
   ctx.globalAlpha=1.0;
  };

  for(let y=HIDDEN;y<model.board.length;y++)for(let x=0;x<WIDTH;x++)if(model.board[y][x])block(x,y,colors[model.board[y][x]]);
  if(model.phase!=='lost'&&model.phase!=='won'){
   for(const [x,y] of ghost(model))block(x,y,colors[model.active.type],0.28);
   for(const [x,y] of cells(model.active))block(x,y,colors[model.active.type]);
  }
 };

 const frameLoop=(time)=>{
  if(disposed)return;
  const delta=Math.min(time-lastTime,100);
  lastTime=time;
  if(model.phase==='playing'){
   accumulator+=delta;
   while(accumulator>=1000/60){tick(model);accumulator-=1000/60;mark();}
   show();
  }else{accumulator=0;}
  renderPlayfield();
  if(!disposed)animId=requestAnimationFrame(frameLoop);
 };
 animId=requestAnimationFrame(frameLoop);

 queueMicrotask(()=>{
  if(!valid())return;
  coach=new Rive({src:new URL('./coach/build/coach.riv',import.meta.url).href,canvas:coachCanvas,artboard:'Main',stateMachines:'Presentation',autoBind:true,autoplay:true,enableRiveAssetCDN:false,shouldDisableRiveListeners:true,shouldDisableGamepad:true,onLoad(){if(!valid())return;const vm=coach?.viewModelInstance;const danger=vm?.number('danger'),combo=vm?.number('combo'),menu=vm?.enum('menuState'),motion=vm?.boolean('reducedMotion'),celebrate=vm?.trigger('celebrate'),topOut=vm?.trigger('topOut');if(!danger||!combo||!menu||!motion||!celebrate||!topOut){coachNotice.textContent='Coach unavailable';return;}coachValues={danger,combo,menu,motion,celebrate,topOut};syncCoach();},onLoadError(){if(valid())coachNotice.textContent='Coach unavailable';}});
  const win=body.closest('.window');
  if(win){
   windowObserver=new MutationObserver(()=>{if(win.hidden||win.classList.contains('rolled')||!win.classList.contains('focused')){suspend();coach?.pause();}else if(!document.hidden)coach?.play();});
   windowObserver.observe(win,{attributes:true,attributeFilter:['hidden','class']});
   if(win.hidden||win.classList.contains('rolled')||!win.classList.contains('focused'))suspend();
  }
  resizeObserver=new ResizeObserver(()=>{if(!disposed)renderPlayfield();});
  resizeObserver.observe(stage);
 });
 if(host.w?.launchContext?.storage==='mirror'&&host.w.launchContext.owner===owner)queueMicrotask(()=>{const initial=host.w?.launchContext;if(initial?.storage==='mirror'&&initial.owner===owner)void open(initial.path,true);});
 return {element:body,dispose(){if(disposed)return;disposed=true;stopHeld();watchSerial++;unwatch();if(animId){cancelAnimationFrame(animId);animId=0;}resizeObserver?.disconnect();windowObserver?.disconnect();motionMedia.removeEventListener('change',syncCoach);coachValues=null;coach?.cleanup();coach=null;audio.dispose();window.removeEventListener('blur',suspend);document.removeEventListener('visibilitychange',visibility);stageCanvas=null;ctx=null;}};
}
