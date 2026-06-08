const KEY = 'sticker-tracker-2026-v2';
const $ = s => document.querySelector(s);
const teamsEl = $('#teams');
let state = JSON.parse(localStorage.getItem(KEY) || '{}');

const save = () => localStorage.setItem(KEY, JSON.stringify(state));
const idFor = (code, n) => `${code}-${n}`;

function numbersForSpecial(s){
  return s.numbers || Array.from({length:s.count},(_,i)=>i+1);
}

function allItems(){
  const items=[];
  TEAMS.forEach(([code,name])=>{
    for(let n=1;n<=20;n++) items.push({code,name,n,id:idFor(code,n),label:`${code} ${n}`});
  });
  SPECIALS.forEach(s=>{
    numbersForSpecial(s).forEach(n=>items.push({code:s.code,name:s.name,n,id:idFor(s.code,n),label:`${s.code} ${n}`}));
  });
  return items;
}

function statusOf(id){ return state[id] || 'missing'; }

function cycle(id){
  const next = {missing:'owned', owned:'dup', dup:'missing'}[statusOf(id)];
  if(next==='missing') delete state[id];
  else state[id]=next;
  save();
  render();
}

function setGroup(code, status){
  allItems().filter(x=>x.code===code).forEach(x=>{
    if(status==='missing') delete state[x.id];
    else state[x.id]=status;
  });
  save();
  render();
}

function stats(){
  const items=allItems();
  const owned=items.filter(x=>statusOf(x.id)==='owned' || statusOf(x.id)==='dup').length;
  const dup=items.filter(x=>statusOf(x.id)==='dup').length;
  $('#ownedCount').textContent=owned;
  $('#missingCount').textContent=items.length-owned;
  $('#dupCount').textContent=dup;
  $('#progressPct').textContent=items.length ? Math.round((owned/items.length)*100)+'%' : '0%';
}

function teamCard(code,name,nums){
  const q=$('#search').value.trim().toLowerCase();
  const filter=$('#statusFilter').value;
  const items=nums.map(n=>({code,name,n,id:idFor(code,n)}));
  const visible=items.filter(x=>{
    const st=statusOf(x.id);
    const matches=!q || code.toLowerCase().includes(q) || name.toLowerCase().includes(q) || `${code} ${x.n}`.toLowerCase().includes(q);
    const ok=filter==='all' || st===filter || (filter==='owned' && st==='dup');
    return matches && ok;
  });
  if(!visible.length) return '';
  const owned=items.filter(x=>statusOf(x.id)==='owned'||statusOf(x.id)==='dup').length;
  return `
    <article class="team-card">
      <div class="team-head">
        <div>
          <h3>${name}</h3>
          <small>${code}</small>
        </div>
        <span class="pill">${owned}/${items.length}</span>
      </div>
      <div class="stickers">
        ${visible.map(x=>{
          const st=statusOf(x.id);
          const txt=st==='dup'?'repetida':st==='owned'?'pegada':'falta';
          return `<button class="sticker ${st}" onclick="cycle('${x.id}')"><span>${code} ${x.n}</span><small>${txt}</small></button>`;
        }).join('')}
      </div>
      <div class="team-actions">
        <button onclick="setGroup('${code}','owned')">Marcar todo</button>
        <button onclick="setGroup('${code}','missing')">Limpiar</button>
      </div>
    </article>`;
}

function render(){
  const normal = TEAMS.map(([c,n])=>teamCard(c,n,Array.from({length:20},(_,i)=>i+1))).join('');
  const specials = SPECIALS.map(s=>teamCard(s.code,s.name,numbersForSpecial(s))).join('');
  teamsEl.innerHTML = normal + specials;
  stats();
}

$('#search').addEventListener('input', render);
$('#statusFilter').addEventListener('change', render);

$('#cameraInput').addEventListener('change', e=>{
  const file=e.target.files[0];
  if(!file) return;
  $('#previewImage').src=URL.createObjectURL(file);
  $('#photoPanel').classList.remove('hidden');
});

$('#closePhoto').addEventListener('click',()=>$('#photoPanel').classList.add('hidden'));

$('#exportBtn').addEventListener('click',()=>{
  const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='sticker-tracker-2026-backup.json';
  a.click();
});

$('#importInput').addEventListener('change', async e=>{
  const file=e.target.files[0];
  if(!file) return;
  state=JSON.parse(await file.text());
  save();
  render();
});

$('#resetBtn').addEventListener('click',()=>{
  if(confirm('¿Reiniciar todo tu progreso?')){
    state={};
    save();
    render();
  }
});

render();
