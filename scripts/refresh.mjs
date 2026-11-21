import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {execFile} from "node:child_process";
import {promisify} from "node:util";
const execFileAsync=promisify(execFile);
const file=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../docs/data/public-offers.json");
const catalog=JSON.parse(await fs.readFile(file,"utf8"));
const sources=[...new Set(catalog.offers.map(o=>o.source))]
 .filter(s=>s.startsWith("https://www.klassenfahrten-kluehspies.de/"))
 .sort((a,b)=>{
  const oldest=url=>Math.min(...catalog.offers.filter(o=>o.source===url).map(o=>Date.parse(o.checkedAt||"2020-01-01")||0));
  return oldest(a)-oldest(b);
 });
const selected=process.argv.includes("--all")?sources:sources.slice(0,20);
const now=new Date().toISOString();
let checked=0,updated=0,failed=0,programsUpdated=0;
const clean=h=>h.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi," ").replace(/<[^>]*>/g," ").replace(/&nbsp;|&#160;/gi," ").replace(/&euro;|&#8364;/gi,"€").replace(/&amp;/gi,"&").replace(/\s+/g," ").trim();
const unescapeText=s=>s.replace(/&#(\d+);/g,(_,x)=>String.fromCharCode(Number(x))).replace(/&quot;/gi,'"').replace(/&amp;/gi,"&").replace(/&apos;/gi,"'").replace(/&lt;/gi,"<").replace(/&gt;/gi,">");
async function checkSource(url){
 try {
  const {stdout:html}=await execFileAsync("curl",["--silent","--show-error","--compressed","--location","--retry","1","--retry-delay","1","--max-time","26","--fail",url],{encoding:"utf8",maxBuffer:12*1024*1024,timeout:58000});
  const products=[];
  for(const script of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){
   try{
    const parsed=JSON.parse(script[1]);
    for(const group of (Array.isArray(parsed)?parsed:[parsed]))
     if(group?.["@type"]==="ProductGroup")for(const v of (group.hasVariant||[]))
      if(v?.["@type"]==="Product")products.push(v);
   }catch{}
  }
  if(!products.length)throw Error("no first-party product offers");
  const found=[];
  for(const group of html.matchAll(/data-selector="optionalProgramPackages"/g)){
   let slice=html.slice(group.index,group.index+30000);
   const end=slice.indexOf("</ul> </li> </ul>");if(end>0)slice=slice.slice(0,end);
   for(const match of slice.matchAll(/data-program-uid="(\d+)"[^>]*>([\s\S]*?)<\/li>/gi)){
    const name=unescapeText(clean(match[2]));
    if(name.length>1&&name.length<100&&!found.some(x=>x.uid===match[1]))found.push({uid:match[1],name});
   }
  }
  const prices=new Map();
  for(const match of html.matchAll(/<span\s+data-price-tag-for=["']program-(\d+)["'][^>]*>([\s\S]*?)<\/span>/gi)){
   const uid=match[1],label=unescapeText(clean(match[2]));
   const amount=/^Ab\s+(\d{1,4}(?:\.\d{3})*,\d{2})\s*€\s+pro Person$/i.exec(label);
   const cents=amount?Math.round(Number(amount[1].replace(/\./g,"").replace(",","."))*100):null;
   const value=Number.isSafeInteger(cents)&&cents>0&&cents<1000000?cents:null;
   if(prices.has(uid)&&prices.get(uid)!==value)prices.set(uid,null);
   else if(!prices.has(uid))prices.set(uid,value);
  }
  for(const offer of catalog.offers.filter(o=>o.source===url)){
   if(found.length){
    offer.programs=found.slice(0,100).map(p=>({...p,...(prices.get(p.uid)?{publicPriceFromCents:prices.get(p.uid),publicPriceBasis:"perPerson",publicPriceSource:url,publicPriceCheckedAt:now}:{})}));
    programsUpdated++;
   }
   const product=products.find(p=>p.name===offer.title);
   const item=Array.isArray(product?.offers)?product.offers.find(p=>p.priceCurrency==="EUR"):null;
   const n=Number(item?.price);
   if(Number.isFinite(n)&&n>0&&n<10000&&Math.round(n*100)===n*100){
    offer.priceFromCents=Math.round(n*100);
    offer.checkedAt=now;
    updated++;
   }
  }
  checked++;
 }catch(e){failed++;console.log("Kept previous values:",new URL(url).pathname,String(e.message).slice(0,100));}
}
for(let i=0;i<selected.length;i+=4)await Promise.all(selected.slice(i,i+4).map(checkSource));
if(updated){
 catalog.verifiedAt=now;
 const temp=file+".tmp";
 await fs.writeFile(temp,JSON.stringify(catalog,null,2)+"\n");
 await fs.rename(temp,file);
}
console.log(JSON.stringify({checked,updated,programsUpdated,failed,totalSources:sources.length,verifiedAt:updated?now:null}));