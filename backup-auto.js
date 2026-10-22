'use strict';
// Optional Mac backup module. No network access and no modification of person records.
(function(){
 const delay=30000, dbName='geburtstage-backup-targets-v1';
 let handles={}, fingerprints={}, timer=null, busy=false, dirty=false, status, setupButtons={};
 function note(message){if(status)status.textContent=message;}
 function storeOpen(){return new Promise((resolve,reject)=>{const r=indexedDB.open(dbName,1);r.onupgradeneeded=()=>r.result.createObjectStore('settings');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
 async function setting(key,value){
  const db=await storeOpen();
  try{return await new Promise((resolve,reject)=>{const tx=db.transaction('settings',arguments.length===1?'readonly':'readwrite');const os=tx.objectStore('settings');const q=arguments.length===1?os.get(key):os.put(value,key);q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);tx.onabort=()=>reject(tx.error);});}
  finally{db.close();}
 }
 async function hashPeople(){return OfflineCore.sha(JSON.stringify(offlineDB.state.people));}
 async function permission(handle,ask=false){
  if(!handle)return false;
  const opts={mode:'readwrite'};
  if(await handle.queryPermission(opts)==='granted')return true;
  return ask&&(await handle.requestPermission(opts)==='granted');
 }
 async function writeVerified(handle,envelope,filename){
  const text=JSON.stringify(envelope),file=await handle.getFileHandle(filename,{create:true});
  const writer=await file.createWritable();await writer.write(text);await writer.close();
  const reread=await (await file.getFile()).text();
  if(reread!==text)throw Error('Leserückprüfung fehlgeschlagen');
  await OfflineCore.readFile(reread);
 }
 async function run(){
  if(busy||!dirty||offlineDB.locked||offlineDB.state?.deviceRole!=='mac')return;
  busy=true;
  try{
   const current=await hashPeople();
   const needed=['mac','icloud'].filter(k=>fingerprints[k]!==current);
   if(!needed.length){dirty=false;note('Aktueller Datenstand ist bereits gesichert.');return;}
   const denied=[];
   for(const k of needed)if(!await permission(handles[k]))denied.push(k);
   if(denied.length){note('Sicherung ausstehend: Ordnerberechtigung fehlt für '+denied.join(', ')+'. Bitte Ordner erneut freigeben.');return;}
   const snapshot=OfflineCore.clone(offlineDB.state);
   const packed=await OfflineCore.pack(snapshot);
   const name='Geburtstage_MAC_Stand-'+snapshot.revision+'_'+new Date().toISOString().replace(/[:.]/g,'-')+'_sha256-'+packed.sha256+'.json';
   for(const k of needed){
    try{
     await writeVerified(handles[k],packed,name);
     fingerprints[k]=current;
     await setting('fingerprints',fingerprints);
    }catch(e){note('Sicherung für '+k+' fehlgeschlagen: '+e.message);return;}
   }
   dirty=(await hashPeople())!==current;
   note('Sicherung geprüft: Mac und iCloud-Drive-Ordner beschrieben. iCloud-Synchronisierung selbst wird von macOS verwaltet.');
  }catch(e){note('Sicherung fehlgeschlagen: '+e.message)}
  finally{busy=false;if(dirty)schedule();}
 }
 function schedule(){clearTimeout(timer);timer=setTimeout(run,delay);}
 async function selectTarget(key){
  if(!globalThis.showDirectoryPicker){note('Diese Anwendung unterstützt keine automatische Ordnerauswahl. Die manuelle JSON-Sicherung bleibt erforderlich.');return;}
  try{
   const handle=await showDirectoryPicker({mode:'readwrite',id:'geburtstage-'+key});
   if(!await permission(handle,true))throw Error('Schreibberechtigung nicht erteilt');
   handles[key]=handle;await setting('handle-'+key,handle);
   dirty=true;note('Ordner '+key+' eingerichtet. Erste Sicherung wird geprüft.');schedule();
  }catch(e){if(e.name!=='AbortError')note('Ordner nicht eingerichtet: '+e.message)}
 }
 async function start(){
  const container=document.querySelector('#backupReminder')?.parentElement;
  if(!container)return;
  const wrap=document.createElement('section');
  wrap.style.cssText='padding:12px;border:1px solid #d8c5ae;border-radius:9px;margin-top:12px';
  const title=document.createElement('strong');title.textContent='Automatische Sicherung nach Änderungen (Testversion 1.4.1)';
  status=document.createElement('p');status.setAttribute('role','status');status.textContent='Ordner werden geprüft.';
  wrap.append(title,status);
  for(const [key,label] of [['mac','Mac-Ordner wählen / Berechtigung erneuern'],['icloud','iCloud-Drive-Ordner wählen / Berechtigung erneuern']]){
   const button=document.createElement('button');button.type='button';button.textContent=label;button.style.margin='4px';button.onclick=()=>selectTarget(key);wrap.append(button);setupButtons[key]=button;
  }
  container.append(wrap);
  try{
   for(const k of ['mac','icloud'])handles[k]=await setting('handle-'+k);
   fingerprints=await setting('fingerprints')||{};
   if(offlineDB.state?.deviceRole!=='mac'){wrap.hidden=true;return;}
   if(!globalThis.showDirectoryPicker){note('Automatische Dateisicherung wird von dieser App-Umgebung nicht unterstützt. Bitte weiterhin manuell sichern.');return;}
   const current=await hashPeople();
   dirty=['mac','icloud'].some(k=>fingerprints[k]!==current);
   if(dirty){note('Änderungen noch nicht in beiden Ordnern gesichert. Ordner auswählen oder Berechtigung erneuern.');if(handles.mac&&handles.icloud)schedule();}
   else note('Datenstand in beiden Ordnern gesichert. Neue Sicherung nur nach Änderungen.');
  }catch(e){note('Einrichtung nicht abgeschlossen: '+e.message)}
 }
 // Hook only successful database commits. Never write to the main database.
 const original=offlineDB.commit.bind(offlineDB);
 offlineDB.commit=async function(next,opts){
  const before=JSON.stringify(this.state?.people||[]);
  const result=await original(next,opts);
  if(this.state?.deviceRole==='mac'&&before!==JSON.stringify(this.state.people)){
   dirty=true;schedule();note('Daten geändert. Sicherung in 30 Sekunden vorgesehen.');
  }
  return result;
 };
 document.addEventListener('DOMContentLoaded',()=>{let tries=0;const wait=()=>{if(offlineDB.state||offlineDB.locked)start();else if(++tries<40)setTimeout(wait,250);};wait();});
})();
