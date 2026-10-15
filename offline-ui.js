'use strict';
const offlineDB=new OfflineStore.Store();
let pendingOffline=null,verifiedBefore=null,proposedBefore=null,offlineFailed=false;
const offlineError=e=>showMessage('Offline-Sicherheit',e?.message||String(e));
function storageLoad(){return OfflineCore.clone(offlineDB.state?.people||[])}
async function openDB(){await offlineDB.open();return offlineDB.db}
async function idbGetAll(){if(offlineDB.locked)throw Error('Lokaler Speicher ist gesperrt.');return storageLoad()}
async function idbPut(rec){await offlineDB.put(rec);updateConnection()}
function requestAutoSync(){} // Local UI compatibility; no network implementation exists.
function updateConnection(){
 const state=offlineDB.state;const role=state?.deviceRole;
 const status=document.querySelector('#connectionStatus');
 status.textContent=offlineDB.locked?'Speicher gesperrt':role==='mac'?'Mac · lokal gespeichert':role==='iphone'?'iPhone · Lesekopie':'Offline · Einrichtung nötig';
 const last=state?.lastImport;
 document.querySelector('#syncInfo').textContent=last?'Letzter manueller Import: '+new Date(last.at).toLocaleString('de-DE')+' · Mac-Stand '+last.sourceRevision:'Noch kein manueller Abgleich. Keine Cloud-Verbindung.';
 const phone=role!=='mac'||offlineDB.locked;
 document.body.classList.toggle('phone-copy',phone);
 document.querySelector('#newBtn').disabled=phone;
 document.querySelector('#deviceChoice').hidden=!!role&&role!=='unassigned';
 const s=state?OfflineCore.summary(state.people):{count:0,trash:0};
 document.querySelector('#offlineSummary').textContent=(state?'Lokaler Stand '+state.revision+' · ':'')+s.count+' Personen · '+s.trash+' im Papierkorb. '+(role==='mac'?'Mac ist maßgeblich.':'Änderungen nur am Mac.');
 document.querySelector('#backupBtn').textContent=role==='iphone'?'Notfallsicherung dieses iPhones':'Sicherung für iPhone erstellen';
 if(role==='mac'){const lastFile=safePreference('geburtstage_offline_v140_last_export');document.querySelector('#syncInfo').textContent=lastFile?'Letzte Mac-Dateierstellung: '+lastFile+'. Ein Import auf dem iPhone wird hier nicht automatisch bestätigt.':'Noch keine Mac-Datei erstellt. Kein automatischer Geräteabgleich.';}
 document.querySelector('#backupReminder').textContent='Wichtig: Browserdaten sind keine dauerhafte Sicherung. Nach Änderungen und mindestens wöchentlich eine JSON-Datei außerhalb dieser App sichern. Geräteverlust oder gelöschte Browserdaten können auch interne Sicherungen löschen.';
}
async function offlineDownload(envelope,label){
 const text=JSON.stringify(envelope);await OfflineCore.unpack(JSON.parse(text));
 const hash=await OfflineCore.sha(text);
 const file=new File([text],`Geburtstage_${label}_${new Date().toISOString().replace(/[:.]/g,'-')}_sha256-${hash}.json`,{type:'application/json'});
 downloadBlob(file,file.name);return file;
}
async function backupJSON(){
 try{if(offlineDB.locked)throw Error('Beschädigten Speicher nicht als gültige Sicherung exportieren. Wiederherstellung verwenden.');
  const packed=await OfflineCore.pack(offlineDB.state);await offlineDownload(packed,offlineDB.state.deviceRole==='mac'?'MAC_fuer_iPhone':'IPHONE_Notfallsicherung');savePreference('geburtstage_offline_v140_last_export',new Date().toLocaleString('de-DE'));updateConnection();
  showMessage('Sicherungsdatei erstellt','Datei in Downloads/Dateien speichern und bei Bedarf über Teilen → AirDrop senden. Die Datei enthält alle Personen einschließlich Papierkorb. SHA-256 ist eingebettet und im Dateinamen. Ein Download allein bestätigt noch nicht, dass die Datei extern sicher aufbewahrt ist.');
 }catch(e){offlineError(e)}
}
function resetImport(){pendingOffline=null;verifiedBefore=null;proposedBefore=null;document.querySelector('#importApproval').value='';document.querySelector('#applyOfflineImport').disabled=true;document.querySelector('#beforeFile').value='';document.querySelector('#backupReadStatus').textContent='Noch keine Vorher-Sicherungsdatei geprüft.';}
async function importFile(file){
 resetImport();
 try{
  if(offlineDB.state?.deviceRole==='unassigned')throw Error('Bitte zuerst „Mac – maßgeblich“ oder „iPhone – Lesekopie“ wählen.');
  if(file.size>40*1024*1024)throw Error('Datei ist größer als 40 MB.');
  const candidate=await OfflineCore.readFile(await file.text());
  const restore=document.querySelector('#restoreMode').checked;
  OfflineCore.importGate(offlineDB.state,candidate,{restore});
  pendingOffline={candidate,restore,expected:JSON.stringify(offlineDB.state)};
  document.querySelector('#importPreview').textContent=`Geprüfte Datei: ${candidate.summary.count} Personen · ${candidate.summary.trash} im Papierkorb\nSHA-256 (Datei): ${candidate.fileSha}\nMac-Stand: ${candidate.payload.revision}\n${restore?'WIEDERHERSTELLUNG: Ein älterer Stand kann neuere Daten ersetzen.':'Vollständiger Austausch ohne Zusammenführung.'}\nZur Bestätigung eingeben: ERSETZEN ${candidate.fileSha.slice(-8)}`;
  document.querySelector('#createBeforeBackup').disabled=false;
 }catch(e){document.querySelector('#importPreview').textContent=e.message;}
}
function gateApply(){document.querySelector('#applyOfflineImport').disabled=!(pendingOffline&&verifiedBefore&&document.querySelector('#importApproval').value===`ERSETZEN ${pendingOffline.candidate.fileSha.slice(-8)}`)}
function setupOfflineControls(){
 document.querySelector('#offlineToolsBtn').onclick=()=>{resetImport();document.querySelector('#offlineDialog').showModal()};
 document.querySelector('#chooseMac').onclick=()=>chooseDevice('mac');document.querySelector('#choosePhone').onclick=()=>chooseDevice('iphone');
 document.querySelector('#offlineIncoming').onchange=async e=>{const f=e.target.files[0];if(f)await importFile(f);e.target.value=''};
 document.querySelector('#restoreMode').onchange=()=>{resetImport();document.querySelector('#importPreview').textContent='Modus geändert. Bitte Datei erneut auswählen.'};
 document.querySelector('#createBeforeBackup').onclick=async()=>{
  try{if(!pendingOffline)throw Error('Zuerst die eingehende Datei prüfen.');proposedBefore=await OfflineCore.pack(offlineDB.state);await offlineDownload(proposedBefore,'VOR_AUSTAUSCH');document.querySelector('#backupReadStatus').textContent='Vorher-Datei herunterladen. Danach genau diese gespeicherte Datei unten wieder auswählen.';}catch(e){offlineError(e)}
 };
 document.querySelector('#beforeFile').onchange=async e=>{
  verifiedBefore=null;
  try{const f=e.target.files[0];if(!f||!proposedBefore)throw Error('Zuerst die Vorher-Sicherung erstellen.');const result=await OfflineCore.readFile(await f.text());
   if(result.envelope.payload!==proposedBefore.payload||JSON.stringify(offlineDB.state)!==pendingOffline.expected)throw Error('Vorher-Sicherung passt nicht zum aktuellen Gerätebestand.');
   verifiedBefore=result.fileSha;document.querySelector('#backupReadStatus').textContent='Vorher-Sicherungsdatei unabhängig zurückgelesen und geprüft. SHA-256: '+verifiedBefore;
  }catch(e){document.querySelector('#backupReadStatus').textContent=e.message;}gateApply();
 };
 document.querySelector('#importApproval').oninput=gateApply;
 document.querySelector('#applyOfflineImport').onclick=async()=>{
  if(!pendingOffline||!verifiedBefore)return;
  const job=pendingOffline;document.querySelector('#applyOfflineImport').disabled=true;pendingOffline=null;
  try{
   if(JSON.stringify(offlineDB.state)!==job.expected)throw Error('Gerätebestand wurde inzwischen verändert. Bitte den Vorgang neu prüfen.');
   const result=await offlineDB.replace(job.candidate,{restore:job.restore});
   if(JSON.stringify(result.people)!==JSON.stringify(job.candidate.payload.people)||JSON.stringify(OfflineCore.summary(result.people))!==JSON.stringify(job.candidate.summary))throw Error('Import-Nachprüfung abweichend. Nicht wiederholen.');
   selected.clear();await refresh();updateConnection();
   document.querySelector('#offlineDialog').close();
   showMessage('Austausch geprüft',`${result.people.length} Personen · ${OfflineCore.summary(result.people).trash} im Papierkorb. Der vollständige Inhalt wurde nach dem Speichern erneut geprüft. Die Vorher-Sicherung bleibt erhalten.`);
  }catch(e){offlineError(e);}finally{resetImport();}
 };
 document.querySelector('#exportInternalBackup').onclick=async()=>{
  try{const backups=await offlineDB.backups();if(!backups.length)throw Error('Noch keine interne Sicherung vorhanden.');
   const dialog=document.querySelector('#internalBackups');dialog.replaceChildren();
   for(const entry of backups){let p;try{p=await OfflineCore.unpack(entry.envelope);}catch{const note=document.createElement('p');note.textContent=entry.key+': Beschädigter Rohzustand bleibt erhalten; keine gültige Sicherungsdatei.';dialog.append(note);continue;}
    const button=document.createElement('button');button.type='button';button.textContent=`${entry.key} · Stand ${p.revision} · ${p.people.length} Personen`;button.onclick=()=>offlineDownload(entry.envelope,'INTERNE_SICHERUNG').catch(offlineError);dialog.append(button);}
  }catch(e){offlineError(e)}
 };
 document.querySelector('#requestPersistence').onclick=async()=>{try{const ok=await navigator.storage?.persist?.();document.querySelector('#persistenceStatus').textContent=ok?'Beständiger Browserspeicher gewährt. Externe Dateien bleiben trotzdem nötig.':'Browser gewährt keinen beständigen Speicher. Externe Sicherungsdateien sind besonders wichtig.';}catch(e){offlineError(e)}};
 document.querySelector('#recoveryBackups').onclick=async()=>{document.querySelector('#offlineDialog').showModal();document.querySelector('#offlineIncoming').disabled=true;await document.querySelector('#exportInternalBackup').onclick();};
 document.querySelector('#recoverIncoming').onchange=async e=>{
  const file=e.target.files[0];e.target.value='';if(!file)return;
  try{const c=await OfflineCore.readFile(await file.text());const role=document.querySelector('#recoveryRole').value;if(c.legacy||!(c.payload.deviceRole==='mac'||role==='iphone'&&c.payload.deviceRole==='iphone'))throw Error('Eine geprüfte Offline-Sicherung wählen. iPhone-Sicherungen dürfen nur auf ein iPhone zurück.');
   if(!confirm(`Beschädigten lokalen Speicher aus ${c.summary.count} Personen wiederherstellen? Der beschädigte Zustand wird intern unverändert gesichert. Nur auf diesem Gerät.`))return;
   await offlineDB.recover(c,role);location.reload();
  }catch(e){offlineError(e)}
 };
}
async function chooseDevice(role){try{await offlineDB.setRole(role);updateConnection();}catch(e){offlineError(e)}}
async function init(){
 setupMonths();buildFieldChecklist();setupEvents();setupOfflineControls();restoreExportPrefs();applyLanguage();
 try{await openDB();await refresh();updateConnection();document.querySelector('#offlineReady').textContent='IndexedDB geprüft · keine Cloud-Verbindung';}
 catch(e){offlineFailed=true;document.querySelector('#recoveryPanel').hidden=false;document.querySelector('#offlineReady').textContent='Speicher nicht verfügbar oder beschädigt. Nichts wurde ersetzt.';document.querySelectorAll('#newBtn,#importBtn,#offlineToolsBtn,#backupBtn,#chooseMac,#choosePhone').forEach(b=>b.disabled=true);offlineError(e);}
 if('serviceWorker' in navigator&&['https:','http:'].includes(location.protocol)){
  try{await navigator.serviceWorker.register('./sw.js');await navigator.serviceWorker.ready;document.querySelector('#cacheStatus').textContent='App-Code ist für Offline-Starts vorbereitet.';}catch{document.querySelector('#cacheStatus').textContent='Offline-Appcache nicht verfügbar. App-Code lokal behalten; Installation vor Umstellung prüfen.';}
 }
}
document.addEventListener('DOMContentLoaded',init);
