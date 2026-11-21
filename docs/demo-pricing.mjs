/**
 * Demonstration-only calculator. All monetary rates are fictional.
 * No rates are official Klühspies tariffs. Never use for offers or bookings.
 * Official public starting prices are NOT inputs to this simulation.
 */
const sampleDailyRate=Object.freeze({"Städte":5800,"Aktiv":6600,"Ski":7400});
const sampleTransport=Object.freeze({package:0,bus:4600,rail:3200,self:-1200});
const money=c=>(c/100).toLocaleString("de-DE",{style:"currency",currency:"EUR"});

export function simulateIndividualPrice(input,offer){
 if(!offer||!Number.isInteger(offer.days)||offer.days<1||!sampleDailyRate[offer.category])
  return {status:"invalid",reason:"Kein geeignetes Musterpaket gefunden."};
 const students=Number(input.students),adults=Number(input.adults),group=students+adults;
 if(!Number.isInteger(students)||students<10||students>999||!Number.isInteger(adults)||adults<1||adults>99)
  return {status:"invalid",reason:"Mindestens 10 Schüler:innen und eine Begleitperson eingeben."};
 if(!/^\d{5}$/.test(input.postal||""))
  return {status:"invalid",reason:"Bitte eine fünfstellige Abfahrts-PLZ eingeben."};
 if(!/^\d{4}-\d{2}-\d{2}$/.test(input.from||""))
  return {status:"invalid",reason:"Bitte ein Reisedatum eingeben."};
 const start=new Date(input.from+"T12:00:00Z");
 if(Number.isNaN(start.getTime())||start.toISOString().slice(0,10)!==input.from)
  return {status:"invalid",reason:"Das Reisedatum ist ungültig."};
 const to=new Date(start.getTime()+(offer.days-1)*86400000).toISOString().slice(0,10);
 if(start.getUTCFullYear()<2027||start.getUTCFullYear()>2030||to.slice(0,4)!==input.from.slice(0,4))
  return {status:"invalid",reason:"Das Muster zeigt Reisejahre 2027 bis 2030."};
 if(!Object.prototype.hasOwnProperty.call(sampleTransport,input.transport))
  return {status:"invalid",reason:"Bitte eine Anreiseart wählen."};
 if(!["included","alternative"].includes(input.accommodation))
  return {status:"invalid",reason:"Bitte eine Unterkunftsoption wählen."};
 const programs=Array.isArray(input.programIds)?input.programIds:[];
 if(new Set(programs).size!==programs.length||programs.some(id=>!offer.programs?.some(p=>p.uid===id)))
  return {status:"invalid",reason:"Ein gewählter Programmbaustein ist nicht bekannt."};
 const chosen=programs.map(id=>offer.programs.find(p=>p.uid===id));
 if(new Set(chosen.map(p=>p.name.toLocaleLowerCase("de-DE").trim())).size!==chosen.length)
  return {status:"invalid",reason:"Bitte nur eine Preisvariante eines Programms wählen."};

 const free=Math.floor(group/12),paying=group-free;
 const days=offer.days,nights=Math.max(0,days-1),month=start.getUTCMonth()+1;
 const seasonRate=[4,5,6,9,10].includes(month)?1900:[11,12,1,2].includes(month)?1100:0;
 const postalDigit=Number(input.postal[0]),regionRate=postalDigit>=7?2200:postalDigit>=4?1500:900;
 const groupDiscount=group>=50?-2000:group>=30?-800:0;
 const transportRate=sampleTransport[input.transport];
 const stayRate=input.accommodation==="alternative"?nights*2900:0;
 const components=[],add=(title,detail,amount)=>{
  if(amount!==0)components.push({title,detail,amount});
 };
 add("Reisepaket – Muster-Tagesrate",paying+" zahlende Personen × "+days+" Tage × "+money(sampleDailyRate[offer.category]),paying*days*sampleDailyRate[offer.category]);
 add("Reisezeitraum – Muster-Saisonfaktor",paying+" × "+money(seasonRate),paying*seasonRate);
 add("Abfahrtsregion – Muster-PLZ-Staffel",paying+" × "+money(regionRate),paying*regionRate);
 add("Anreise – Musteranpassung",paying+" × "+money(transportRate),paying*transportRate);
 add("Unterkunft – Muster-Zuschlag",paying+" × "+nights+" Nächte × "+money(2900),paying*stayRate);
 add("Gruppengröße – Muster-Rabatt",paying+" × "+money(groupDiscount),paying*groupDiscount);
 for(const p of chosen){
  const rate=1200+(Number(p.uid.replace(/\D/g,""))%6)*600;
  add(p.name+" – Musterprogramm",group+" Teilnehmende × "+money(rate),group*rate);
 }
 const total=components.reduce((sum,x)=>sum+x.amount,0);
 if(!Number.isSafeInteger(total)||total<=0)return {status:"invalid",reason:"Die Musterkalkulation ist nicht möglich."};
 return {
  status:"simulation",from:input.from,to,group,students,adults,free,paying,total,
  perPaying:Math.round(total/paying),perTraveler:Math.round(total/group),components,
  conditions:"Fiktive Mustertarife: keine von Klühspies bestätigten Preise, Kontingente, Verfügbarkeiten oder Freiplätze."
 };
}
