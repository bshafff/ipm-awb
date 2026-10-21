/* Outbox: antrian kirim offline. Data disimpan di HP (localStorage), dikirim ulang otomatis saat ada sinyal. */
window.Outbox=(function(){
  const key='outbox_'+(location.pathname.split('/').pop()||'index');let send=null,done=null,busy=false,badge=null;
  const rd=()=>{try{return JSON.parse(localStorage.getItem(key)||'[]')}catch(e){return[]}};
  const wr=a=>{try{localStorage.setItem(key,JSON.stringify(a))}catch(e){}ui()};
  function ui(){const n=rd().length;if(!document.body)return;
    if(!badge){badge=document.createElement('div');badge.style.cssText='position:fixed;left:10px;bottom:calc(10px + env(safe-area-inset-bottom));z-index:998;background:#92400e;color:#fff;font:700 12px sans-serif;padding:7px 11px;border-radius:99px;box-shadow:0 2px 8px rgba(0,0,0,.25)';badge.onclick=()=>flush();document.body.appendChild(badge)}
    badge.style.display=n?'block':'none';badge.textContent='⏳ '+n+' data menunggu sinyal (tap = kirim sekarang)'}
  async function flush(){
    if(busy||!send)return;const q=rd();if(!q.length)return;busy=true;let sent=0;
    try{while(q.length){let ok=false;try{ok=await send(q[0])}catch(e){}if(!ok)break;q.shift();sent++;wr(q)}}finally{busy=false}
    if(sent&&done)done(sent,q.length)}
  return{
    init(s,d){send=s;done=d;ui();addEventListener('online',flush);document.addEventListener('visibilitychange',()=>{if(!document.hidden)flush()});setInterval(flush,20000);setTimeout(flush,1500)},
    add(it){const q=rd();q.push(it);wr(q);flush()},pending:rd,count:()=>rd().length,flush};
})();
