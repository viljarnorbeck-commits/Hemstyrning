import http from "node:http";
import { calendarEvents } from "./calendar.js";
import { Simulation, scenarios } from "./simulation.js";
import { resolve } from "node:path";
import { workspaceApi } from "./workspace-api.js";
import { bridgeApi, connectLiveSocket, type LiveTarget } from "./bridge.js";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { WebSocket, WebSocketServer } from "ws";
import { createInitialStates } from "./fixtures.js";
import { callService, ServiceError } from "./services.js";
import { StateStore } from "./store.js";
import type { ServiceCall, StateChangedEvent } from "./types.js";

export interface SimulatorOptions {
  token: string;
  commandDelayMs?: number;
  dataDirectory?: string;
  live?: LiveTarget;
}

interface ClientSession {
  authenticated: boolean;
  subscriptions: Set<number>;
}

function asObject(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
}

export function createSimulator(options: SimulatorOptions) {
  const delayMs = options.commandDelayMs ?? 250;
  const store = new StateStore(createInitialStates());
  const simulation = new Simulation(store);
  const app = express();
  app.use(cors());
  const workspace = workspaceApi(options.dataDirectory ?? resolve(import.meta.dirname, '../../../data'));
  app.use('/workspace-api', workspace.router);
  app.use(express.json());
  app.use('/bridge/api', bridgeApi(store, workspace.load, delayMs, options.live));
  const dev = express.Router();
  dev.use((req,res,next)=>{ if(req.headers.origin && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(req.headers.origin)){res.sendStatus(403);return;}next(); });
  dev.get('/info',(_req,res)=>res.json({mode:'simulator'}));
  dev.get('/settings',(_req,res)=>res.json({settings:simulation.settings,scenario:simulation.scenario,scenarios}));
  dev.put('/settings',(req,res)=>{try{simulation.configure(req.body);res.json({saved:true});}catch{res.status(400).json({message:'Ogiltiga simulatorinställningar'});}});
  dev.post('/scenario',(req,res)=>{try{simulation.runScenario(String(req.body.id));res.json({started:true});}catch{res.status(400).json({message:'Okänt scenario'});}});
  dev.post('/step',(req,res)=>{const seconds=Number(req.body.seconds);if(!Number.isFinite(seconds)||seconds<0||seconds>3600){res.sendStatus(400);return;}simulation.tick(seconds);res.json({stepped:true});});
  dev.get('/states',(_req,res)=>res.json(store.all()));
  dev.post('/states/:entityId',(req,res)=>{if(typeof req.body.state!=='string'){res.sendStatus(400);return;}simulation.override(req.params.entityId,req.body);res.json(store.get(req.params.entityId));});
  dev.delete('/states/:entityId',(req,res)=>{simulation.override(req.params.entityId,null);res.sendStatus(204);});
  dev.post('/services/:domain/:service',async(req,res)=>{const response=await callService(store,{domain:req.params.domain,service:req.params.service,serviceData:req.body},delayMs);res.json(response??{accepted:true});});
  dev.get('/calendars/:id',(req,res)=>{try{res.json(calendarEvents(store,req.params.id,String(req.query.start),String(req.query.end)));}catch(error){res.status(400).json({message:error instanceof Error?error.message:'Kalenderfel'});}});
  dev.get('/history',(req,res)=>res.json(store.history(String(req.query.entity_id??'').split(','))));
  app.use('/dev-api',dev);

  const authenticate = (req: Request, res: Response, next: NextFunction) => {
    if (req.header("authorization") !== `Bearer ${options.token}`) {
      res.status(401).json({ message: "Invalid access token" });
      return;
    }
    next();
  };

  app.get("/health", (_req, res) => res.json({ status: "ok", mode: "simulation" }));
  app.use("/api", authenticate);
  app.get("/api/", (_req, res) => res.json({ message: "API running." }));
  app.get("/api/config", (_req, res) => res.json({
    latitude: 63.18,
    longitude: 14.64,
    elevation: 312,
    unit_system: { length: "km", accumulated_precipitation: "mm", temperature: "°C", volume: "L", mass: "g", wind_speed: "m/s" },
    location_name: "Hemkontroll Simulator",
    time_zone: "Europe/Stockholm",
    version: "2026.10.0-sim",
    state: "RUNNING",
  }));
  app.get("/api/history/period/:start", (req,res)=>res.json(store.history(String(req.query.filter_entity_id??'').split(','),Date.parse(req.params.start))));
  app.get('/api/calendars',(_req,res)=>res.json(store.all().filter(s=>s.entity_id.startsWith('calendar.')).map(s=>({entity_id:s.entity_id,name:s.attributes.friendly_name??s.entity_id}))));
  app.get('/api/calendars/:id',(req,res)=>{try{res.json(calendarEvents(store,req.params.id,String(req.query.start),String(req.query.end)));}catch(error){res.status(400).json({message:error instanceof Error?error.message:'Kalenderfel'});}});
  app.get("/api/states", (_req, res) => res.json(store.all()));
  app.get("/api/states/:entityId", (req, res) => {
    const found = store.get(req.params.entityId);
    found ? res.json(found) : res.status(404).json({ message: "Entity not found." });
  });
  app.post("/api/states/:entityId", (req, res) => {
    const body = asObject(req.body);
    if (typeof body.state !== "string") {
      res.status(400).json({ message: "state must be a string" });
      return;
    }
    const existed = Boolean(store.get(req.params.entityId));
    const attributes = asObject(body.attributes);
    res.status(existed ? 200 : 201).json(store.set(req.params.entityId, body.state, attributes));
  });
  app.post("/api/services/:domain/:service", async (req, res, next) => {
    try {
      const serviceData = asObject(req.body);
      const result = await callService(store, {
        domain: req.params.domain,
        service: req.params.service,
        serviceData,
      }, delayMs);
      res.json(result === undefined ? store.all() : { service_response: result });
    } catch (error) {
      next(error);
    }
  });

  app.post("/simulator/entities/:entityId", authenticate, (req, res) => {
    const body = asObject(req.body);
    if (typeof body.state !== "string") {
      res.status(400).json({ message: "state must be a string" });
      return;
    }
    const entityId = String(req.params.entityId);
    res.json(store.set(entityId, body.state, asObject(body.attributes)));
  });

  const server = http.createServer(app);
  const webSockets = new WebSocketServer({ noServer: true });
  const sessions = new Map<WebSocket, ClientSession>();
  server.on('listening',()=>{void workspace.load().then(scene=>{if(!server.listening)return;simulation.configure({...simulation.settings,latitude:scene.location.latitude,longitude:scene.location.longitude,mowerRoute:scene.geography.simulatorRoute??[]});simulation.start();}).catch(()=>{if(server.listening)simulation.start();});});
  server.on('close',()=>simulation.stop());

  server.on("upgrade", (request, socket, head) => {
    if (request.url !== "/api/websocket" && request.url !== '/bridge/ws' && request.url !== '/simulator/ws') {
      socket.destroy();
      return;
    }
    if (request.url === '/bridge/ws' && request.headers.origin && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(request.headers.origin)) { socket.destroy(); return; }
    webSockets.handleUpgrade(request, socket, head, (ws) => webSockets.emit("connection", ws, request));
  });

  webSockets.on("connection", (ws, request) => {
    const isBridge = request.url === '/bridge/ws' || request.url === '/simulator/ws';
    if (request.url === '/bridge/ws' && options.live) { connectLiveSocket(ws, options.live); return; }
    const session: ClientSession = { authenticated: false, subscriptions: new Set() };
    sessions.set(ws, session);
    ws.send(JSON.stringify({ type: "auth_required", ha_version: "2026.10.0-sim" }));

    ws.on("message", async (raw) => {
      let message: Record<string, unknown>;
      try {
        message = asObject(JSON.parse(raw.toString()));
      } catch {
        ws.close(1003, "Invalid JSON");
        return;
      }
      if (!session.authenticated) {
        if (message.type === "auth" && (isBridge ? message.access_token === "local-bridge" : message.access_token === options.token)) {
          session.authenticated = true;
          ws.send(JSON.stringify({ type: "auth_ok", ha_version: "2026.10.0-sim" }));
        } else {
          ws.send(JSON.stringify({ type: "auth_invalid", message: "Invalid access token" }));
          ws.close(1008, "Authentication failed");
        }
        return;
      }
      const id = typeof message.id === "number" ? message.id : 0;
      try {
        if (message.type === "ping") {
          ws.send(JSON.stringify({ id, type: "pong" }));
        } else if (message.type === "get_states") {
          ws.send(JSON.stringify({ id, type: "result", success: true, result: store.all() }));
        } else if (message.type === "subscribe_events" && (message.event_type === undefined || message.event_type === "state_changed")) {
          session.subscriptions.add(id);
          ws.send(JSON.stringify({ id, type: "result", success: true, result: null }));
        } else if (message.type === "unsubscribe_events") {
          const subscription = Number(message.subscription);
          const removed = session.subscriptions.delete(subscription);
          ws.send(JSON.stringify({ id, type: "result", success: removed, result: null }));
        } else if (message.type === "call_service" && !isBridge) {
          const domain = String(message.domain ?? "");
          const service = String(message.service ?? "");
          const serviceData = asObject(message.service_data);
          const targetData = asObject(message.target);
          const target: ServiceCall["target"] = {};
          if (typeof targetData.entity_id === "string" || Array.isArray(targetData.entity_id)) target.entity_id = targetData.entity_id as string | string[];
          const result = await callService(store, { domain, service, serviceData, target }, delayMs);
          ws.send(JSON.stringify({ id, type: "result", success: true, result: { response: result ?? null } }));
        } else {
          ws.send(JSON.stringify({ id, type: "result", success: false, error: { code: "unknown_command", message: `Unknown command: ${String(message.type)}` } }));
        }
      } catch (error) {
        const messageText = error instanceof Error ? error.message : "Unknown error";
        ws.send(JSON.stringify({ id, type: "result", success: false, error: { code: "service_validation_error", message: messageText } }));
      }
    });
    ws.on("close", () => sessions.delete(ws));
  });

  store.on("state_changed", (event: StateChangedEvent) => {
    for (const [ws, session] of sessions) {
      if (ws.readyState !== WebSocket.OPEN || !session.authenticated) continue;
      for (const id of session.subscriptions) ws.send(JSON.stringify({ id, type: "event", event }));
    }
  });

  dev.post('/disconnect',(_req,res)=>{let count=0;for(const [ws]of sessions){ws.close(1012,'Simulated connection loss');count++;}res.json({disconnected:count});});
  app.post("/simulator/disconnect-clients", authenticate, (_req, res) => {
    let disconnected = 0;
    for (const ws of sessions.keys()) {
      ws.close(1012, "Simulated Home Assistant restart");
      disconnected += 1;
    }
    res.json({ disconnected });
  });

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const status = error instanceof ServiceError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Internal server error";
    res.status(status).json({ message });
  });

  return { app, server, store, webSockets, simulation };
}
