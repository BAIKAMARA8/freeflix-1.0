const SUPABASE_URL = 'https://nferraozvfggyxlbsppo.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_WJYQ97C8H1FfVEkCqWlIcQ_ntuQO3Us';
const TMDB_KEY = '729792fe9a5158a25c636273a292acd3';
const ADMIN_PASS = "232";

const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
let allMovies = [];
let isAdmin = false;
let editingId = null;

// ADMIN TOGGLE
window.addEventListener('keydown', (e) => {
    if (e.shiftKey && e.key.toLowerCase() === 'a') {
        if (prompt("ADMIN CODE:") === ADMIN_PASS) {
            isAdmin = !isAdmin;
            document.getElementById('admin-panel').classList.toggle('hidden');
            document.getElementById('admin-status').innerText = isAdmin ? "ADMINISTRATOR" : "SECURE LINE";
            renderGrid(allMovies);
        }
    }
});

// STARTUP
async function init() {
    setTimeout(() => { document.getElementById('splash')?.remove(); }, 1200);
    try {
        const [dbRes, tmdbRes] = await Promise.all([
            _supabase.from('movies').select('*').order('created_at', {ascending: false}),
            fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_KEY}`).then(r => r.json())
        ]);
        const tmdbFormatted = tmdbRes.results.map(m => ({
            title: m.title, 
            poster_url: `https://image.tmdb.org/t/p/w500${m.poster_path}`,
            dropbox_url: null, 
            category: 'Trending', 
            id: m.id
        }));
        allMovies = [...(dbRes.data || []), ...tmdbFormatted];
        renderGrid(allMovies);
    } catch (err) { console.error(err); }
}

// RENDER
function renderGrid(movies) {
    const grid = document.getElementById('movie-grid');
    grid.innerHTML = movies.map(m => {
        const isTMDB = !m.dropbox_url;
        const mString = JSON.stringify(m).replace(/'/g, "&apos;");
        return `
        <div class="relative group rounded-xl overflow-hidden border border-white/5 bg-[#111] hover:border-[#00F2FF]/50 transition-all">
            <div onclick='openMedia(${mString})' class="cursor-pointer">
                <img src="${m.poster_url}" loading="lazy" class="w-full aspect-[2/3] object-cover opacity-80 group-hover:opacity-100">
                <div class="absolute inset-0 bg-gradient-to-t from-black p-3 flex flex-col justify-end">
                    <p class="text-[7px] text-[#00F2FF] font-bold uppercase tracking-widest">${m.category || 'Global'}</p>
                    <h4 class="font-bold text-[10px] uppercase truncate">${m.title}</h4>
                </div>
            </div>
            ${isAdmin ? `
                <div class="absolute top-2 right-2 flex gap-1 z-20">
                    ${isTMDB ? 
                        `<button onclick='importTMDB(${mString})' class="bg-green-600 p-1.5 rounded-lg text-[10px]">📥</button>` : 
                        `<button onclick='openEditModal(${mString})' class="bg-blue-600 p-1.5 rounded-lg text-[10px]">✎</button>
                         <button onclick='deleteMedia(${m.id})' class="bg-red-600 p-1.5 rounded-lg text-[10px]">✕</button>`
                    }
                </div>
            ` : ''}
        </div>
    `}).join('');
}

// PLAYER (With Referrer Fix)
async function openMedia(m) {
    const epList = document.getElementById('episode-list');
    document.getElementById('playing-title').innerText = m.title;
    document.getElementById('player-overlay').classList.remove('hidden');
    epList.innerHTML = '';

    if (m.category === 'Series' && m.episodes) {
        const eps = Array.isArray(m.episodes) ? m.episodes : JSON.parse(m.episodes);
        epList.innerHTML = `<div class="flex gap-2 overflow-x-auto pb-4 no-scrollbar">` + 
            eps.map((url, i) => `<button onclick="playSource('${url}')" class="bg-white/5 border border-white/10 px-5 py-2 rounded-xl text-[10px] hover:bg-[#00F2FF] hover:text-black transition-all">EP ${i+1}</button>`).join('') + `</div>`;
        playSource(eps[0]);
    } else {
        playSource(m.dropbox_url, m.id);
    }
}

async function playSource(url, id) {
    const container = document.getElementById('player-container');
    if (url) {
        container.innerHTML = `<video controls autoplay class="w-full h-full"><source src="${url.replace('dl=0', 'raw=1')}" type="video/mp4"></video>`;
    } else {
        const res = await fetch(`https://api.themoviedb.org/3/movie/${id}/videos?api_key=${TMDB_KEY}`).then(r => r.json());
        const key = res.results.find(v => v.site === "YouTube")?.key;
        container.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${key}?autoplay=1" class="w-full h-full" frameborder="0" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
    }
}

// ACTIONS
function importTMDB(m) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('up-title').value = m.title;
    document.getElementById('up-poster').value = m.poster_url;
    document.getElementById('up-dropbox').focus();
}

function openEditModal(m) {
    editingId = m.id;
    document.getElementById('edit-title').value = m.title;
    document.getElementById('edit-dropbox').value = m.dropbox_url;
    document.getElementById('edit-poster').value = m.poster_url;
    document.getElementById('edit-category').value = m.category;
    document.getElementById('edit-modal').classList.remove('hidden');
}

async function saveEdit() {
    const data = {
        title: document.getElementById('edit-title').value,
        dropbox_url: document.getElementById('edit-dropbox').value.replace('dl=0', 'raw=1'),
        poster_url: document.getElementById('edit-poster').value,
        category: document.getElementById('edit-category').value
    };
    await _supabase.from('movies').update(data).eq('id', editingId);
    location.reload();
}

async function deleteMedia(id) {
    if(confirm("Delete forever?")) { await _supabase.from('movies').delete().eq('id', id); location.reload(); }
}

async function uploadMovie() {
    const title = document.getElementById('up-title').value;
    const cat = document.getElementById('up-category').value;
    const rawUrl = document.getElementById('up-dropbox').value;
    const poster = document.getElementById('up-poster').value;

    let payload = { title, category: cat, poster_url: poster };
    if (cat === 'Series') {
        const epArray = rawUrl.split(',').map(l => l.trim().replace('dl=0', 'raw=1'));
        payload.episodes = epArray;
        payload.dropbox_url = epArray[0];
    } else { payload.dropbox_url = rawUrl.replace('dl=0', 'raw=1'); }

    await _supabase.from('movies').insert([payload]);
    location.reload();
}

function searchMovies() {
    const term = document.getElementById('live-search').value.toLowerCase();
    renderGrid(allMovies.filter(m => m.title.toLowerCase().includes(term)));
}

function filterCat(cat) {
    document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active-cat'));
    if (event) event.target.classList.add('active-cat');
    renderGrid(cat === 'All' ? allMovies : allMovies.filter(m => m.category === cat));
}

function showShareQR() {
    document.getElementById('qr-container').innerHTML = "";
    new QRCode(document.getElementById('qr-container'), { text: window.location.href, width: 140, height: 140 });
    document.getElementById('qr-modal').classList.remove('hidden');
}

function closePlayer() { document.getElementById('player-overlay').classList.add('hidden'); document.getElementById('player-container').innerHTML = ''; }
init();