// Eigenständige Preislogik. Keine fiktiven Klühspies-Tarife.
export const euro = c => (c/100).toLocaleString("de-DE",{style:"currency",currency:"EUR"});
export function validTariff(t){
 if (!t||typeof t!=="object") return false;
 if(typeof t.id!=="string"||!t.id.trim()||typeof t.offerId!=="string"||!t.offerId.trim()) return false;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(t.from||"")||!/^\d{4}-\d{2}-\d{2}$/.test(t.to||"")||t.from>t.to)return false;
 for(const x of ["minGroup","maxGroup","priceCents","fixedCents"]){if(!Number.isSafeInteger(t[x])||t[x]<0)return false}
 if(t.maxGroup<t.minGroup||t.minGroup<1||t.priceCents<=0)return false;
 if(typeof t.transport!=="string"||!["bus","rail","self"].includes(t.transport))return false;
 if(typeof t.accommodation!=="string"||!t.accommodation)return false;
 if(typeof t.verifiedSource!=="string"||t.verifiedSource.trim().length<8)return false;
 if(typeof t.verifiedAt!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(t.verifiedAt))return false;
 if(t.postalPrefixes!==undefined&&(!Array.isArray(t.postalPrefixes)||t.postalPrefixes.some(v=>typeof v!=="string"||!/^[0-9]{1,5}$/.test(v))))return false;
 if(t.freeSeats!==undefined&&(!Number.isSafeInteger(t.freeSeats)||t.freeSeats<0))return false;
 if(t.freeEvery!==undefined&&(!Number.isSafeInteger(t.freeEvery)||t.freeEvery<2))return false;
 if(t.programPrices!==undefined){
 if(!t.programPrices||typeof t.programPrices!=="object"||Array.isArray(t.programPrices))return false;
 for(const v of Object.values(t.programPrices)){
  if(Number.isSafeInteger(v)&&v>=0)continue;
  if(!v||typeof v!=="object"||!Number.isSafeInteger(v.priceCents)||v.priceCents<0||!["perTraveler","perPaying","perGroup"].includes(v.type))return false;
 }
}
 return true;
}
export function calculate(input,tariffs,offers) {
 const offer=offers.find(o=>o.id===input.offerId);
 if(!offer) return {status:"invalid",reason:"Reisepaket fehlt"};
 const students=Number(input.students),adults=Number(input.adults),group=students+adults;
 if(!Number.isInteger(students)||!Number.isInteger(adults)||students<10||students>999||adults<1||adults>99)return {status:"invalid",offer,reason:"Mindestens 10 Schüler:innen und 1 Begleitperson eingeben."};
 if(!/^\d{4}-\d{2}-\d{2}$/.test(input.from||"")||!/^\d{5}$/.test(input.postal||""))return {status:"invalid",offer,reason:"Reisedatum und fünfstellige Postleitzahl eingeben."};
 const from=new Date(input.from+"T12:00:00Z");
 if(Number.isNaN(from.getTime())||from.toISOString().slice(0,10)!==input.from)return {status:"invalid",offer,reason:"Ungültiges Reisedatum."};
 const to=new Date(from.getTime()+(offer.days-1)*86400000).toISOString().slice(0,10);
 const month=from.getUTCMonth()+1;
 const seasonal=offer.months.length===0||offer.months.includes(month);
 const selectedPrograms=Array.isArray(input.programIds)?[...new Set(input.programIds)]:input.program&&input.program!=="none"?[input.program]:[];
 if(selectedPrograms.some(x=>typeof x!=="string"||!offer.programs?.some(p=>p.uid===x)&&!["guided","museum","workshop"].includes(x)))return {status:"invalid",offer,reason:"Unbekannter Programmbaustein."};
 const matching=(Array.isArray(tariffs)?tariffs:[]).filter(t=>validTariff(t)&&t.offerId===offer.id&&input.from>=t.from&&to<=t.to&&group>=t.minGroup&&group<=t.maxGroup&&t.transport===input.transport&&t.accommodation===input.accommodation&&(!t.postalPrefixes||t.postalPrefixes.some(p=>input.postal.startsWith(p)))&&selectedPrograms.every(id=>Object.prototype.hasOwnProperty.call(t.programPrices||{},id)));
 // Mehrdeutige Preisregeln niemals stillschweigend auswählen.
 if(matching.length!==1) return {status:"reference",offer,group,to,seasonal,reason:matching.length>1?"Mehrdeutige Tarife: Mehr als eine Kalkulationsregel passt.":"Für diese Auswahl liegt noch kein vollständig freigegebener Klühspies-Tarif vor."};
 const t=matching[0];
 const frees= t.freeEvery ? Math.floor(group/t.freeEvery) : (t.freeSeats||0);
 if(frees>=group)return {status:"invalid",offer,reason:"Freiplatzregel ergibt keine zahlenden Gäste."};
 const paying=group-frees;
 let program=0;
 for(const id of selectedPrograms){
  const v=t.programPrices[id];
  if(Number.isSafeInteger(v))program+=v*paying;
  else program+=v.priceCents*(v.type==="perGroup"?1:v.type==="perTraveler"?group:paying);
 }

 const base=t.priceCents*paying, fixed=t.fixedCents;
 const total=base+fixed+program;
 return {status:"exact",offer,to,group,paying,free:frees,tariffId:t.id,tariff:t,base,fixed,program,total,perPaying:Math.round(total/paying),perTraveler:Math.round(total/group),seasonal};
}
