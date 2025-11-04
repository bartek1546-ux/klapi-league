// App.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, Legend, ReferenceLine, Cell
} from "recharts";

/* ============================== */
/*      ERROR BOUNDARY            */
/* ============================== */
class ErrorBoundary extends React.Component {
  constructor(p){ super(p); this.state={hasError:false,error:null};}
  static getDerivedStateFromError(error){ return {hasError:true,error}; }
  componentDidCatch(e,i){ console.error("ErrorBoundary:",e,i); }
  render(){
    if(this.state.hasError){
      return (
        <div style={{padding:24,maxWidth:900,margin:"40px auto",background:"#1f1531",color:"#fff",border:"1px solid #5533aa",borderRadius:16}}>
          <h2>Ups… coś poszło nie tak</h2>
          <p>Odśwież stronę albo wróć na główną. Szczegóły w konsoli.</p>
          <code style={{display:"block",whiteSpace:"pre-wrap",background:"#140c25",padding:12,borderRadius:12}}>{String(this.state.error)}</code>
          <div style={{marginTop:12,display:"flex",gap:8}}>
            <a className="btn" href="#/">Strona główna</a>
            <button className="btn" onClick={()=>location.reload()}>Odśwież</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ============================== */
/*        DANE + STORAGE          */
/* ============================== */
const LS_KEY = "klapi-league-state-v5";
const ADMINS = { "Bartek": "1998", "Oliwia": "2003" };

/* >>> HELPER: lokalny YYYY-MM-DD (bez UTC) <<< */
const toLocalDateStr = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const defaultPlayers = [
  { id:"julia",   name:"Julia",   avatar:"", bio:"" },
  { id:"oliwia",  name:"Oliwia",  avatar:"", bio:"" },
  { id:"daniel",  name:"Daniel",  avatar:"", bio:"" },
  { id:"celina",  name:"Celina",  avatar:"", bio:"" },
  { id:"bartosz", name:"Bartosz", avatar:"", bio:"" },
];

const seedState = {
  players: defaultPlayers,
  gps: [{
    id:"gp1",
    /* FIX: lokalna data, nie toISOString() */
    date: toLocalDateStr(new Date()),
    planned:false,
    results:{
      julia:[1,2,1,2,2],
      oliwia:[2,1,2,2,3],
      daniel:[3,3,4,1,2],
      celina:[2,2,3,3,1],
      bartosz:[3,3,2,2,2]
    }
  }],
  posts: [
    { id:"p1", title:"Start sezonu!", body:"Kłapi League wystartowała. Pierwsze GP już za nami.", author:"Bartek", date:Date.now()-86400000, comments:[] },
    { id:"p2", title:"Regulamin", body:"5 rund, najniższa suma wygrywa. Gramy co tydzień.", author:"Oliwia", date:Date.now()-172800000, comments:[] },
    { id:"p3", title:"Zapowiedź następnego GP", body:"Wpadnijcie w sobotę! Gramy od 19:00. Miejsce tradycyjne.", author:"Bartek", date:Date.now()-3600_000, comments:[] },
  ],
  logs: [{ ts:Date.now(), type:"INIT", msg:"Zainicjalizowano stan ligi." }]
};

const useStore = () => {
  const [state,setState] = useState(()=> {
    try{ const raw=localStorage.getItem(LS_KEY); return raw?JSON.parse(raw):seedState;}
    catch{ return seedState; }
  });
  useEffect(()=>{ localStorage.setItem(LS_KEY, JSON.stringify(state)); },[state]);
  return [state,setState];
};

const sum = a => (a||[]).reduce((x,y)=>x+y,0);
const fmt = iso => new Date(iso).toLocaleDateString();

/* ============================== */
/*           ROUTER               */
/* ============================== */
const route = () => {
  const h = window.location.hash || "#/";
  const parts = h.replace(/^#\//,'').split("/").filter(Boolean);
  if(parts.length===0) return {view:"home"};
  if(parts[0]==="players") return {view:"players"};
  if(parts[0]==="player" && parts[1]) return {view:"player", id:parts[1]};
  if(parts[0]==="calendar") return {view:"calendar"};
  if(parts[0]==="tabela") return {view:"tabela"};
  if(parts[0]==="gp" && parts[1]) return {view:"gp", id:parts[1]};
  if(parts[0]==="news") return {view:"news"};
  if(parts[0]==="post" && parts[1]) return {view:"post", id:parts[1]};
  if(parts[0]==="admin") return {view:"admin"};
  if(parts[0]==="admin-players") return {view:"adminPlayers"};
  return {view:"home"};
};

/* ============================== */
/*            SHELL               */
/* ============================== */
const Shell = ({ adminName, onShowLogin, onLogout, children }) => {
  return (
    <div className="app" style={{minHeight:"100vh",background:"url('/background.png') center/cover fixed, #201541"}}>
      <header className="nav">
        {/* PRZEWIJANY pasek (wraz z przyciskami admina) */}
        <div className="nav__scroll">
          <div className="nav__inner">
            <div className="nav__left">
              <img src="/logo-klapi.png" alt="Kłapi League" className="nav__logo" />
              <a className="tab" href="#/">Strona główna</a>
              <a className="tab" href="#/tabela">Tabela</a>
              <a className="tab" href="#/players">Gracze</a>
              <a className="tab" href="#/calendar">Kalendarz</a>
              <a className="tab" href="#/news">Gazetka</a>
              {adminName ? (
                <>
                  <a className="tab" href="#/admin">Panel admina</a>
                  <a className="tab" href="#/admin-players">Gracze (admin)</a>
                  <button className="tab btn--ghost" onClick={onLogout}>Wyloguj</button>
                </>
              ) : (
                <button className="tab btn--ghost" onClick={onShowLogin}>Admin (logowanie)</button>
              )}
            </div>
          </div>
        </div>
      </header>
      <div style={{height:64}} />
      <main className="container">{children}</main>
      <footer className="footer">
        <img src="/logo2.png" alt="" height="18" style={{opacity:.85,verticalAlign:"middle"}} />{" "}
        <span style={{color:"#d8c8ff"}}>Kłapi League</span> • made with ❤️
      </footer>
    </div>
  );
};

/* ============================== */
/*        KOMPONENTY UI           */
/* ============================== */
const Top3Row = ({ idx, children }) => {
  let bg = "transparent";
  if(idx===0) bg = "rgba(255,209,102,.10)";
  if(idx===1) bg = "rgba(200,200,200,.10)";
  if(idx===2) bg = "rgba(205,133,63,.10)";
  return <tr style={{background:bg}}>{children}</tr>;
};

const FormSquares = ({ form, gpIds }) => {
  // pokaż ostatnie 3 i pozwól kliknąć do odpow. GP
  const last3 = [...form].slice(-3);
  const last3Gp = gpIds ? gpIds.slice(-3) : [];
  return (
    <div style={{display:"flex",gap:6}}>
      {last3.map((pos,i)=>{
        const bg = pos===1 ? "#06d6a0" : pos===5 ? "#ef476f" : "#3f2b86";
        const color = pos===1 ? "#0b1f17" : "#cdbfff";
        const gpHref = last3Gp[i] ? `#/gp/${last3Gp[i]}` : null;
        const box = (
          <div key={i} style={{
            width:22,height:22,borderRadius:4,display:"grid",placeItems:"center",
            background:bg,color, fontWeight:700, fontSize:12, cursor: gpHref?"pointer":"default"
          }}>{pos}</div>
        );
        return gpHref ? <a key={i} href={gpHref} title="Przejdź do GP">{box}</a> : box;
      })}
    </div>
  );
};

/** News Spotlight + Ticker (auto-rotacja pozostałych dwóch) */
const NewsSpotlight = ({ posts }) => {
  const list = [...posts].sort((a,b)=>b.date-a.date);
  if(list.length===0) return <p className="muted">Brak aktualności.</p>;
  const [idx,setIdx] = useState(1); // start od drugiego (ticker)
  const tail = list.slice(1,3);     // maks 2 w tickerze

  useEffect(()=>{
    if(tail.length===0) return;
    const t = setInterval(()=>setIdx(i=>(i%tail.length)+1), 5000); // co 5 s
    return ()=>clearInterval(t);
  },[tail.length]);

  const latest = list[0];
  const activeTicker = tail.length ? list[idx] : null;

  return (
    <div className="newsWrap">
      <a className="newsSpot" href={`#/post/${latest.id}`}>
        <div className="newsTitle">{latest.title}</div>
        <div className="newsMeta">{new Date(latest.date).toLocaleString()} • {latest.author}</div>
        <div className="newsBody">{latest.body}</div>
      </a>

      {activeTicker && (
        <a className="newsTicker" href={`#/post/${activeTicker.id}`}>
          <span className="dot" /> {activeTicker.title}
          <span className="tickerMeta"> • {new Date(activeTicker.date).toLocaleDateString()}</span>
        </a>
      )}
    </div>
  );
};

/* ============================== */
/*          HOME (DASH)           */
/* ============================== */
const Home = ({ state }) => {
  const players = state.players;
  const played = state.gps.filter(g=>!g.planned).sort((a,b)=>a.date.localeCompare(b.date));
  const last = played[played.length-1];
  const nextPlanned = state.gps.filter(g=>g.planned).sort((a,b)=>a.date.localeCompare(b.date))[0];

  // klasyfikacja
  const standings = useMemo(()=>{
    const totals = players.map(p=>{
      const pts = played.reduce((acc,g)=> acc + sum(g.results?.[p.id]), 0);
      const wins = played.reduce((acc,g)=>{
        if(!g.results) return acc;
        const totals = Object.entries(g.results).map(([pid,a])=>({pid,s:sum(a)}));
        const min = Math.min(...totals.map(t=>t.s));
        return acc + (totals.filter(t=>t.s===min).some(t=>t.pid===p.id)?1:0);
      },0);
      return {...p,total:pts,wins};
    });
    return totals.sort((a,b)=>a.total-b.total);
  },[players,played]);

  // wykresy
  const COLORS = ["#ffd166","#06d6a0","#1b9aaa","#ef476f","#8338ec"];

  const lineData = played.map(g=>{
    const row = {date:g.date};
    players.forEach(p=>{ row[p.name]=sum(g.results?.[p.id])||0; });
    return row;
  });

  const barData = useMemo(()=>{
    if(!last?.results) return [];
    const arr = Object.entries(last.results).map(([pid,scores])=>{
      const pl = players.find(x=>x.id===pid);
      return { name: pl?.name||pid, value: sum(scores) };
    });
    const vals = arr.map(a=>a.value);
    const min = Math.min(...vals), max = Math.max(...vals);
    const color = (v)=> max===min ? "#7c3aed" : `rgb(${Math.round(255*(v-min)/(max-min))},${Math.round(200*(1-(v-min)/(max-min)))},120)`;
    return arr.map(a=>({...a,fill:color(a.value)}));
  },[last,players]);

  const rankData = played.map(g=>{
    const row = {date:g.date};
    if(g.results){
      const totals = Object.entries(g.results).map(([pid,a])=>({pid,s:sum(a)})).sort((a,b)=>a.s-b.s);
      players.forEach(p=>{
        row[p.name] = totals.findIndex(t=>t.pid===p.id)+1;
      });
    }
    return row;
  });

  const daysTo = (iso) => {
    if(!iso) return null;
    const d = Math.ceil( (new Date(iso).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86400000 );
    return d;
  };

  return (
    <>
      {/* Pasek o następnym GP – z obrazkiem */}
      <div className="nextgp">
        <img src="/nastepnegp.png" alt="Następne GP" className="nextgp__img" />
        <div className="nextgp__text">
          <strong>
            {nextPlanned
              ? <>Następne Grand Prix: <u>{fmt(nextPlanned.date)}</u> ({daysTo(nextPlanned.date)} dni)</>
              : <>Brak zaplanowanego GP — dodaj w panelu admina</>}
          </strong>
        </div>
      </div>

      {/* Rząd 1: Aktualności + Klasyfikacja (skrót) */}
      <div className="grid2">
        <div className="card">
          <h2>Aktualności</h2>
          <NewsSpotlight posts={state.posts}/>
          <div style={{textAlign:"right",marginTop:8}}>
            <a className="btn small" href="#/news">Gazetka →</a>
          </div>
        </div>

        <div className="card">
          <h2>Klasyfikacja generalna (skrót)</h2>
          <div className="tableWrap">
            <table className="table">
              <thead><tr><th>#</th><th>Gracz</th><th>Suma pkt</th><th>Wygrane GP</th></tr></thead>
              <tbody>
                {standings.map((p,i)=>(
                  <Top3Row key={p.id} idx={i}>
                    <td>{i+1}</td>
                    <td><a href={`#/player/${p.id}`}>{p.name}</a></td>
                    <td>{p.total}</td>
                    <td>{p.wins}</td>
                  </Top3Row>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Rząd 2: 2 wykresy obok siebie */}
      <div className="grid2">
        <div className="card">
          <h2>Ostatnie Grand Prix — suma punktów</h2>
          {barData.length===0 ? <p>Brak danych.</p> :
            <div className="chartH">
              <ResponsiveContainer>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3f2b86"/>
                  <XAxis dataKey="name" stroke="#cdbfff"/>
                  <YAxis stroke="#cdbfff"/>
                  <Tooltip />
                  <Bar dataKey="value">
                    {barData.map((e,i)=><Cell key={i} fill={e.fill}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          }
        </div>

        <div className="card">
          <h2>Wynik w czasie</h2>
          <div className="chartH">
            <ResponsiveContainer>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f2b86"/>
                <XAxis dataKey="date" stroke="#cdbfff" />
                <YAxis stroke="#cdbfff" />
                <Tooltip />
                <Legend />
                {players.map((p,idx)=>(
                  <Line key={p.id} type="monotone" dataKey={p.name} stroke={["#ffd166","#06d6a0","#1b9aaa","#ef476f","#8338ec"][idx%5]} strokeWidth={2} dot={false}/>
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card" style={{marginTop:16}}>
        <h2>Pozycja w czasie (1 = lider)</h2>
        <div className="chartH">
          <ResponsiveContainer>
            <LineChart data={rankData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f2b86"/>
              <XAxis dataKey="date" stroke="#cdbfff"/>
              <YAxis reversed domain={[1, players.length]} allowDecimals={false} stroke="#cdbfff"/>
              <Tooltip />
              <Legend />
              <ReferenceLine y={1} stroke="#ffd166"/>
              {players.map((p,idx)=>(
                <Line key={p.id} type="monotone" dataKey={p.name} stroke={["#ffd166","#06d6a0","#1b9aaa","#ef476f","#8338ec"][idx%5]} strokeWidth={2} dot={false}/>
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{marginTop:12, textAlign:"right"}}>
        <a className="btn small" href="#/">← Strona główna</a>
      </div>
    </>
  );
};

/* ============================== */
/*      TABELA (szczegóły)        */
/* ============================== */
const Tabela = ({ state }) => {
  const players = state.players;
  const played = state.gps.filter(g=>!g.planned).sort((a,b)=>a.date.localeCompare(b.date));
  const playedIds = played.map(g=>g.id);

  const rows = useMemo(()=>{
    const totals = players.map(p=>{
      const total = played.reduce((acc,g)=>acc+sum(g.results?.[p.id]),0);
      const form = played.map(g=>{
        if(!g.results) return null;
        const list = Object.entries(g.results).map(([pid,a])=>({pid,s:sum(a)})).sort((a,b)=>a.s-b.s);
        return list.findIndex(t=>t.pid===p.id)+1;
      }).filter(x=>x!=null);
      const wins = form.filter(x=>x===1).length;
      return {...p,total,form,wins};
    }).sort((a,b)=>a.total-b.total);
    const leader = totals[0]?.total ?? 0;
    return totals.map(r => ({...r, gap: r.total - leader}));
  },[players,played]);

  return (
    <div className="card">
      <h2>Tabela</h2>
      <div className="tableWrap">
        <table className="table">
          <thead>
            <tr>
              <th>#</th><th>Gracz</th><th>Suma pkt</th><th>Strata do lidera</th><th>Wygrane GP</th><th>Forma (3)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r,i)=>{
              const gpIdsForForm = playedIds; // 1:1 z form (chronologicznie)
              return (
                <Top3Row key={r.id} idx={i}>
                  <td>{i+1}</td>
                  <td><a href={`#/player/${r.id}`}>{r.name}</a></td>
                  <td>{r.total}</td>
                  <td>{r.gap}</td>
                  <td>{r.wins}</td>
                  <td><FormSquares form={r.form} gpIds={gpIdsForForm} /></td>
                </Top3Row>
            )})}
          </tbody>
        </table>
      </div>

      <div style={{marginTop:12, textAlign:"right"}}>
        <a className="btn small" href="#/">← Strona główna</a>
      </div>
    </div>
  );
};

/* ============================== */
/*       GRACZE + PROFIL          */
/* ============================== */
const Players = ({ state }) => (
  <div className="card">
    <h2>Gracze</h2>
    <div className="players">
      {state.players.map(p=>(
        <a key={p.id} href={`#/player/${p.id}`} className="playerCard">
          <img src={p.avatar||"/logo2.png"} alt=""/>
          <div>
            <strong>{p.name}</strong>
            <div className="sub">{p.bio?.slice(0,80)||"Profil gracza"}</div>
          </div>
        </a>
      ))}
    </div>
    <div style={{marginTop:12, textAlign:"right"}}>
      <a className="btn small" href="#/">← Strona główna</a>
    </div>
  </div>
);

function calcPlayerStats(state, pid){
  const gps = state.gps.filter(g=>!g.planned && g.results && g.results[pid]).sort((a,b)=>a.date.localeCompare(b.date));
  const rounds = gps.flatMap(g => g.results[pid]);
  const perGpSums = gps.map(g => sum(g.results[pid]));
  const avgPerRound = rounds.length ? (sum(rounds)/rounds.length) : 0;
  const avgPerGp = perGpSums.length ? (sum(perGpSums)/perGpSums.length) : 0;
  const bestGp = perGpSums.length ? Math.min(...perGpSums) : null;
  const worstGp = perGpSums.length ? Math.max(...perGpSums) : null;
  const spreadPerGp = gps.map(g => {
    const arr = g.results[pid];
    return Math.max(...arr) - Math.min(...arr);
  });
  const maxSpread = spreadPerGp.length ? Math.max(...spreadPerGp) : 0;

  const positions = gps.map(g=>{
    const list = Object.entries(g.results).map(([pp,a])=>({pp,s:sum(a)})).sort((a,b)=>a.s-b.s);
    return list.findIndex(t=>t.pp===pid)+1;
  });
  const wins = positions.filter(p=>p===1).length;
  const avgPos = positions.length ? (positions.reduce((a,b)=>a+b,0)/positions.length) : null;

  const byRound = [0,1,2,3,4].map(i=>{
    const vals = gps.map(g=>g.results[pid][i]).filter(x=>x!=null);
    return vals.length? (sum(vals)/vals.length) : Infinity;
  });
  const bestRoundIndex = byRound.indexOf(Math.min(...byRound)); // 0..4

  return { avgPerRound, avgPerGp, bestGp, worstGp, maxSpread, wins, avgPos, form: positions, bestRoundIndex, gpIds: gps.map(g=>g.id) };
}

const PlayerPage = ({ state, id }) => {
  const p = state.players.find(x=>x.id===id);
  if(!p) return <div className="card"><h2>Nie znaleziono gracza</h2></div>;
  const stats = calcPlayerStats(state, p.id);

  const played = state.gps.filter(g=>!g.planned && g.results).sort((a,b)=>a.date.localeCompare(b.date));
  const rankData = played.map(g=>{
    const list = Object.entries(g.results).map(([pid,a])=>({pid,s:sum(a)})).sort((a,b)=>a.s-b.s);
    return {date:g.date, Pos:list.findIndex(t=>t.pid===p.id)+1};
  });

  return (
    <div className="card">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <a className="btn" href="#/players">← Wróć</a>
        <a className="btn" href="#/">← Strona główna</a>
      </div>

      <div className="profile">
        <img src={p.avatar||"/logo2.png"} alt=""/>
        <div>
          <h2 style={{margin:"0 0 6px"}}>{p.name}</h2>
          <p className="muted">{p.bio||"Brak opisu."}</p>
        </div>
      </div>

      <div className="grid2">
        <div>
          <h3>Statystyki</h3>
          <ul className="list" style={{gap:6}}>
            <li><b>Śr. pkt / runda:</b> {stats.avgPerRound.toFixed(2)}</li>
            <li><b>Śr. pkt / GP:</b> {stats.avgPerGp.toFixed(2)}</li>
            <li><b>Najlepsze GP (suma):</b> {stats.bestGp ?? "—"}</li>
            <li><b>Najgorsze GP (suma):</b> {stats.worstGp ?? "—"}</li>
            <li><b>Największy rozstrzał w GP (max-min rund):</b> {stats.maxSpread}</li>
            <li><b>Wygrane GP:</b> {stats.wins}</li>
            {stats.avgPos!=null && <li><b>Śr. pozycja w GP:</b> {stats.avgPos.toFixed(2)}</li>}
            <li><b>Forma (3):</b> <FormSquares form={stats.form} gpIds={stats.gpIds}/></li>
            <li><b>Najlepsza runda:</b> {stats.bestRoundIndex>=0 ? `R${stats.bestRoundIndex+1}` : "—"}</li>
          </ul>
        </div>

        <div>
          <h3>Pozycja w czasie (1 = lider)</h3>
          <div className="chartH">
            <ResponsiveContainer>
              <LineChart data={rankData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f2b86"/>
                <XAxis dataKey="date" stroke="#cdbfff"/>
                <YAxis reversed allowDecimals={false} stroke="#cdbfff"/>
                <Tooltip />
                <Line type="monotone" dataKey="Pos" stroke="#ffd166" strokeWidth={2} dot={false}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================== */
/*           KALENDARZ            */
/* ============================== */
const CalendarPage = ({ state }) => {
  const [view,setView]=useState(()=>{ const n=new Date(); return {y:n.getFullYear(), m:n.getMonth()}; });
  const list = [...state.gps].sort((a,b)=>a.date.localeCompare(b.date));

  const first = new Date(view.y, view.m, 1);
  const start = (first.getDay()+6)%7; // pon=0
  const days = new Date(view.y, view.m+1, 0).getDate();
  const cells = Array.from({length:start}).map(()=>null).concat(
    Array.from({length:days}).map((_,i)=>new Date(view.y,view.m,i+1))
  );

  const findGpOn = (d) => state.gps.find(g=>g.date===toLocalDateStr(d));

  return (
    <div className="card">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <h2 style={{display:"flex",alignItems:"center",gap:8,margin:0}}>
          <button className="btn small" onClick={()=>setView(v=>({y: v.m===0?v.y-1:v.y, m:(v.m+11)%12}))}>←</button>
          {new Date(view.y,view.m,1).toLocaleString(undefined,{month:"long",year:"numeric"})}
          <button className="btn small" onClick={()=>setView(v=>({y: v.m===11?v.y+1:v.y, m:(v.m+1)%12}))}>→</button>
        </h2>
        <a className="btn small" href="#/">← Strona główna</a>
      </div>

      <div className="month">
        {cells.map((d,i)=>(
          <div key={i}
               className="day"
               onClick={()=>d && findGpOn(d) && (location.hash=`#/gp/${findGpOn(d).id}`)}
               style={d?{
                 cursor: findGpOn(d) ? "pointer" : "default",
                 background: findGpOn(d) ? (findGpOn(d).planned?"rgba(255,180,0,.12)":"rgba(0,180,120,.15)") : "transparent",
                 borderColor: findGpOn(d) ? (findGpOn(d).planned?"#ffd166":"#07c18a") : "#3f2b86"
               }:{opacity:.35}}>
            {d?d.getDate():""}
          </div>
        ))}
      </div>

      <h3>Lista GP</h3>
      <ul className="list">
        {list.map(g=>(
          <li key={g.id}>
            <span><b>{fmt(g.date)}</b> {g.planned && <em style={{color:"#ffb703"}}>(planowane)</em>}</span>
            {!g.planned && <span className="muted"> • rozegrane</span>}
            <a className="btn small" href={`#/gp/${g.id}`} style={{marginLeft:"auto"}}>Szczegóły</a>
          </li>
        ))}
      </ul>
    </div>
  );
};

/* ============================== */
/*             GP DETAIL          */
/* ============================== */
const GPPage = ({ state, id }) => {
  const gp = state.gps.find(x=>x.id===id);
  if(!gp) return <div className="card"><h2>Nie znaleziono GP</h2></div>;
  const players = state.players;

  const rankOrder = [...players].sort((a,b)=>{
    const sa = sum(gp.results?.[a.id]||[0,0,0,0,0]);
    const sb = sum(gp.results?.[b.id]||[0,0,0,0,0]);
    return sa - sb;
  });

  return (
    <div className="card">
      <div style={{display:"flex",gap:8,alignItems:"center",justifyContent:"space-between"}}>
        <a className="btn" href="#/calendar">← Wróć</a>
        <a className="btn" href="#/">← Strona główna</a>
      </div>

      <h2 style={{margin:"12px 0 6px"}}>Grand Prix — {fmt(gp.date)}</h2>

      <div className="tableWrap">
        <table className="table">
          <thead><tr><th>#</th><th>Gracz</th><th>R1</th><th>R2</th><th>R3</th><th>R4</th><th>R5</th><th>Suma</th></tr></thead>
          <tbody>
            {rankOrder.map((p,idx)=>{
              const arr = gp.results?.[p.id] || [0,0,0,0,0];
              return (
                <Top3Row key={p.id} idx={idx}>
                  <td>{idx+1}</td>
                  <td><a href={`#/player/${p.id}`}>{p.name}</a></td>
                  {arr.map((v,i)=><td key={i}>{v}</td>)}
                  <td><b>{sum(arr)}</b></td>
                </Top3Row>
              );
            })}
          </tbody>
        </table>
      </div>
      {gp.planned && <p className="muted" style={{marginTop:8}}>(To GP było planowane – brak wyników)</p>}
    </div>
  );
};

/* ============================== */
/*         GAZETKA / NEWS         */
/* ============================== */
const NewsPage = ({ state }) => {
  const list = [...state.posts].sort((a,b)=>b.date-a.date);
  return (
    <div className="card">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <h2 style={{margin:0}}>Gazetka ligowa</h2>
        <a className="btn small" href="#/">← Strona główna</a>
      </div>
      <div className="newsList">
        {list.map(p=>(
          <a className="newsItem" key={p.id} href={`#/post/${p.id}`}>
            <h3 style={{margin:"0 0 6px"}}>{p.title}</h3>
            <div className="newsMeta">{new Date(p.date).toLocaleString()} • {p.author}</div>
            <p style={{marginTop:6}}>{p.body}</p>
          </a>
        ))}
      </div>
    </div>
  );
};

const PostPage = ({ state, id, onAddComment }) => {
  const post = state.posts.find(p=>p.id===id);
  const [nick,setNick]=useState(""); const [txt,setTxt]=useState("");
  if(!post) return <div className="card"><h2>Post nie istnieje</h2></div>;
  return (
    <div className="card">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <a className="btn" href="#/news">← Wróć do gazetki</a>
        <a className="btn small" href="#/">← Strona główna</a>
      </div>
      <h2 style={{margin:"12px 0 6px"}}>{post.title}</h2>
      <div className="newsMeta">{new Date(post.date).toLocaleString()} • {post.author}</div>
      <p style={{marginTop:10}}>{post.body}</p>

      <div className="panel" style={{marginTop:16}}>
        <h3>Komentarze</h3>
        {post.comments?.length ? (
          <ul className="list" style={{gap:6}}>
            {post.comments.map((c,i)=><li key={i}><b>{c.nick}:</b> {c.text} <span className="muted">({new Date(c.ts).toLocaleString()})</span></li>)}
          </ul>
        ) : <div className="muted">Brak komentarzy</div>}

        <h4>Dodaj komentarz</h4>
        <label>Nick<input value={nick} onChange={e=>setNick(e.target.value)} placeholder="Twoje imię"/></label>
        <label>Treść<textarea rows={3} value={txt} onChange={e=>setTxt(e.target.value)} /></label>
        <button className="btn" onClick={()=>{ if(!nick.trim()||!txt.trim()) return alert("Podaj nick i treść"); onAddComment(post.id,{nick:nick.trim(),text:txt.trim()}); setTxt(""); }}>
          Wyślij
        </button>
      </div>
    </div>
  );
};

/* ============================== */
/*             ADMIN              */
/* ============================== */
// Uwaga: ta wersja zawiera edycję/usuwanie ROZEGRANYCH GP
const AdminPage = ({
  state,
  onAddPlanned, onAddPlayed, onEditPlanned, onDeleteGP,
  onAddPlayer, onUpdatePlayer, onDeletePlayer,
  onAddPost, onDeletePost, adminName,
  onAddPlayedFromEdit, // jeżeli używasz – zostaje
  onEditPlayedDate, onEditPlayedResults
}) => {
  const [datePlan,setDatePlan] = useState("");
  const [datePlayed,setDatePlayed] = useState("");
  const [scores,setScores] = useState({});
  const [title,setTitle]=useState(""); const [body,setBody]=useState("");

  const allPlanned = state.gps.filter(g=>g.planned).sort((a,b)=>a.date.localeCompare(b.date));
  const allPlayed  = state.gps.filter(g=>!g.planned).sort((a,b)=>a.date.localeCompare(b.date));

  const setScore=(pid,i,val)=>{
    const v=val; // zostawiamy string; liczbę rzutujemy dopiero przy zapisie
    setScores(prev=>{
      const next={...prev,[pid]:[...(prev[pid]||["","","","",""])]}; next[pid][i]=v; return next;
    });
  };

  // modal do edycji wyników ROZEGRANYCH GP
  const [editPlayed,setEditPlayed]=useState({open:false,gpId:null,scores:{}});

  return (
    <div className="card">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <span className="muted">Zalogowano jako <b>{adminName}</b></span>
        <div style={{display:"flex",gap:8}}>
          <a className="btn small" href="#/admin-players">Zarządzaj graczami</a>
          <a className="btn small" href="#/">Strona główna</a>
        </div>
      </div>

      {/* DODAJ planowane GP */}
      <div className="panel">
        <h3>Dodaj planowane GP</h3>
        <label>Data
          <input type="date" value={datePlan} onChange={e=>setDatePlan(e.target.value)} />
        </label>
        <button className="btn" onClick={()=>{ if(!datePlan) return alert("Wybierz datę"); onAddPlanned(datePlan); setDatePlan(""); }}>
          Dodaj
        </button>
      </div>

      {/* DODAJ rozegrane GP */}
      <div className="panel">
        <h3>Dodaj rozegrane GP (5 rund)</h3>
        <label>Data
          <input type="date" value={datePlayed} onChange={e=>setDatePlayed(e.target.value)} />
        </label>

        {/* nagłówki R1..R5 */}
        <div className="roundsHeader">
          <span>R1</span><span>R2</span><span>R3</span><span>R4</span><span>R5</span>
        </div>

        <div className="playersRounds">
          {state.players.map(p=>(
            <div key={p.id} className="playerRow">
              <b className="playerRow__name">{p.name}</b>
              <div className="hscroll">
                <div className="rounds">
                  {[0,1,2,3,4].map(i=>(
                    <input key={i}
                           type="number"
                           min="0"
                           inputMode="numeric"
                           aria-label={`R${i+1}`}
                           placeholder={`R${i+1}`}
                           value={(scores[p.id]?.[i] ?? "")}
                           onChange={e=>setScore(p.id,i,e.target.value)} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button className="btn" onClick={()=>{
          if(!datePlayed) return alert("Wybierz datę");
          const results={};
          state.players.forEach(p=>{
            const arr = (scores[p.id]||["","","","",""]).map(v=>Number(v===""?0:v));
            results[p.id]=arr;
          });
          onAddPlayed(datePlayed,results); setDatePlayed(""); setScores({});
        }}>Zapisz GP</button>
      </div>

      {/* EDYTUJ/USUŃ planowane */}
      <div className="panel">
        <h3>Edytuj/usuwaj planowane GP</h3>
        {allPlanned.length===0 ? <p className="muted">Brak planów.</p> : (
          <ul className="list">
            {allPlanned.map(g=>(
              <li key={g.id}>
                <span><b>{fmt(g.date)}</b> <em style={{color:"#ffb703"}}>(planowane)</em></span>
                <div style={{marginLeft:"auto",display:"flex",gap:8}}>
                  <button className="btn small" onClick={()=>{
                    const nd=prompt("Nowa data (YYYY-MM-DD)", g.date); if(!nd) return; onEditPlanned(g.id,nd);
                  }}>Zmień datę</button>
                  <button className="btn small danger" onClick={()=>{ if(confirm("Usunąć planowane GP?")) onDeleteGP(g.id); }}>Usuń</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* EDYTUJ/USUŃ rozegrane */}
      <div className="panel">
        <h3>Edytuj/usuń rozegrane GP</h3>
        {allPlayed.length===0 ? <p className="muted">Brak rozegranych GP.</p> : (
          <ul className="list">
            {allPlayed.map(g=>(
              <li key={g.id}>
                <span><b>{fmt(g.date)}</b> <em style={{color:"#07c18a"}}>(rozegrane)</em></span>
                <div style={{marginLeft:"auto",display:"flex",gap:8}}>
                  <button className="btn small" onClick={()=>{
                    const nd=prompt("Nowa data (YYYY-MM-DD)", g.date); if(!nd) return; onEditPlayedDate(g.id,nd);
                  }}>Zmień datę</button>
                  <button className="btn small" onClick={()=>{
                    const scores = {};
                    if (g.results) {
                      Object.entries(g.results).forEach(([pid,arr])=>{
                        scores[pid] = (arr||[]).map(v=>String(v??""));
                      });
                    } else {
                      state.players.forEach(p=>scores[p.id]=["","","","",""]);
                    }
                    setEditPlayed({open:true,gpId:g.id,scores});
                  }}>Edytuj wyniki</button>
                  <button className="btn small danger" onClick={()=>{ if(confirm("Usunąć to rozegrane GP?")) onDeleteGP(g.id); }}>Usuń</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* NOWY post */}
      <div className="panel">
        <h3>Nowy post (Gazetka)</h3>
        <label>Tytuł<input value={title} onChange={e=>setTitle(e.target.value)} /></label>
        <label>Treść<textarea rows={3} value={body} onChange={e=>setBody(e.target.value)} /></label>
        <button className="btn" onClick={()=>{ if(!title.trim()||!body.trim()) return alert("Uzupełnij tytuł i treść"); onAddPost({title:title.trim(), body:body.trim()}); setTitle(""); setBody(""); }}>
          Opublikuj
        </button>
        <div className="muted" style={{marginTop:6}}>Ostatnie posty:</div>
        <ul className="list">
          {[...state.posts].sort((a,b)=>b.date-a.date).slice(0,5).map(p=>(
            <li key={p.id}>
              <a href={`#/post/${p.id}`}><b>{p.title}</b></a> • {new Date(p.date).toLocaleString()} • {p.author}
              <button className="btn small danger" style={{marginLeft:"auto"}} onClick={()=>{ if(confirm("Usunąć post?")) onDeletePost(p.id); }}>Usuń</button>
            </li>
          ))}
        </ul>
      </div>

      {/* Logi */}
      <div className="panel">
        <h3>Logi</h3>
        <ul className="log">
          {[...state.logs].reverse().map((l,i)=>(
            <li key={i}><span className="muted">{new Date(l.ts).toLocaleString()}</span> <b>[{l.type}]</b> {l.msg}</li>
          ))}</ul>
      </div>

      {/* Modal edycji wyników ROZEGRANEGO GP */}
      {editPlayed.open && (
        <div className="modal__backdrop" onClick={()=>setEditPlayed({open:false,gpId:null,scores:{}})}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <h3>Edytuj wyniki rozegranego GP</h3>

            <div className="roundsHeader" style={{marginTop:8}}>
              <span>R1</span><span>R2</span><span>R3</span><span>R4</span><span>R5</span>
            </div>

            <div className="playersRounds">
              {state.players.map(p=>(
                <div key={p.id} className="playerRow">
                  <b className="playerRow__name">{p.name}</b>
                  <div className="hscroll">
                    <div className="rounds">
                      {[0,1,2,3,4].map(i=>(
                        <input
                          key={i}
                          type="number"
                          min="0"
                          inputMode="numeric"
                          aria-label={`R${i+1}`}
                          placeholder={`R${i+1}`}
                          value={(editPlayed.scores[p.id]?.[i] ?? "")}
                          onChange={e=>{
                            const v=e.target.value;
                            setEditPlayed(prev=>{
                              const nextScores={...prev.scores,[p.id]:[...(prev.scores[p.id]||["","","","",""])]};
                              nextScores[p.id][i]=v;
                              return {...prev, scores: nextScores};
                            })
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:12}}>
              <button className="btn small" onClick={()=>setEditPlayed({open:false,gpId:null,scores:{}})}>Anuluj</button>
              <button className="btn small" onClick={()=>{
                const results={}; state.players.forEach(p=>{
                  const arr = (editPlayed.scores[p.id]||["","","","",""]).map(v=>Number(v===""?0:v));
                  results[p.id]=arr;
                });
                onEditPlayedResults(editPlayed.gpId, results);
                setEditPlayed({open:false,gpId:null,scores:{}});
              }}>Zapisz wyniki</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/** Osobna, odchudzona podstrona zarządzania graczami (lista + edycja) */
const AdminPlayers = ({ state, onAddPlayer, onUpdatePlayer, onDeletePlayer }) => {
  const [name,setName]=useState(""),[avatar,setAvatar]=useState(""),[bio,setBio]=useState("");
  const [editing,setEditing]=useState(null);

  return (
    <div className="card">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <h2 style={{margin:0}}>Zarządzanie graczami</h2>
        <div style={{display:"flex",gap:8}}>
          <a className="btn small" href="#/admin">← Panel administracyjny</a>
          <a className="btn small" href="#/">← Strona główna</a>
        </div>
      </div>

      <div className="panel">
        <h3>Dodaj nowego gracza</h3>
        <label>Imię<input value={name} onChange={e=>setName(e.target.value)} placeholder="np. Marek" /></label>
        <label>Avatar (URL)<input value={avatar} onChange={e=>setAvatar(e.target.value)} placeholder="https://..." /></label>
        <label>Opis<textarea rows={3} value={bio} onChange={e=>setBio(e.target.value)} placeholder="Krótki opis"/></label>
        <button className="btn" onClick={()=>{ if(!name.trim()) return alert("Podaj imię"); onAddPlayer({name,avatar,bio}); setName(""); setAvatar(""); setBio(""); }}>
          Dodaj gracza
        </button>
      </div>

      <div className="panel">
        <h3>Lista graczy</h3>
        <ul className="list">
          {state.players.map(p=>(
            <li key={p.id} style={{alignItems:"flex-start"}}>
              <div style={{display:"flex",gap:10,alignItems:"center"}}>
                <img src={p.avatar||"/logo2.png"} alt="" style={{width:42,height:42,borderRadius:10,border:"1px solid #6b46c1",objectFit:"cover"}}/>
                <div>
                  <b>{p.name}</b>
                  <div className="muted" style={{maxWidth:420}}>{p.bio||"—"}</div>
                </div>
              </div>
              <div style={{marginLeft:"auto",display:"flex",gap:8}}>
                <button className="btn small" onClick={()=>setEditing(p)}>Edytuj</button>
                <button className="btn small danger" onClick={()=>{ if(confirm("Usunąć gracza?")) onDeletePlayer(p.id); }}>Usuń</button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {editing && (
        <div className="modal__backdrop" onClick={()=>setEditing(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <h3>Edytuj: {editing.name}</h3>
            <label>Imię<input defaultValue={editing.name} onChange={e=>editing.name=e.target.value}/></label>
            <label>Avatar (URL)<input defaultValue={editing.avatar} onChange={e=>editing.avatar=e.target.value}/></label>
            <label>Opis<textarea rows={3} defaultValue={editing.bio} onChange={e=>editing.bio=e.target.value}/></label>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <button className="btn small" onClick={()=>setEditing(null)}>Anuluj</button>
              <button className="btn small" onClick={()=>{ onUpdatePlayer(editing); setEditing(null); }}>Zapisz</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================== */
/*           LOGIN MODAL          */
/* ============================== */
const LoginModal = ({ open, onClose, onSuccess }) => {
  const [login,setLogin]=useState("");
  const [pass,setPass]=useState("");
  useEffect(()=>{ if(open){ setLogin(""); setPass(""); } },[open]);

  if(!open) return null;
  return (
    <div className="modal__backdrop" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <h3>Logowanie admina</h3>
        <label>Login
          <input value={login} onChange={e=>setLogin(e.target.value)} placeholder="login" />
        </label>
        <label>Hasło
          <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="PIN" />
        </label>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <button className="btn small" onClick={onClose}>Anuluj</button>
          <button className="btn small" onClick={()=>{
            if(!(login in ADMINS)) return alert("Nieznany login.");
            if(pass!==ADMINS[login]) return alert("Błędne hasło.");
            onSuccess(login);
          }}>Zaloguj</button>
        </div>
      </div>
    </div>
  );
};

/* ============================== */
/*              APP               */
/* ============================== */
export default function App(){
  const [state,setState]=useStore();
  const [r,setR]=useState(route());
  const [adminName,setAdminName]=useState("");
  const [loginOpen,setLoginOpen]=useState(false);

  useEffect(()=>{ const h=()=>setR(route()); addEventListener("hashchange",h); return ()=>removeEventListener("hashchange",h); },[]);

  const addLog=(type,msg)=>setState(s=>({...s,logs:[...s.logs,{ts:Date.now(),type,msg}]}));

  // LOGIN
  const onShowLogin = () => setLoginOpen(true);
  const onCloseLogin = () => setLoginOpen(false);
  const onLoginSuccess = (nick) => {
    setAdminName(nick);
    setLoginOpen(false);
    if (location.hash !== "#/admin") location.hash = "#/admin";
  };
  const onLogout = () => {
    setAdminName("");
    if (location.hash.startsWith("#/admin")) location.hash = "#/";
  };

  // MUTACJE
  const onAddPlanned=(date)=>{
    const gp={id:crypto.randomUUID(),date,planned:true};
    setState(s=>({...s,gps:[...s.gps,gp]})); addLog("PLAN_ADD",`Dodano planowane GP na ${date}.`);
  };
  const onEditPlanned=(id,newDate)=>{
    setState(s=>({...s,gps:s.gps.map(g=>g.id===id?{...g,date:newDate}:g)})); addLog("PLAN_EDIT",`Zmieniono datę planowanego GP (${id}) na ${newDate}.`);
  };
  const onAddPlayed=(date,results)=>{
    setState(s=>{
      const existed=s.gps.find(g=>g.date===date && g.planned);
      const gp=existed?{...existed,planned:false,results}:{id:crypto.randomUUID(),date,planned:false,results};
      const others=s.gps.filter(g=>g.id!==(existed?.id));
      return {...s,gps:[...others,gp]};
    }); addLog("GP_ADD",`Dodano rozegrane GP na ${date}.`);
  };
  const onDeleteGP=(id)=>{
    setState(s=>({...s,gps:s.gps.filter(g=>g.id!==id)})); addLog("GP_DELETE",`Usunięto GP (${id}).`); if (location.hash.startsWith("#/gp/")) location.hash="#/calendar";
  };

  // NOWE: edycja rozegranych GP
  const onEditPlayedDate=(id,newDate)=>{
    setState(s=>({...s,gps:s.gps.map(g=>g.id===id?{...g,date:newDate}:g)}));
    addLog("GP_DATE_EDIT",`Zmieniono datę rozegranego GP (${id}) na ${newDate}.`);
  };
  const onEditPlayedResults=(id,results)=>{
    setState(s=>({...s,gps:s.gps.map(g=>g.id===id?{...g,results,planned:false}:g)}));
    addLog("GP_RESULTS_EDIT",`Zmieniono wyniki rozegranego GP (${id}).`);
  };

  const onAddPlayer=({name,avatar,bio})=>{
    const id=name.toLowerCase().replace(/\s+/g,"-");
    setState(s=>({...s,players:[...s.players,{id,name,avatar,bio}]})); addLog("PLAYER_ADD",`Dodano gracza: ${name}.`);
  };
  const onUpdatePlayer=(player)=>{
    setState(s=>({...s,players:s.players.map(p=>p.id===player.id?{...p,...player}:p)})); addLog("PLAYER_EDIT",`Edytowano gracza: ${player.name}.`);
  };
  const onDeletePlayer=(id)=>{
    setState(s=>({...s,players:s.players.filter(p=>p.id!==id)})); addLog("PLAYER_DELETE",`Usunięto gracza (${id}).`);
  };

  const onAddPost=({title,body})=>{
    setState(s=>({...s,posts:[...s.posts,{id:crypto.randomUUID(),title,body,author:adminName||"Admin",date:Date.now(),comments:[]}]}));
    addLog("POST_ADD",`Nowy post: ${title}.`);
  };
  const onDeletePost=(id)=>{
    setState(s=>({...s,posts:s.posts.filter(p=>p.id!==id)})); addLog("POST_DELETE",`Usunięto post (${id}).`);
  };
  const onAddComment=(postId,comment)=>{
    setState(s=>({...s,posts:s.posts.map(p=>p.id===postId?{...p,comments:[...(p.comments||[]),{...comment,ts:Date.now()}]}:p)}));
    addLog("COMMENT_ADD",`Komentarz do posta (${postId}) od ${comment.nick}.`);
  };

  return (
    <ErrorBoundary>
      <Shell adminName={adminName} onShowLogin={onShowLogin} onLogout={onLogout}>
        {r.view==="home"    && <Home state={state} />}
        {r.view==="tabela"  && <Tabela state={state} />}
        {r.view==="players" && <Players state={state} />}
        {r.view==="player"  && <PlayerPage state={state} id={r.id} />}
        {r.view==="calendar"&& <CalendarPage state={state} />}
        {r.view==="gp"      && <GPPage state={state} id={r.id} />}
        {r.view==="news"    && <NewsPage state={state} />}
        {r.view==="post"    && <PostPage state={state} id={r.id} onAddComment={onAddComment} />}

        {r.view==="admin" && (adminName
          ? <AdminPage
              state={state}
              onAddPlanned={onAddPlanned}
              onAddPlayed={onAddPlayed}
              onEditPlanned={onEditPlanned}
              onDeleteGP={onDeleteGP}
              onAddPlayer={onAddPlayer}
              onUpdatePlayer={onUpdatePlayer}
              onDeletePlayer={onDeletePlayer}
              onAddPost={onAddPost}
              onDeletePost={onDeletePost}
              adminName={adminName}
              onEditPlayedDate={onEditPlayedDate}
              onEditPlayedResults={onEditPlayedResults}
            />
          : <div className="card"><h2>Wymagane logowanie admina (kliknij „Admin (logowanie)” u góry).</h2></div>
        )}

        {r.view==="adminPlayers" && (adminName
          ? <AdminPlayers
              state={state}
              onAddPlayer={onAddPlayer}
              onUpdatePlayer={onUpdatePlayer}
              onDeletePlayer={onDeletePlayer}
            />
          : <div className="card"><h2>Wymagane logowanie admina.</h2></div>
        )}
      </Shell>

      {/* ====== STYLES ====== */}
      <style>{`
        :root{--ink:#e9ddff;--muted:#cdbfff;--brand:#6b46c1;--card:#1b1134;}
        *{box-sizing:border-box}
        body{margin:0;font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Helvetica,Arial;color:var(--ink);-webkit-tap-highlight-color:transparent}
        .container{max-width:1140px;margin:0 auto;padding:16px}

        /* NAV (scrollowalny) */
        .nav{position:sticky;top:0;z-index:50;background:rgba(18,10,34,.85);
             backdrop-filter:saturate(180%) blur(8px);border-bottom:1px solid #3f2b86}
        .nav__scroll{overflow:auto hidden}
        .nav__scroll::-webkit-scrollbar{height:8px}
        .nav__scroll::-webkit-scrollbar-thumb{background:#3f2b86;border-radius:6px}
        .nav__inner{min-width:max-content;display:flex;align-items:center;gap:8px;padding:8px 16px;height:64px}
        .nav__left{display:flex;align-items:center;gap:8px;min-width:0}
        .nav__logo{height:28px;width:auto;display:block}
        .tab{padding:8px 10px;border-radius:10px;color:var(--ink);text-decoration:none;white-space:nowrap;border:0;background:transparent}
        .tab:hover{background:rgba(255,255,255,.06);cursor:pointer}
        .btn--ghost{border:1px solid #3f2b86}

        /* UI */
        .btn{background:linear-gradient(180deg,#7c4dff,#6b46c1);border:1px solid #8b5cf6;color:#fff;padding:8px 12px;border-radius:10px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:8px}
        .btn:hover{filter:brightness(1.05)}
        .btn.small{padding:6px 10px;font-size:.92rem}
        .btn.danger{background:linear-gradient(180deg,#ff4d6d,#d90429);border-color:#ef233c}
        .card{background:rgba(27,17,52,.82);backdrop-filter:blur(6px);border:1px solid #3f2b86;border-radius:16px;padding:16px}
        .table{width:100%;border-collapse:collapse}
        .table th,.table td{border-bottom:1px solid #3f2b86;padding:8px;text-align:left;vertical-align:middle}
        .table th{color:#d8c8ff;font-weight:600}
        .muted{color:var(--muted);opacity:.85}
        .grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
        .players{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}
        .playerCard{display:flex;gap:10px;align-items:center;background:#140c25;padding:10px;border:1px solid #3f2b86;border-radius:12px;text-decoration:none;color:var(--ink)}
        .playerCard img{width:48px;height:48px;border-radius:10px;object-fit:cover;border:1px solid #6b46c1}
        .playerCard .sub{font-size:.9rem;color:#cdbfff;opacity:.8}
        .profile{display:flex;gap:16px;align-items:center;margin:12px 0}
        .profile img{width:96px;height:96px;border-radius:12px;object-fit:cover;border:2px solid #6b46c1}
        .month{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin:12px 0}
        .day{height:42px;border:1px solid #3f2b86;border-radius:10px;display:flex;align-items:center;justify-content:center}
        .list{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px}
        .list li{display:flex;align-items:center;gap:12px;padding:8px;background:#140c25;border:1px solid #3f2b86;border-radius:10px}
        .panel{margin-top:16px;padding:12px;border:1px dashed #5533aa;border-radius:12px;display:grid;gap:8px}
        label{display:grid;gap:6px}
        input,textarea,select{background:#140c25;color:var(--ink);border:1px solid #3f2b86;border-radius:10px;padding:10px}
        .tableWrap{overflow-x:auto}
        .footer{ text-align:center; opacity:.7; padding:32px 0}

        /* Edytory wyników – hscroll + header R1..R5 */
        .roundsHeader{display:grid;grid-template-columns:120px repeat(5,56px);gap:6;align-items:center;color:#cdbfff;opacity:.9}
        .playersRounds{display:flex;flex-direction:column;gap:8}
        .playerRow{display:grid;grid-template-columns:120px 1fr;gap:6;align-items:center}
        .playerRow__name{white-space:nowrap}
        .hscroll{overflow:auto hidden}
        .rounds{display:grid;grid-template-columns:repeat(5,56px);gap:6;min-width:300px}
        .rounds input::placeholder{color:#9f8bd8}

        /* Charts heights responsive */
        .chartH{height:260px}

        /* NEXT GP */
        .nextgp{display:flex;gap:12px;align-items:center;background:linear-gradient(90deg,#2b1c62,#4922a6);border:1px solid #6b46c1;color:#fff;border-radius:12px;padding:10px;margin:0 0 16px}
        .nextgp__img{height:40px;width:auto;border-radius:8px}
        .nextgp__text{font-weight:600}

        /* News */
        .newsWrap{display:flex;flex-direction:column;gap:8px}
        .newsSpot{display:block;background:#140c25;border:1px solid #3f2b86;border-radius:12px;padding:12px;color:inherit;text-decoration:none}
        .newsTitle{font-weight:800;margin-bottom:4px}
        .newsMeta{color:#cdbfff;opacity:.85;font-size:.92rem}
        .newsBody{margin-top:6px;line-height:1.35}
        .newsTicker{display:flex;align-items:center;gap:8px;background:#180e30;border:1px solid #3f2b86;border-radius:10px;padding:8px 10px;text-decoration:none;color:inherit;overflow:hidden}
        .newsTicker .dot{width:8px;height:8px;border-radius:50%;background:#ffd166;flex:0 0 auto}
        .tickerMeta{color:#cdbfff;opacity:.7}

        /* Modal */
        .modal__backdrop{position:fixed;inset:0;background:rgba(0,0,0,.5);display:grid;place-items:center;z-index:70}
        .modal{width:min(92vw,560px);background:#1b1134;border:1px solid #3f2b86;border-radius:16px;padding:16px}

        /* MOBILE */
        @media (max-width: 900px){
          .grid2{grid-template-columns:1fr}
          .nav__inner{height:60px;padding:6px 12px}
          .tab{padding:6px 8px}
          .nextgp__img{height:34px}
          .chartH{height:220px}
          .profile img{width:80px;height:80px}
          .roundsHeader{grid-template-columns:100px repeat(5,56px)}
          .playerRow{grid-template-columns:100px 1fr}
        }
        @media (max-width: 600px){
          .container{padding:12px}
          .btn{padding:7px 10px;border-radius:9px}
          .btn.small{padding:5px 8px}
          input,textarea,select{padding:9px}
          .day{height:38px}
          .newsBody{font-size:.98rem}
          .rounds{grid-template-columns:repeat(5,52px)}
          .roundsHeader{grid-template-columns:90px repeat(5,52px)}
          .playerRow{grid-template-columns:90px 1fr}
        }
      `}</style>

      {/* LOGIN MODAL */}
      <LoginModal open={loginOpen} onClose={onCloseLogin} onSuccess={onLoginSuccess} />
    </ErrorBoundary>
  );
}
