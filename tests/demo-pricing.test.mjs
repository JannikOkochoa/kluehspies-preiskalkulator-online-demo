import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {simulateIndividualPrice} from "../docs/demo-pricing.mjs";

const offers=JSON.parse(readFileSync(new URL("../docs/data/public-offers.json",import.meta.url),"utf8")).offers;
assert.equal(offers.length,237);
const standard={students:28,adults:2,from:"2027-05-17",postal:"28195",transport:"package",accommodation:"included",programIds:[]};
for(const offer of offers){
 const r=simulateIndividualPrice(standard,offer);
 assert.equal(r.status,"simulation","Failed: "+offer.title);
 assert.equal(r.total,r.components.reduce((sum,x)=>sum+x.amount,0));
 assert.equal(r.group,r.paying+r.free);
 assert(r.perPaying>0&&r.total>0);
}
const berlin=offers.find(x=>x.id==="berlin-5");
assert(berlin);
const base=simulateIndividualPrice(standard,berlin);
assert.equal(base.group,30);assert.equal(base.free,2);assert.equal(base.paying,28);
assert(simulateIndividualPrice({...standard,students:40},berlin).total>base.total);
assert(simulateIndividualPrice({...standard,postal:"79100"},berlin).total>base.total);
assert(simulateIndividualPrice({...standard,transport:"bus"},berlin).total>base.total);
assert(simulateIndividualPrice({...standard,accommodation:"alternative"},berlin).total>base.total);
assert(simulateIndividualPrice({...standard,programIds:[berlin.programs[0].uid]},berlin).total>base.total);
assert.equal(simulateIndividualPrice({...standard,from:"2028-05-17"},berlin).status,"simulation");
for(const state of [{...standard,postal:""}, {...standard,from:"2026-05-17"},{...standard,students:0},{...standard,programIds:["not-real"]}]){
 assert.equal(simulateIndividualPrice(state,berlin).status,"invalid");
}
assert.equal(berlin.priceFromCents,34400,"Public official example data must remain untouched");
console.log("PASS: All 237 demonstration offers, arithmetic invariants, inputs and unchanged official sample price.");
