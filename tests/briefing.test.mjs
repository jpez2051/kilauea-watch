import test from 'node:test';
import assert from 'node:assert/strict';
import {forecastExcerpt,compareWindows} from '../src/briefing.ts';
test('forecast extract preserves uncertainty rather than inventing a countdown',()=>{
  assert.equal(forecastExcerpt('Reinflation has stopped. More data are needed to determine the forecast window for the next episode.'),'More data are needed to determine the forecast window for the next episode.');
  assert.equal(forecastExcerpt('No forecast is available.'),'No forecast is available.');
  assert.equal(forecastExcerpt('The volcano is paused.'),null);
  assert.equal(forecastExcerpt(''),null);
});
test('equal-length earthquake comparison uses disjoint intervals and inclusive final endpoint',()=>{
  const qs=[-1,0,4,5,10,11].map(time=>({properties:{time}}));
  assert.deepEqual(compareWindows(qs,0,10),{earlier:2,recent:2,direction:'the same number of'});
  assert.deepEqual(compareWindows([],0,10),{earlier:0,recent:0,direction:'the same number of'});
  assert.equal(compareWindows([{properties:{time:9}}],0,10).direction,'more');
});
