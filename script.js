// FREEFLIX 1.0 - FINAL PRODUCTION CODE
// This version includes auto-trimming to prevent "Failed to Fetch" errors.

const SUPABASE_URL = 'https://nferraozvfggyxlbsppo.supabase.co'.trim(); 
const SUPABASE_KEY = 'sb_publishable_WJYQ97C8H1FfVEkCqWlIcQ_ntuQO3Us'.trim();
const TMDB_KEY = '729792fe9a5158a25c636273a292acd3'.trim();
const ADMIN_PASS = "232";

// Initialize Supabase
const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let allMovies = [];
let isAdmin = false;
let editingId = null;

// --- 1. ADMIN SYSTEM ---
window.addEventListener('keydown', (e) => {
    if (e.shiftKey && e.key.toLowerCase() === 'a') {
        const pass = prompt("ADMIN CODE:");
        if (pass === ADMIN_PASS) {
            isAdmin = !isAdmin;
            document.getElementById('admin-panel').classList.toggle('hidden');
            document.getElementById('admin-status').innerText = isAdmin ? "ADMINISTRATOR" : "SECURE LINE";
            renderGrid(allMovies);
        }
    }
});

// --- 2. STARTUP LOGIC ---
async function init() {
    // Splash screen timer
    setTimeout(() => { 
        const splash = document.getElementById('splash');
        if (splash) splash.style.display = 'none'; 
    }, 1200);

    try {
        // Fetch Dashboard Movies from your Supabase
        const { data: dbData, error: dbError } = await _supabase
            .from('movies')
            .select('*')
            .order('created_at', { ascending: false });

        if (dbError) {
            console.error("Database Connection Error:", dbError.message);
        }
        
        allMovies = dbData || [];

        // Fetch Trending (Non-blocking)
        try {
            const tmdbRes = await fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_KEY}`).then(r => r.json());
            if (tmdbRes.results) {
                const tmdbFormatted = tmdbRes.results.map(m => ({
                    title: m.title, 
                    poster_url: `https://image.tmdb.org/t/p/w500${m.poster_path}`,
                    dropbox_url: null, 
                    category: 'Trending', 
                    id: m.id
                }));
                allMovies = [...allMovies, ...tmdbFormatted];
            }
        } catch (e) {
            console.warn("TMDB Trends currently unavailable.");
        }

        renderGrid(allMovies);
    } catch (err) {
        console.error("System Init Error:", err);
    }
}

// --- 3. RENDERING ---
function renderGrid(movies) {
    const grid = document.getElementById('movie-grid');
    if (!grid) return;
    
    if (movies.length === 0) {
        grid.innerHTML = `<div class="col-span-full py-20 text-center"><p class="text-white/40 italic">No movies found in your dashboard yet.</p></div>`;
        return;
    }

    grid.innerHTML = movies.map(m => {
        const isTMDB = !m.dropbox_url;
        const mString = JSON.stringify(m).replace(/'/g, "&apos;");
        return `
        <div class="relative group rounded-xl overflow-hidden border border-white/5 bg-[#111] hover:border-[#00F2FF]/50 transition-all duration-300">
            <div onclick='openMedia(${mString})' class="cursor-pointer">
                <img src="${m.poster_url}" loading="lazy" class="w-full aspect-[2/3] object-cover opacity-80 group-hover:opacity-100 transition-opacity">
                <div class="absolute inset-0 bg-gradient-to-t from-black via-black/20 p-3 flex flex-col justify-end">
                    <p class="text-[7px] text-[#00F2FF] font-bold uppercase tracking-widest">${m.category || 'Movie'}</p>
                    <h4 class="font-bold text-[10px] uppercase truncate">${m.title}</h4>
                </div>
            </div>
            ${isAdmin ? `
                <div class="absolute top-2 right-2 flex gap-1 z-20">
                    ${isTMDB ? 
                        `<button onclick='importTMDB(${mString})' class="bg-green-600 hover:bg-green-500 p-1.5 rounded-lg text-[10px] shadow-lg">📥</button>` : 
                        `<button onclick='openEditModal(${mString})' class="bg-blue-600 hover:bg-blue-500 p-1.5 rounded-lg text-[10px] shadow-lg">✎</button>
                         <button onclick='deleteMedia(${m.id})' class="bg-red-600 hover:bg-red-500 p-1.5 rounded-lg text-[10px] shadow-lg">✕</button>`
                    }
                </div>
            ` : ''}
        </div>
    `}).join('');
}

// --- 4. PLAYER ---
async function openMedia(m) {
    const epList = document.getElementById('episode-list');
    const playerOverlay = document.getElementById('player-overlay');
    document.getElementById('playing-title').innerText = m.title;
    playerOverlay.classList.remove('hidden');
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
        const playableUrl = url.replace('dl=0', 'raw=1');
        container.innerHTML = `<video controls autoplay class="w-full h-full rounded-lg bg-black"><source src="${playableUrl}" type="video/mp4"></video>`;
    } else {
        // Fallback to TMDB Trailer
        try {
            const res = await fetch(`https://api.themoviedb.org/3/movie/${id}/videos?api_key=${TMDB_KEY}`).then(r => r.json());
            const key = res.results?.find(v => v.site === "YouTube")?.key;
            if (key) {
                container.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${key}?autoplay=1" class="w-full h-full rounded-lg" frameborder="0" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
            } else {
                container.innerHTML = `<div class="flex items-center justify-center h-full text-white/50">Trailer not found for this title.</div>`;
            }
        } catch (e) {
            container.innerHTML = `<div class="flex items-center justify-center h-full text-white/50">Error loading source.</div>`;
        }
    }
}

// --- 5. ACTIONS ---
function importTMDB(m) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('up-title').value = m.title;
    document.getElementById('up-poster').value = m.poster_url;
    document.getElementById('up-dropbox').focus();
    alert("Details imported! Now paste the Dropbox Link to publish.");
}

async function uploadMovie() {
    const title = document.getElementById('up-title').value;
    const cat = document.getElementById('up-category').value;
    const rawUrl = document.getElementById('up-dropbox').value;
    const poster = document.getElementById('up-poster').value;

    if(!title || !rawUrl) return alert("Please provide at least a Title and a Link.");

    let payload = { title, category: cat, poster_url: poster };
    
    if (cat === 'Series') {
        const epArray = rawUrl.split(',').map(l => l.trim().replace('dl=0', 'raw=1'));
        payload.episodes = epArray;
        payload.dropbox_url = epArray[0];
    } else { 
        payload.dropbox_url = rawUrl.replace('dl=0', 'raw=1'); 
    }

    try {
        const { error } = await _supabase.from('movies').insert([payload]);
        if (error) throw error;
        location.reload();
    } catch (err) {
        alert("Upload Failed: " + err.message);
        console.error("Upload detail:", err);
    }
}

async function deleteMedia(id) {
    if(confirm("Are you sure you want to delete this?")) { 
        await _supabase.from('movies').delete().eq('id', id); 
        location.reload(); 
    }
}

function searchMovies() {
    const term = document.getElementById('live-search').value.toLowerCase();
    const filtered = allMovies.filter(m => m.title.toLowerCase().includes(term));
    renderGrid(filtered);
}

function filterCat(cat) {
    document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active-cat'));
    if (event) event.target.classList.add('active-cat');
    renderGrid(cat === 'All' ? allMovies : allMovies.filter(m => m.category === cat));
}

function closePlayer() { 
    document.getElementById('player-overlay').classList.add('hidden'); 
    document.getElementById('player-container').innerHTML = ''; 
}

// Launch
init();