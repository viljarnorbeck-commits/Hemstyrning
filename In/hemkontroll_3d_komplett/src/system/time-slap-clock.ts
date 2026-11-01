import './time-slap-clock.css';

/** Local clock time, matching the time already displayed by the home overview. */
export function timeSlapClock(now:Date){
 const time=now.toLocaleTimeString('sv-SE',{hour:'2-digit',minute:'2-digit'});
 const matched=now.getHours()===now.getMinutes();
 return `<strong class="time-slap-clock${matched?' is-time-slap':''}" data-dom-key="home-clock" role="timer" aria-live="off" aria-label="Klockan ${time}"><span class="clock-regular" aria-hidden="true">${time}</span><span class="clock-bold" aria-hidden="true">${time}</span></strong>`;
}
