function safePreference(key){try{return localStorage.getItem(key)}catch{return null}}
function savePreference(k,v){try{localStorage.setItem(k,v)}catch{}}
'use strict';

const DB_NAME='geburtstage-offline-v140';
const DB_VERSION=1;
const PEOPLE_STORE='people';
const META_STORE='meta';
const APP_VERSION='1.4.0-offline-dev';

const FIELDS=[
  'Personen-ID','Status','Anrede','Vorname Thai','Nachname Thai','Vorname Deutsch/Latein','Nachname Deutsch/Latein','Name Thai','Name Deutsch/Latein','Vorname','Nachname','Geburtsname','Spitzname','Kartenname','Lateinischer Name','Sprache',
  'Geburtstag laut Pass','Tatsächlicher Geburtstag','Geburtstag: Tag','Geburtstag: Monat','Geburtsjahr n. Chr.','Geburtsjahr B.E.',
  'Wochentag (Thai)','Wochentag (Deutsch)','Aktuelles Alter','12-Jahres-Tierzeichen','Sternzeichen','Horoskop','Haupttempel','Telefon','E-Mail','Straße und Hausnummer','Postleitzahl (PLZ)','Ort','Bundesland / Provinz','Land','Adresse','Link zum Profilfoto',
  'Link zum Fotoordner','Fotostatus','Notizen','Mönchsname','Kirchlicher Rang','Sterbedatum','Gedenkerinnerung',
  'Im Papierkorb seit','Erstellt am','Geändert am'
];

const DATE_FIELDS=new Set(['Geburtstag laut Pass','Tatsächlicher Geburtstag','Sterbedatum']);
const DATETIME_FIELDS=new Set(['Im Papierkorb seit','Erstellt am','Geändert am']);
const NUMBER_FIELDS=new Set(['Geburtstag: Tag','Geburtstag: Monat','Geburtsjahr n. Chr.','Geburtsjahr B.E.','Aktuelles Alter']);
const TEXTAREA_FIELDS=new Set(['Adresse','Notizen']);
const CONTACT_PRESET=['Vorname Thai','Nachname Thai','Vorname Deutsch/Latein','Nachname Deutsch/Latein','Name Thai','Name Deutsch/Latein','Status','Personen-ID','Anrede','Vorname','Nachname','Geburtsname','Spitzname','Kartenname','Lateinischer Name','Geburtstag laut Pass','Tatsächlicher Geburtstag','Geburtstag: Tag','Geburtstag: Monat','Geburtsjahr n. Chr.','Telefon','E-Mail','Straße und Hausnummer','Postleitzahl (PLZ)','Ort','Bundesland / Provinz','Land','Adresse','Haupttempel','Notizen'];
const BIRTHDAY_PRESET=['Vorname Thai','Nachname Thai','Vorname Deutsch/Latein','Nachname Deutsch/Latein','Name Thai','Name Deutsch/Latein','Anrede','Status','Adresse','Personen-ID','Kartenname','Vorname','Nachname','Spitzname','Geburtstag: Tag','Geburtstag: Monat','Geburtsjahr n. Chr.','Aktuelles Alter','12-Jahres-Tierzeichen','Sternzeichen','Horoskop','Haupttempel','Sprache'];
const LANG_KEY='geburtstage_offline_v140_language';
const EXPORT_PREF_KEY='geburtstage_offline_v140_export_pref';
let currentLang=safePreference(LANG_KEY)||'de';
const I18N={
 de:{appTitle:'Geburtstagsdatenbank',subtitle:'Offline · Mac als Original · iPhone-Kopie per AirDrop',installApp:'App installieren',people:'Personen',withBirthday:'mit Geburtstag',selected:'ausgewählt',trash:'im Papierkorb',search:'Suche',temple:'Tempel',month:'Monat',view:'Ansicht',newPerson:'+ Neue Person',export:'Exportieren',import:'Importieren',backup:'Sicherung (JSON)',selectVisible:'Sichtbare auswählen',clearSelection:'Auswahl aufheben',name:'Name',birthday:'Geburtstag',weekday:'Wochentag',age:'Alter',animalZodiac:'12-Jahres-Tierzeichen',starSign:'Sternzeichen',horoscope:'Horoskop',language:'Sprache',contact:'Kontakt',action:'Aktion',exportData:'Daten exportieren',exportDesc:'Personen, Datenfelder und Dateiformat frei auswählen.',whichPeople:'1. Welche Personen?',onlySelected:'Nur ausgewählte Personen',allFiltered:'Alle aktuell sichtbaren/gefilterten Personen',allCurrentView:'Alle Personen der aktuellen Ansicht',whichData:'2. Welche Daten?',allData:'Alle Daten auswählen',preset:'Voreinstellung',presetBirthday:'Geburtstagsliste',presetContact:'Kontaktfelder',presetCalendar:'Kalender',format:'3. Format',contacts:'Kontakte',calendar:'Kalender',cancel:'Abbrechen',allTemples:'Alle Tempel',allMonths:'Alle Monate',activePeople:'Aktive Personen',allRecords:'Alle Datensätze',noRecords:'Keine passenden Datensätze.',recordsVisible:'Datensätze sichtbar',nickname:'Spitzname',view:'Ansehen',edit:'Bearbeiten',restore:'Wiederherstellen',trashBtn:'Papierkorb',newPersonTitle:'Neue Person',editPerson:'Person bearbeiten',custom:'Eigene Auswahl',checkDuplicates:'Doppelte prüfen',duplicateTitle:'Mögliche doppelte Einträge',duplicateDesc:'Die App zeigt nur Verdachtsfälle. Es wird nichts automatisch gelöscht.',duplicateReason:'Grund',personOne:'Person 1',personTwo:'Person 2',close:'Schließen',duplicateNone:'Keine möglichen Doppel-Einträge gefunden.',duplicateFound:'mögliche Doppel-Einträge gefunden',sameName:'gleicher Name',sameEmail:'gleiche E-Mail',samePhone:'gleiche Telefonnummer',sameBirthdayName:'ähnlicher Name + gleicher Geburtstag'},
 th:{appTitle:'ฐานข้อมูลวันเกิด',subtitle:'ออฟไลน์ · Mac เป็นข้อมูลหลัก · ส่งสำเนาด้วย AirDrop',installApp:'ติดตั้งแอป',people:'บุคคล',withBirthday:'มีวันเกิด',selected:'เลือกแล้ว',trash:'ในถังพัก',search:'ค้นหา',temple:'วัด',month:'เดือน',view:'มุมมอง',newPerson:'+ เพิ่มบุคคล',export:'ส่งออก',import:'นำเข้า',backup:'สำรองข้อมูล (JSON)',selectVisible:'เลือกที่มองเห็นทั้งหมด',clearSelection:'ยกเลิกการเลือก',name:'ชื่อ',birthday:'วันเกิด',weekday:'วันเกิดตามสัปดาห์',age:'อายุ',animalZodiac:'นักษัตร 12 ปี',starSign:'ราศีตะวันตก',horoscope:'คำทำนาย',language:'ภาษา',contact:'ติดต่อ',action:'จัดการ',exportData:'ส่งออกข้อมูล',exportDesc:'เลือกบุคคล ฟิลด์ข้อมูล และรูปแบบไฟล์ได้ตามต้องการ',whichPeople:'1. เลือกบุคคลใด?',onlySelected:'เฉพาะบุคคลที่เลือก',allFiltered:'บุคคลที่แสดง/กรองอยู่ทั้งหมด',allCurrentView:'บุคคลทั้งหมดในมุมมองปัจจุบัน',whichData:'2. เลือกข้อมูลใด?',allData:'เลือกข้อมูลทั้งหมด',preset:'รูปแบบสำเร็จรูป',presetBirthday:'รายการวันเกิด',presetContact:'ข้อมูลติดต่อ',presetCalendar:'ปฏิทิน',format:'3. รูปแบบไฟล์',contacts:'รายชื่อผู้ติดต่อ',calendar:'ปฏิทิน',cancel:'ยกเลิก',allTemples:'ทุกวัด',allMonths:'ทุกเดือน',activePeople:'บุคคลที่ใช้งาน',allRecords:'ข้อมูลทั้งหมด',noRecords:'ไม่พบข้อมูลที่ตรงกัน',recordsVisible:'รายการที่แสดง',nickname:'ชื่อเล่น',view:'ดูข้อมูล',edit:'แก้ไข',restore:'กู้คืน',trashBtn:'ถังพัก',newPersonTitle:'เพิ่มบุคคล',editPerson:'แก้ไขบุคคล',custom:'เลือกเอง',checkDuplicates:'ตรวจหารายการซ้ำ',duplicateTitle:'รายการที่อาจซ้ำกัน',duplicateDesc:'แอปจะแสดงเฉพาะรายการที่น่าสงสัยและจะไม่ลบข้อมูลอัตโนมัติ',duplicateReason:'เหตุผล',personOne:'บุคคล 1',personTwo:'บุคคล 2',close:'ปิด',duplicateNone:'ไม่พบรายการที่อาจซ้ำกัน',duplicateFound:'รายการที่อาจซ้ำกัน',sameName:'ชื่อเหมือนกัน',sameEmail:'อีเมลเหมือนกัน',samePhone:'เบอร์โทรศัพท์เหมือนกัน',sameBirthdayName:'ชื่อคล้ายกัน + วันเกิดเดียวกัน'}
};
const FIELD_LABELS_TH={
'Personen-ID':'รหัสบุคคล','Status':'สถานะ','Anrede':'คำนำหน้า','Vorname':'ชื่อ','Nachname':'นามสกุล','Geburtsname':'นามสกุลเดิม / ชื่อเกิด','Spitzname':'ชื่อเล่น','Kartenname':'ชื่อบนการ์ด','Lateinischer Name':'ชื่ออักษรละติน','Sprache':'ภาษา','Geburtstag laut Pass':'วันเกิดตามพาสปอร์ต','Tatsächlicher Geburtstag':'วันเกิดจริง','Geburtstag: Tag':'วันที่เกิด','Geburtstag: Monat':'เดือนเกิด','Geburtsjahr n. Chr.':'ปีเกิด ค.ศ.','Geburtsjahr B.E.':'ปีเกิด พ.ศ.','Wochentag (Thai)':'วันเกิด (ไทย)','Wochentag (Deutsch)':'วันเกิด (เยอรมัน)','Aktuelles Alter':'อายุปัจจุบัน','12-Jahres-Tierzeichen':'นักษัตร 12 ปี','Sternzeichen':'ราศีตะวันตก','Horoskop':'คำทำนายตามราศี','Haupttempel':'วัดหลัก','Telefon':'โทรศัพท์','E-Mail':'อีเมล','Adresse':'ที่อยู่','Link zum Profilfoto':'ลิงก์รูปประจำตัว','Link zum Fotoordner':'ลิงก์โฟลเดอร์รูป','Fotostatus':'สถานะรูป','Notizen':'หมายเหตุ','Mönchsname':'ฉายาพระ','Kirchlicher Rang':'สมณศักดิ์','Sterbedatum':'วันที่เสียชีวิต','Gedenkerinnerung':'เตือนวันครบรอบ','Im Papierkorb seit':'อยู่ในถังพักตั้งแต่','Erstellt am':'สร้างเมื่อ','Geändert am':'แก้ไขเมื่อ'};
function tr(k){return I18N[currentLang]?.[k]||I18N.de[k]||k}
function fieldLabel(f){if(f==='Vorname Thai')return 'Vorname Thai / ชื่อภาษาไทย';if(f==='Nachname Thai')return 'Nachname Thai / นามสกุลภาษาไทย';if(f==='Vorname Deutsch/Latein')return 'Vorname Deutsch / Latein';if(f==='Nachname Deutsch/Latein')return 'Nachname Deutsch / Latein';if(f==='Name Thai')return 'Name Thai / ชื่อภาษาไทย';if(f==='Name Deutsch/Latein')return 'Name Deutsch / Latein';return currentLang==='th'?(FIELD_LABELS_TH[f]||f):f}
function applyLanguage(){
 document.documentElement.lang=currentLang==='th'?'th':'de';
 document.querySelectorAll('[data-i18n]').forEach(el=>{const k=el.dataset.i18n;if(tr(k))el.textContent=tr(k)});
 $('#langDeBtn')?.classList.toggle('active',currentLang==='de');$('#langThBtn')?.classList.toggle('active',currentLang==='th');
 if($('#searchInput'))$('#searchInput').placeholder=currentLang==='th'?'ชื่อ โทรศัพท์ อีเมล หมายเหตุ …':'Name, Telefon, E-Mail, Notiz …';
 if($('#templeFilter')?.options[0])$('#templeFilter').options[0].textContent=tr('allTemples');
 setupMonths();
 if($('#viewFilter')){const v=$('#viewFilter');if(v.options[0])v.options[0].textContent=tr('activePeople');if(v.options[1])v.options[1].textContent=tr('trashBtn');if(v.options[2])v.options[2].textContent=tr('allRecords')}
 const ps=$('#presetSelect');if(ps){ps.options[0].textContent=tr('presetBirthday');ps.options[1].textContent=tr('presetContact');ps.options[2].textContent=tr('presetCalendar');ps.options[3].textContent=tr('allData');ps.options[4].textContent=tr('custom')}
 buildFieldChecklist(true);render();updateConnection();
 savePreference(LANG_KEY,currentLang);
}
function setLanguage(lang){currentLang=lang==='th'?'th':'de';applyLanguage()}

const CALENDAR_PRESET=['Vorname Thai','Nachname Thai','Vorname Deutsch/Latein','Nachname Deutsch/Latein','Kartenname','Vorname','Nachname','Spitzname','Geburtstag: Tag','Geburtstag: Monat','Geburtsjahr n. Chr.','Haupttempel'];

let db=null;
let people=[];
let filtered=[];
let selected=new Set();
let editingId=null;
let deferredPrompt=null;

const $=sel=>document.querySelector(sel);
const $$=sel=>Array.from(document.querySelectorAll(sel));

function esc(s=''){
  return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}
function xmlEsc(s=''){
  return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
}
function filenameSafe(s){return String(s).replace(/[\\/:*?"<>|]+/g,'-').replace(/\s+/g,'_').slice(0,120)}
function pad(n){return String(n).padStart(2,'0')}
function todayISO(){return new Date().toISOString().slice(0,10)}
function nowISO(){return new Date().toISOString().slice(0,19)}
function downloadBlob(blob,name){const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1500)}
function showMessage(title,text){$('#messageTitle').textContent=title;$('#messageText').textContent=text;$('#messageDialog').showModal()}

// Full legacy names are never split on spaces: compound names are ambiguous.
const NAME_PART_FIELDS=['Vorname Thai','Nachname Thai','Vorname Deutsch/Latein','Nachname Deutsch/Latein'];
const LEGACY_NAME_FIELDS=['Name Thai','Name Deutsch/Latein','Vorname','Nachname','Lateinischer Name','Kartenname'];
function nameParts(p){
  const result={};
  const first=String(p['Vorname']||'').trim(),last=String(p['Nachname']||'').trim();
  const joined=[first,last].filter(Boolean).join(' ');
  const script=v=>/[\u0E00-\u0E7F]/u.test(v)&&!/\p{Script=Latin}/u.test(v)?'thai':/\p{Script=Latin}/u.test(v)&&!/[\u0E00-\u0E7F]/u.test(v)?'latin':'';
  for(const [language,firstKey,lastKey,fullKey] of [
    ['thai','Vorname Thai','Nachname Thai','Name Thai'],
    ['latin','Vorname Deutsch/Latein','Nachname Deutsch/Latein','Name Deutsch/Latein']
  ]){
    const full=String(p[fullKey]|| (language==='latin'?p['Lateinischer Name']:'')||'').trim();
    // Only use existing explicit first/last boundaries if the full name agrees.
    const compatible=!full||full===joined;
    result[firstKey]=p[firstKey]??(compatible&&script(first)===language?first:'');
    result[lastKey]=p[lastKey]??(compatible&&script(last)===language?last:'');
  }
  return result;
}
function personNames(p){
  const parts=nameParts(p);
  let thai=[parts['Vorname Thai'],parts['Nachname Thai']].filter(Boolean).join(' ').trim();
  let latin=[parts['Vorname Deutsch/Latein'],parts['Nachname Deutsch/Latein']].filter(Boolean).join(' ').trim();
  // Keep unresolved complete names visible until the user assigns their parts.
  thai=thai||String(p['Name Thai']||'').trim();
  latin=latin||String(p['Name Deutsch/Latein']||p['Lateinischer Name']||'').trim();
  if(!thai&&!latin)latin=[p['Vorname'],p['Nachname']].filter(Boolean).join(' ')||p['Kartenname']||'';
  if(thai===latin)latin='';
  return {thai,latin};
}
function legacyNamesHint(p){
  const values=LEGACY_NAME_FIELDS.filter(f=>p[f]).map(f=>`<div><strong>${esc(f)}:</strong> ${esc(p[f])}</div>`).join('');
  return values?`<details class="span-3"><summary>Bisherige Namen (unverändert erhalten)</summary><p>Vollständige Namen werden nicht automatisch an Leerzeichen geteilt. Bitte unklare Namen bei Bedarf den vier Feldern zuordnen.</p>${values}</details>`:'';
}
function isActive(p){return !['inaktiv','inactive','ไม่ใช้งาน','ปิดใช้งาน','verstorben','เสียชีวิต','papierkorb'].includes(String(p['Status']||'').trim().toLowerCase())}
function birthdayEligible(p){return isActive(p)&&!p['Im Papierkorb seit']&&!p['Sterbedatum']}
function nameMarkup(p){const n=personNames(p);return esc(displayName(p))+(n.thai&&n.latin?`<span class="person-sub">${esc(n.latin)}</span>`:'')}
function displayName(p){const n=personNames(p);return n.thai||n.latin||p['Spitzname']||p['Personen-ID']||'Ohne Namen'}

function birthdayParts(p){
  const actual=p['Tatsächlicher Geburtstag']; const pass=p['Geburtstag laut Pass'];
  const source=actual||pass;
  if(source && /^\d{4}-\d{2}-\d{2}/.test(source)){
    const [y,m,d]=source.slice(0,10).split('-').map(Number);return {y,m,d};
  }
  const d=Number(p['Geburtstag: Tag']); const m=Number(p['Geburtstag: Monat']); const y=Number(p['Geburtsjahr n. Chr.']);
  return {y:y||null,m:m||null,d:d||null};
}
function birthdayLabel(p){const {y,m,d}=birthdayParts(p);if(!m||!d)return '–';return `${pad(d)}.${pad(m)}.${y||''}`.replace(/\.$/,'')}
function calcAge(p){const {y,m,d}=birthdayParts(p);if(!y||!m||!d)return '';const now=new Date();let a=now.getFullYear()-y;if(now.getMonth()+1<m||(now.getMonth()+1===m&&now.getDate()<d))a--;return a>=0?a:''}
function normalizeRecord(p){
  const out={...p};FIELDS.forEach(f=>out[f]=p[f]??'');
  Object.assign(out,nameParts(p),addressParts(p));
  if(!out['Personen-ID']) out['Personen-ID']=nextId();
  const bp=birthdayParts(out);
  // Existing date components are never rewritten while loading or synchronizing.
  if(!Object.hasOwn(p,'Geburtstag: Tag')&&bp.d)out['Geburtstag: Tag']=bp.d;
  if(!Object.hasOwn(p,'Geburtstag: Monat')&&bp.m)out['Geburtstag: Monat']=bp.m;
  if(!Object.hasOwn(p,'Geburtsjahr n. Chr.')&&bp.y)out['Geburtsjahr n. Chr.']=bp.y;
  if(!Object.hasOwn(p,'Geburtsjahr B.E.')&&bp.y)out['Geburtsjahr B.E.']=bp.y+543;
  out['Aktuelles Alter']=calcAge(out);
  return out;
}
function nextId(){
  const max=people.reduce((m,p)=>Math.max(m,parseInt(String(p['Personen-ID']||'').replace(/\D/g,''),10)||0),0);
  return `P${String(max+1).padStart(4,'0')}`;
}

async function refresh(){people=await idbGetAll();populateTempleFilter();applyFilters();}
function populateTempleFilter(){
  const sel=$('#templeFilter');const cur=sel.value;const vals=[...new Set(people.map(p=>p['Haupttempel']).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'de'));
  sel.innerHTML='<option value="">Alle Tempel</option>'+vals.map(v=>`<option>${esc(v)}</option>`).join('');sel.value=vals.includes(cur)?cur:'';
}
function applyFilters(){
  const q=$('#searchInput').value.trim().toLocaleLowerCase('de');const temple=$('#templeFilter').value;const month=$('#monthFilter').value;const view=$('#viewFilter').value;
  filtered=people.filter(p=>{
    const trash=!!p['Im Papierkorb seit']||String(p['Status']).toLowerCase()==='papierkorb';
    if(view==='active'&&(trash||!isActive(p)))return false;if(view==='trash'&&!trash)return false;
    if(temple&&p['Haupttempel']!==temple)return false;
    if(month&&Number(birthdayParts(p).m)!==Number(month))return false;
    if(q){const hay=FIELDS.map(f=>p[f]).join(' ').toLocaleLowerCase('de');if(!hay.includes(q))return false}
    return true;
  }).sort((a,b)=>{
    const ba=birthdayParts(a),bb=birthdayParts(b);const av=(ba.m||99)*100+(ba.d||99),bv=(bb.m||99)*100+(bb.d||99);return av-bv||displayName(a).localeCompare(displayName(b),'de');
  });
  render();
}

function normalizeDupText(v){
  return String(v||'')
    .normalize('NFKC')
    .toLowerCase()
    .trim()
    .replace(/[.,;:()[\]{}"'`´’\-_/\\]+/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}
function normalizePhone(v){
  return String(v||'').replace(/[^\d+]/g,'').replace(/^00/,'+');
}
function dupNames(p){
  const vals=[
    `${p['Vorname']||''} ${p['Nachname']||''}`,
    p['Kartenname'],
    p['Lateinischer Name'],personNames(p).thai,personNames(p).latin
  ].map(normalizeDupText).filter(x=>x.length>=4);
  return [...new Set(vals)];
}
function birthdayKeyForDuplicate(p){
  const bp=birthdayParts(p);
  return bp.d&&bp.m ? `${pad(bp.m)}-${pad(bp.d)}` : '';
}
function nameSimilarityToken(a,b){
  if(!a||!b) return false;
  if(a===b) return true;
  const at=a.split(' ').filter(x=>x.length>1);
  const bt=b.split(' ').filter(x=>x.length>1);
  if(!at.length||!bt.length) return false;
  const common=at.filter(x=>bt.includes(x));
  return common.length>=2 || (common.length>=1 && Math.min(at.length,bt.length)===1);
}
function findPotentialDuplicates(){
  const list=storageLoad().map(normalizeRecord).filter(p=>!p['Im Papierkorb seit']);
  const found=[];
  const seen=new Set();

  for(let i=0;i<list.length;i++){
    for(let j=i+1;j<list.length;j++){
      const a=list[i], b=list[j];
      if(!a['Personen-ID'] || !b['Personen-ID']) continue;

      const reasons=[];
      const namesA=dupNames(a), namesB=dupNames(b);
      const exactName=namesA.some(x=>namesB.includes(x));

      const emailA=normalizeDupText(a['E-Mail']);
      const emailB=normalizeDupText(b['E-Mail']);
      const phoneA=normalizePhone(a['Telefon']);
      const phoneB=normalizePhone(b['Telefon']);
      const bdA=birthdayKeyForDuplicate(a);
      const bdB=birthdayKeyForDuplicate(b);

      if(exactName) reasons.push(tr('sameName'));
      if(emailA && emailB && emailA===emailB) reasons.push(tr('sameEmail'));
      if(phoneA && phoneB && phoneA===phoneB && phoneA.replace(/\D/g,'').length>=6) reasons.push(tr('samePhone'));

      if(bdA && bdB && bdA===bdB && !exactName){
        const similar=namesA.some(x=>namesB.some(y=>nameSimilarityToken(x,y)));
        if(similar) reasons.push(tr('sameBirthdayName'));
      }

      if(reasons.length){
        const key=[a['Personen-ID'],b['Personen-ID']].sort().join('|');
        if(!seen.has(key)){
          seen.add(key);
          found.push({a,b,reasons});
        }
      }
    }
  }

  return found.sort((x,y)=>y.reasons.length-x.reasons.length);
}
function duplicatePersonLabel(p){
  return esc(displayName(p)||p['Personen-ID']||'–');
}
function openDuplicateCheck(){
  const rows=findPotentialDuplicates();
  const body=$('#duplicateBody');
  const summary=$('#duplicateSummary');

  if(!rows.length){
    body.innerHTML=`<tr><td colspan="6" class="empty">${esc(tr('duplicateNone'))}</td></tr>`;
    summary.textContent=tr('duplicateNone');
  }else{
    summary.textContent=`${rows.length} ${tr('duplicateFound')}.`;
    body.innerHTML=rows.map(({a,b,reasons})=>{
      const bda=formatBirthday(a)||formatBirthday(b)||'–';
      const temples=[a['Haupttempel'],b['Haupttempel']].filter(Boolean);
      const temple=[...new Set(temples)].join(' / ')||'–';
      return `<tr>
        <td>${esc(reasons.join(', '))}</td>
        <td><strong>${duplicatePersonLabel(a)}</strong><span class="person-sub">${esc(a['Personen-ID']||'')}</span></td>
        <td><strong>${duplicatePersonLabel(b)}</strong><span class="person-sub">${esc(b['Personen-ID']||'')}</span></td>
        <td>${esc(bda)}</td>
        <td>${esc(temple)}</td>
        <td class="action-cell">
          <button type="button" data-dup-edit="${esc(a['Personen-ID'])}">${tr('edit')} 1</button>
          <button type="button" data-dup-edit="${esc(b['Personen-ID'])}">${tr('edit')} 2</button>
        </td>
      </tr>`;
    }).join('');
  }

  body.querySelectorAll('[data-dup-edit]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      $('#duplicateDialog').close();
      openEdit(btn.dataset.dupEdit);
    });
  });

  $('#duplicateDialog').showModal();
}

function render(){
  $('#countAll').textContent=people.filter(p=>!p['Im Papierkorb seit']).length;
  $('#countBirthdays').textContent=people.filter(p=>birthdayEligible(p)&&birthdayParts(p).m&&birthdayParts(p).d).length;
  $('#countSelected').textContent=selected.size;
  $('#countTrash').textContent=people.filter(p=>!!p['Im Papierkorb seit']).length;
  $('#resultInfo').textContent=`${filtered.length} ${tr('recordsVisible')}`;
  const body=$('#peopleBody');
  if(!filtered.length){body.innerHTML=`<tr><td colspan="12" class="empty">${tr('noRecords')}</td></tr>`;return}
  body.innerHTML=filtered.map(p=>{
    const id=p['Personen-ID']; const trash=!!p['Im Papierkorb seit'];
    const contact=[p['Telefon'],p['E-Mail']].filter(Boolean).map(esc).join('<br>')||'–';
    const sub=[p['Spitzname']?`${tr('nickname')}: ${p['Spitzname']}`:'',p['Personen-ID']].filter(Boolean).join(' · ');
    return `<tr>
      <td class="check"><input class="row-check" type="checkbox" data-id="${esc(id)}" ${selected.has(id)?'checked':''}></td>
      <td><span class="person-name">${nameMarkup(p)}</span><span class="person-sub">${esc(sub)}</span></td>
      <td>${esc(birthdayLabel(p))}</td>
      <td>${esc(weekdayFromRecord(p)||'–')}</td>
      <td>${esc(calcAge(p)||'–')}</td>
      <td>${esc(zodiacYearFromRecord(p)||'–')}</td>
      <td>${esc(westernZodiacFromRecord(p)||'–')}</td>
      <td class="horoscope-cell">${esc(horoscopeFromRecord(p)||'–')}</td>
      <td>${esc(p['Haupttempel']||'–')}</td>
      <td>${esc(p['Sprache']||'–')}</td>
      <td class="contact-cell">${contact}</td>
      <td class="action-cell"><button data-action="view" data-id="${esc(id)}">${tr('view')}</button> <button data-action="edit" data-id="${esc(id)}">${tr('edit')}</button> ${trash?`<button data-action="restore" data-id="${esc(id)}">${tr('restore')}</button>`:`<button data-action="trash" data-id="${esc(id)}" class="danger">${tr('trashBtn')}</button>`}</td>
    </tr>`;
  }).join('');
  $$('.row-check').forEach(c=>c.addEventListener('change',e=>{e.target.checked?selected.add(e.target.dataset.id):selected.delete(e.target.dataset.id);renderSelectionCounts()}));
  $$('[data-action]').forEach(b=>b.addEventListener('click',handleAction));
  updateSelectAllState();renderSelectionCounts();
}
function renderSelectionCounts(){$('#countSelected').textContent=selected.size;$('#scopeSelectedCount').textContent=selected.size;$('#scopeFilteredCount').textContent=filtered.length}
function updateSelectAllState(){const ids=filtered.map(p=>p['Personen-ID']);const all=ids.length&&ids.every(id=>selected.has(id));$('#selectAllVisible').checked=!!all;$('#selectAllVisible').indeterminate=!all&&ids.some(id=>selected.has(id))}

async function handleAction(e){
 try{
  const id=e.currentTarget.dataset.id;const action=e.currentTarget.dataset.action;const p=people.find(x=>x['Personen-ID']===id);if(!p)return;
  if(action==='view')openView(p);
  if(action==='edit'){if(offlineDB.state.deviceRole!=='mac')return;openEditor(p);}
  if(action!=='view'&&offlineDB.state.deviceRole!=='mac')return;
  if(action==='trash'){p['Im Papierkorb seit']=nowISO();p['Geändert am']=nowISO();await idbPut(p);selected.delete(id);await refresh()}
  if(action==='restore'){p['Im Papierkorb seit']='';p['Status']=p['Status']==='Papierkorb'?'ใช้งาน':p['Status'];p['Geändert am']=nowISO();await idbPut(p);await refresh()}
 }catch(e){offlineError(e)}
}

const ADDRESS_FIELDS=['Straße und Hausnummer','Postleitzahl (PLZ)','Ort','Bundesland / Provinz','Land'];
const CHOICE_FIELDS=['Anrede','Haupttempel','Ort','Bundesland / Provinz','Land'];
const CHOICE_KEY='geburtstage_offline_v140_choices';
const DEFAULT_CHOICES={
  Anrede:['Herr','Frau','Familie','พระ / Phra','แม่ชี / Mae Chi','โยม','กัลฯ','Keine Anrede'],
  Haupttempel:['Wat Buddha Heilbronn','Wat Phra Dhammakaya Bavaria','Wat Phra Dhammakaya Rheinland','Wat Phra Dhammakaya Nordrhein-Westfalen','Wat Phra Dhammakaya Schwarzwald','Wat Phra Dhammakaya Hamburg','Wat Phra Dhammakaya Berlin'],
  Land:['Deutschland','Thailand']
};
const BIRTHDAY_FIELDS=['Geburtstag laut Pass','Tatsächlicher Geburtstag','Geburtstag: Tag','Geburtstag: Monat','Geburtsjahr n. Chr.','Geburtsjahr B.E.'];
let editorInitialValues={};
function choiceKey(value){return String(value||'').normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase('de')}
function savedChoices(){try{return JSON.parse(localStorage.getItem(CHOICE_KEY)||'{}')}catch{return {}}}
function choiceValues(field,current=''){
  const saved=savedChoices();const values=[...(DEFAULT_CHOICES[field]||[]),...people.map(p=>p[field]),...(Array.isArray(saved[field])?saved[field]:[]),current];
  const unique=new Map();for(const value of values){const key=choiceKey(value);if(key&&!unique.has(key))unique.set(key,String(value).trim().replace(/\s+/g,' '))}
  return [...unique.values()].sort((a,b)=>a.localeCompare(b,'de'));
}
function rememberChoices(rec){const saved=savedChoices();for(const field of CHOICE_FIELDS){saved[field]=choiceValues(field,rec[field])}savePreference(CHOICE_KEY,JSON.stringify(saved))}
function canonicalChoice(field,value){return choiceValues(field).find(x=>choiceKey(x)===choiceKey(value))||String(value||'').trim().replace(/\s+/g,' ')}
function addressParts(p){
  const result=Object.fromEntries(ADDRESS_FIELDS.map(f=>[f,p[f]??'']));
  // Only an explicit German street/house-number, five-digit postcode, city pattern.
  // No guessed country, province, international format or ambiguous extra segments.
  if(!ADDRESS_FIELDS.some(f=>Object.hasOwn(p,f))){
    const match=String(p.Adresse||'').match(/^\s*([^,\n]+\s+\d+[a-zA-Z]?(?:[-/]\d+[a-zA-Z]?)?)\s*,\s*(\d{5})\s+([\p{L}][\p{L}\p{M} .’'()-]*)\s*$/u);
    if(match){result[ADDRESS_FIELDS[0]]=match[1].trim();result[ADDRESS_FIELDS[1]]=match[2];result.Ort=match[3].trim()}
  }
  return result;
}
function addressText(p){const a=addressParts(p);return [a[ADDRESS_FIELDS[0]],[a[ADDRESS_FIELDS[1]],a.Ort].filter(Boolean).join(' '),a[ADDRESS_FIELDS[3]],a.Land].filter(Boolean).join(', ')||p.Adresse||''}
function addressLegacyHint(p){return p.Adresse?`<div class="span-3 note"><strong>Ursprüngliche Adresse (unverändert erhalten):</strong><div style="white-space:pre-wrap">${esc(p.Adresse)}</div><p>Die ursprüngliche Zeile bleibt gespeichert. Änderungen an den getrennten Feldern ersetzen sie nicht.</p></div>`:''}
function showFormError(message){const box=$('#personFormError');box.textContent=message;box.classList.remove('hidden');box.scrollIntoView({block:'nearest'})}
function setupEditorEnhancements(){
  $('#editForm').noValidate=true;
  editorInitialValues=Object.fromEntries($$('#editFields [data-field]').map(el=>[el.dataset.field,el.value]));
  const zip=$('#f_'+FIELDS.indexOf('Postleitzahl (PLZ)'));
  const update=()=>{
    const matches=people.filter(p=>String(addressParts(p)['Postleitzahl (PLZ)'])===zip.value.trim()&&zip.value.trim());
    for(const field of ['Ort','Bundesland / Provinz','Land']){
      const values=[...new Set(matches.map(p=>addressParts(p)[field]).filter(Boolean))];
      const list=$('#choices_'+FIELDS.indexOf(field));if(list)list.innerHTML=[...new Set([...values,...choiceValues(field)])].map(v=>`<option value="${esc(v)}"></option>`).join('');
    }
    $('#postcodeHint').textContent=matches.length?'Passende Vorschläge aus vorhandenen Adressen stehen in den Auswahllisten. Bitte selbst auswählen.':'Orte können frei eingegeben werden. PLZ-Vorschläge stammen nur aus vorhandenen Adressen.';
  };
  if(zip){zip.addEventListener('input',update);update()}
}
function validDateParts(y,m,d){const date=new Date(0);date.setFullYear(y,m-1,d);return date.getFullYear()===y&&date.getMonth()===m-1&&date.getDate()===d}
function prepareBirthday(rec,changed){
  if(!BIRTHDAY_FIELDS.some(f=>changed.has(f)))return;
  const current=new Date().getFullYear();
  const day='Geburtstag: Tag',month='Geburtstag: Monat',year='Geburtsjahr n. Chr.',be='Geburtsjahr B.E.';
  const source=rec['Tatsächlicher Geburtstag']?'Tatsächlicher Geburtstag':rec['Geburtstag laut Pass']?'Geburtstag laut Pass':null;
  const dateChanged=['Geburtstag laut Pass','Tatsächlicher Geburtstag'].some(f=>changed.has(f));
  const partsChanged=[day,month,year,be].some(f=>changed.has(f));
  for(const field of ['Geburtstag laut Pass','Tatsächlicher Geburtstag'])if(rec[field]){
    const m=String(rec[field]).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if(!m||+m[1]<1000||+m[1]>current||!validDateParts(+m[1],+m[2],+m[3]))throw Error(`${field}: Bitte ein gültiges Datum mit vierstelligem Jahr bis ${current} eingeben.`);
  }
  if(dateChanged&&source&&!partsChanged){const [y,m,d]=rec[source].split('-').map(Number);rec[day]=d;rec[month]=m;rec[year]=y;rec[be]=y+543}
  if(changed.has(be)&&!changed.has(year)){rec[year]=rec[be]===''?'':Number(rec[be])-543}
  else if(changed.has(year)&&!changed.has(be)){rec[be]=rec[year]===''?'':Number(rec[year])+543}
  for(const [field,min,max] of [[day,1,31],[month,1,12],[year,1000,current],[be,1543,current+543]]){
    const value=rec[field];if(value===''||value==null)continue;
    if(!/^\d+$/.test(String(value))||Number(value)<min||Number(value)>max||([year,be].includes(field)&&String(value).length!==4))throw Error(`${field}: Bitte eine ganze Zahl von ${min} bis ${max} eingeben. Negative Zahlen sind nicht erlaubt.`);
  }
  if(rec[year]!==''&&rec[be]!==''&&Number(rec[be])!==Number(rec[year])+543)throw Error('Die Jahreszahlen n. Chr. und B.E. passen nicht zusammen (B.E. = n. Chr. + 543).');
  if(rec[day]&&rec[month]&&!validDateParts(Number(rec[year])||2000,Number(rec[month]),Number(rec[day])))throw Error('Dieses Datum gibt es nicht. Bitte Tag, Monat und gegebenenfalls das Schaltjahr prüfen.');
  if(partsChanged&&source){
    if(!rec[day]||!rec[month]||!rec[year])throw Error('Ein vollständiges Geburtsdatum ist hinterlegt. Bitte Tag, Monat und Jahr vollständig eingeben oder zuerst das vollständige Datumsfeld leeren.');
    const iso=`${rec[year]}-${pad(rec[month])}-${pad(rec[day])}`;
    if(dateChanged&&iso!==rec[source])throw Error('Datumsfeld und Tag/Monat/Jahr widersprechen sich. Bitte dieselben Angaben verwenden.');
    rec[source]=iso;
  }
}

function fieldInput(field,value){
  const id='f_'+FIELDS.indexOf(field);let input;

  if(CHOICE_FIELDS.includes(field)){
    input=`<input id="${id}" data-field="${esc(field)}" type="text" list="choices_${FIELDS.indexOf(field)}" value="${esc(value||'')}" placeholder="Auswählen oder neu eingeben" autocomplete="off"><datalist id="choices_${FIELDS.indexOf(field)}">${choiceValues(field,value).map(v=>`<option value="${esc(v)}"></option>`).join('')}</datalist><small>Neue Einträge werden beim Speichern übernommen.</small>`;
  }
  else if(field==='Status'){
    const values=['Aktiv','Inaktiv'];const current=isActive({Status:value})?'Aktiv':'Inaktiv';
    input=`<select id="${id}" data-field="${esc(field)}">${values.map(v=>`<option value="${v}" ${v===current?'selected':''}>${v}</option>`).join('')}</select>`;
  }
  else if(field==='Personen-ID')input=`<input id="${id}" data-field="${esc(field)}" value="${esc(value||'')}" readonly>`;
  else if(field==='Link zum Profilfoto'){
    const hasPhoto=String(value||'').startsWith('data:image/');
    input=`<div class="media-picker">
      <input id="${id}" data-field="${esc(field)}" type="text"
        placeholder="${currentLang==='th'?'เลือกรูปจากเครื่อง หรือวางลิงก์รูป':'Bild vom Mac auswählen oder Bildlink einfügen'}"
        value="${esc(value||'')}">
      <button type="button" id="profilePhotoChooseBtn">${currentLang==='th'?'เลือกรูป':'Bild auswählen'}</button>
      <button type="button" id="profilePhotoRemoveBtn">${currentLang==='th'?'ลบรูป':'Bild entfernen'}</button>
      <input type="file" id="profilePhotoFile" accept="image/*" hidden>
    </div>
    <div class="photo-preview-wrap">
      <img id="profilePhotoPreview" class="photo-preview ${hasPhoto?'':'hidden'}" ${hasPhoto?`src="${esc(value||'')}"`:''} alt="">
      <span class="folder-note">${currentLang==='th'
        ?'รูปที่เลือกจะถูกย่อขนาดและเก็บไว้ในข้อมูลของบุคคลนี้'
        :'Das ausgewählte Bild wird verkleinert und direkt im Personendatensatz gespeichert.'}</span>
    </div>`;
  }
  else if(field==='Link zum Fotoordner'){
    input=`<div class="media-picker">
      <input id="${id}" data-field="${esc(field)}" type="text"
        placeholder="${currentLang==='th'?'เลือกโฟลเดอร์รูป หรือวางลิงก์โฟลเดอร์':'Fotoordner auswählen oder Ordnerlink einfügen'}"
        value="${esc(value||'')}">
      <button type="button" id="photoFolderChooseBtn">${currentLang==='th'?'เลือกโฟลเดอร์':'Ordner auswählen'}</button>
      <button type="button" id="photoFolderClearBtn">${currentLang==='th'?'ล้าง':'Leeren'}</button>
      <input type="file" id="photoFolderFile" webkitdirectory directory multiple hidden>
    </div>
    <div class="folder-note">${currentLang==='th'
      ?'เบราว์เซอร์ไม่อนุญาตให้บันทึกเส้นทางเต็มของโฟลเดอร์บน Mac ด้วยเหตุผลด้านความปลอดภัย แอปจึงบันทึกชื่อโฟลเดอร์ไว้'
      :'Aus Sicherheitsgründen gibt der Browser den vollständigen Mac-Ordnerpfad nicht frei. Die App speichert deshalb den ausgewählten Ordnernamen.'}</div>`;
  }
  else if(['12-Jahres-Tierzeichen','Sternzeichen','Horoskop'].includes(field)){
    const p=editingId?people.find(x=>x['Personen-ID']===editingId):null;
    const val=p?calculatedAstroValue(p,field):'';
    input=`<input id="${id}" type="text" value="${esc(val||'')}" readonly
      title="${currentLang==='th'?'คำนวณอัตโนมัติจากวันเกิด':'Wird automatisch aus dem Geburtsdatum berechnet'}">`;
  }
  else if(DATE_FIELDS.has(field)) input=`<input id="${id}" data-field="${esc(field)}" type="date" value="${esc(String(value||'').slice(0,10))}">`;
  else if(DATETIME_FIELDS.has(field)) input=`<input id="${id}" data-field="${esc(field)}" type="text" value="${esc(value||'')}">`;
  else if(['Geburtstag: Tag','Geburtstag: Monat','Geburtsjahr n. Chr.','Geburtsjahr B.E.'].includes(field)){const range=field==='Geburtstag: Tag'?[1,31]:field==='Geburtstag: Monat'?[1,12]:field==='Geburtsjahr B.E.'?[1543,new Date().getFullYear()+543]:[1000,new Date().getFullYear()];input=`<input id="${id}" data-field="${esc(field)}" type="number" inputmode="numeric" min="${range[0]}" max="${range[1]}" step="1" value="${esc(value??'')}">`;}
  else if(field==='Postleitzahl (PLZ)')input=`<input id="${id}" data-field="${esc(field)}" type="text" autocomplete="postal-code" value="${esc(value||'')}"><small id="postcodeHint"></small>`;
  else if(NUMBER_FIELDS.has(field)) input=`<input id="${id}" data-field="${esc(field)}" type="number" value="${esc(value||'')}">`;
  else if(TEXTAREA_FIELDS.has(field)) input=`<textarea id="${id}" data-field="${esc(field)}">${esc(value||'')}</textarea>`;
  else input=`<input id="${id}" data-field="${esc(field)}" type="text" value="${esc(value||'')}">`;

  const cls=(TEXTAREA_FIELDS.has(field)||field==='Link zum Profilfoto'||field==='Link zum Fotoordner'||field==='Horoskop')?'span-3':'';
  return `<label class="${cls}"><span>${esc(fieldLabel(field))}</span>${input}</label>`;
}

function resizePhotoToDataURL(file,maxSize=700,quality=.82){
  return new Promise((resolve,reject)=>{
    if(!file || !file.type.startsWith('image/')){reject(new Error('Keine Bilddatei'));return}
    const reader=new FileReader();
    reader.onerror=()=>reject(reader.error||new Error('Datei konnte nicht gelesen werden'));
    reader.onload=()=>{
      const img=new Image();
      img.onerror=()=>reject(new Error('Bild konnte nicht geöffnet werden'));
      img.onload=()=>{
        let w=img.naturalWidth||img.width,h=img.naturalHeight||img.height;
        const scale=Math.min(1,maxSize/Math.max(w,h));
        w=Math.max(1,Math.round(w*scale));h=Math.max(1,Math.round(h*scale));
        const c=document.createElement('canvas');c.width=w;c.height=h;
        const ctx=c.getContext('2d');ctx.drawImage(img,0,0,w,h);
        resolve(c.toDataURL('image/jpeg',quality));
      };
      img.src=reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function updateProfilePreview(value){
  const img=$('#profilePhotoPreview');
  if(!img)return;
  const ok=String(value||'').startsWith('data:image/');
  if(ok){img.src=value;img.classList.remove('hidden')}
  else{img.removeAttribute('src');img.classList.add('hidden')}
}

function setupEditorMediaPickers(){
  const photoInput=$('#f_'+FIELDS.indexOf('Link zum Profilfoto'));
  const choose=$('#profilePhotoChooseBtn');
  const remove=$('#profilePhotoRemoveBtn');
  const file=$('#profilePhotoFile');

  if(choose&&file) choose.addEventListener('click',()=>file.click());
  if(file&&photoInput) file.addEventListener('change',async()=>{
    const chosen=file.files?.[0];
    if(!chosen)return;
    try{
      choose.disabled=true;
      choose.textContent=currentLang==='th'?'กำลังเตรียมรูป…':'Bild wird vorbereitet…';
      const data=await resizePhotoToDataURL(chosen);
      photoInput.value=data;
      updateProfilePreview(data);
      const status=$('#f_'+FIELDS.indexOf('Fotostatus'));
      if(status)status.value=currentLang==='th'?'มีรูป':'Bild vorhanden';
    }catch(err){
      console.error(err);
      showMessage(currentLang==='th'?'เลือกรูปไม่ได้':'Bild konnte nicht gewählt werden',err.message);
    }finally{
      choose.disabled=false;
      choose.textContent=currentLang==='th'?'เลือกรูป':'Bild auswählen';
      file.value='';
    }
  });
  if(remove&&photoInput) remove.addEventListener('click',()=>{
    photoInput.value='';
    updateProfilePreview('');
    const status=$('#f_'+FIELDS.indexOf('Fotostatus'));
    if(status)status.value=currentLang==='th'?'ไม่มีรูป':'Kein Bild';
  });
  if(photoInput) photoInput.addEventListener('input',()=>updateProfilePreview(photoInput.value.trim()));

  const folderInput=$('#f_'+FIELDS.indexOf('Link zum Fotoordner'));
  const folderBtn=$('#photoFolderChooseBtn');
  const folderClear=$('#photoFolderClearBtn');
  const folderFile=$('#photoFolderFile');

  if(folderBtn&&folderFile) folderBtn.addEventListener('click',()=>folderFile.click());
  if(folderFile&&folderInput) folderFile.addEventListener('change',()=>{
    const files=[...(folderFile.files||[])];
    if(!files.length)return;
    const rel=files[0].webkitRelativePath||files[0].name;
    const folderName=rel.includes('/')?rel.split('/')[0]:'';
    folderInput.value=folderName?`Lokaler Ordner: ${folderName}`:'';
    folderFile.value='';
  });
  if(folderClear&&folderInput) folderClear.addEventListener('click',()=>{folderInput.value=''});
}


function viewValue(p,f){
  if(ADDRESS_FIELDS.includes(f))return addressParts(p)[f]||'–';
  if(NAME_PART_FIELDS.includes(f))return nameParts(p)[f]||'–';
  if(f==='Status')return isActive(p)?'Aktiv':'Inaktiv';
  const astro=typeof calculatedAstroValue==='function'?calculatedAstroValue(p,f):null;
  if(astro!==null) return astro||'–';
  if((f==='Wochentag (Deutsch)'||f==='Wochentag (Thai)') && typeof weekdayFromRecord==='function') return weekdayFromRecord(p)||p[f]||'–';
  const v=p[f];
  return (v===undefined||v===null||v==='')?'–':String(v);
}
function openView(p){
  if(!p)return;
  $('#viewTitle').textContent=displayName(p)||p['Personen-ID']||'Person';
  $('#viewSubtitle').textContent=[p['Spitzname'],p['Haupttempel']].filter(Boolean).join(' · ');
  const photo=p['Link zum Profilfoto'];
  const photoHtml=(photo && String(photo).startsWith('data:image/'))
    ? `<img class="view-photo" src="${esc(photo)}" alt="">`
    : `<div class="view-photo" style="display:grid;place-items:center;font-size:2rem">${esc((displayName(p)||'?').trim().charAt(0)||'?')}</div>`;
  const fields=[
    'Personen-ID','Status','Anrede','Vorname Thai','Nachname Thai','Vorname Deutsch/Latein','Nachname Deutsch/Latein','Name Thai','Name Deutsch/Latein','Vorname','Nachname','Geburtsname','Spitzname','Kartenname','Lateinischer Name','Sprache',
    'Geburtstag laut Pass','Tatsächlicher Geburtstag','Wochentag (Deutsch)','Wochentag (Thai)','Aktuelles Alter',
    '12-Jahres-Tierzeichen','Sternzeichen','Horoskop','Haupttempel','Telefon','E-Mail','Straße und Hausnummer','Postleitzahl (PLZ)','Ort','Bundesland / Provinz','Land','Adresse',
    'Link zum Profilfoto','Link zum Fotoordner','Fotostatus','Notizen','Mönchsname','Kirchlicher Rang',
    'Sterbedatum','Gedenkerinnerung','Erstellt am','Geändert am'
  ];
  const cards=fields.filter(f=>!LEGACY_NAME_FIELDS.includes(f)||p[f]).map(f=>{
    let val=viewValue(p,f);
    if(f==='Link zum Profilfoto' && photo && String(photo).startsWith('data:image/')) val=currentLang==='th'?'รูปถูกเก็บไว้ในฐานข้อมูล':'Bild ist in der Datenbank gespeichert';
    const full=['Adresse','Notizen','Horoskop','Link zum Profilfoto','Link zum Fotoordner'].includes(f)?' full':'';
    return `<div class="view-card${full}"><div class="view-label">${esc(fieldLabel(f))}</div><div class="view-value">${esc(val)}</div></div>`;
  }).join('');
  $('#viewContent').innerHTML=`<div class="view-card full"><div class="view-header">${photoHtml}<div><div class="view-label">${currentLang==='th'?'ชื่อ':'Name'}</div><div class="view-value" style="font-size:1.35rem;font-weight:700">${nameMarkup(p)}</div><div class="view-label" style="margin-top:.4rem">${currentLang==='th'?'วัด':'Tempel'}</div><div class="view-value">${esc(p['Haupttempel']||'–')}</div></div></div></div>`+cards;
  $('#viewEditBtn').onclick=()=>{$('#viewDialog').close();openEditor(p)};
  $('#viewDialog').showModal();
}

function openEditor(p=null){if(offlineDB.state?.deviceRole!=='mac'||offlineDB.locked)return;editingId=p?.['Personen-ID']||null;const obj=p?normalizeRecord(p):Object.fromEntries(FIELDS.map(f=>[f,'']));if(!p){obj['Personen-ID']=nextId();obj['Status']='Aktiv';obj['Fotostatus']='ไม่มีรูป';obj['Gedenkerinnerung']='ไม่เตือน'}$('#editTitle').textContent=p?`${tr('editPerson')} – ${displayName(p)}`:tr('newPersonTitle');$('#editFields').innerHTML=FIELDS.filter(f=>f!=='Adresse').filter(f=>!LEGACY_NAME_FIELDS.filter(x=>x!=='Kartenname').includes(f)).map(f=>fieldInput(f,obj[f])).join('')+legacyNamesHint(obj)+addressLegacyHint(obj);$('#editFields').insertAdjacentHTML('afterbegin','<div id="personFormError" class="span-3 danger hidden" role="alert"></div>');setupEditorMediaPickers();setupEditorEnhancements();$('#editDialog').showModal()}
async function saveEditor(){
  const old=editingId?storageLoad().find(p=>p['Personen-ID']===editingId):null;
  const rec={...(old||{})};const changed=new Set();
  try{
    for(const el of $$('#editFields [data-field]')){
      const field=el.dataset.field;
      if(el.validity?.badInput)throw Error(`${field}: Bitte eine gültige Zahl oder ein gültiges Datum eingeben.`);
      if(!old||el.value!==editorInitialValues[field]){
        if(el.value!==editorInitialValues[field])changed.add(field);rec[field]=el.type==='number'?(el.value===''?'':Number(el.value)):el.value.trim();
        if(CHOICE_FIELDS.includes(field))rec[field]=canonicalChoice(field,rec[field]);
      }
    }
    prepareBirthday(rec,changed);
    rec['Personen-ID']=editingId||rec['Personen-ID']||nextId();
    rec['Erstellt am']=old?.['Erstellt am']||rec['Erstellt am']||nowISO();rec['Geändert am']=nowISO();
    const norm=rec;
    await idbPut(norm);
    try{rememberChoices(norm)}catch(error){console.warn('Auswahllisten konnten nicht zusätzlich gespeichert werden; Werte bleiben im Personendatensatz.',error)}
    $('#editDialog').close();await refresh();requestAutoSync();
  }catch(error){showFormError(error.message||'Speichern fehlgeschlagen. Bitte die Eingaben prüfen.')}
}

function getExportPrefs(){try{return JSON.parse(localStorage.getItem(EXPORT_PREF_KEY)||'{}')}catch{return {}}}
function saveExportPrefs(){const p=getExportPrefs();p.fields=selectedFields();p.preset=$('#presetSelect')?.value||'custom';p.scope=$('input[name="exportScope"]:checked')?.value||'selected';p.format=$('input[name="format"]:checked')?.value||'xlsx';savePreference(EXPORT_PREF_KEY,JSON.stringify(p))}
function buildFieldChecklist(keepCurrent=false){
  const current=keepCurrent?selectedFields():[];const pref=getExportPrefs();const fields=current.length?current:(Array.isArray(pref.fields)&&pref.fields.length?pref.fields:BIRTHDAY_PRESET);
  $('#fieldChecklist').innerHTML=FIELDS.map(f=>`<label><input type="checkbox" class="field-check" value="${esc(f)}" ${fields.includes(f)?'checked':''}><span>${esc(fieldLabel(f))}</span></label>`).join('');
  $$('.field-check').forEach(c=>c.addEventListener('change',()=>{if($('#presetSelect'))$('#presetSelect').value='custom';saveExportPrefs()}));
}
function setFieldPreset(fields,preset='custom'){ $$('.field-check').forEach(c=>c.checked=fields.includes(c.value));if($('#presetSelect'))$('#presetSelect').value=preset;saveExportPrefs() }
function applyPreset(name){if(name==='contact')setFieldPreset(CONTACT_PRESET,'contact');else if(name==='calendar')setFieldPreset(CALENDAR_PRESET,'calendar');else if(name==='all')setFieldPreset(FIELDS,'all');else if(name==='birthday')setFieldPreset(BIRTHDAY_PRESET,'birthday');else saveExportPrefs()}
function restoreExportPrefs(){const p=getExportPrefs();if($('#presetSelect'))$('#presetSelect').value=p.preset||'birthday';if(p.scope){const r=$(`input[name="exportScope"][value="${p.scope}"]`);if(r)r.checked=true}if(p.format){const r=$(`input[name="format"][value="${p.format}"]`);if(r)r.checked=true}}
function exportPeopleByScope(){
  const scope=$('input[name="exportScope"]:checked').value;const view=$('#viewFilter').value;
  if(scope==='selected')return people.filter(p=>selected.has(p['Personen-ID']));
  if(scope==='filtered')return [...filtered];
  return people.filter(p=>{const trash=!!p['Im Papierkorb seit'];return view==='all'||(view==='trash'?trash:!trash&&isActive(p))});
}
function selectedFields(){return $$('.field-check:checked').map(c=>c.value)}
function exportRows(ps,fields){return ps.map(p=>Object.fromEntries(fields.map(f=>[f,formatExportValue(p,f)])))}

const ANIMAL_ZODIAC_DE=['Ratte','Ochse','Tiger','Hase','Drache','Schlange','Pferd','Ziege','Affe','Hahn','Hund','Schwein'];
const ANIMAL_ZODIAC_TH=['ชวด (หนู)','ฉลู (วัว)','ขาล (เสือ)','เถาะ (กระต่าย)','มะโรง (มังกร)','มะเส็ง (งู)','มะเมีย (ม้า)','มะแม (แพะ)','วอก (ลิง)','ระกา (ไก่)','จอ (สุนัข)','กุน (หมู)'];

const WESTERN_ZODIAC=[
  {key:'capricorn',de:'Steinbock',th:'ราศีมังกร',from:[12,22],to:[1,19]},
  {key:'aquarius',de:'Wassermann',th:'ราศีกุมภ์',from:[1,20],to:[2,18]},
  {key:'pisces',de:'Fische',th:'ราศีมีน',from:[2,19],to:[3,20]},
  {key:'aries',de:'Widder',th:'ราศีเมษ',from:[3,21],to:[4,19]},
  {key:'taurus',de:'Stier',th:'ราศีพฤษภ',from:[4,20],to:[5,20]},
  {key:'gemini',de:'Zwillinge',th:'ราศีเมถุน',from:[5,21],to:[6,20]},
  {key:'cancer',de:'Krebs',th:'ราศีกรกฎ',from:[6,21],to:[7,22]},
  {key:'leo',de:'Löwe',th:'ราศีสิงห์',from:[7,23],to:[8,22]},
  {key:'virgo',de:'Jungfrau',th:'ราศีกันย์',from:[8,23],to:[9,22]},
  {key:'libra',de:'Waage',th:'ราศีตุล',from:[9,23],to:[10,22]},
  {key:'scorpio',de:'Skorpion',th:'ราศีพิจิก',from:[10,23],to:[11,21]},
  {key:'sagittarius',de:'Schütze',th:'ราศีธนู',from:[11,22],to:[12,21]}
];

const HOROSCOPE_DE={
 capricorn:'Zielstrebig, zuverlässig und ausdauernd. Schätzt klare Strukturen und arbeitet geduldig auf langfristige Ziele hin.',
 aquarius:'Unabhängig, ideenreich und offen für Neues. Denkt gern unkonventionell und legt Wert auf Freiheit.',
 pisces:'Einfühlsam, intuitiv und fantasievoll. Nimmt Stimmungen fein wahr und besitzt oft eine starke kreative Seite.',
 aries:'Tatkräftig, mutig und direkt. Beginnt Neues mit viel Energie und entscheidet häufig spontan.',
 taurus:'Beständig, geduldig und genussorientiert. Schätzt Sicherheit, Verlässlichkeit und ein stabiles Umfeld.',
 gemini:'Neugierig, kommunikativ und vielseitig. Lernt schnell und interessiert sich oft für viele Themen gleichzeitig.',
 cancer:'Fürsorglich, sensibel und familienverbunden. Sucht emotionale Sicherheit und besitzt ein gutes Gespür für andere.',
 leo:'Selbstbewusst, großzügig und kreativ. Zeigt gern Initiative und kann andere mit Begeisterung mitreißen.',
 virgo:'Sorgfältig, praktisch und analytisch. Achtet auf Details und möchte Dinge gern sinnvoll und zuverlässig gestalten.',
 libra:'Diplomatisch, ausgeglichen und harmonieorientiert. Hat ein feines Gespür für Fairness, Beziehungen und Ästhetik.',
 scorpio:'Intensiv, entschlossen und tiefgründig. Verfolgt wichtige Ziele konzentriert und besitzt starke innere Ausdauer.',
 sagittarius:'Optimistisch, freiheitsliebend und wissbegierig. Sucht neue Erfahrungen und denkt gern über größere Zusammenhänge nach.'
};

const HOROSCOPE_TH={
 capricorn:'มุ่งมั่น รับผิดชอบ และอดทน ชอบความชัดเจนและค่อย ๆ เดินไปสู่เป้าหมายระยะยาวอย่างเป็นระบบ',
 aquarius:'รักอิสระ มีความคิดสร้างสรรค์ และเปิดรับสิ่งใหม่ มักคิดนอกกรอบและให้ความสำคัญกับเสรีภาพ',
 pisces:'อ่อนโยน เข้าใจความรู้สึกผู้อื่น และมีจินตนาการ รับรู้อารมณ์รอบตัวได้ดีและมักมีด้านสร้างสรรค์',
 aries:'กระตือรือร้น กล้าตัดสินใจ และตรงไปตรงมา เริ่มต้นสิ่งใหม่ด้วยพลังและมักลงมืออย่างรวดเร็ว',
 taurus:'มั่นคง อดทน และรักความสบาย ให้ความสำคัญกับความปลอดภัย ความน่าเชื่อถือ และชีวิตที่เป็นระบบ',
 gemini:'ช่างสงสัย สื่อสารเก่ง และสนใจหลายด้าน เรียนรู้เร็วและปรับตัวกับเรื่องใหม่ได้ดี',
 cancer:'เอาใจใส่ อ่อนไหว และผูกพันกับครอบครัว ต้องการความมั่นคงทางใจและเข้าใจความรู้สึกผู้อื่นได้ดี',
 leo:'มั่นใจ ใจกว้าง และมีความคิดสร้างสรรค์ กล้าแสดงออกและสามารถสร้างแรงบันดาลใจให้คนรอบข้าง',
 virgo:'ละเอียด รอบคอบ และเป็นเหตุเป็นผล ใส่ใจรายละเอียดและชอบจัดการสิ่งต่าง ๆ ให้เป็นระบบ',
 libra:'สุภาพ รักความสมดุล และหลีกเลี่ยงความขัดแย้ง มีความรู้สึกไวต่อความยุติธรรม ความสัมพันธ์ และความงาม',
 scorpio:'จริงจัง มุ่งมั่น และลึกซึ้ง เมื่อให้ความสำคัญกับสิ่งใดมักทุ่มเทและอดทนอย่างมาก',
 sagittarius:'มองโลกในแง่ดี รักอิสระ และใฝ่รู้ ชอบประสบการณ์ใหม่และสนใจการมองภาพรวมของชีวิต'
};


function weekdayFromRecord(p){
  const raw=p['Tatsächlicher Geburtstag']||p['Geburtstag laut Pass']||'';
  if(!raw || !/^\d{4}-\d{2}-\d{2}/.test(raw)) return '';
  const [y,m,d]=raw.slice(0,10).split('-').map(Number);
  const dt=new Date(Date.UTC(y,m-1,d));
  const de=['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
  const th=['วันอาทิตย์','วันจันทร์','วันอังคาร','วันพุธ','วันพฤหัสบดี','วันศุกร์','วันเสาร์'];
  return currentLang==='th'?th[dt.getUTCDay()]:de[dt.getUTCDay()];
}

function zodiacYearFromRecord(p){
  const bp=birthdayParts(p);
  const y=Number(bp.y||p['Geburtsjahr n. Chr.']||0);
  if(!y) return '';
  const idx=((y-2020)%12+12)%12;
  return currentLang==='th' ? ANIMAL_ZODIAC_TH[idx] : ANIMAL_ZODIAC_DE[idx];
}
function westernZodiacFromParts(m,d){
  m=Number(m); d=Number(d);
  if(!m||!d) return null;
  for(const z of WESTERN_ZODIAC){
    const [fm,fd]=z.from,[tm,td]=z.to;
    if((m===fm && d>=fd)||(m===tm && d<=td)) return z;
  }
  return null;
}
function westernZodiacFromRecord(p){
  const bp=birthdayParts(p);
  const z=westernZodiacFromParts(bp.m,bp.d);
  return z ? (currentLang==='th'?z.th:z.de) : '';
}
function horoscopeFromRecord(p){
  const bp=birthdayParts(p);
  const z=westernZodiacFromParts(bp.m,bp.d);
  if(!z) return '';
  return currentLang==='th'?(HOROSCOPE_TH[z.key]||''):(HOROSCOPE_DE[z.key]||'');
}
function calculatedAstroValue(p,f){
  if(f==='12-Jahres-Tierzeichen') return zodiacYearFromRecord(p);
  if(f==='Sternzeichen') return westernZodiacFromRecord(p);
  if(f==='Horoskop') return horoscopeFromRecord(p);
  return null;
}

function formatExportValue(p,f){
  if(ADDRESS_FIELDS.includes(f))return addressParts(p)[f];
  if(f==='Adresse'){const current=addressText(p);return p.Adresse&&p.Adresse!==current?`${current} | Ursprüngliche Adresse: ${p.Adresse}`:current;}
  if(NAME_PART_FIELDS.includes(f))return nameParts(p)[f];
  if(f==='Name Thai')return personNames(p).thai;if(f==='Name Deutsch/Latein')return personNames(p).latin;if(f==='Status')return isActive(p)?'Aktiv':'Inaktiv';
  const astro=calculatedAstroValue(p,f);if(astro!==null)return astro;if(f==='Aktuelles Alter')return calcAge(p);return p[f]??''}

function csvEscape(v){const s=String(v??'');return /[",\n\r;]/.test(s)?`"${s.replace(/"/g,'""')}"`:s}
function exportCSV(ps,fields){const sep=';';const lines=[fields.map(csvEscape).join(sep),...ps.map(p=>fields.map(f=>csvEscape(formatExportValue(p,f))).join(sep))];downloadBlob(new Blob(['\ufeff'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'}),makeName('csv'))}

// Minimal ZIP writer (store/no compression), used for XLSX and DOCX. No external library needed.
const CRC_TABLE=(()=>{let t=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
function crc32(bytes){let c=0xFFFFFFFF;for(const b of bytes)c=CRC_TABLE[(c^b)&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0}
function u16(n){return [n&255,(n>>>8)&255]}
function u32(n){return [n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255]}
function concatArrays(parts){let len=parts.reduce((s,a)=>s+a.length,0),out=new Uint8Array(len),o=0;for(const a of parts){out.set(a,o);o+=a.length}return out}
function zipStore(files){
  const enc=new TextEncoder();let offset=0;const local=[];const central=[];
  for(const file of files){const name=enc.encode(file.name);const data=typeof file.data==='string'?enc.encode(file.data):file.data;const crc=crc32(data);
    const lh=new Uint8Array([80,75,3,4,20,0,0,0,0,0,0,0,0,0,...u32(crc),...u32(data.length),...u32(data.length),...u16(name.length),0,0]);
    local.push(lh,name,data);
    const ch=new Uint8Array([80,75,1,2,20,0,20,0,0,0,0,0,0,0,0,0,...u32(crc),...u32(data.length),...u32(data.length),...u16(name.length),0,0,0,0,0,0,0,0,0,0,0,0,...u32(offset)]);
    central.push(ch,name);offset+=lh.length+name.length+data.length;
  }
  const centralBytes=concatArrays(central);const end=new Uint8Array([80,75,5,6,0,0,0,0,...u16(files.length),...u16(files.length),...u32(centralBytes.length),...u32(offset),0,0]);return concatArrays([...local,centralBytes,end]);
}

function excelCol(n){let s='';while(n){n--;s=String.fromCharCode(65+n%26)+s;n=Math.floor(n/26)}return s}
function xlsxCell(v,r,c){const ref=`${excelCol(c)}${r}`;if(typeof v==='number'&&Number.isFinite(v))return `<c r="${ref}"><v>${v}</v></c>`;return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xmlEsc(v??'')}</t></is></c>`}
function exportXLSX(ps,fields){
  const matrix=[fields,...ps.map(p=>fields.map(f=>formatExportValue(p,f)))];
  const rowsXml=matrix.map((row,ri)=>`<row r="${ri+1}">${row.map((v,ci)=>xlsxCell(v,ri+1,ci+1)).join('')}</row>`).join('');
  const sheet=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rowsXml}</sheetData></worksheet>`;
  const files=[
    {name:'[Content_Types].xml',data:`<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`},
    {name:'_rels/.rels',data:`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`},
    {name:'xl/workbook.xml',data:`<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Geburtstagsdaten" sheetId="1" r:id="rId1"/></sheets></workbook>`},
    {name:'xl/_rels/workbook.xml.rels',data:`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`},
    {name:'xl/styles.xml',data:`<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="1"><font><sz val="11"/><name val="Aptos"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs></styleSheet>`},
    {name:'xl/worksheets/sheet1.xml',data:sheet}
  ];
  downloadBlob(new Blob([zipStore(files)],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),makeName('xlsx'));
}

function docxTable(ps,fields){
  const cell=(v,bold=false)=>`<w:tc><w:tcPr><w:tcW w:w="1800" w:type="dxa"/></w:tcPr><w:p><w:r>${bold?'<w:rPr><w:b/></w:rPr>':''}<w:t xml:space="preserve">${xmlEsc(v??'')}</w:t></w:r></w:p></w:tc>`;
  const rows=[`<w:tr>${fields.map(f=>cell(f,true)).join('')}</w:tr>`,...ps.map(p=>`<w:tr>${fields.map(f=>cell(formatExportValue(p,f))).join('')}</w:tr>`)].join('');
  return `<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders><w:top w:val="single" w:sz="4" w:color="BBBBBB"/><w:left w:val="single" w:sz="4" w:color="BBBBBB"/><w:bottom w:val="single" w:sz="4" w:color="BBBBBB"/><w:right w:val="single" w:sz="4" w:color="BBBBBB"/><w:insideH w:val="single" w:sz="4" w:color="DDDDDD"/><w:insideV w:val="single" w:sz="4" w:color="DDDDDD"/></w:tblBorders></w:tblPr>${rows}</w:tbl>`;
}
function exportDOCX(ps,fields){
  const doc=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:rPr><w:b/><w:sz w:val="32"/></w:rPr><w:t>Geburtstagsdatenbank</w:t></w:r></w:p><w:p><w:r><w:t>${xmlEsc(`${ps.length} Personen · Export ${new Date().toLocaleDateString('de-DE')}`)}</w:t></w:r></w:p>${docxTable(ps,fields)}<w:sectPr><w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/><w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720"/></w:sectPr></w:body></w:document>`;
  const files=[
    {name:'[Content_Types].xml',data:`<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`},
    {name:'_rels/.rels',data:`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`},
    {name:'word/document.xml',data:doc},
    {name:'word/_rels/document.xml.rels',data:`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`}
  ];
  downloadBlob(new Blob([zipStore(files)],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}),makeName('docx'));
}

function vEscape(s){return String(s??'').replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;')}
function exportVCF(ps,fields){
  const allowed=new Set(fields);const cards=[];
  for(const p of ps){const name=displayName(p)||p['Personen-ID'];const lines=['BEGIN:VCARD','VERSION:3.0',`FN:${vEscape(name)}`];
    const parts=nameParts(p);const latin=parts['Vorname Deutsch/Latein']||parts['Nachname Deutsch/Latein'];const hasParts=NAME_PART_FIELDS.some(f=>parts[f]);
    if(NAME_PART_FIELDS.some(f=>allowed.has(f))||allowed.has('Vorname')||allowed.has('Nachname'))lines.push(`N:${vEscape(hasParts?parts[latin?'Nachname Deutsch/Latein':'Nachname Thai']:(p['Nachname']||''))};${vEscape(hasParts?parts[latin?'Vorname Deutsch/Latein':'Vorname Thai']:(p['Vorname']||''))};;;`);
    for(const [i,f] of NAME_PART_FIELDS.entries())if(allowed.has(f))lines.push(`X-${['GIVEN-THAI','FAMILY-THAI','GIVEN-LATIN','FAMILY-LATIN'][i]}:${vEscape(formatExportValue(p,f))}`);
    if(allowed.has('Spitzname')&&p['Spitzname'])lines.push(`NICKNAME:${vEscape(p['Spitzname'])}`);
    if(allowed.has('Telefon')&&p['Telefon'])lines.push(`TEL;TYPE=CELL:${vEscape(p['Telefon'])}`);
    if(allowed.has('E-Mail')&&p['E-Mail'])lines.push(`EMAIL:${vEscape(p['E-Mail'])}`);
    if(allowed.has('Adresse')&&p.Adresse&&addressText(p)!==p.Adresse)lines.push(`NOTE:${vEscape('Ursprüngliche Adresse: '+p.Adresse)}`);
    if(allowed.has('Adresse')||ADDRESS_FIELDS.some(f=>allowed.has(f))){const a=addressParts(p);if(ADDRESS_FIELDS.some(f=>a[f]))lines.push(`ADR;TYPE=HOME:;;${vEscape(a[ADDRESS_FIELDS[0]])};${vEscape(a.Ort)};${vEscape(a[ADDRESS_FIELDS[3]])};${vEscape(a[ADDRESS_FIELDS[1]])};${vEscape(a.Land)}`);else if(p.Adresse)lines.push(`ADR;TYPE=HOME:;;${vEscape(p.Adresse)};;;;`);}
    const bp=birthdayParts(p);if((allowed.has('Geburtstag laut Pass')||allowed.has('Tatsächlicher Geburtstag')||allowed.has('Geburtstag: Tag')||allowed.has('Geburtstag: Monat'))&&bp.m&&bp.d){const y=bp.y||1604;lines.push(`BDAY:${y}${pad(bp.m)}${pad(bp.d)}`)}
    if(allowed.has('Haupttempel')&&p['Haupttempel'])lines.push(`ORG:${vEscape(p['Haupttempel'])}`);
    if(allowed.has('Notizen')&&p['Notizen'])lines.push(`NOTE:${vEscape(p['Notizen'])}`);
    for(const f of ['Name Thai','Name Deutsch/Latein','Anrede','Status'])if(allowed.has(f))lines.push(`X-${({'Name Thai':'NAME-THAI','Name Deutsch/Latein':'NAME-LATIN','Anrede':'SALUTATION','Status':'STATUS'})[f]}:${vEscape(formatExportValue(p,f))}`);
    lines.push('END:VCARD');cards.push(lines.join('\r\n'));
  }
  downloadBlob(new Blob([cards.join('\r\n')+'\r\n'],{type:'text/vcard;charset=utf-8'}),makeName('vcf'));
}
function icsEscape(s){return String(s??'').replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;')}
function exportICS(ps,fields){
  const events=[];let skipped=0;for(const p of ps){if(!birthdayEligible(p)){skipped++;continue}const bp=birthdayParts(p);if(!bp.m||!bp.d){skipped++;continue}const y=bp.y||2000;const dt=`${y}${pad(bp.m)}${pad(bp.d)}`;const desc=fields.filter(f=>!['Vorname','Nachname','Kartenname','Spitzname','Geburtstag laut Pass','Tatsächlicher Geburtstag','Geburtstag: Tag','Geburtstag: Monat'].includes(f)).map(f=>p[f]?`${f}: ${p[f]}`:'').filter(Boolean).join('\\n');
    const uid=`birthday-${p['Personen-ID']||Math.random().toString(36).slice(2)}@offline.local`;events.push(['BEGIN:VEVENT',`UID:${uid}`,`DTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')}`,`DTSTART;VALUE=DATE:${dt}`,`RRULE:FREQ=YEARLY`,`SUMMARY:${icsEscape('Geburtstag – '+displayName(p))}`,desc?`DESCRIPTION:${icsEscape(desc)}`:'','TRANSP:TRANSPARENT','END:VEVENT'].filter(Boolean).join('\r\n'))}
  const cal=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Geburtstagsdatenbank Offline//DE','CALSCALE:GREGORIAN','METHOD:PUBLISH',...events,'END:VCALENDAR'].join('\r\n');downloadBlob(new Blob([cal],{type:'text/calendar;charset=utf-8'}),makeName('ics'));if(skipped)showMessage('Kalenderexport',`${events.length} Geburtstage exportiert. ${skipped} Personen wurden übersprungen, weil sie inaktiv, verstorben, im Papierkorb oder ohne Geburtstag sind.`)
}

function exportPDF(ps,fields){
  const printWin=window.open('','_blank');if(!printWin){showMessage('PDF','Bitte Pop-ups für diese Seite erlauben.');return}
  const rows=ps.map(p=>`<tr>${fields.map(f=>`<td>${esc(formatExportValue(p,f))}</td>`).join('')}</tr>`).join('');
  printWin.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Geburtstagsdatenbank / ฐานข้อมูลวันเกิด</title><style>@page{size:landscape;margin:10mm}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans Thai",Arial,sans-serif;color:#111}h1{font-size:20px}p{font-size:10px;color:#555}table{border-collapse:collapse;width:100%;font-size:8px}th,td{border:1px solid #aaa;padding:3px;vertical-align:top;word-break:break-word}th{background:#eee}</style>
<link rel="manifest" href="./manifest.webmanifest">
<meta name="theme-color" content="#9a4f0d">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Geburtstage">
<link rel="apple-touch-icon" href="./apple-touch-icon.png">

</head><body><h1 data-i18n="appTitle">Geburtstagsdatenbank</h1><p>${ps.length} Personen · ${new Date().toLocaleString('de-DE')}</p><table><thead><tr>${fields.map(f=>`<th>${esc(f)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></body></html>`);printWin.document.close();printWin.focus();printWin.print();
}
function makeName(ext){return filenameSafe(`Geburtstagsdatenbank_${todayISO()}`)+'.'+ext}

async function runExport(){
  const ps=exportPeopleByScope();const fields=selectedFields();const fmt=$('input[name="format"]:checked').value;saveExportPrefs();
  if(!ps.length){showMessage('Export','Bitte wählen Sie mindestens eine Person aus oder verwenden Sie „sichtbare Personen“.');return}
  if(!fields.length){showMessage('Export','Bitte wählen Sie mindestens ein Datenfeld aus oder klicken Sie auf „Alle Daten auswählen“.');return}
  $('#exportDialog').close();
  try{
    if(fmt==='csv')exportCSV(ps,fields);else if(fmt==='xlsx')exportXLSX(ps,fields);else if(fmt==='docx')exportDOCX(ps,fields);else if(fmt==='vcf')exportVCF(ps,fields);else if(fmt==='ics')exportICS(ps,fields);else if(fmt==='pdf')exportPDF(ps,fields);
  }catch(err){console.error(err);showMessage('Exportfehler','Der Export konnte nicht abgeschlossen werden: '+err.message)}
}

function setupMonths(){const names=currentLang==='th'?['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม']:['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];const cur=$('#monthFilter')?.value||'';$('#monthFilter').innerHTML=`<option value="">${tr('allMonths')}</option>`+names.map((n,i)=>`<option value="${i+1}">${n}</option>`).join('');$('#monthFilter').value=cur}
function setupEvents(){
  ['searchInput','templeFilter','monthFilter','viewFilter'].forEach(id=>$('#'+id).addEventListener(id==='searchInput'?'input':'change',applyFilters));
  $('#newBtn').addEventListener('click',()=>openEditor());
  $('#editForm').addEventListener('submit',e=>{e.preventDefault();saveEditor()});
  $('#savePersonBtn').addEventListener('click',e=>{e.preventDefault();saveEditor()});
  $('#exportBtn').addEventListener('click',()=>{renderSelectionCounts();restoreExportPrefs();$('#exportDialog').showModal()});
  $('#runExportBtn').addEventListener('click',e=>{e.preventDefault();runExport()});
  $('#allFieldsBtn').addEventListener('click',()=>applyPreset('all'));$('#noFieldsBtn').addEventListener('click',()=>setFieldPreset([],'custom'));
  $$('.preset').forEach(b=>b.addEventListener('click',()=>applyPreset(b.dataset.preset)));
  $('#presetSelect').addEventListener('change',e=>applyPreset(e.target.value));
  $$('input[name="exportScope"],input[name="format"]').forEach(el=>el.addEventListener('change',saveExportPrefs));
  $('#langDeBtn').addEventListener('click',()=>setLanguage('de'));$('#langThBtn').addEventListener('click',()=>setLanguage('th')); 
  $('#selectVisibleBtn').addEventListener('click',()=>{filtered.forEach(p=>selected.add(p['Personen-ID']));render()});
  $('#clearSelectionBtn').addEventListener('click',()=>{selected.clear();render()});
  $('#selectAllVisible').addEventListener('change',e=>{filtered.forEach(p=>e.target.checked?selected.add(p['Personen-ID']):selected.delete(p['Personen-ID']));render()});
  $('#backupBtn').addEventListener('click',backupJSON);
  $('#duplicateBtn').addEventListener('click',openDuplicateCheck);$('#importBtn').addEventListener('click',()=>$('#offlineToolsBtn').click());
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;$('#installBtn').classList.remove('hidden')});
  $('#installBtn').addEventListener('click',async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$('#installBtn').classList.add('hidden')});
}
