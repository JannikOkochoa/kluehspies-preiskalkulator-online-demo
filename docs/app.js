import {calculate,euro} from "./pricing.mjs?v=20261121-kluehspies-2";
import {simulateIndividualPrice} from "./demo-pricing.mjs?v=20261121-kluehspies-2";
const $=id=>document.getElementById(id);
let offers=[],tariffs=[],checkedAt="",toastTimeout;
let demoMode=new URLSearchParams(window.location.search).get("demo")==="1";
const PROGRAM_YEAR=2027;
const categories=["Städte","Aktiv","Ski"];
const normalizedName=p=>String(p?.name||"").trim().toLocaleLowerCase("de-DE");
const priceVariants=p=>(offer()?.programs||[]).filter(x=>normalizedName(x)===normalizedName(p));
const programLabel=p=>{const same=priceVariants(p);return same.length>1?p.name+" – Variante "+(same.findIndex(x=>x.uid===p.uid)+1):p.name;};
let expandedPrograms=false;
const selectedProgramDetails=()=>offer()?.programs?.filter(x=>state.programIds.includes(x.uid))||[];
const stays=[{id:"included",name:"Unterkunft laut Angebot",info:"Leistungsumfang im Originalangebot prüfen"},{id:"alternative",name:"Wunschunterkunft anfragen",info:"Nur mit hinterlegten Unterkunftskonditionen"}];
const rides=[{id:"package",name:"Laut Angebot",sub:"Originalleistung",icon:"▰"},{id:"bus",name:"Reisebus",sub:"Nur falls enthalten",icon:"▰"},{id:"rail",name:"Bahnanreise",sub:"Tarif erforderlich",icon:"⇆"},{id:"self",name:"Selbstanreise",sub:"Eigenorganisation",icon:"➤"}];
const defaults={offerId:"berlin-5",students:28,adults:2,from:"2027-05-17",postal:"28195",transport:"package",accommodation:"included",programIds:[]};
let state={...defaults};
try{const st=JSON.parse(localStorage.getItem("kluehspies-user-draft-v2")||"null");if(st&&typeof st==="object")state={...state,...st}}catch{}
if(!Array.isArray(state.programIds))state.programIds=[];
const safe=s=>String(s).replace(/[&<>"']/g,x=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[x]));
const longDate=s=>{if(!s)return "–";let [y,m,d]=s.split("-");return d+"."+m+"."+y};
const shortDate=s=>{if(!s)return "–";let [y,m,d]=s.split("-");return d+"."+m+"."};
const monthAllowed=o=>{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(state.from))return false;
 const date=new Date(state.from+"T12:00:00Z");if(isNaN(date))return false;
 for(let i=0;i<o.days;i++){const d=new Date(date.getTime()+i*86400000);if(d.getUTCFullYear()!==PROGRAM_YEAR||(o.months?.length&&!o.months.includes(d.getUTCMonth()+1)))return false}
 return true;
};
const offer=()=>offers.find(o=>o.id===state.offerId)||offers[0];
function tell(msg){const t=$("toast");t.textContent=msg;t.classList.add("visible");clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>t.classList.remove("visible"),3200)}
function updateFields(){for(const k of ["students","adults","postal"])$(k).value=state[k];$("departure").value=state.from}
function itemButton(o,k){const selected=state[k]===o.id;return '<button class="line-option '+(selected?"is-selected":"")+'" type="button" data-kind="'+k+'" data-value="'+o.id+'" aria-pressed="'+selected+'"><span class="radio-tick"></span><span><strong>'+safe(o.name)+'</strong><small>'+safe(o.info)+'</small></span>'+(o.tag?'<span class="line-right">'+o.tag+'</span>':"")+'</button>'}
function renderOptions(){
 const entries=offer()?.programs||[];
 const eligible=entries.filter(x=>x&&x.uid&&x.name);
 const shown=expandedPrograms?eligible:eligible.slice(0,7);
 $("programCards").innerHTML=(eligible.length?'<div class="program-caption">Diese Programme gehören zum ausgewählten Reiseziel. Bei unterschiedlichen Varianten prüfen Sie bitte die Leistungen im Originalangebot.</div>':'')+
 (eligible.length?shown.map(x=>{
   const isSelected=state.programIds.includes(x.uid);
   const publicHint=Number.isSafeInteger(x.publicPriceFromCents)&&x.publicPriceFromCents>0?'Programmpreis ab '+euro(x.publicPriceFromCents)+' pro Person (nicht enthalten)':'Preis für dieses Programm auf Anfrage';
   return '<button class="line-option '+(isSelected?'is-selected':'')+'" type="button" data-program-id="'+safe(x.uid)+'" aria-pressed="'+isSelected+'"><span class="check-box">'+(isSelected?'✓':'')+'</span><span><strong>'+safe(programLabel(x))+'</strong><small>'+safe(publicHint)+'</small></span></button>';
 }).join(''):'<p class="empty-programs">Für dieses Reisepaket sind hier noch keine einzelnen Programme hinterlegt. Weitere Programmideen finden Sie im Originalangebot.</p>')+
 (eligible.length>7?'<button id="morePrograms" type="button" class="more-programs">'+(expandedPrograms?'Weniger anzeigen':'Alle '+eligible.length+' Programmbausteine anzeigen')+' <span>↓</span></button>':'');

 $("accommodationCards").innerHTML=stays.map(o=>itemButton(o,"accommodation")).join("");
 $("transportCards").innerHTML=rides.map(o=>'<button type="button" class="transport-option '+(state.transport===o.id?"is-selected":"")+'" data-kind="transport" data-value="'+o.id+'" aria-pressed="'+(state.transport===o.id)+'"><span class="transport-icon">'+o.icon+'</span><span class="radio-tick"></span><strong>'+safe(o.name)+'</strong><small>'+safe(o.sub)+'</small></button>').join("");
}
function renderOffers(){
 const current=offer();if(!current)return;
 const activeCategory=current.category;
 $("categoryTabs").innerHTML=categories.map(c=>'<button type="button" data-nav-category="'+safe(c)+'" class="category-tab '+(c===activeCategory?'is-selected':'')+'" aria-pressed="'+(c===activeCategory)+'">'+safe(c==="Städte"?"Städtereisen":c==="Aktiv"?"Aktivreisen":"Skireisen")+'</button>').join("");
 document.querySelectorAll(".primary-nav [data-nav-category]").forEach(b=>{const selected=b.dataset.navCategory===activeCategory;b.classList.toggle("selected",selected);b.setAttribute("aria-pressed",String(selected));});
 const destinations=[...new Set(offers.filter(o=>o.category===activeCategory).map(o=>o.destination))].sort((a,b)=>a.localeCompare(b,"de"));
 $("destination").innerHTML=destinations.map(d=>'<option value="'+safe(d)+'">'+safe(d)+'</option>').join("");
 $("destination").value=current.destination;
 $("offerCards").innerHTML=offers.filter(o=>o.destination===current.destination&&o.category===activeCategory).map(o=>'<button class="offer-option '+(state.offerId===o.id?"is-selected":"")+'" type="button" data-offer="'+o.id+'" aria-pressed="'+(state.offerId===o.id)+'"><span class="radio-tick"></span><span class="option-eyebrow">'+safe(o.category)+' / '+o.days+' Tage</span><strong>'+safe(o.title)+'</strong><span class="option-price">ab '+euro(o.priceFromCents)+' <small>p. P.</small></span><span class="option-caption">'+(o.seasonUnknown?"Reisepreis je nach Termin":o.months?.length?"Nur in ausgewählten Monaten":"Veröffentlichter Ab-Preis")+'</span></button>').join("");
}
function saveDraft(){try{localStorage.setItem("kluehspies-user-draft-v2",JSON.stringify(state))}catch{}}
function showQuote(){
 const o=offer();if(!o)return;
 const demo=demoMode?simulateIndividualPrice(state,o):null;
 const demoOk=demo?.status==="simulation";
 const r=calculate(state,tariffs,offers),season=monthAllowed(o),yearUnverified=Number(state.from.slice(0,4))!==PROGRAM_YEAR,exact=r.status==="exact",transportMatched=state.transport==="package"||(state.transport==="bus"&&/\bBus\b/i.test(o.inclusive||"")),canUsePublic=season&&transportMatched&&state.accommodation==="included";
 let end=r.to;
 if(!end&&/^\d{4}-\d\d-\d\d$/.test(state.from)){const d=new Date(state.from+"T12:00:00Z");if(!isNaN(d))end=new Date(d.getTime()+(o.days-1)*86400000).toISOString().slice(0,10)}
 $("returnDate").value=longDate(end);
 $("quoteCity").textContent=o.destination.toUpperCase();
 const picture=$("quote").querySelector(".quote-photo img");
 // Immediately hide the previous offer's photo until the current destination image loads.
 // Never show a Berlin photo as fallback for another destination.
 picture.onload=()=>{picture.style.opacity="1";};
 picture.onerror=()=>{picture.onload=null;picture.onerror=null;picture.style.opacity="0";};
 picture.style.opacity="0";
 picture.parentElement.style.background="linear-gradient(130deg,#0576BD,#004F80)";
 picture.src=o.imageUrl||"./assets/"+o.image;
 picture.alt="Klassenfahrt "+o.destination;
 $("summaryPackage").textContent=o.title;
 $("summaryDates").textContent=shortDate(state.from)+" – "+longDate(end);
 $("summaryPeople").textContent=(Number(state.students)+Number(state.adults))+" Personen";
 $("summaryProgram").textContent=state.programIds.length?(state.programIds.length+" Zusatzbaustein"+(state.programIds.length!==1?"e":"")):"Ohne Zusatzbaustein";
 $("summaryStay").textContent=stays.find(x=>x.id===state.accommodation)?.name||"–";
 $("summaryTransport").textContent=rides.find(x=>x.id===state.transport)?.name||"–";
 $("quoteState").textContent=demoMode?"BEISPIELPREIS":exact?"TARIFPREIS":canUsePublic?"AB-PREIS LAUT ANGEBOT":"PREIS AUF ANFRAGE";
 $("quoteState").classList.toggle("is-exact",exact&&!demoMode);
 $("quoteState").classList.toggle("is-demo",demoMode);
 $("quoteUpdated").textContent=demoMode?"Fiktive Preise":exact?"Tarif vom "+longDate(r.tariff.verifiedAt):"Stand: "+longDate((o.checkedAt||checkedAt||"2026-10-20").slice(0,10));
 $("pricePrelude").textContent=demoMode?(demoOk?"Beispielpreis für Ihre Reise":"Beispielpreis nicht berechenbar"):exact?"Individuell berechneter Reisepreis":canUsePublic?(o.seasonUnknown?"Ab-Preis – nicht für gewähltes Datum bestätigt":"Veröffentlichter Einstiegspreis"):"Kein geprüfter Preis für diese Auswahl";
 $("priceFrom").textContent=demoMode?"":exact?"":canUsePublic?"ab":"";
 $("mainPrice").textContent=demoMode?(demoOk?euro(demo.perPaying):"–"):exact?euro(r.perPaying):canUsePublic?euro(o.priceFromCents):"–";
 $("priceUnit").textContent=demoMode?(demoOk?"je zahlender Person (nur Beispiel)":"Bitte Eingaben prüfen"):exact?"je zahlender Person (Verfügbarkeit offen)":canUsePublic?(state.programIds.length?"pro Person, ohne Zusatzprogramme":o.seasonUnknown?"pro Person, Termin nicht bestätigt":"pro Person, unverbindlich"):"Nur mit freigegebenem Tarif";
 $("sourceLink").href=o.source;
 const selectedPublic=selectedProgramDetails();
 $("publicProgramBreakdown").hidden=demoMode||exact||!selectedPublic.length;
 if(!demoMode&&!exact&&selectedPublic.length){
  const heading='<h4>ÖFFENTLICHE ZUSATZPROGRAMM-AB-PREISE</h4>';
  const lines=selectedPublic.map(x=>'<div class="program-price-line"><span>'+safe(programLabel(x))+'</span><strong>'+(Number.isSafeInteger(x.publicPriceFromCents)&&x.publicPriceFromCents>0?'ab '+euro(x.publicPriceFromCents)+' p. P.':'Preis offen')+'</strong></div>').join("");
  $("publicProgramBreakdown").innerHTML=heading+lines+'<p>Die Programm-Ab-Preise kommen gegebenenfalls zum Reisepaket hinzu. Ein genauer Gesamtpreis ist erst mit einem persönlichen Angebot möglich.</p>';
 }
 $("exactBreakdown").hidden=demoMode||!exact;
 $("demoControl").classList.toggle("is-active",demoMode);
 $("quote").classList.toggle("is-demo",demoMode);
 $("demoModeBtn").setAttribute("aria-pressed",String(demoMode));
 $("demoModeBtn").textContent=demoMode?"Beispielrechnung schließen":"Beispielrechnung anzeigen";
 $("demoHint").textContent=demoMode?"Alle Beträge frei erfunden. Kein verbindliches Angebot.":"Nur zur Veranschaulichung. Keine verbindlichen Klühspies-Preise.";
 $("demoDisclaimer").hidden=!demoMode;
 $("freeSeatNote").innerHTML=demoMode?
   "<strong>Freiplätze im Beispiel:</strong> Die Rechnung nimmt einen Freiplatz je zwölf Reisenden an. Ob und wie viele Freiplätze Klühspies tatsächlich anbietet, steht im jeweiligen Angebot.":
   "<strong>Freiplätze:</strong> Die Konditionen richten sich nach dem ausgewählten Reisepaket und Ihrem individuellen Angebot.";
 $("programHelper").textContent=demoMode?
   "Wählen Sie die gewünschten Programme aus. Für die Beispielrechnung verwenden wir erfundene Programmgebühren.":
   "Welche Programmpunkte möchten Sie mit Ihrer Klasse erleben? Die Preise klärt Klühspies bei der Reiseanfrage.";
 $("transportHelper").textContent=demoMode?
   "Die Zuschläge für Anreise und Unterkunft sind in dieser Beispielrechnung frei erfunden.":
   "Die im Paket enthaltenen Leistungen finden Sie beim jeweiligen Originalangebot.";
 $("demoBreakdown").hidden=!demoMode;
 if(demoMode){
   if(demoOk){
     const rows=demo.components.map(item=>'<div class="demo-line"><div><strong>'+safe(item.title)+'</strong><small>'+safe(item.detail)+'</small></div><b>'+euro(item.amount)+'</b></div>').join("");
     $("demoBreakdown").innerHTML='<div class="demo-breakdown-head"><strong>KOSTEN IM BEISPIEL</strong><span>Nur zur Veranschaulichung</span></div>'+
       '<div class="demo-people"><span>Teilnehmende <b>'+demo.group+'</b></span><span>Angenommene Freiplätze <b>'+demo.free+'</b></span><span>Zahlende Personen <b>'+demo.paying+'</b></span></div>'+
       rows+
       '<div class="demo-total"><span>Gruppenpreis im Beispiel</span><strong>'+euro(demo.total)+'</strong></div>'+
       '<div class="demo-average"><span>Durchschnitt je Reisendem (inkl. Freiplätzen)</span><b>'+euro(demo.perTraveler)+'</b></div>'+
       '<p class="demo-smallprint">Diese Zahlen dienen nur dazu, die Berechnung zu zeigen. Sie sind keine Klühspies-Preise. Verfügbarkeit und Buchung wurden nicht geprüft.</p>';
   }else{
     $("demoBreakdown").innerHTML='<p class="demo-smallprint"><strong>Beispielrechnung nicht möglich:</strong> '+safe(demo?.reason||"Ungültige Eingaben")+'</p>';
   }
 }
 $("copyBtn").textContent=demoMode?"Beispielrechnung kopieren":"Reiseplanung kopieren";
 if(exact){
  $("exactBreakdown").innerHTML='<p><span>Reisende</span><b>'+r.group+'</b></p><p><span>Vertragliche Freiplätze</span><b>'+r.free+'</b></p><p><span>Zahlende Personen</span><b>'+r.paying+'</b></p><p><span>Grundpaket</span><b>'+euro(r.base)+'</b></p>'+(r.program?'<p><span>Zusatzprogramm</span><b>'+euro(r.program)+'</b></p>':"")+(r.fixed?'<p><span>Fixkosten</span><b>'+euro(r.fixed)+'</b></p>':"")+'<hr><p><span>Gruppenpreis gesamt</span><b>'+euro(r.total)+'</b></p>';
 }
 $("statusExplainer").innerHTML=demoMode?'<strong>So setzt sich der Preis im Beispiel zusammen.</strong> Alle Beträge und Konditionen sind erfunden. Ein verbindliches Angebot erhalten Sie direkt bei Klühspies.':exact?'<strong>Mathematisch aus freigegebenem Tarif kalkuliert.</strong> Grundlage: '+safe(r.tariff.verifiedSource)+'. Noch keine Zusage zur Verfügbarkeit oder Buchbarkeit.':!season?(yearUnverified?'<strong>Für dieses Reisejahr liegt kein geprüfter Preis vor.</strong> Die Demo enthält öffentlich bestätigte Reisepreise für 2027.':'<strong>Außerhalb der veröffentlichten Angebots-Saison.</strong> Bitte anderen Zeitraum wählen oder das Originalangebot prüfen.'):!canUsePublic?'<strong>Individuelle Auswahl ohne belegten Preis.</strong> Für diese Anreise bzw. Unterkunft existiert noch kein freigegebener Tarif.':'<strong>Wichtig:</strong> '+safe(r.reason||"Nur veröffentlichter Einstiegspreis verfügbar.")+' Dieser Ab-Preis ist kein individuelles Angebot.'+(o.seasonUnknown?" Eine Gültigkeit für den gewählten Reisezeitraum ist nicht nachgewiesen.":"");
 $("mobilePrice").textContent=demoMode?(demoOk?euro(demo.perPaying):"–"):(canUsePublic&&!exact?"ab ":"")+(exact?euro(r.perPaying):canUsePublic?euro(o.priceFromCents):"–");
 $("mobileStatus").textContent=demoMode?"Beispielpreis (fiktiv)":exact?"Tarifpreis pro Person":canUsePublic?"Öffentlicher Ab-Preis":"Preis auf Anfrage";
 saveDraft();window.__lastQuote={r,o,demo};
}
function rerender(){renderOffers();renderOptions();showQuote()}
async function refresh(){
 const btn=$("refreshBtn");btn.disabled=true;btn.textContent="Lade veröffentlichte Preisliste …";$("refreshMessage").textContent="";
 try{
  const res=await fetch("./data/public-offers.json?ts="+Date.now(),{cache:"no-store"});
  if(!res.ok)throw Error("Preisliste nicht erreichbar");
  const p=await res.json();offers=p.offers;tariffs=[];checkedAt=p.verifiedAt;
  $("refreshMessage").textContent="Veröffentlichter Preisstand neu geladen. Dieser Button fragt keine tagesaktuellen Buchungspreise ab.";
  rerender();tell("Preisliste geladen");
 }catch(e){$("refreshMessage").textContent="Abruf fehlgeschlagen: "+e.message}
 finally{btn.disabled=false;btn.textContent="↻ Veröffentlichten Preisstand laden"}
}

function bind(){
 const header=document.querySelector(".site-header");
 const menuButton=$("mobileMenuButton");
 const closeMenu=()=>{
   header.classList.remove("menu-open");
   menuButton.setAttribute("aria-expanded","false");
   menuButton.setAttribute("aria-label","Menü öffnen");
 };
 menuButton.addEventListener("click",()=>{
   const open=!header.classList.contains("menu-open");
   header.classList.toggle("menu-open",open);
   menuButton.setAttribute("aria-expanded",String(open));
   menuButton.setAttribute("aria-label",open?"Menü schließen":"Menü öffnen");
 });
 $("mobileSearchButton").addEventListener("click",()=>{
   closeMenu();
   $("step-1").scrollIntoView({behavior:"smooth",block:"start"});
   $("destination").focus({preventScroll:true});
 });
 document.addEventListener("keydown",e=>{if(e.key==="Escape")closeMenu()});
 document.addEventListener("click",e=>{if(header.classList.contains("menu-open")&&!header.contains(e.target))closeMenu()});
 $("destination").addEventListener("change",e=>{const selectedCategory=offer()?.category,group=offers.filter(o=>o.destination===e.target.value&&o.category===selectedCategory),s=group.find(monthAllowed)||group[0];if(s){state.offerId=s.id;state.programIds=[];expandedPrograms=false;rerender()}});
 $("offerCards").addEventListener("click",e=>{const b=e.target.closest("[data-offer]");if(b){state.offerId=b.dataset.offer;state.programIds=[];expandedPrograms=false;rerender()}});
 for(const id of ["students","adults","postal","departure"])$(id).addEventListener("input",e=>{state[id==="departure"?"from":id]=id==="postal"?e.target.value.replace(/[^\d]/g,"").slice(0,5):id==="departure"?e.target.value:Number(e.target.value);showQuote()});
 document.addEventListener("click",e=>{
  const cat=e.target.closest("[data-nav-category]");
  if(cat){closeMenu();const pick=offers.find(x=>x.category===cat.dataset.navCategory);if(pick){state.offerId=pick.id;state.programIds=[];expandedPrograms=false;rerender();if(cat.classList.contains("nav-link"))document.querySelector("#reise").scrollIntoView({behavior:"smooth"});}return;}
  const program=e.target.closest("[data-program-id]");
  if(program){
   const id=program.dataset.programId,entry=offer().programs.find(x=>x.uid===id);
   const wasSelected=state.programIds.includes(id);
   state.programIds=state.programIds.filter(uid=>uid!==id&&!((offer().programs||[]).some(x=>x.uid===uid&&normalizedName(x)===normalizedName(entry))));
   if(!wasSelected)state.programIds.push(id);
   renderOptions();showQuote();
  }
  if(e.target.closest("#morePrograms")){expandedPrograms=!expandedPrograms;renderOptions()}
  const s=e.target.closest("[data-kind]");if(s){state[s.dataset.kind]=s.dataset.value;renderOptions();showQuote()}
  const b=e.target.closest("[data-counter]");if(b){const k=b.dataset.counter,lo=k==="students"?10:1,hi=k==="students"?999:99;state[k]=Math.min(hi,Math.max(lo,Number(state[k]||0)+Number(b.dataset.delta)));$(k).value=state[k];showQuote()}
 });
 $("resetBtn").addEventListener("click",()=>{state={...defaults};updateFields();rerender();tell("Auswahl zurückgesetzt")});
 $("demoModeBtn").addEventListener("click",()=>{
   demoMode=!demoMode;
   const url=new URL(window.location.href);
   if(demoMode)url.searchParams.set("demo","1");
   else url.searchParams.delete("demo");
   window.history.replaceState(null,"",url.toString());
   showQuote();
 });
 $("copyBtn").addEventListener("click",async()=>{
  const {r,o,demo}=window.__lastQuote,price=demoMode?(demo?.status==="simulation"?euro(demo.perPaying)+" pro zahlender Person, unverbindliche Beispielrechnung":"Beispielrechnung nicht möglich"):r.status==="exact"?euro(r.perPaying)+" pro zahlender Person (Tarifpreis, Verfügbarkeit offen)":$("mainPrice").textContent.trim()==="–"?"Kein geprüfter Preis für diese Auswahl":euro(o.priceFromCents)+" ab pro Person (unverbindlich)";
  const content=[...(demoMode?["BEISPIELRECHNUNG – FIKTIVE BETRÄGE, KEIN VERBINDLICHER PREIS"]:[]),"Klühspies Klassenfahrt – "+o.title,"Termin: "+longDate(state.from)+" – "+$("returnDate").value,"Gruppe: "+state.students+" Schüler:innen, "+state.adults+" Begleitpersonen","Abfahrts-PLZ: "+state.postal,"Programm: "+(selectedProgramDetails().map(programLabel).join(", ")||"Ohne Zusatzbaustein"),"Unterkunft: "+stays.find(x=>x.id===state.accommodation)?.name,"Anreise: "+rides.find(x=>x.id===state.transport)?.name,"Preisstatus: "+price,...(demoMode&&demo?.status==="simulation"?["Fiktiver Gruppenpreis gesamt: "+euro(demo.total),"Fiktive Freiplätze: "+demo.free,"Zahlende Personen: "+demo.paying,...demo.components.map(x=>x.title+": "+euro(x.amount))]:[]),"Quelle: "+o.source,"Hinweis: Keine bestätigte Verfügbarkeit und keine verbindlichen Tarife."].join("\n");
  try{await navigator.clipboard.writeText(content);tell("Reiseplanung kopiert")}catch{tell("Kopieren in diesem Browser nicht möglich")}
 });
 $("printBtn").addEventListener("click",()=>window.print());
 $("mobileDetails").addEventListener("click",()=>$("quote").scrollIntoView({behavior:"smooth",block:"start"}));
 $("refreshBtn").addEventListener("click",refresh);
}
async function init(){
 try{const res=await fetch("./data/public-offers.json?ts="+Date.now());if(!res.ok)throw Error("Serverfehler");const p=await res.json();offers=p.offers;tariffs=[];checkedAt=p.verifiedAt;if(!offers.some(o=>o.id===state.offerId))state.offerId=offers[0].id;state.programIds=state.programIds.filter(id=>offer().programs?.some(x=>x.uid===id));updateFields();bind();rerender()}
 catch(e){document.querySelector(".planner-title h2").textContent="Preisdaten konnten nicht geladen werden";console.error(e)}
}
init();
