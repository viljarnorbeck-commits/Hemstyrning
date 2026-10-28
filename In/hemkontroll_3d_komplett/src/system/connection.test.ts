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
  const fetchMock=vi.fn().mockResolvedValue({ok:true,json:async()=>({mode:'simulator'})});vi.stubGlobal('fetch',fetchMock);
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
