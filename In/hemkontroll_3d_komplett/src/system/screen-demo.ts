// Local-only launchpad for testing a TV, desktop display, tablet controller and phone
// against ONE shared Hemstyrning backend from independent Chrome tabs.
const local = ['localhost','127.0.0.1','::1','[::1]'].includes(location.hostname);
document.title = 'Hemstyrning · Flera skärmar';
if (!local) {
 document.body.replaceChildren(document.createTextNode('Testvyn är endast tillgänglig via localhost.'));
} else {
 const screens=[
  {id:'tv',title:'TV · Vardagsrum',tag:'VISNINGSSKÄRM',description:'3D-gården i TV-profil. Visar parkopplingskoden och tar emot kamerakommandon.',route:'/?profile=tv&screen=Vardagsrum&preview=1',color:'#9bff4d',hint:'Testa piltangenterna och Enter som fjärrkontroll.'},
  {id:'desk',title:'Dator · Arbetsrum',tag:'ÖVERSIKT',description:'Den fullständiga listan med energi, sol, bilar och enheter. Ingen tung 3D-modell laddas.',route:'/?view=list&profile=standard&screen=Arbetsrum&preview=1',color:'#36e4ee',hint:'Kan ligga öppen samtidigt som TV:n.'},
  {id:'pad',title:'Surfplatta · Kontrollpanel',tag:'FJÄRRKONTROLL',description:'Lampornas skjutbrytare, bilvärme, robotar, detaljer och scener. Parkoppla denna med TV-fliken.',route:'/control?profile=standard&preview=1',color:'#75aaff',hint:'Välj objektets namn för att flytta kameran på TV:n.'},
  {id:'phone',title:'Mobil · Hem',tag:'MOBILVY',description:'Hemstarten med samma livevärden. Aktivera mobilstorlek i Chromes enhetsverktyg.',route:'/?profile=mobile&screen=Mobil&preview=1',color:'#bd94ff',hint:'DevTools → Ctrl+Shift+M → välj telefonformat.'}
 ];
 const css=`
 body{margin:0;background:#080c13;color:#edf3ff;font:15px/1.6 Inter,ui-sans-serif,system-ui,sans-serif;min-height:100dvh}
 .demo-wrap{max-width:1180px;margin:0 auto;padding:48px 24px 70px}
 .demo-kicker{font-size:12px;font-weight:800;letter-spacing:.2em;color:#36e4ee}
 .demo-wrap h1{font-size:clamp(34px,5vw,62px);letter-spacing:-.05em;line-height:1.1;margin:12px 0 18px}
 .demo-intro{max-width:790px;color:#aebed2;font-size:17px}
 .demo-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;margin-top:32px}
 .demo-card{--card-accent:#36e4ee;background:#101722;border:1px solid #5262787a;border-top:5px solid var(--card-accent);border-radius:10px;padding:24px;display:flex;flex-direction:column}
 .demo-card small{font-size:11px;letter-spacing:.16em;font-weight:800;color:var(--card-accent)}
 .demo-card h2{font-size:25px;margin:10px 0 7px}
 .demo-card p{color:#c0cce0;margin:0 0 12px}
 .demo-card .demo-hint{font-size:13px;color:#9eafc5;margin-top:auto}
 .demo-card a{display:inline-flex;align-items:center;justify-content:center;align-self:flex-start;margin-top:18px;background:var(--card-accent);color:#071018;font-weight:800;font-size:14px;text-decoration:none;border-radius:6px;min-height:45px;padding:0 20px}
 .demo-card a:hover{filter:brightness(1.1)}
 .demo-card a:focus-visible{outline:3px solid white;outline-offset:4px}
 .demo-guide{margin-top:28px;background:#182231;border:1px solid #5262787a;border-radius:10px;padding:22px 26px}
 .demo-guide strong{color:#f6f9ff}
 .demo-guide ol{padding-left:23px;margin:12px 0}
 .demo-guide li{padding:3px 0}
 .demo-guide code{color:#36e4ee;background:#080c13;padding:3px 6px;border-radius:3px}
 .demo-guide p{color:#adbbce;margin-bottom:0}
 @media(max-width:760px){.demo-grid{grid-template-columns:1fr}.demo-wrap{padding:30px 14px}.demo-card{padding:18px}}
 `;
 const style=document.createElement('style');style.textContent=css;document.head.append(style);
 document.body.innerHTML=`<main class="demo-wrap">
 <span class="demo-kicker">HEMSTYRNING · LOKALT TEST</span>
 <h1>Fyra skärmar. Ett hem.</h1>
 <p class="demo-intro">Öppna varje enhet i en <strong>ny Chrome-flik</strong>. Alla ansluter till samma Home Assistant-simulator på din dator. Det behövs inte fyra localhost-servrar. Testet är gjort för att fungera utan riktiga TV-apparater eller mobiler.</p>
 <div class="demo-grid">${screens.map(s=>`<section class="demo-card" style="--card-accent:${s.color}"><small>${s.tag}</small><h2>${s.title}</h2><p>${s.description}</p><p class="demo-hint">${s.hint}</p><a href="${s.route}" target="_blank" rel="noopener noreferrer">Öppna ${s.id==='tv'?'TV':s.id==='desk'?'dator':s.id==='pad'?'surfplatta':'mobil'} i ny flik ↗</a></section>`).join('')}</div>
 <section class="demo-guide"><h2>Testa kommunikationen</h2><ol>
 <li>Öppna <strong>TV</strong> och <strong>Surfplatta</strong> ovan.</li>
 <li>På TV-fliken: öppna <strong>Visningsskärm</strong> och kopiera den sexsiffriga koden.</li>
 <li>På surfplattefliken: skriv koden under <strong>Styr skärm</strong> och klicka <strong>Parkoppla</strong>.</li>
 <li>Välj exempelvis <strong>LUBA</strong> eller en bil genom att trycka på namnet. TV-flikens kamera ska flytta sig. En skjutbrytare styr enheten separat.</li>
 <li>Tryck på <strong>Visa hela gården</strong> för att återgå till TV:ns startvy.</li></ol>
 <p>Flikarna har egna skärmsessioner, men delar simulerade enhetstillstånd. Öppna nya flikar med länkarna här (använd inte Chromes <em>Duplicera flik</em>). För mobiltest: använd Chromes enhetsverktyg <code>F12</code> → <code>Ctrl+Shift+M</code>. Detta testar webbgränssnitt och skärmsynkronisering, inte prestanda hos en fysisk Google TV.</p></section>
 </main>`;
}

export {};
