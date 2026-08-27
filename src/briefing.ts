import type {Quake} from './monitoring';

// Quote complete source sentences, including uncertainty and negation; never infer a date.
export function forecastExcerpt(summary:string) {
  const sentences=summary.match(/[^.!?]+(?:[.!?]+|$)/g)||[];
  return sentences.filter(s=>/forecast|more data|uncertain|likely|next episode/i.test(s)).map(s=>s.trim()).join(' ') || null;
}
export function compareWindows(quakes:Quake[],start:number,end:number) {
  const midpoint=start+(end-start)/2;
  const earlier=quakes.filter(q=>q.properties.time>=start&&q.properties.time<midpoint).length;
  const recent=quakes.filter(q=>q.properties.time>=midpoint&&q.properties.time<=end).length;
  return {earlier,recent,direction:recent>earlier?'more':recent<earlier?'fewer':'the same number of'};
}
