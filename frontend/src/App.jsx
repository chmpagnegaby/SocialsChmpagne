import React from "react";

/**
 * App.jsx — Instagram‑style UI for CRUD posts (minimal external deps)
 * Fix: Add `import React from 'react'` to satisfy JSX transform in environments that
 *      require React in scope (resolves "React is not defined").
 * Keeps: Robust API base resolution, no bundler-specific imports, fetch-based HTTP,
 *        inline SVG icons, and self-tests (now with an extra 404 test).
 */

// ===================== CONFIG (robust env resolution) =====================
function resolveApiBase() {
  // Priority 1: window globals (can be set in index.html)
  if (typeof window !== "undefined") {
    const g = window;
    if (g.VITE_API_BASE) return g.VITE_API_BASE;
    if (g.__API_BASE__) return g.__API_BASE__;
    if (g.__VITE_API_BASE__) return g.__VITE_API_BASE__;
  }
  // Priority 2: <meta name="api-base" content="...">
  if (typeof document !== "undefined") {
    const m = document.querySelector('meta[name="api-base"]');
    if (m?.content) return m.content;
  }
  // Priority 3: fallback to localhost
  return "http://localhost:3000";
}

export const API_BASE = resolveApiBase();
export const POSTS_URL = `${API_BASE}/posts`;
console.info("[ENV] Resolved API_BASE:", API_BASE);

// ===================== LIGHTWEIGHT ICONS (inline SVG) =====================
function Icon({ path, className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {path}
    </svg>
  );
}
const PlusIcon = (p) => <Icon {...p} path={<path d="M12 5v14M5 12h14" />} />;
const PencilIcon = (p) => <Icon {...p} path={<path d="M12 20h9" />} />; // minimal line (we style with label)
const TrashIcon = (p) => <Icon {...p} path={<path d="M3 6h18M8 6v14m8-14v14M5 6l1-3h12l1 3" />} />;
const RefreshIcon = (p) => <Icon {...p} path={<><path d="M20 11a8 8 0 10-1.78 5" /><polyline points="20 7 20 11 16 11" /></>} />;
const ShieldCheckIcon = (p) => <Icon {...p} path={<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /><path d="M9 12l2 2 4-4" /></>} />;
const ShieldAlertIcon = (p) => <Icon {...p} path={<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /><path d="M12 8v4" /><circle cx="12" cy="16" r="1" /></>} />;
const LoaderIcon = (p) => (
  <svg viewBox="0 0 24 24" className={`h-5 w-5 animate-spin ${p?.className||''}`}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
    <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="4" fill="none" />
  </svg>
);

// ===================== UI HELPERS =====================
const btn =
  "inline-flex items-center gap-2 rounded-2xl px-4 py-2 font-semibold transition-all active:scale-[.98] disabled:opacity-50 disabled:pointer-events-none";

const card =
  "rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900/70 to-zinc-900/30 backdrop-blur-md shadow-xl";

const inputBase =
  "w-full rounded-2xl bg-zinc-900/60 border border-white/10 px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/50";

function formatDate(iso) {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch { return ""; }
}

// ===================== HTTP (fetch wrappers) =====================
async function http(url, { method = "GET", body, headers } = {}) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", ...(headers || {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    throw Object.assign(new Error(`HTTP ${res.status}: ${res.statusText}`), { status: res.status, data });
  }
  return data;
}

// ===================== NAVBAR =====================
function Navbar({ onRefresh, healthy }) {
  return (
    <div className="sticky top-0 z-40 w-full border-b border-white/10 bg-zinc-950/70 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/40">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-400 to-fuchsia-500" />
          <span className="bg-gradient-to-r from-indigo-400 to-fuchsia-400 bg-clip-text text-xl font-extrabold text-transparent">MiniBlog</span>
          <span className="ml-3 rounded-full border border-white/10 px-2.5 py-1 text-xs text-zinc-300/80">API: {API_BASE}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${healthy ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"}`} title={healthy ? "API saludable" : "API caída o sin conexión"}>
            {healthy ? <ShieldCheckIcon className="h-3.5 w-3.5" /> : <ShieldAlertIcon className="h-3.5 w-3.5" />} {healthy ? "Online" : "Offline"}
          </span>
          <button onClick={onRefresh} className={`${btn} bg-zinc-800 hover:bg-zinc-700 text-zinc-100`}>
            <RefreshIcon className="h-4 w-4" /> Refrescar
          </button>
        </div>
      </div>
    </div>
  );
}

// ===================== POST CARD =====================
function PostCard({ post, onEdit, onDelete }) {
  const initials = post?.usuario_id ? `U${post.usuario_id}` : "U";
  return (
    <article className={`${card} overflow-hidden transition duration-300 ease-out hover:shadow-2xl hover:shadow-black/20`}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-zinc-800 text-sm font-bold text-zinc-200">{initials}</div>
        <div className="flex flex-col">
          <h3 className="text-base font-semibold text-zinc-100">{post.titulo}</h3>
          <span className="text-xs text-zinc-400">{formatDate(post.created_at)}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => onEdit(post)} className={`${btn} bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-100 px-3 py-1.5`}>
            <PencilIcon className="h-4 w-4" />
          </button>
          <button onClick={() => onDelete(post.id)} className={`${btn} bg-red-600/80 hover:bg-red-600 text-white px-3 py-1.5`}>
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
      {/* Media placeholder like IG */}
      <div className="aspect-[4/3] w-full bg-gradient-to-br from-zinc-800 to-zinc-900" />
      {/* Content */}
      <div className="p-4 pt-3">
        <p className="leading-relaxed text-zinc-300">{post.contenido}</p>
      </div>
    </article>
  );
}

// ===================== MODAL =====================
function Modal({ open, onClose, children, title }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-modal="true" className={`${card} relative z-10 w-full max-w-lg p-5 transition duration-200 ease-out`}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-zinc-100">{title}</h3>
          <button onClick={onClose} className={`${btn} bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-3 py-1.5`}>Cerrar</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ===================== SELF TESTS =====================
function SelfTests({ onRun, results, running }) {
  return (
    <div className={`${card} p-4`}>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-200">Self‑tests</h3>
        <button onClick={onRun} disabled={running} className={`${btn} bg-zinc-800 hover:bg-zinc-700 text-zinc-100`}>
          {running ? <LoaderIcon /> : <RefreshIcon className="h-4 w-4" />} Ejecutar
        </button>
      </div>
      <ul className="space-y-2 text-sm">
        <li>
          <span className="text-zinc-400">API_BASE resuelto:</span>
          <span className="ml-2 text-zinc-100">{API_BASE}</span>
        </li>
        {results.map((r, i) => (
          <li key={i} className={`flex items-center gap-2 ${r.pass ? "text-emerald-300" : "text-red-300"}`}>
            {r.pass ? <ShieldCheckIcon className="h-4 w-4" /> : <ShieldAlertIcon className="h-4 w-4" />} {r.name}: {r.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ===================== MAIN APP =====================
export default function App() {
  const [posts, setPosts] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [healthy, setHealthy] = React.useState(false);

  const [editing, setEditing] = React.useState(null); // post object or null
  const [openModal, setOpenModal] = React.useState(false);
  const [form, setForm] = React.useState({ titulo: "", contenido: "", usuario_id: 1 });

  const [tests, setTests] = React.useState([]);
  const [runningTests, setRunningTests] = React.useState(false);

  async function fetchPosts() {
    setLoading(true); setError("");
    try {
      const data = await http(POSTS_URL);
      setPosts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setError("No se pudieron cargar los posts");
    } finally { setLoading(false); }
  }

  async function checkHealth() {
    try {
      const res = await http(`${API_BASE}/health`);
      setHealthy(!!res?.ok);
    } catch { setHealthy(false); }
  }

  React.useEffect(() => { fetchPosts(); checkHealth(); }, []);

  const openCreate = () => { setEditing(null); setForm({ titulo: "", contenido: "", usuario_id: 1 }); setOpenModal(true); };
  const openEdit = (post) => { setEditing(post); setForm({ titulo: post.titulo, contenido: post.contenido, usuario_id: post.usuario_id }); setOpenModal(true); };

  async function handleSubmit(e) {
    e?.preventDefault?.(); setLoading(true); setError("");
    try {
      if (editing) await http(`${POSTS_URL}/${editing.id}`, { method: "PUT", body: form });
      else await http(POSTS_URL, { method: "POST", body: form });
      setOpenModal(false); await fetchPosts();
    } catch (e) { console.error(e); setError("No se pudo guardar el post"); }
    finally { setLoading(false); }
  }

  async function handleDelete(id) {
    setLoading(true); setError("");
    try { await http(`${POSTS_URL}/${id}`, { method: "DELETE" }); setPosts((prev) => prev.filter((p) => p.id !== id)); }
    catch (e) { console.error(e); setError("No se pudo eliminar el post"); }
    finally { setLoading(false); }
  }

  async function runSelfTests() {
    setRunningTests(true);
    const results = [];
    try {
      // Test 1: API_BASE defined and is URL
      const looksUrl = /^https?:\/\//.test(API_BASE);
      results.push({ name: "API_BASE", pass: !!API_BASE && looksUrl, message: looksUrl ? API_BASE : "No parece una URL válida" });

      // Test 2: /health reachable
      try { const r = await http(`${API_BASE}/health`); const ok = !!r?.ok; results.push({ name: "GET /health", pass: ok, message: ok ? "ok" : "respuesta inesperada" }); }
      catch (e) { results.push({ name: "GET /health", pass: false, message: e?.message || "falló la petición" }); }

      // Test 3: /posts list
      try { const r2 = await http(POSTS_URL); const arr = Array.isArray(r2); results.push({ name: "GET /posts", pass: arr, message: arr ? `${r2.length} items` : "respuesta no es array" }); }
      catch (e) { results.push({ name: "GET /posts", pass: false, message: e?.message || "falló la petición" }); }

      // Test 4: /posts schema (non‑mutating)
      try {
        const r3 = await http(POSTS_URL);
        const okShape = !r3.length || (r3[0] && "id" in r3[0] && "titulo" in r3[0] && "contenido" in r3[0] && "usuario_id" in r3[0]);
        results.push({ name: "Schema /posts[0]", pass: okShape, message: okShape ? "shape ok" : "faltan campos obligatorios" });
      } catch (e) {
        results.push({ name: "Schema /posts[0]", pass: false, message: e?.message || "falló la petición" });
      }

      // Test 5: 404 handling on unknown route (non‑mutating)
      try {
        const resp = await fetch(`${API_BASE}/__nonexistent__`, { method: "GET" });
        const ok404 = resp.status === 404 || (resp.status >= 400 && resp.status < 500);
        results.push({ name: "GET /__nonexistent__", pass: ok404, message: `status ${resp.status}` });
      } catch (e) {
        results.push({ name: "GET /__nonexistent__", pass: false, message: e?.message || "falló la petición" });
      }

      setTests(results);
    } finally { setRunningTests(false); }
  }

  return (
    <div className="min-h-dvh bg-[radial-gradient(40%_40%_at_20%_0%,rgba(99,102,241,.25),transparent),radial-gradient(40%_40%_at_80%_0%,rgba(236,72,153,.18),transparent)] text-zinc-100">
      <Navbar onRefresh={() => { fetchPosts(); checkHealth(); }} healthy={healthy} />

      <main className="mx-auto grid max-w-5xl gap-6 p-4 sm:p-6">
        {/* Composer */}
        <section className={`${card} p-5`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Crear algo nuevo</h2>
            <button onClick={openCreate} className={`${btn} bg-indigo-500/90 hover:bg-indigo-500 text-white`}>
              <PlusIcon className="h-4 w-4" /> Nuevo post
            </button>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>
        )}

        {/* Posts grid */}
        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onEdit={openEdit} onDelete={handleDelete} />
          ))}
        </section>

        {loading && (
          <div className="flex items-center justify-center py-8 text-zinc-400"><LoaderIcon className="mr-2" /> Cargando...</div>
        )}

        {/* Self-tests block */}
        <SelfTests onRun={runSelfTests} results={tests} running={runningTests} />
      </main>

      {/* Modal create/edit */}
      <Modal open={openModal} onClose={() => setOpenModal(false)} title={editing ? "Editar post" : "Nuevo post"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input className={inputBase} placeholder="Título" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
          <textarea className={`${inputBase} min-h-[120px]`} placeholder="Contenido" value={form.contenido} onChange={(e) => setForm({ ...form, contenido: e.target.value })} />
          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={() => setOpenModal(false)} className={`${btn} bg-zinc-800 hover:bg-zinc-700 text-zinc-100`}>Cancelar</button>
            <button type="submit" className={`${btn} bg-indigo-500 hover:bg-indigo-600 text-white`}>{editing ? "Guardar" : "Publicar"}</button>
          </div>
        </form>
      </Modal>

      {/* Floating New */}
      <button onClick={openCreate} className="fixed bottom-6 right-6 z-40 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-2xl shadow-indigo-900/40 transition active:scale-95">
        <PlusIcon />
      </button>
    </div>
  );
}
