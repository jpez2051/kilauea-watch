import {useEffect,useState} from 'react';
export function useFeed<T>(url:string,parse:(raw:unknown)=>T,refresh:number) {
  const [result,setResult]=useState<{url:string;data:T|null;checked:number|null;error:string;loading:boolean}>({url,data:null,checked:null,error:'',loading:true});
  useEffect(()=>{
    const controller=new AbortController();let active=true;
    setResult(old=>({url,data:old.url===url?old.data:null,checked:old.url===url?old.checked:null,error:old.url===url?old.error:'',loading:true}));
    const timeout=setTimeout(()=>controller.abort(),20000);
    (async()=>{try {
      const response=await fetch(url,{signal:controller.signal});
      if(!response.ok)throw new Error(`USGS returned HTTP ${response.status}`);
      const data=parse(await response.json());
      if(active)setResult({url,data,checked:Date.now(),error:'',loading:false});
    }catch(error){if(active)setResult(old=>({...old,loading:false,error:error instanceof Error&&error.name==='AbortError'?'Request timed out':error instanceof Error?error.message:'Feed unavailable'}));}
    finally{clearTimeout(timeout);}})();
    return()=>{active=false;clearTimeout(timeout);controller.abort();};
  },[url,parse,refresh]);
  if(result.url!==url)return {data:null,checked:null,error:'',loading:true,stale:false};
  return {...result,stale:!!result.data&&(!!result.error||!!result.checked&&Date.now()-result.checked>600000)};
}
