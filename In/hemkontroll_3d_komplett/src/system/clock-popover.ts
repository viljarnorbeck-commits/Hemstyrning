import './clock-popover.css';

type TimerState={phase:'running'|'paused'|'done';end:number;remaining:number;duration:number};
const storageKey='hem-clock-timer-v1';
const countdown=(ms:number)=>{const seconds=Math.max(0,Math.ceil(ms/1000)),hours=Math.floor(seconds/3600),minutes=Math.floor(seconds%3600/60);return(hours?String(hours).padStart(2,'0')+':':'')+String(minutes).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');};

/** A non-modal, locally persisted timer. No HA calls, page reload or dimmed backdrop. */
export class ClockPopover{
 private panel=document.createElement('div');private abort=new AbortController();private ticker:ReturnType<typeof setInterval>;
 private timer?:TimerState;private toggleWasOpen=false;private audio?:AudioContext;private validation='';
 constructor(private root:HTMLElement){
  this.panel.id='home-clock-popover';this.panel.className='home-clock-popover';this.panel.setAttribute('popover','auto');this.panel.setAttribute('role','dialog');this.panel.setAttribute('aria-label','Klocka och timer');this.panel.tabIndex=-1;
  this.panel.innerHTML=`<div class="clock-popover-heading"><span>KLOCKA</span><span class="clock-popover-date"></span></div><div class="clock-popover-time" role="timer" aria-live="off"><span data-clock-hours></span><span class="clock-live-seconds" data-clock-seconds></span></div><div class="clock-timer-heading"><span>TIMER</span><span data-clock-phase></span></div><div class="clock-presets" role="group" aria-label="Starta en färdig timer">${[5,10,15,20].map(minutes=>`<button type="button" data-clock-preset="${minutes}"><b>${minutes}</b><span>min</span></button>`).join('')}</div><form class="clock-custom-time" autocomplete="off"><label>Egen tid<span><input name="minutes" type="number" min="0" max="1439" step="1" value="10" inputmode="numeric" aria-label="Minuter" autocomplete="off"><small>min</small><input name="seconds" type="number" min="0" max="59" step="1" value="0" inputmode="numeric" aria-label="Sekunder" autocomplete="off"><small>sek</small></span></label><button type="submit">Starta</button></form><div class="clock-countdown" hidden><span data-clock-remaining role="timer" aria-live="off"></span><div class="clock-timer-progress"><i></i></div><div class="clock-timer-actions"><button type="button" data-clock-action="pause">Pausa</button><button type="button" data-clock-action="clear">Avbryt</button></div></div><p class="clock-timer-message" role="status" aria-live="polite"></p>`;
  document.body.append(this.panel);this.timer=this.read();const signal=this.abort.signal;
  root.addEventListener('pointerdown',e=>{this.toggleWasOpen=!!(e.target as Element).closest('[data-home-clock]')&&this.panel.matches(':popover-open');},{signal});
  root.addEventListener('click',e=>{const button=(e.target as Element).closest<HTMLElement>('[data-home-clock]');if(!button)return;e.preventDefault();e.stopPropagation();if(this.panel.matches(':popover-open')||this.toggleWasOpen){this.toggleWasOpen=false;this.close();return;}this.panel.showPopover();this.refresh();this.panel.focus({preventScroll:true});},{signal});
  this.panel.addEventListener('toggle',()=>this.refresh(),{signal});
  this.panel.addEventListener('click',e=>{
   const button=(e.target as Element).closest<HTMLButtonElement>('button');if(!button)return;
   if(button.dataset.clockPreset){this.start(Number(button.dataset.clockPreset)*60);return;}
   if(button.dataset.clockAction==='clear'){this.timer=undefined;this.save();this.refresh();}
   if(button.dataset.clockAction==='pause'&&this.timer){
    if(this.timer.phase==='running'){this.timer.remaining=Math.max(0,this.timer.end-Date.now());this.timer.phase='paused';}
    else if(this.timer.phase==='paused'){this.timer.end=Date.now()+this.timer.remaining;this.timer.phase='running';}
    this.save();this.refresh();
   }
  },{signal});
  this.panel.querySelector('form')!.addEventListener('submit',e=>{e.preventDefault();const form=e.currentTarget as HTMLFormElement,minutes=form.elements.namedItem('minutes')as HTMLInputElement,seconds=form.elements.namedItem('seconds')as HTMLInputElement;if(!form.reportValidity())return;this.start(Number(minutes.value)*60+Number(seconds.value));},{signal});
  window.addEventListener('resize',()=>this.refresh(),{signal});window.addEventListener('scroll',()=>this.refresh(),{capture:true,passive:true,signal});
  window.addEventListener('storage',e=>{if(e.key===storageKey){this.timer=this.read();this.refresh();}},{signal});
  document.addEventListener('hem-route-changed',()=>this.close(),{signal});document.addEventListener('visibilitychange',()=>this.refresh(),{signal});
  this.ticker=setInterval(()=>this.refresh(),250);this.refresh();
 }
 private read():TimerState|undefined{
  try{const t=JSON.parse(localStorage.getItem(storageKey)??'null');if(t&&['running','paused','done'].includes(t.phase)&&[t.end,t.remaining,t.duration].every(Number.isFinite)&&t.duration>0&&t.duration<=86400000&&t.remaining>=0&&t.remaining<=t.duration)return t;}catch{/* A local timer still works if storage is unavailable. */}
 }
 private save(){try{if(this.timer)localStorage.setItem(storageKey,JSON.stringify(this.timer));else localStorage.removeItem(storageKey);}catch{/* Keep the timer running in memory. */}}
 private start(seconds:number){
  if(!Number.isInteger(seconds)||seconds<=0||seconds>86400){this.validation='Välj en tid mellan 1 sekund och 24 timmar.';this.refresh();return;}
  this.validation='';
  this.timer={phase:'running',end:Date.now()+seconds*1000,remaining:seconds*1000,duration:seconds*1000};this.save();
  // Unlock a brief completion chime during the explicit Start/preset gesture.
  try{this.audio??=new AudioContext();void this.audio.resume().catch(()=>{});}catch{/* The visible completion signal remains available. */}
  this.refresh();
 }
 private chime(){
  if(this.audio?.state!=='running')return;
  const audio=this.audio;
  for(let i=0;i<3;i++){const oscillator=audio.createOscillator(),gain=audio.createGain(),at=audio.currentTime+i*.36;oscillator.type='sine';oscillator.frequency.value=i===1?880:660;gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.08,at+.025);gain.gain.exponentialRampToValueAtTime(.001,at+.26);oscillator.connect(gain);gain.connect(audio.destination);oscillator.start(at);oscillator.stop(at+.28);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};}
 }
 refresh(){
  const now=new Date();let remaining=this.timer?.phase==='running'?Math.max(0,this.timer.end-now.getTime()):this.timer?.remaining??0;
  if(this.timer?.phase==='running'&&remaining===0){this.timer.phase='done';this.timer.remaining=0;this.save();this.chime();}
  const button=this.root.querySelector<HTMLElement>('[data-home-clock]'),open=this.panel.matches(':popover-open');button?.setAttribute('aria-expanded',String(open));
  const badge=this.root.querySelector<HTMLElement>('[data-home-timer]');if(badge){if(badge.hidden!==!this.timer)badge.hidden=!this.timer;const text=this.timer?.phase==='done'?'Timer klar':this.timer?(this.timer.phase==='paused'?'Pausad · ':'')+countdown(remaining):'';if(badge.textContent!==text)badge.textContent=text;badge.classList.toggle('is-finished',this.timer?.phase==='done');}
  if(!open)return;
  if(!button?.isConnected||!button.getClientRects().length){this.close();return;}
  this.panel.querySelector('[data-clock-hours]')!.textContent=now.toLocaleTimeString('sv-SE',{hour:'2-digit',minute:'2-digit'});
  this.panel.querySelector('[data-clock-seconds]')!.textContent=':'+String(now.getSeconds()).padStart(2,'0');
  this.panel.querySelector('.clock-popover-date')!.textContent=now.toLocaleDateString('sv-SE',{weekday:'short',day:'numeric',month:'short'});
  this.panel.querySelector('[data-clock-phase]')!.textContent=this.timer?.phase==='running'?'Pågår':this.timer?.phase==='paused'?'Pausad':'';
  const countdownBox=this.panel.querySelector<HTMLElement>('.clock-countdown')!;countdownBox.hidden=!this.timer;
  this.panel.querySelector('[data-clock-remaining]')!.textContent=countdown(remaining);
  this.panel.querySelector<HTMLElement>('.clock-timer-progress i')!.style.width=(this.timer?100*remaining/this.timer.duration:0)+'%';
  const pause=this.panel.querySelector<HTMLButtonElement>('[data-clock-action=pause]')!;pause.hidden=!this.timer||this.timer.phase==='done';pause.textContent=this.timer?.phase==='paused'?'Återuppta':'Pausa';
  this.panel.querySelector('[data-clock-action=clear]')!.textContent=this.timer?.phase==='done'?'Klar':'Avbryt';
  const message=this.panel.querySelector('.clock-timer-message')!,text=this.validation||(this.timer?.phase==='done'?'Tiden är ute':'');if(message.textContent!==text)message.textContent=text;this.panel.classList.toggle('timer-finished',this.timer?.phase==='done');
  // Anchor the upper-left corner just below the existing clock text, keeping it visible.
  const rect=(button.querySelector('.time-slap-clock')??button).getBoundingClientRect(),width=Math.min(340,innerWidth-24);this.panel.style.width=width+'px';const height=this.panel.offsetHeight;
  const left=Math.max(12,Math.min(rect.left,innerWidth-width-12)),below=rect.bottom+6,top=below+height<=innerHeight-12?below:Math.max(12,rect.top-height-6);
  this.panel.style.left=left+'px';this.panel.style.top=top+'px';this.panel.style.transformOrigin=Math.max(10,Math.min(width-10,rect.left-left))+'px '+(top<rect.top?'bottom':'top');
 }
 close(){if(this.panel.matches(':popover-open'))this.panel.hidePopover();this.root.querySelector('[data-home-clock]')?.setAttribute('aria-expanded','false');}
 dispose(){clearInterval(this.ticker);this.abort.abort();this.close();this.panel.remove();void this.audio?.close();}
}
