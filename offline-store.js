(function(root,factory){const api=factory(root.OfflineCore);if(typeof module==='object'&&module.exports)module.exports=api;root.OfflineStore=api;})(globalThis,Core=>{
 'use strict';
 class Store{
  constructor(name='geburtstage-offline-v140'){this.name=name;this.db=null;this.state=null;this.envelope=null;this.locked=false;this.busy=false;}
  async open(){
   this.db=await new Promise((resolve,reject)=>{const req=indexedDB.open(this.name,1);req.onupgradeneeded=()=>{for(const s of ['state','backups','journal'])req.result.createObjectStore(s)};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);req.onblocked=()=>reject(Error('Andere App-Fenster schließen und erneut öffnen.'));});
   this.db.onversionchange=()=>{this.locked=true;this.db.close();};
   const saved=await this.get('state','current');
   if(saved){this.envelope=saved;try{this.state=await Core.unpack(saved);}catch(error){this.locked=true;throw Error('Lokaler Bestand beschädigt. Nichts wurde ersetzt. Geprüfte Sicherung über den Wiederherstellungsbereich verwenden. '+error.message);}}
   else{if(await this.count('journal')||await this.count('backups')){this.locked=true;throw Error('Lokaler Hauptbestand fehlt, aber Sicherungsreste sind vorhanden. Kein automatischer Neustart.');}this.state=Core.empty();this.envelope=null;}
   return Core.clone(this.state);
  }
  get(store,key){return new Promise((resolve,reject)=>{const t=this.db.transaction(store);const q=t.objectStore(store).get(key);q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);});}
  count(store){return new Promise((resolve,reject)=>{const q=this.db.transaction(store).objectStore(store).count();q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);});}
  async commit(next,{replace=false,op='edit'}={}){
   if(this.locked||this.busy)throw Error('Speicher gesperrt oder ein Vorgang läuft. Kein automatischer Wiederholungsversuch.');
   this.busy=true;
   try{
    const expected=this.envelope;const packed=await Core.pack(next);const opId=Core.uuid();
    await new Promise((resolve,reject)=>{
     const tx=this.db.transaction(['state','backups','journal'],'readwrite');let conflict=false;
     const state=tx.objectStore('state'),request=state.get('current');
     request.onsuccess=()=>{
      if(JSON.stringify(request.result||null)!==JSON.stringify(expected)){conflict=true;tx.abort();return;}
      if(expected){tx.objectStore('backups').put(expected,replace?'before-replace-'+opId:'last-good');}
      state.put(packed,'current');
      tx.objectStore('journal').put({opId,op,at:new Date().toISOString(),before:expected?.sha256||null,after:packed.sha256,status:'committed'},opId);
     };
     tx.oncomplete=resolve;
     tx.onabort=()=>reject(Error(conflict?'Ein anderes Fenster hat den Bestand geändert. Bitte neu öffnen.':('Speichern nicht abgeschlossen; bisheriger Bestand bleibt erhalten. '+(tx.error?.message||'Abbruch, möglicherweise Speicherplatzmangel.'))));
     tx.onerror=()=>{};
    });
    this.state=Core.clone(next);this.envelope=packed;
    try{const saved=await this.get('state','current');if(JSON.stringify(saved)!==JSON.stringify(packed))throw Error('Leserückprüfung abweichend.');await Core.unpack(saved);}catch(e){this.locked=true;throw Error('Speicherergebnis unklar. Nicht wiederholen. App neu öffnen und letzten Bestand prüfen. '+e.message);}
    return Core.clone(this.state);
   }finally{this.busy=false;}
  }
  async setRole(role){if(this.state.deviceRole!=='unassigned'||this.state.people.length)throw Error('Geräteaufgabe ist bereits festgelegt.');if(!['mac','iphone'].includes(role))throw Error('Ungültige Geräteaufgabe.');return this.commit({...this.state,deviceRole:role,revision:this.state.revision+1},{op:'choose-role'});}
  async put(record){
   if(this.state.deviceRole!=='mac')throw Error('Diese iPhone-Kopie ist nur lesbar. Änderungen bitte am Mac vornehmen.');
   const list=Core.clone(this.state.people);const i=list.findIndex(p=>p['Personen-ID']===record['Personen-ID']);if(i>=0)list[i]=Core.clone(record);else{Core.validatePeople([record],{requireName:true});list.push(Core.clone(record));}
   return this.commit({...this.state,people:list,revision:this.state.revision+1},{op:'save-person'});
  }
  async replace(candidate,options={}){const next=Core.replacement(this.state,candidate,options.restore);return this.commit(next,{replace:true,op:options.restore?'restore':'replace'});}
  async recover(candidate,role){
   if(!this.locked||!this.db||!['mac','iphone'].includes(role)||candidate.legacy||!(candidate.payload.deviceRole==='mac'||role==='iphone'&&candidate.payload.deviceRole==='iphone'))throw Error('Wiederherstellung ist hier nicht zulässig. Ein Mac darf keine iPhone-Sicherung übernehmen.');
   await Core.unpack(candidate.envelope);
   const next={...Core.clone(candidate.payload),deviceRole:role,revision:candidate.payload.revision+1,lastImport:{at:new Date().toISOString(),sourceRevision:candidate.payload.revision,fileSha:candidate.fileSha,restored:true}};
   this.locked=false;
   try{return await this.commit(next,{replace:true,op:'explicit-corruption-recovery'});}catch(e){this.locked=true;throw e;}
  }
  async backups(){return new Promise((resolve,reject)=>{const out=[],tx=this.db.transaction('backups'),q=tx.objectStore('backups').openCursor();q.onsuccess=()=>{if(q.result){out.push({key:q.result.key,envelope:q.result.value});q.result.continue();}else resolve(out)};q.onerror=()=>reject(q.error);});}
 }
 return {Store};
});
