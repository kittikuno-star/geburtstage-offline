(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.OfflineCore=api;})(globalThis,()=>{
 'use strict';
 const FORMAT='geburtstage-offline-v1';
 const MAC_SHA='c9add36e698acbf22904b7b07e63f8e6daa1fbef79840323731de4f08abdf044';
 const clone=v=>JSON.parse(JSON.stringify(v));
 function fail(message){throw Error(message)}
 async function sha(text){if(!globalThis.crypto?.subtle)fail('SHA-256 ist hier nicht verfügbar. Bitte die App über localhost oder HTTPS öffnen.');return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),b=>b.toString(16).padStart(2,'0')).join('')}
 function validatePeople(people,{requireName=false}={}){
  if(!Array.isArray(people)||people.length>20000)fail('Ungültige oder zu große Personenliste.');
  const ids=new Set();
  for(const p of people){
   if(!p||typeof p!=='object'||Array.isArray(p))fail('Ungültiger Personendatensatz.');
   const id=p['Personen-ID'];
   if(typeof id!=='string'||!/^P\d{4,8}$/.test(id)||ids.has(id))fail('Fehlende, ungültige oder doppelte Personen-ID.');ids.add(id);
   const names=['Vorname Thai','Nachname Thai','Vorname Deutsch/Latein','Nachname Deutsch/Latein','Name Thai','Name Deutsch/Latein','Vorname','Nachname','Lateinischer Name','Kartenname','Spitzname','Mönchsname'];
   if(requireName&&!names.some(k=>typeof p[k]==='string'&&p[k].trim()))fail(id+': Mindestens ein Name ist für eine neue Person erforderlich.');
   if(typeof p.Status!=='string'||!p.Status.trim())fail(id+': Status fehlt.');
   for(const [k,v] of Object.entries(p)){
    if(['__proto__','constructor','prototype'].includes(k)||!['string','number','boolean'].includes(typeof v)&&v!==null)fail(id+': Nicht unterstützter Feldtyp. Kein Schema wurde geändert.');
    if(typeof v==='number'&&!Number.isFinite(v)||typeof v==='string'&&/[\uD800-\uDFFF]/u.test(v))fail(id+': Beschädigte Zeichen oder Zahl.');
   }
   // The confirmed legacy schema uses numeric 0 for an unknown day. Preserve it exactly.
   for(const [k,min,max] of [['Geburtstag: Tag',0,31],['Geburtstag: Monat',0,12]]){
    const v=p[k];if(v!==undefined&&v!==null&&v!==''&&(!Number.isInteger(Number(v))||Number(v)<min||Number(v)>max))fail(id+': '+k+' ist ungültig.');
   }
  }
  return people;
 }
 function summary(people){validatePeople(people);const trash=people.filter(p=>p['Im Papierkorb seit']||String(p.Status).toLowerCase()==='papierkorb').map(p=>p['Personen-ID']).sort();return {count:people.length,trash:trash.length,trashIds:trash};}
 function validateLegacyState(people,state,declared){
  const s=summary(people),ids=new Set(people.map(p=>p['Personen-ID']));
  if(!state||!declared||!state.confirmed||typeof state.confirmed!=='object'||Array.isArray(state.confirmed))fail('Bestätigter Ausgangsbestand fehlt.');
  const confirmed=Object.keys(state.confirmed);
  if(confirmed.length!==ids.size||confirmed.some(id=>!ids.has(id))||!state.dirty||!state.deleted||Object.keys(state.dirty).length||Object.keys(state.deleted).length||declared.people!==s.count||declared.confirmed!==confirmed.length||declared.dirty!==0||declared.deleted!==0)fail('Personen-IDs oder Ausgangsbestand sind unvollständig oder unerwartet.');
  return {...s,unique:ids.size};
 }
 function validPayload(p){
  if(!p||p.schema!==1||!['mac','iphone','unassigned'].includes(p.deviceRole)||typeof p.datasetId!=='string'||!p.datasetId||!Number.isSafeInteger(p.revision)||p.revision<0||typeof p.createdAt!=='string'||!Number.isFinite(Date.parse(p.createdAt)))fail('Unbekanntes Datenformat oder ungültige Versionsangaben.');
  validatePeople(p.people);return p;
 }
 async function pack(payload){validPayload(payload);const text=JSON.stringify(payload);const result={format:FORMAT,payload:text,sha256:await sha(text)};if(new TextEncoder().encode(JSON.stringify(result)).length>40*1024*1024)fail('Bestand überschreitet die sichere Dateigrenze von 40 MB. Änderung wurde nicht gespeichert. Große eingebettete Bilder bitte vermeiden.');return result;}
 async function unpack(envelope){
  if(!envelope||envelope.format!==FORMAT||typeof envelope.payload!=='string'||!/^[a-f0-9]{64}$/.test(envelope.sha256||''))fail('Keine vollständige Offline-Sicherungsdatei.');
  if(await sha(envelope.payload)!==envelope.sha256)fail('Prüfsumme stimmt nicht. Import abgebrochen.');
  let p;try{p=JSON.parse(envelope.payload)}catch{fail('Beschädigte Sicherung.');}return validPayload(p);
 }
 function uuid(){return crypto.randomUUID()}
 function empty(){return {schema:1,deviceRole:'unassigned',datasetId:uuid(),revision:0,people:[],createdAt:new Date().toISOString(),lastImport:null}}
 async function readFile(text){
  if(typeof text!=='string'||text.length>40*1024*1024)fail('Datei fehlt oder überschreitet 40 MB.');
  let obj;try{obj=JSON.parse(text)}catch{fail('Die Datei ist kein vollständiges JSON.');}
  if(obj.format===FORMAT){const p=await unpack(obj);return {payload:p,envelope:obj,fileSha:await sha(text),legacy:false,summary:summary(p.people)}}
  // Only the independently confirmed master backup is admitted, never an old phone export.
  if(await sha(text)!==MAC_SHA)fail('Alte Sicherungen: Nur die ausdrücklich geprüfte Mac-Originaldatei vom 14.10.2026 wird angenommen.');
  if(obj.format!=='geburtstagsdatenbank-readonly-backup-v1'||obj.payload?.source!=='https://subtle-dodol-f5ec20.netlify.app')fail('Falsche Herkunft.');
  const raw=obj.payload.raw;const people=JSON.parse(raw.people),state=JSON.parse(raw.syncState);const s=validateLegacyState(people,state,obj.payload.summary);
  const payload={schema:1,deviceRole:'mac',datasetId:'mac-master-2026-10-14-'+MAC_SHA.slice(0,12),revision:1,people,createdAt:obj.payload.exportedAt,lastImport:null,legacySourceSha:MAC_SHA};
  return {payload,envelope:await pack(payload),fileSha:MAC_SHA,legacy:true,summary:s};
 }
 function importGate(current,candidate,{restore=false}={}){
  if(!['mac','iphone'].includes(current.deviceRole))fail('Bitte zuerst die Geräteaufgabe wählen.');
  if(candidate.payload.deviceRole!=='mac'&&!(restore&&current.deviceRole==='iphone'&&candidate.payload.deviceRole==='iphone'))fail('Nur Mac-Dateien sind maßgeblich. Eine Offline-iPhone-Notfallsicherung ist ausschließlich zur bewussten Wiederherstellung auf dem iPhone erlaubt.');
  if(candidate.legacy&&(current.deviceRole!=='mac'||current.people.length))fail('Die alte Mac-Sicherung ist ausschließlich für die erste leere Mac-Einrichtung zulässig.');
  if(current.people.length&&current.datasetId!==candidate.payload.datasetId)fail('Andere Datenbankkennung. Import abgebrochen.');
  const last=current.lastImport;
  if(!restore&&last&&candidate.payload.revision<=last.sourceRevision)fail('Diese Mac-Fassung wurde bereits importiert oder ist älter. Für eine bewusste Wiederherstellung den Wiederherstellungsmodus wählen.');
  return true;
 }
 function replacement(current,candidate,restore=false){
  importGate(current,candidate,{restore});
  return {...clone(current),people:clone(candidate.payload.people),datasetId:candidate.payload.datasetId,revision:current.revision+1,lastImport:{at:new Date().toISOString(),fileSha:candidate.fileSha,sourceRevision:candidate.payload.revision,sourceCreatedAt:candidate.payload.createdAt,restored:restore}};
 }
 return {FORMAT,MAC_SHA,validateLegacyState,clone,sha,summary,validatePeople,validPayload,pack,unpack,empty,readFile,importGate,replacement,uuid};
});
