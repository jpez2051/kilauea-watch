export type Range = 'Day' | 'Week' | 'Month';
export const rangeDays: Record<Range, number> = {Day: 1, Week: 7, Month: 30};
export type Status = {alertLevel:string; colorCode:string; noticeSynopsis:string; noticeUrl:string; alertDate:string};
export type Quake = {id:string; properties:{mag:number|null; place:string; time:number; url:string}};
export const STATUS_URL = 'https://volcanoes.usgs.gov/vsc/api/volcanoApi/vhpstatus/332010';
export const MONITORING_URL = 'https://www.usgs.gov/volcanoes/kilauea/science/monitoring-data-kilauea';
export const NOTICE_URL = 'https://www.usgs.gov/volcanoes/kilauea/volcano-updates';
export const webcams = [
  {id:'HggWKlZv9yk',code:'V1cam',label:'West Halemaʻumaʻu',detail:'Northwest rim',url:'https://url.usgs.gov/v1cam'},
  {id:'f9-oSpYpubg',code:'V2cam',label:'East Halemaʻumaʻu',detail:'Northeast rim',url:'https://url.usgs.gov/v2cam'},
  {id:'gXKuUyKt8mc',code:'V3cam',label:'South Halemaʻumaʻu',detail:'South rim',url:'https://url.usgs.gov/v3cam'},
];
export const tiltPlots = [
  {label:'2 days',file:'UWD-TILT-2day.png'},
  {label:'1 week',file:'UWD-TILT-week.png'},
  {label:'3 months',file:'UWD-TILT-3month.png'},
];
export function colorTone(value?:string) {
  const code=value?.trim().toUpperCase();
  return ({GREEN:'green',YELLOW:'yellow',ORANGE:'orange',RED:'red'} as Record<string,string>)[code||''] || 'unknown';
}
export function alertTone(value?:string) {
  return colorTone(({NORMAL:'GREEN',ADVISORY:'YELLOW',WATCH:'ORANGE',WARNING:'RED'} as Record<string,string>)[value||'']);
}
export function safeUsgsUrl(value:unknown,fallback=NOTICE_URL) {
  try {const url=new URL(String(value));return url.protocol==='https:'&&(url.hostname==='usgs.gov'||url.hostname.endsWith('.usgs.gov'))?url.href:fallback;} catch {return fallback;}
}
export function parseStatus(raw:unknown):Status {
  if(!raw||typeof raw!=='object')throw new Error('Unrecognized status response');
  const d=raw as Record<string,unknown>;
  if(typeof d.alertLevel!=='string'||typeof d.colorCode!=='string')throw new Error('Missing official status');
  return {alertLevel:d.alertLevel.trim().toUpperCase(),colorCode:d.colorCode.trim().toUpperCase(),noticeSynopsis:typeof d.noticeSynopsis==='string'?d.noticeSynopsis:'No summary supplied.',noticeUrl:safeUsgsUrl(d.noticeUrl),alertDate:typeof d.alertDate==='string'?d.alertDate:''};
}
export function parseQuakes(raw:unknown):Quake[] {
  if(!raw||typeof raw!=='object'||!Array.isArray((raw as {features?:unknown}).features))throw new Error('Unrecognized earthquake response');
  return (raw as {features:Quake[]}).features.filter(q=>q&&typeof q.id==='string'&&q.properties&&Number.isFinite(q.properties.time)).map(q=>({...q,properties:{...q.properties,mag:typeof q.properties.mag==='number'&&Number.isFinite(q.properties.mag)?q.properties.mag:null,url:safeUsgsUrl(q.properties.url,'https://earthquake.usgs.gov/earthquakes/map/')}})).sort((a,b)=>b.properties.time-a.properties.time);
}
export function histogram(quakes:Quake[],start:number,end:number,count=16) {
  const bins=Array.from({length:count},(_,i)=>({start:start+(end-start)*i/count,end:start+(end-start)*(i+1)/count,count:0}));
  for(const quake of quakes){const t=quake.properties.time;if(t>=start&&t<=end)bins[Math.min(count-1,Math.floor((t-start)/(end-start)*count))].count++;}
  return bins;
}
export function largestMagnitude(quakes:Quake[]) {const values=quakes.map(q=>q.properties.mag).filter((m):m is number=>m!==null);return values.length?Math.max(...values):null;}
export function fmtTime(value:number|string) {
  let text=value;
  if(typeof text==='string'&&/^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d$/.test(text))text=text.replace(' ','T')+'Z';
  const date=new Date(text);return Number.isFinite(date.getTime())?new Intl.DateTimeFormat('en-US',{timeZone:'Pacific/Honolulu',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'}).format(date):'Time unavailable';
}
