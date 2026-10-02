import { useEffect, useState } from 'react';
import { api } from './api';

function Auth({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const submit = async () => {
    try {
      const d = await api(`/auth/${mode}`, 'POST', f);
      localStorage.setItem('token', d.token); localStorage.setItem('name', d.user.name); onAuth();
    } catch (e) { setErr(e.message); }
  };
  const set = k => e => setF({ ...f, [k]: e.target.value });
  return (
    <div className="card auth">
      <h1>🌱 PlantNest</h1>
      {mode === 'register' && <input placeholder="Name" onChange={set('name')} />}
      <input placeholder="Email" onChange={set('email')} />
      <input type="password" placeholder="Password" onChange={set('password')} />
      {err && <p className="err">{err}</p>}
      <button onClick={submit}>{mode === 'login' ? 'Login' : 'Create account'}</button>
      <a onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
        {mode === 'login' ? 'New here? Register' : 'Have an account? Login'}
      </a>
    </div>
  );
}

const daysLeft = d => Math.ceil((new Date(d) - Date.now()) / 86400000);

function Dashboard({ onLogout }) {
  const [plants, setPlants] = useState([]);
  const [f, setF] = useState({ name: '', species: '', location: '', wateringEveryDays: 7 });
  const load = () => api('/plants').then(setPlants);
  useEffect(() => { load(); }, []);
  const add = async () => { if (!f.name) return; await api('/plants', 'POST', f); setF({ ...f, name: '', species: '', location: '' }); load(); };
  const water = async id => { await api(`/plants/${id}/water`, 'POST'); load(); };
  const del = async id => { await api(`/plants/${id}`, 'DELETE'); load(); };
  const due = plants.filter(p => daysLeft(p.nextWatering) <= 0);

  return (
    <div className="wrap">
      <header><h1>🌱 Hi {localStorage.getItem('name')}</h1><button onClick={onLogout}>Logout</button></header>
      {due.length > 0 && <div className="banner">💧 Needs water today: {due.map(p => p.name).join(', ')}</div>}
      <div className="card form">
        <input placeholder="Plant name" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
        <input placeholder="Species" value={f.species} onChange={e => setF({ ...f, species: e.target.value })} />
        <input placeholder="Location" value={f.location} onChange={e => setF({ ...f, location: e.target.value })} />
        <input type="number" min="1" title="Water every N days" value={f.wateringEveryDays}
          onChange={e => setF({ ...f, wateringEveryDays: +e.target.value })} />
        <button onClick={add}>Add plant</button>
      </div>
      <div className="grid">
        {plants.map(p => {
          const d = daysLeft(p.nextWatering);
          return (
            <div key={p._id} className={'card plant ' + (d <= 0 ? 'due' : '')}>
              <h3>🪴 {p.name}</h3>
              <small>{p.species} {p.location && '· ' + p.location}</small>
              <p>{d <= 0 ? 'Water now!' : `Water in ${d} day${d > 1 ? 's' : ''}`}</p>
              <small>Every {p.wateringEveryDays} days</small>
              <div className="row"><button onClick={() => water(p._id)}>💧 Watered</button><button className="ghost" onClick={() => del(p._id)}>Delete</button></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(!!localStorage.getItem('token'));
  return authed ? <Dashboard onLogout={() => { localStorage.clear(); setAuthed(false); }} /> : <Auth onAuth={() => setAuthed(true)} />;
}
