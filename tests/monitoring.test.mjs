import test from 'node:test';
import assert from 'node:assert/strict';
import {colorTone,alertTone,parseStatus,parseQuakes,histogram,largestMagnitude,safeUsgsUrl,NOTICE_URL,fmtTime,webcams} from '../src/monitoring.ts';
const quake=(time,mag=1)=>({id:String(time),properties:{time,mag,place:'Summit',url:'https://earthquake.usgs.gov/event'}});
test('official colors and alert levels map correctly; unknown is never green',()=>{
  for(const color of ['GREEN','YELLOW','ORANGE','RED']) assert.equal(colorTone(color),color.toLowerCase());
  assert.equal(colorTone(' yellow '),'yellow');assert.equal(colorTone(),'unknown');assert.equal(colorTone('UNASSIGNED'),'unknown');
  assert.equal(alertTone('ADVISORY'),'yellow');assert.equal(alertTone('WATCH'),'orange');assert.equal(alertTone(),'unknown');
});
test('empty intervals remain zero and boundaries are counted once',()=>{
  assert.deepEqual(histogram([],0,160).map(b=>b.count),Array(16).fill(0));
  const bins=histogram([quake(-1),quake(0),quake(10),quake(160),quake(161)],0,160);
  assert.equal(bins[0].count,1);assert.equal(bins[1].count,1);assert.equal(bins[15].count,1);assert.equal(bins.reduce((n,b)=>n+b.count,0),3);
});
test('missing and negative magnitudes are not converted to zero',()=>{
  assert.equal(largestMagnitude([]),null);assert.equal(largestMagnitude([quake(1,null)]),null);assert.equal(largestMagnitude([quake(1,-1),quake(2,-.3)]),-.3);
});
test('invalid feeds are rejected; events sorted and malformed events filtered',()=>{
  assert.throws(()=>parseStatus({}));assert.throws(()=>parseQuakes({}));
  assert.equal(parseStatus({alertLevel:' advisory ',colorCode:' yellow '}).colorCode,'YELLOW');
  const events=parseQuakes({features:[quake(1),null,quake(3),{id:'bad',properties:{time:'bad'}}]});
  assert.deepEqual(events.map(q=>q.properties.time),[3,1]);
});
test('source links cannot inject arbitrary URL schemes or hosts',()=>{
  for(const url of ['javascript:alert(1)','https://usgs.gov.evil.example','http://usgs.gov'])assert.equal(safeUsgsUrl(url),NOTICE_URL);
  assert.equal(safeUsgsUrl('https://volcanoes.usgs.gov/test'),'https://volcanoes.usgs.gov/test');
});
test('USGS naive UTC timestamp converts to HST and invalid dates are explicit',()=>{
  assert.match(fmtTime('2026-08-27 20:00:00'),/10:00/);assert.equal(fmtTime('invalid'),'Time unavailable');
});
test('all cameras have distinct IDs and permanent official redirect links',()=>{
  assert.equal(new Set(webcams.map(c=>c.id)).size,3);
  webcams.forEach(c=>assert.equal(c.url,`https://url.usgs.gov/${c.code.toLowerCase()}`));
});
