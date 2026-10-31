import type {ViewState,ViewerView} from '../../../../shared/view-protocol.js';
export type CameraCommand='SelectObject'|'FocusObject'|'FollowObject'|'ShowOverview'|'EnterFree3D'|'CancelFollow';
export class ScreenLink extends EventTarget {
 private socket?:WebSocket;private retry?:ReturnType<typeof setTimeout>;private heartbeat?:ReturnType<typeof setInterval>;private stopped=false;private lastPong=0;private lastActivity=0;
 connected=false;canControl=false;error='';state?:ViewState;viewer:ViewerView|null=null;
 constructor(private kind:'display'|'control',public name:string){super();}
 private emit(m:unknown){this.dispatchEvent(new CustomEvent('message',{detail:m}));}
 start(){
  this.stopped=false;clearTimeout(this.retry);this.socket?.close();
  const ws=this.socket=new WebSocket(`${location.protocol==='https:'?'wss:':'ws:'}//${location.host}/screen-ws`);
  ws.onopen=()=>{this.lastPong=Date.now();ws.send(JSON.stringify({type:'hello',kind:this.kind}));};
  ws.onmessage=e=>{
   if(ws!==this.socket)return;let m;try{m=JSON.parse(e.data);}catch{ws.close();return;}this.lastPong=Date.now();
   if(m.type==='ready'){this.connected=true;this.canControl=m.canControl===true;this.error='';this.state=undefined;if(this.viewer)this.write({type:'viewer',...this.viewer});this.accept(m.state);}
   if(m.type==='ViewState')this.accept(m.state);
   if(m.type==='ViewerState'){this.viewer=m.view;if(m.state)this.accept(m.state);this.emit(m);}
   if(m.type==='error'){this.error=m.message;this.emit(m);}
   if(m.type==='ConfigUpdated')this.emit(m);
   if(m.type==='ready')this.emit(m);
  };
  ws.onclose=()=>{if(ws!==this.socket)return;this.connected=false;clearInterval(this.heartbeat);this.emit({type:'offline'});if(!this.stopped)this.retry=setTimeout(()=>this.start(),1500);};ws.onerror=()=>ws.close();
  clearInterval(this.heartbeat);this.heartbeat=setInterval(()=>{if(ws.readyState===WebSocket.OPEN){if(Date.now()-this.lastPong>35000)ws.close();else this.write({type:'ping'});}},15000);
 }
 private accept(state:ViewState){if(!state||typeof state.version!=='number'||typeof state.epoch!=='string')return;if(this.state&&(state.epoch!==this.state.epoch||state.version<=this.state.version))return;this.state=state;this.emit({type:'ViewState',state});}
 private write(m:unknown){if(this.socket?.readyState===WebSocket.OPEN)this.socket.send(JSON.stringify(m));}
 send(type:CameraCommand,objectId?:string){if(!this.connected)throw Error('Gemensam visning återansluter');if(!this.canControl)throw Error('Läsbehörighet: gemensam visning kan inte styras');this.error='';const mode=type==='FocusObject'||type==='SelectObject'?'FOCUS_OBJECT':type==='FollowObject'?'FOLLOW_OBJECT':type==='EnterFree3D'?'FREE_3D':'HOME';this.write({type:'view',mode,...(objectId?{objectId}:{})});}
 activity(){if(!this.connected||!this.canControl||this.viewer||Date.now()-this.lastActivity<1000)return;this.lastActivity=Date.now();this.write({type:'activity'});}
 openViewer(view:ViewerView){if(!this.connected)throw Error('Gemensam visning återansluter');this.write({type:'viewer',...view});}
 leaveViewer(){this.viewer=null;this.write({type:'leaveViewer'});this.emit({type:'ViewerState',view:null,state:this.state});}
 stop(){this.stopped=true;clearTimeout(this.retry);clearInterval(this.heartbeat);this.socket?.close();this.connected=false;}
}
