import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Connection } from './connection';
class Socket extends EventTarget {
  static instances: Socket[]=[];
  send=vi.fn();
  onmessage: ((event:{data:string})=>void)|null=null;
  onclose:(()=>void)|null=null;
  onerror:(()=>void)|null=null;
  constructor(public url:string){super();Socket.instances.push(this);}
  emit(value:unknown){this.onmessage?.({data:JSON.stringify(value)});}
  close(){this.onclose?.();}
}
beforeEach(()=>{Socket.instances=[];vi.stubGlobal('WebSocket',Socket);vi.stubGlobal('location',{protocol:'http:',host:'localhost:5173'});});
afterEach(()=>vi.unstubAllGlobals());
const state=(value:string)=>({entity_id:'light.test',state:value,attributes:{brightness:200},last_updated:new Date().toISOString()});
async function connected() {
  const fetchMock=vi.fn().mockResolvedValue({ok:true,json:async()=>({mode:'simulator',commandsEnabled:true,controlBlockReason:null})});vi.stubGlobal('fetch',fetchMock);
  const connection=new Connection();await connection.start();const socket=Socket.instances[0];
  socket.emit({type:'auth_ok'});socket.emit({type:'result',id:1,success:true});socket.emit({type:'result',id:2,success:true,result:[state('off')]});
  return {connection,socket,fetchMock};
}
describe('shared HA connection',()=>{
  it('subscribes before snapshot and waits for state confirmation, not REST acceptance',async()=>{
    const {connection,socket,fetchMock}=await connected();
    expect(JSON.parse(socket.send.mock.calls[0][0]).type).toBe('subscribe_events');
    expect(JSON.parse(socket.send.mock.calls[1][0]).type).toBe('get_states');
    let done=false;const command=connection.toggle('light.test','live').then(()=>done=true);
    await Promise.resolve();expect(done).toBe(false);expect(connection.states.get('light.test')!.state).toBe('off');
    socket.emit({type:'event',event:{event_type:'state_changed',data:{new_state:state('on')}}});
    await command;expect(done).toBe(true);
    expect(fetchMock).toHaveBeenLastCalledWith('/connection-api/services/light/turn_on',expect.objectContaining({headers:expect.objectContaining({'X-Hemkontroll-Mode':'live'})}));connection.stop();
  });
  it('blocks simulation before fetch and invalidates state control while offline',async()=>{
    const {connection,fetchMock}=await connected();fetchMock.mockClear();
    await expect(connection.toggle('light.test','simulation')).rejects.toThrow('inga styrkommandon');expect(fetchMock).not.toHaveBeenCalled();
    connection.stop();await expect(connection.toggle('light.test','live')).rejects.toThrow('saknar bekräftat');
  });
  it('reports command timeout without inventing a state change',async()=>{
    const {connection}=await connected();vi.useFakeTimers();
    const command=connection.toggle('light.test','live');const failed=expect(command).rejects.toThrow('Ingen statebekräftelse');
    await vi.advanceTimersByTimeAsync(10001);await failed;expect(connection.states.get('light.test')!.state).toBe('off');connection.stop();vi.useRealTimers();
  });
});

it('waits for all configured lights and media state instead of assuming HTTP acceptance',async()=>{
 const {connection,socket}=await connected();let finished=false;
 const all=connection.allLights(true,['light.test']).then(()=>finished=true);await Promise.resolve();expect(finished).toBe(false);
 socket.emit({type:'event',event:{event_type:'state_changed',data:{new_state:state('on')}}});await all;
 const media={entity_id:'media_player.test',state:'paused',attributes:{media_title:'Låt A'},last_updated:new Date().toISOString()};connection.states.set(media.entity_id,media);finished=false;
 const play=connection.media(media.entity_id,'media_play').then(()=>finished=true);await Promise.resolve();expect(finished).toBe(false);
 socket.emit({type:'event',event:{event_type:'state_changed',data:{new_state:{...media,state:'playing'}}}});await play;expect(finished).toBe(true);connection.stop();
});

it('blocks all control paths locally when the real bridge is read-only',async()=>{
 const {connection,fetchMock}=await connected();connection.commandsEnabled=false;fetchMock.mockClear();
 await expect(connection.toggle('light.test','live')).rejects.toThrow('skrivskyddad');
 await expect(connection.media('media_player.test','media_play')).rejects.toThrow('skrivskyddad');
 await expect(connection.allLights(true,['light.test'])).rejects.toThrow('skrivskyddad');expect(fetchMock).not.toHaveBeenCalled();connection.stop();
});

it('keeps commands disabled unless the server explicitly grants control',async()=>{
 const fetchMock=vi.fn().mockResolvedValue({ok:true,json:async()=>({mode:'home-assistant'})});vi.stubGlobal('fetch',fetchMock);
 const c=new Connection();await c.start();const ws=Socket.instances[0];ws.emit({type:'auth_ok'});ws.emit({type:'result',id:1,success:true});ws.emit({type:'result',id:2,success:true,result:[state('off')]});
 expect(c.commandsEnabled).toBe(false);fetchMock.mockClear();await expect(c.toggle('light.test','live')).rejects.toThrow('skrivskyddad');expect(fetchMock).not.toHaveBeenCalled();c.stop();
});
