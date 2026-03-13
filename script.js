// FREEFLIX 1.0 - OFFICIAL PRODUCTION SCRIPT
const SUPABASE_URL = 'https://nferraozvgfgglxbsppo.supabase.co'.trim(); 
const SUPABASE_KEY = 'sb_secret_Gw2gqVc6tyWWcIEtOOpldg_oWQIfUX6
'.trim();
const OMDB_KEY = 'b5941be8'.trim(); // Your active OMDb Key
const ADMIN_PASS = "232";

const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let allMovies = [];
let isAdmin = false;

// --- ADMIN TOGGLE ---
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

// --- STARTUP ---
async function init() {
    setTimeout(() => { document.getElementById('splash')?.remove(); }, 1200);

    try {
        // 1. Get your personal movies from Supabase (Dashboard)
        const { data, error } = await _supabase
            .from('movies')
            .select('*')
            .order('created_at', {ascending: false});
        
        allMovies = data || [];

        // 2. Get 12 trending movies from OMDb to fill the grid
        try {
            const omdbRes = await fetch(`https://www.omdbapi.com/?s=action&type=movie&apikey=${OMDB_KEY}`).then(r => r.json());
            if (omdbRes.Search) {
                const omdbFormatted = omdbRes.Search.map(m => ({
                    title: m.Title, 
                    poster_url: m.Poster !== "N/A" ? m.Poster : 'https://via.placeholder.com/500x750?text=No+Poster',
                    dropbox_url: null, 
                    category: 'Global', 
                    id: m.imdbID
                }));
                allMovies = [...allMovies, ...omdbFormatted];
            }
        } catch (e) { console.warn("OMDb fetch failed."); }

        renderGrid(allMovies);
    } catch (err) { console.error("Critical Error:", err); }
}

// --- RENDER GRID ---
function renderGrid(movies) {
    const grid = document.getElementById('movie-grid');
    if (!grid) return;
    
    grid.innerHTML = movies.map(m => {
        const isExternal = !m.dropbox_url;
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
            ${isAdmin && !isExternal ? `
                <div class="absolute top-2 right-2 z-20">
                    <button onclick='deleteMedia(${m.id})' class="bg-red-600 p-1.5 rounded-lg text-[10px]">✕</button>
                </div>
            ` : ''}
        </div>`;
    }).join('');
}

// --- PLAYER ---
function openMedia(m) {
    const container = document.getElementById('player-container');
    document.getElementById('playing-title').innerText = m.title;
    document.getElementById('player-overlay').classList.remove('hidden');

    if (m.dropbox_url) {
        // Play your uploaded movie from Dropbox
        const url = m.dropbox_url.replace('dl=0', 'raw=1');
        container.innerHTML = `<video controls autoplay class="w-full h-full"><source src="${url}" type="video/mp4"></video>`;
    } else {
        // External OMDb Movie (Coming Soon/Trailer)
        container.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full text-center p-5 bg-[#0a0a0a]">
            <p class="text-white/40 mb-4 text-xs italic">Movie available in global database. Add to your local server to play.</p>
            <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(m.title)}+trailer" 
               target="_blank" 
               class="bg-[#00F2FF] text-black px-6 py-2 rounded-full text-[10px] font-bold hover:scale-105 transition-transform">
               WATCH TRAILER
            </a>
        </div>`;
    }
}

// --- UPLOAD ---
async function uploadMovie() {
    const title = document.getElementById('up-title').value;
    const cat = document.getElementById('up-category').value;
    const rawUrl = document.getElementById('up-dropbox').value;
    const poster = document.getElementById('up-poster').value;

    if(!title || !rawUrl) return alert("Please fill Title and Dropbox Link.");

    let payload = { 
        title, 
        category: cat, 
        poster_url: poster || 'https://via.placeholder.com/500x750?text=No+Poster',
        dropbox_url: rawUrl.replace('dl=0', 'raw=1')
    };

    const { error } = await _supabase.from('movies').insert([payload]);
    if (error) alert("Error: " + error.message);
    else location.reload();
}

async function deleteMedia(id) {
    if(confirm("Delete forever?")) { 
        await _supabase.from('movies').delete().eq('id', id); 
        location.reload(); 
    }
}

function closePlayer() { 
    document.getElementById('player-overlay').classList.add('hidden'); 
    document.getElementById('player-container').innerHTML = ''; 
}

init();