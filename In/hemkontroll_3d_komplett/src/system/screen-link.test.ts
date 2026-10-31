import {it,expect,vi,afterEach} from 'vitest';import {ScreenLink} from './screen-link';
class Socket {static OPEN=1;static last:Socket;readyState=1;sent:any[]=[];onopen?:()=>void;onmessage?:(event:{data:string})=>void;onclose?:()=>void;onerror?:()=>void;constructor(){Socket.last=this;}send(s:string){this.sent.push(JSON.parse(s));}close(){this.readyState=3;this.onclose?.();}receive(m:unknown){this.onmessage?.({data:JSON.stringify(m)});}}
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();});
it('rejects stale and foreign epochs until a new authenticated ready snapshot, throttles activity and disposes timers',()=>{
 vi.useFakeTimers();vi.setSystemTime(100000);vi.stubGlobal('location',{protocol:'http:',host:'localhost'});vi.stubGlobal('WebSocket',Socket);
 const link=new ScreenLink('display','Test');link.start();const ws=Socket.last;ws.onopen?.();const state={mode:'HOME',epoch:'a',version:5,expiresAt:null,reason:'command'};
 ws.receive({type:'ready',canControl:true,state});ws.receive({type:'ViewState',state:{...state,version:4,mode:'FREE_3D'}});expect(link.state?.mode).toBe('HOME');ws.receive({type:'ViewState',state:{...state,epoch:'old',version:99,mode:'FREE_3D'}});expect(link.state?.epoch).toBe('a');
 link.activity();link.activity();expect(ws.sent.filter(m=>m.type==='activity')).toHaveLength(1);vi.advanceTimersByTime(1000);link.activity();expect(ws.sent.filter(m=>m.type==='activity')).toHaveLength(2);
 ws.close();vi.advanceTimersByTime(1500);const reconnected=Socket.last;reconnected.receive({type:'ready',canControl:true,state:{...state,epoch:'b',version:0}});expect(link.state?.epoch).toBe('b');link.stop();expect(vi.getTimerCount()).toBe(0);
});
it('viewer may follow but cannot emit shared commands or activity',()=>{
 vi.useFakeTimers();vi.stubGlobal('location',{protocol:'http:',host:'localhost'});vi.stubGlobal('WebSocket',Socket);const link=new ScreenLink('display','Läsare');link.start();const ws=Socket.last;ws.receive({type:'ready',canControl:false,state:{mode:'HOME',epoch:'a',version:0,expiresAt:null,reason:'command'}});expect(()=>link.send('ShowOverview')).toThrow('Läsbehörighet');link.activity();expect(ws.sent).toHaveLength(0);link.stop();
});
