'use client';
import {useCallback,useEffect,useMemo,useState} from 'react';

type Range='Day'|'Week'|'Month';
type Status={alertLevel:string;colorCode:string;noticeSynopsis:string;noticeUrl:string;alertDate:string};
type Quake={id:string;properties:{mag:number|null;place:string;time:number;url:string};geometry:{coordinates:number[]}};
const rangeDays:Record<Range,number>={Day:1,Week:7,Month:30};
const webcams=[
  {id:'tk0tfYDxrUA',code:'V1cam',label:'West Halemaʻumaʻu',detail:'Northwest rim looking into the crater'},
  {id:'Tz5tPqRRv1Y',code:'V2cam',label:'East Halemaʻumaʻu',detail:'Northeast rim looking west'},
  {id:'BqmpkUdMtyA',code:'V3cam',label:'South Halemaʻumaʻu',detail:'South rim looking north'},
];
const fmtTime=(value:number|string)=>new Intl.DateTimeFormat('en-US',{timeZone:'Pacific/Honolulu',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'}).format(new Date(value));

export default function Home(){
  const [range,setRange]=useState<Range>('Day');
  const [status,setStatus]=useState<Status|null>(null);
  const [quakes,setQuakes]=useState<Quake[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [lastSync,setLastSync]=useState<Date|null>(null);
  const [camera,setCamera]=useState(0);
  const [modal,setModal]=useState(false);
  const [shared,setShared]=useState(false);

  const loadLive=useCallback(async()=>{
    setLoading(true);setError('');
    const start=new Date(Date.now()-rangeDays[range]*86400000).toISOString();
    const quakeUrl=`https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=19.421&longitude=-155.287&maxradiuskm=30&starttime=${encodeURIComponent(start)}&orderby=time&limit=20000`;
    try{
      const [statusRes,quakeRes]=await Promise.all([
        fetch('https://volcanoes.usgs.gov/vsc/api/volcanoApi/vhpstatus/332010'),
        fetch(quakeUrl),
      ]);
      if(!statusRes.ok||!quakeRes.ok)throw new Error('Official feed did not respond');
      const statusData=await statusRes.json();
      const quakeData=await quakeRes.json();
      setStatus(statusData);setQuakes(quakeData.features||[]);setLastSync(new Date());
    }catch(e){setError(e instanceof Error?e.message:'Live feed unavailable');}
    finally{setLoading(false)}
  },[range]);

  useEffect(()=>{loadLive();const timer=setInterval(loadLive,300000);return()=>clearInterval(timer)},[loadLive]);

  const bars=useMemo(()=>{const bins=Array(16).fill(0);const span=rangeDays[range]*86400000;const start=Date.now()-span;quakes.forEach(q=>{const i=Math.min(15,Math.max(0,Math.floor((q.properties.time-start)/span*16)));bins[i]++});const max=Math.max(...bins,1);return bins.map(v=>Math.max(5,Math.round(v/max*100)))},[quakes,range]);
  const maxMag=useMemo(()=>quakes.reduce((m,q)=>Math.max(m,q.properties.mag??0),0),[quakes]);
  const outlook=status?.alertLevel==='WARNING'?'Warning':status?.alertLevel==='WATCH'?'Heightened':status?.alertLevel==='ADVISORY'?'Watch':'Normal';
  const signalCards=[
    {icon:'↯',tone:'amber',label:'Nearby earthquakes',value:loading?'—':quakes.length.toLocaleString(),unit:`within 30 km · past ${rangeDays[range]} ${range==='Day'?'day':'days'}`,tag:'LIVE USGS',text:`Largest recorded magnitude in this window: M${maxMag.toFixed(1)}. Counts update from the USGS earthquake catalog.`},
    {icon:'●',tone:'red',label:'Aviation color',value:status?.colorCode||'—',unit:'official USGS color code',tag:'LIVE USGS',text:'The aviation color code communicates potential ash and eruption hazards to aircraft.'},
    {icon:'!',tone:'blue',label:'Volcano alert',value:status?.alertLevel||'—',unit:'official ground alert level',tag:'LIVE USGS',text:'This is the current alert level issued by the Hawaiian Volcano Observatory.'},
  ];
  const share=async()=>{try{if(navigator.share)await navigator.share({title:'Kīlauea Watch',text:'Live Kīlauea monitoring made clear',url:location.href});else await navigator.clipboard.writeText(location.href);setShared(true);setTimeout(()=>setShared(false),1800)}catch{}};

  return <main className="shell">
    <nav className="nav"><a className="brand" href="#top"><span className="brandMark">K</span><span>Kīlauea Watch</span></a><div className="navLinks"><a href="#activity">Activity</a><a href="#cameras">Cameras</a><a href="#signals">Signals</a><a href="#learn">Learn</a></div><button className="share" onClick={share}>{shared?'Link copied ✓':'Share tracker'}</button></nav>

    <section className="hero" id="top"><div><p className="eyebrow"><span className="liveDot"/> Kīlauea summit · official feeds</p><h1>What is the volcano<br/><em>telling us now?</em></h1><p className="intro">Live USGS alert information, nearby earthquakes, and official summit cameras—translated into clear language for everyone.</p><div className="heroNote liveNote"><b>{error?'FEED ISSUE':'LIVE DATA'}</b><span>{error?'The official feed could not be reached. Use the USGS link below for current conditions.':`USGS data refreshed ${lastSync?fmtTime(lastSync.getTime()):'now'} · automatically checks every 5 minutes.`}</span><button onClick={loadLive} disabled={loading}>{loading?'Refreshing…':'Refresh'}</button></div></div>
      <div className="statusCard"><div className="statusTop"><span>Official USGS status</span><span className="updated liveBadge">{loading?'SYNCING':status?`${status.colorCode} · ${status.alertLevel}`:'UNAVAILABLE'}</span></div><div className="signal"><span className="signalRing"><i/></span><div><strong>{outlook}</strong><small>{status?`USGS alert level: ${status.alertLevel}`:'Waiting for the official feed'}</small></div></div><div className="meter"><i className={`marker ${outlook.toLowerCase()}`}/></div><div className="meterLabels"><span>Normal</span><span>Advisory</span><span>Watch</span><span>Warning</span></div></div>
    </section>

    <section className="forecastStrip liveOutlook"><div><span className="forecastIcon">≈</span><p><b>Official activity summary</b><br/><small>{status?.noticeSynopsis||'Loading the newest Hawaiian Volcano Observatory notice…'}</small></p></div><a className="outlookLink" href={status?.noticeUrl||'https://www.usgs.gov/volcanoes/kilauea/volcano-updates'} target="_blank" rel="noreferrer">Read USGS notice <span>↗</span></a></section>

    <section className="dashboard" id="activity"><article className="chartCard"><header><div><p className="kicker">Live earthquake catalog</p><h2>{quakes.length?`${quakes.length.toLocaleString()} nearby earthquakes`:'Waiting for earthquake data'}</h2></div><div className="ranges">{(['Day','Week','Month'] as Range[]).map(r=><button key={r} onClick={()=>setRange(r)} className={range===r?'active':''}>{r}</button>)}</div></header><div className="chartWrap"><div className="ylabels"><span>More</span><span>Typical</span><span>Fewer</span></div><div className="barChart" aria-label={`USGS earthquake counts for the past ${rangeDays[range]} days`}>{bars.map((v,i)=><i key={i} style={{height:`${v}%`}} title={`Relative earthquake count ${v}`}/>)}</div></div><footer><span>{range==='Day'?'24 hours ago':range==='Week'?'7 days ago':'30 days ago'}</span><span>Now</span></footer><p className="plain"><b>In plain language:</b> Each bar groups earthquakes detected within 30 km of Kīlauea’s summit. A higher bar means more earthquakes during that part of the selected window. Counts are preliminary and may be revised by USGS.</p></article>
      <aside className="stack"><article className="metricCard"><div className="metricHead"><span className="icon amber">↯</span><span className="trend up">LIVE</span></div><p className="kicker">Latest earthquake</p><strong className="metric">{quakes[0]?.properties.mag!=null?`M${quakes[0].properties.mag.toFixed(1)}`:'—'}</strong><p>{quakes[0]?`${quakes[0].properties.place} · ${fmtTime(quakes[0].properties.time)}`:'Waiting for USGS data.'}</p>{quakes[0]&&<a className="dataLink" href={quakes[0].properties.url} target="_blank" rel="noreferrer">Event details ↗</a>}</article><article className="metricCard"><div className="metricHead"><span className="icon blue">!</span><span className="trend steady">OFFICIAL</span></div><p className="kicker">HVO alert level</p><strong className="metric">{status?.alertLevel||'—'}</strong><p>{status?`Aviation color: ${status.colorCode} · issued ${fmtTime(status.alertDate.replace(' ','T')+'Z')}`:'Waiting for the official status feed.'}</p></article></aside>
    </section>

    <section className="cameraSection" id="cameras"><div className="sectionTitle"><p className="kicker">Live from Halemaʻumaʻu</p><h2>Choose an official USGS camera</h2><p>These YouTube livestreams are operated by the USGS Hawaiian Volcano Observatory. Darkness, clouds, rain, volcanic gas, or maintenance can obscure the view.</p></div><div className="cameraLayout"><div className="videoFrame"><iframe key={webcams[camera].id} src={`https://www.youtube.com/embed/${webcams[camera].id}?autoplay=1&mute=1&rel=0`} title={`${webcams[camera].code} ${webcams[camera].label} live webcam`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen/><span className="camLive"><i/> USGS LIVE</span></div><div className="cameraPicker">{webcams.map((cam,i)=><button key={cam.code} onClick={()=>setCamera(i)} className={camera===i?'selected':''}><span>{cam.code}</span><b>{cam.label}</b><small>{cam.detail}</small></button>)}<a href="https://www.usgs.gov/volcanoes/kilauea/summit-webcams" target="_blank" rel="noreferrer">All USGS webcams ↗</a></div></div></section>

    <section className="signalsSection" id="signals"><div className="sectionTitle"><p className="kicker">The live signal board</p><h2>Current facts, one bigger story</h2><p>No single measurement predicts an eruption. These values come directly from official USGS feeds; specialized deformation and gas interpretation remains with HVO scientists.</p></div><div className="signalGrid">{signalCards.map(c=><article key={c.label}><div className={`icon ${c.tone}`}>{c.icon}</div><p className="kicker">{c.label}</p><strong>{c.value}</strong><small>{c.unit}</small><span className="tag liveTag">{c.tag}</span><p>{c.text}</p></article>)}</div></section>

    <section className="learn" id="learn"><div><p className="kicker">About prediction</p><h2>Live data improves awareness—not certainty.</h2><p>The official alert level and earthquake changes tell us what is happening now. Scientists combine these with deformation, gas, thermal, visual, and historical evidence. An exact eruption day or hour cannot be reliably calculated by this webpage.</p><button onClick={()=>setModal(true)}>See the 4-step method</button></div><div className="forecastScale"><p><b>Current official position</b></p><div><span className="level l2">●</span><p><b>{status?.alertLevel||'Loading'}</b><small>USGS Volcano Alert Level</small></p></div><div><span className="level l2">●</span><p><b>{status?.colorCode||'Loading'}</b><small>USGS Aviation Color Code</small></p></div><em>Only official scientists issue alerts and forecasts.</em></div></section>

    <section className="safety"><span>!</span><div><p className="kicker">When it matters</p><h2>Use official alerts for real-world decisions.</h2><p>Conditions around Kīlauea can change quickly. This tracker republishes selected live USGS data but does not replace evacuation notices, closures, air-quality guidance, or direct USGS updates.</p></div><a href="https://www.usgs.gov/volcanoes/kilauea/volcano-updates" target="_blank" rel="noreferrer">Open USGS updates ↗</a></section>
    <footer className="footer" id="sources"><div className="brand"><span className="brandMark">K</span><span>Kīlauea Watch</span></div><p>Live sources: USGS Volcano Status API and USGS Earthquake Catalog.</p><div><a href="https://www.usgs.gov/volcanoes/kilauea" target="_blank" rel="noreferrer">USGS Kīlauea</a><a href="https://earthquake.usgs.gov/fdsnws/event/1/" target="_blank" rel="noreferrer">Earthquake API</a></div></footer>

    {modal&&<div className="modalShade" onClick={()=>setModal(false)}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="method" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setModal(false)} aria-label="Close">×</button><p className="kicker">Behind the outlook</p><h2 id="method">How scientists estimate what may happen next</h2><ol><li><b>Measure</b><span>Seismometers, GPS, gas sensors, cameras, and satellites collect clues.</span></li><li><b>Compare</b><span>Experts compare current patterns with the volcano’s own history.</span></li><li><b>Combine</b><span>Multiple clues agreeing is more meaningful than one unusual reading.</span></li><li><b>Communicate uncertainty</b><span>Forecasts describe likelihood and confidence—not an exact appointment.</span></li></ol><p className="modalWarn"><b>Live-source note:</b> This page fetches current alert and earthquake data from USGS. Measurements are preliminary and may be revised.</p></section></div>}
  </main>
}
