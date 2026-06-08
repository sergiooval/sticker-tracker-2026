const KEY = 'sticker-tracker-2026-v2';
const $ = selector => document.querySelector(selector);
const teamsEl = $('#teams');
let state = JSON.parse(localStorage.getItem(KEY) || '{}');

const save = () => localStorage.setItem(KEY, JSON.stringify(state));
const idFor = (code, n) => `${code}-${n}`;

function numbersForSpecial(s){
  return s.numbers || Array.from({length:s.count}, (_,i)=>i+1);
}

function allItems(){
  const items = [];
  TEAMS.forEach(([code,name]) => {
    for(let n=1; n<=20; n++) items.push({code,name,n,id:idFor(code,n)});
  });
  SPECIALS.forEach(s => {
    numbersForSpecial(s).forEach(n => items.push({code:s.code,name:s.name,n,id:idFor(s.code,n)}));
  });
  return items;
}

function statusOf(id){
  return state[id] || 'missing';
}

function cycle(id){
  const next = {missing:'owned', owned:'dup', dup:'missing'}[statusOf(id)];
  if(next === 'missing') delete state[id];
  else state[id] = next;
  save();
  render();
}

function setGroup(code, status){
  allItems().filter(item => item.code === code).forEach(item => {
    if(status === 'missing') delete state[item.id];
    else state[item.id] = status;
  });
  save();
  render();
}

function updateStats(){
  const items = allItems();
  const owned = items.filter(item => statusOf(item.id) === 'owned' || statusOf(item.id) === 'dup').length;
  const dup = items.filter(item => statusOf(item.id) === 'dup').length;
  $('#ownedCount').textContent = owned;
  $('#missingCount').textContent = items.length - owned;
  $('#dupCount').textContent = dup;
  $('#progressPct').textContent = Math.round((owned / items.length) * 100) + '%';
}

function teamCard(code, name, nums){
  const q = $('#search').value.trim().toLowerCase();
  const filter = $('#statusFilter').value;
  const items = nums.map(n => ({code,name,n,id:idFor(code,n)}));

  const visible = items.filter(item => {
    const st = statusOf(item.id);
    const matches = !q ||
      code.toLowerCase().includes(q) ||
      name.toLowerCase().includes(q) ||
      `${code} ${item.n}`.toLowerCase().includes(q) ||
      `${code}${item.n}`.toLowerCase().includes(q);
    const ok = filter === 'all' || st === filter || (filter === 'owned' && st === 'dup');
    return matches && ok;
  });

  if(!visible.length) return '';

  const owned = items.filter(item => statusOf(item.id) === 'owned' || statusOf(item.id) === 'dup').length;

  return `
    <article class="team-card">
      <div class="team-header">
        <div>
          <div class="team-name">${name}</div>
          <div class="team-code">${code}</div>
        </div>
        <span class="counter">${owned}/${items.length}</span>
      </div>

      <div class="stickers-grid">
        ${visible.map(item => {
          const st = statusOf(item.id);
          const text = st === 'dup' ? 'repetida' : st === 'owned' ? 'pegada' : 'falta';
          return `<button class="sticker ${st}" onclick="cycle('${item.id}')"><span>${code} ${item.n}</span><small>${text}</small></button>`;
        }).join('')}
      </div>

      <div class="card-actions">
        <button onclick="setGroup('${code}','owned')">Marcar todo</button>
        <button onclick="setGroup('${code}','missing')">Limpiar</button>
      </div>
    </article>
  `;
}

function render(){
  const normal = TEAMS.map(([code,name]) => teamCard(code, name, Array.from({length:20}, (_,i)=>i+1))).join('');
  const specials = SPECIALS.map(s => teamCard(s.code, s.name, numbersForSpecial(s))).join('');
  teamsEl.innerHTML = normal + specials;
  updateStats();
}

$('#search').addEventListener('input', render);
$('#statusFilter').addEventListener('change', render);

$('#cameraInput').addEventListener('change', event => {
  const file = event.target.files[0];
  if(!file) return;
  $('#previewImage').src = URL.createObjectURL(file);
  $('#photoPanel').classList.remove('hidden');
});

$('#closePhoto').addEventListener('click', () => {
  $('#photoPanel').classList.add('hidden');
});

$('#exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'sticker-tracker-2026-backup.json';
  a.click();
});

$('#importInput').addEventListener('change', async event => {
  const file = event.target.files[0];
  if(!file) return;
  state = JSON.parse(await file.text());
  save();
  render();
});

$('#resetBtn').addEventListener('click', () => {
  if(confirm('¿Reiniciar todo tu progreso?')){
    state = {};
    save();
    render();
  }
});

render();
