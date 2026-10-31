import {demoScenes} from './demo-presets.js';
import {demoTracks,simulatedSpotifyId,simulatedFeatures} from './music.js';
import type { HassState } from "./types.js";

const now = new Date().toISOString();

function state(
  entityId: string,
  value: string,
  attributes: Record<string, unknown>,
): HassState {
  return {
    entity_id: entityId,
    state: value,
    attributes,
    last_changed: now,
    last_reported: now,
    last_updated: now,
    context: { id: crypto.randomUUID().replaceAll("-", ""), parent_id: null, user_id: null },
  };
}

const lightNames = [
  ["light.infart_vanster", "Infart vänster"],
  ["light.infart_hoger", "Infart höger"],
  ["light.garage", "Garage"],
  ["light.altan", "Altan"],
  ["light.gangstig", "Gångstig"],
  ["light.forad", "Förråd"],
] as const;

export function createInitialStates(): HassState[] {
  const track=demoTracks[0]!;
  return [
    state("switch.vvb_kallaren_on_off","on",{simulated:true}),
    state("lock.entredorr_2","locked",{friendly_name:"Entrédörr · simulerad",battery_level:85,simulated:true}),
    state("lock.verkstadsentre_2","locked",{friendly_name:"Verkstadsdörr · simulerad",battery_level:65,simulated:true}),
    state("binary_sensor.entredorr_door","off",{simulated:true}),
    state("binary_sensor.verkstadsentre_door","off",{simulated:true}),
    state("climate.vvb_kallaren_termostat","heat",{friendly_name:"VVB · simulerad",supported_features:385,hvac_modes:["off","heat"],min_temp:30,max_temp:75,target_temp_step:.5,temperature:55,hvac_action:"idle",simulated:true}),
    ...demoScenes.map(([id,name])=>state(id,id.startsWith('script.')?'off':'unknown',{friendly_name:name,simulated:true})),
    state(simulatedSpotifyId,'paused',{friendly_name:'Spotify · lokalt testkonto',app_id:'spotify',app_name:'Spotify',simulated:true,supported_features:simulatedFeatures,media_title:track.title,media_artist:track.artist,media_album_name:track.album,entity_picture:track.cover,media_duration:track.duration,media_position:32,media_position_updated_at:new Date().toISOString(),volume_level:.35,source:'Vardagsrum',source_list:['Vardagsrum','Kök','Mobil'],track_index:0}),
    ...lightNames.map(([entityId, friendlyName], index) =>
      state(entityId, index < 2 ? "on" : "off", {
        friendly_name: friendlyName,
        supported_color_modes: index>=2?["rgb","color_temp"]:["brightness","color_temp"],
        color_mode: "brightness",
        brightness: index < 2 ? 204 : 0,
        color_temp_kelvin: 2700,
        supported_features: 0,
      }),
    ),
    state('light.garden_group','on',{friendly_name:'All gårdsbelysning',entity_id:lightNames.map(([id])=>id)}),
    state("sensor.house_power", "3.42", {
      friendly_name: "Husets effekt",
      device_class: "power",
      state_class: "measurement",
      unit_of_measurement: "kW",
    }),
    state("sensor.solar_power", "1.86", {
      friendly_name: "Solproduktion",
      device_class: "power",
      state_class: "measurement",
      unit_of_measurement: "kW",
    }),
    state("sensor.outdoor_illuminance", "740", {
      friendly_name: "Utomhusljus",
      device_class: "illuminance",
      state_class: "measurement",
      unit_of_measurement: "lx",
    }),
    state("weather.home", "partlycloudy", {
      friendly_name: "Hemmet",
      temperature: 8.4,
      cloud_coverage: 45,
      attribution: "SMHI forecast · simulated fixture",
      visibility: 20,
      temperature_unit: "°C",
      humidity: 81,
      wind_speed: 4.2,
    }),
    state("sensor.garden_snow_depth", "0", {
      friendly_name: "Snödjup på gården · simulerad observation", unit_of_measurement: "cm",
    }),
    state("lawn_mower.luba_3_awd", "docked", {
      friendly_name: "LUBA 3 AWD",
      battery_level: 91,
      supported_features: 15,
    }),
    state("vacuum.downstairs", "docked", {
      friendly_name: "Nedervåning",
      battery_level: 100,
      supported_features: 8192|4|16,
    }),
    state("sensor.car_one_battery", "72", {
      friendly_name: "Bil 1 batteri",
      device_class: "battery",
      state_class: "measurement",
      unit_of_measurement: "%",
    }),
  ];
}
