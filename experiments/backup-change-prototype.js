/* Prototype 1.4.1: isolated, synthetic-data-only change detection.
   Not loaded by index.html. No access to production IndexedDB. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 root.BackupChangePrototype=api;
})(globalThis,()=>{
 'use strict';
 function peopleChanged(before,after){
  if(!before||!after||!Array.isArray(before.people)||!Array.isArray(after.people))throw Error('Ungültiger Zustand');
  return JSON.stringify(before.people)!==JSON.stringify(after.people);
 }
 function createScheduler({delay=30000,onBackup,onError=()=>{}}){
  if(typeof onBackup!=='function')throw Error('onBackup fehlt');
  let timer=null,pending=null,writing=false;
  async function flush(){
   if(writing||!pending)return;
   const snapshot=pending;pending=null;writing=true;
   try{await onBackup(snapshot)}
   catch(e){pending=snapshot;onError(e)}
   finally{writing=false;if(pending&&!timer)timer=setTimeout(()=>{timer=null;flush()},delay)}
  }
  return {
   changed(before,after){
    if(!peopleChanged(before,after))return false;
    pending=structuredClone(after);
    if(timer)clearTimeout(timer);
    timer=setTimeout(()=>{timer=null;flush()},delay);
    return true;
   },
   flush,
   cancel(){if(timer)clearTimeout(timer);timer=null;},
   get pending(){return !!pending}
  };
 }
 return {peopleChanged,createScheduler};
});
