// src/App.jsx
import "./App.css";
import React, { useEffect, useMemo, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, Legend, ReferenceLine, Cell
} from "recharts";

// >>> FIREBASE STORE (czyta realtime i wystawia akcje zapisu)
import {
  useCloudState,
  addLog,
  addPlanned, editPlanned, deleteGP,
  addPlayed, editPlayedDate, editPlayedResults,
  addPlayer, updatePlayer, deletePlayer,
  addPost, deletePost, addComment
} from "./store.cloud";

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
/*        HELPERY                 */
/* ============================== */
const sum = a => (a||[]).reduce((x,y)=>x+y,0);
const fmt = iso => new Date(iso).toLocaleDateString();
const toLocalDateStr = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

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
  if(parts[0]==="manager") return {view:"manager"};
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
const ADMINS = { "Bartek": "1998", "Oliwia": "2003" };

const Shell = ({ adminName, onShowLogin, onLogout, children }) => {
  return (
    <div className="app" style={{minHeight:"100vh",background:"url('/background.png') center/cover fixed, #201541"}}>
      <header className="nav">
        <div className="nav__scroll">
          <div className="nav__inner">
            <div className="nav__left">
              <img src="/logo-klapi.png" alt="Kłapi League" className="nav__logo" />
              <a className="tab" href="#/">Strona główna</a>
              <a className="tab" href="#/tabela">Tabela</a>
              <a className="tab" href="#/players">Gracze</a>
              <a className="tab" href="#/calendar">Kalendarz</a>
              <a className="tab" href="#/manager">Manager gry</a>
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

const NewsSpotlight = ({ posts }) => {
  const list = [...posts].sort((a,b)=>b.date-a.date);
  if(list.length===0) return <p className="muted">Brak aktualności.</p>;
  const [idx,setIdx] = useState(1);
  const tail = list.slice(1,3);

  useEffect(()=>{
    if(tail.length===0) return;
    const t = setInterval(()=>setIdx(i=>(i%tail.length)+1), 5000);
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
  const players = state.players||[];
  const played = (state.gps||[]).filter(g=>!g.planned).sort((a,b)=>a.date.localeCompare(b.date));
  const last = played[played.length-1];
  const nextPlanned = (state.gps||[]).filter(g=>g.planned).sort((a,b)=>a.date.localeCompare(b.date))[0];

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

      <div className="grid2">
        <div className="card">
          <h2>Aktualności</h2>
          <NewsSpotlight posts={state.posts||[]}/>
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
        <h2>Manager gry karcianej online</h2>
        <p>
          Prowadź rozgrywkę na żywo: zaznacz aktywnych graczy, zapisuj wyniki każdej rundy
          i udostępnij je jednym kliknięciem administracji lub pozostałym uczestnikom.
        </p>
        <div className="managerBadges">
          <span className="scoreBadge">🃏 Dowolna liczba rund</span>
          <span className="scoreBadge">📊 Ranking na żywo</span>
          <span className="scoreBadge">📎 Eksport JSON</span>
        </div>
        <div style={{marginTop:12}}>
          <a className="btn small" href="#/manager">Uruchom managera →</a>
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
  const players = state.players||[];
  const played = (state.gps||[]).filter(g=>!g.planned).sort((a,b)=>a.date.localeCompare(b.date));
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
              const gpIdsForForm = playedIds;
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
      {(state.players||[]).map(p=>(
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
  const gps = (state.gps||[]).filter(g=>!g.planned && g.results && g.results[pid]).sort((a,b)=>a.date.localeCompare(b.date));
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
  const bestRoundIndex = byRound.indexOf(Math.min(...byRound));

  return { avgPerRound, avgPerGp, bestGp, worstGp, maxSpread, wins, avgPos, form: positions, bestRoundIndex, gpIds: gps.map(g=>g.id) };
}

const PlayerPage = ({ state, id }) => {
  const p = (state.players||[]).find(x=>x.id===id);
  if(!p) return <div className="card"><h2>Nie znaleziono gracza</h2></div>;
  const stats = calcPlayerStats(state, p.id);

  const played = (state.gps||[]).filter(g=>!g.planned && g.results).sort((a,b)=>a.date.localeCompare(b.date));
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
  const list = [...(state.gps||[])].sort((a,b)=>a.date.localeCompare(b.date));

  const first = new Date(view.y, view.m, 1);
  const start = (first.getDay()+6)%7; // pon=0
  const days = new Date(view.y, view.m+1, 0).getDate();
  const cells = Array.from({length:start}).map(()=>null).concat(
    Array.from({length:days}).map((_,i)=>new Date(view.y,view.m,i+1))
  );

  const findGpOn = (d) => (state.gps||[]).find(g=>g.date===toLocalDateStr(d));

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
  const gp = (state.gps||[]).find(x=>x.id===id);
  if(!gp) return <div className="card"><h2>Nie znaleziono GP</h2></div>;
  const players = state.players||[];

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
  const list = [...(state.posts||[])].sort((a,b)=>b.date-a.date);
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
  const post = (state.posts||[]).find(p=>p.id===id);
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
/*       MANAGER ROZGRYWKI        */
/* ============================== */
const CardManager = ({ state, adminName, onSaveLog }) => {
  const players = state.players || [];
  const [selectedIds, setSelectedIds] = useState(() => players.map(p => p.id));
  const [roundCount, setRoundCount] = useState(5);
  const [scores, setScores] = useState({});
  const [sessionName, setSessionName] = useState(() => `Sesja ${new Date().toLocaleDateString()}`);
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    setSelectedIds(prev => {
      const available = players.map(p => p.id);
      if (available.length === 0) return [];
      const filtered = prev.filter(id => available.includes(id));
      const unchanged = filtered.length === prev.length && filtered.every((id, idx) => id === prev[idx]);
      if (unchanged) return prev;
      if (filtered.length > 0) return filtered;
      return available;
    });
  }, [players]);

  useEffect(() => {
    if (!statusMsg) return;
    const timer = setTimeout(() => setStatusMsg(""), 4000);
    return () => clearTimeout(timer);
  }, [statusMsg]);

  useEffect(() => {
    setScores(prev => {
      const allowed = new Set(selectedIds);
      let changed = false;
      const next = {};
      Object.entries(prev).forEach(([pid, arr]) => {
        if (allowed.has(pid)) {
          next[pid] = arr;
        } else {
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [selectedIds]);

  const selectedPlayers = useMemo(
    () => players.filter(p => selectedIds.includes(p.id)),
    [players, selectedIds]
  );

  const togglePlayer = (pid) => {
    setSelectedIds(prev => {
      if (prev.includes(pid)) {
        return prev.filter(id => id !== pid);
      }
      const next = [...prev, pid];
      const order = players.map(p => p.id);
      next.sort((a, b) => order.indexOf(a) - order.indexOf(b));
      return next;
    });
  };

  const updateRoundCount = (value) => {
    const parsed = Number(value);
    const safe = Number.isFinite(parsed) ? Math.min(10, Math.max(1, Math.floor(parsed))) : 1;
    setRoundCount(safe);
  };

  const setScore = (pid, roundIdx, value) => {
    setScores(prev => {
      const next = { ...prev };
      const arr = [...(next[pid] || [])];
      arr[roundIdx] = value;
      next[pid] = arr;
      return next;
    });
  };

  const scoreboard = useMemo(() => {
    return selectedPlayers.map(p => {
      const rounds = Array.from({ length: roundCount }, (_, idx) => {
        const raw = scores[p.id]?.[idx];
        return raw == null ? "" : raw;
      });
      const normalized = rounds.map(v => {
        if (v === "" || v == null) return 0;
        const num = Number(v);
        return Number.isNaN(num) ? 0 : num;
      });
      const total = rounds.reduce((acc, raw, idx) => acc + (raw === "" || raw == null ? 0 : normalized[idx]), 0);
      return { player: p, rounds, normalized, total };
    });
  }, [selectedPlayers, roundCount, scores]);

  const ranking = useMemo(() => {
    if (scoreboard.length === 0) return [];
    const enriched = scoreboard.map(row => {
      const filled = row.rounds
        .map((raw, idx) => (raw === "" || raw == null ? null : row.normalized[idx]))
        .filter(v => v != null);
      const best = filled.length ? Math.min(...filled) : null;
      const worst = filled.length ? Math.max(...filled) : null;
      return { ...row, best, worst };
    }).sort((a, b) => a.total - b.total);
    const leaderTotal = enriched[0]?.total ?? 0;
    return enriched.map((row, idx) => ({
      ...row,
      position: idx + 1,
      gap: idx === 0 ? 0 : row.total - leaderTotal
    }));
  }, [scoreboard]);

  const roundStats = useMemo(() => {
    return Array.from({ length: roundCount }, (_, idx) => {
      const values = scoreboard
        .map(row => ({ raw: row.rounds[idx], val: row.normalized[idx] }))
        .filter(x => x.raw !== "" && x.raw != null)
        .map(x => x.val);
      if (values.length === 0) {
        return { idx: idx + 1, min: null, max: null, avg: null };
      }
      const min = Math.min(...values);
      const max = Math.max(...values);
      const avg = values.reduce((acc, v) => acc + v, 0) / values.length;
      return { idx: idx + 1, min, max, avg };
    });
  }, [scoreboard, roundCount]);

  const filledCells = useMemo(() => {
    return scoreboard.reduce((acc, row) => acc + row.rounds.filter(v => v !== "" && v != null).length, 0);
  }, [scoreboard]);

  const resetScores = () => {
    setScores({});
    setStatusMsg("Wyniki zostały wyczyszczone.");
  };

  const copyToClipboard = async () => {
    if (scoreboard.length === 0) {
      setStatusMsg("Najpierw wybierz graczy.");
      return;
    }
    const payload = {
      name: sessionName || "Sesja bez nazwy",
      roundCount,
      createdAt: new Date().toISOString(),
      players: scoreboard.map(row => ({ id: row.player.id, name: row.player.name })),
      results: scoreboard.reduce((acc, row) => {
        acc[row.player.id] = row.rounds.map((raw, idx) => {
          if (raw === "" || raw == null) return 0;
          const num = Number(raw);
          return Number.isNaN(num) ? 0 : num;
        });
        return acc;
      }, {}),
      ranking: ranking.map(row => ({ position: row.position, id: row.player.id, name: row.player.name, total: row.total }))
    };
    const text = JSON.stringify(payload, null, 2);

    try {
      await navigator.clipboard.writeText(text);
      setStatusMsg("Skopiowano dane sesji do schowka.");
    } catch (err) {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        setStatusMsg("Skopiowano dane sesji do schowka.");
      } catch (err2) {
        console.error(err2);
        setStatusMsg("Nie udało się skopiować – skorzystaj z ręcznego eksportu.");
      }
    }
  };

  const saveLog = async () => {
    if (!onSaveLog || !adminName) {
      setStatusMsg("Zapis do logów dostępny jest tylko po zalogowaniu admina.");
      return;
    }
    if (ranking.length === 0) {
      setStatusMsg("Brak wyników do zapisania w logach.");
      return;
    }
    const summary = ranking
      .map(row => `${row.position}. ${row.player.name} (${row.total})`)
      .join(" | ");
    try {
      await onSaveLog(`${sessionName || "Sesja"} • rund: ${roundCount} • ${summary}`);
      setStatusMsg("Dodano wpis w logach administracyjnych.");
    } catch (err) {
      console.error(err);
      setStatusMsg("Nie udało się zapisać wpisu w logach.");
    }
  };

  return (
    <div className="card">
      <h2>Manager gry karcianej</h2>
      <p className="muted" style={{ marginTop: 6 }}>
        Moduł do prowadzenia spotkań online – uzupełniaj wyniki rund w czasie rzeczywistym,
        kontroluj ranking na żywo i eksportuj dane do dalszego wykorzystania.
      </p>

      <div className="managerGrid">
        <div className="panel">
          <h3>1. Skład i parametry rozgrywki</h3>
          <label>Liczba rund (1-10)
            <input type="number" min="1" max="10" value={roundCount} onChange={e => updateRoundCount(e.target.value)} />
          </label>
          <label>Nazwa / notatka sesji
            <input value={sessionName} onChange={e => setSessionName(e.target.value)} placeholder="np. Piątkowy draft online" />
          </label>

          <div>
            <strong style={{ display: "block", marginBottom: 6 }}>Aktywni gracze</strong>
            <div className="playerPicker">
              {players.map(p => {
                const active = selectedIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`playerToggle${active ? " active" : ""}`}
                    onClick={() => togglePlayer(p.id)}
                  >
                    <img src={p.avatar || "/logo2.png"} alt="" />
                    <span>{p.name}</span>
                  </button>
                );
              })}
            </div>
            {players.length === 0 && (
              <div className="managerEmpty" style={{ marginTop: 8 }}>
                Brak graczy w bazie. Dodaj ich w panelu administracyjnym.
              </div>
            )}
            {players.length > 0 && selectedPlayers.length === 0 && (
              <div className="managerEmpty" style={{ marginTop: 8 }}>
                Wybierz co najmniej jednego gracza, aby rozpocząć.
              </div>
            )}
          </div>

          <div className="managerBadges" style={{ marginTop: 10 }}>
            <span className="scoreBadge">👥 Gracze: <strong>{selectedPlayers.length}</strong></span>
            <span className="scoreBadge">🕒 Rundy: <strong>{roundCount}</strong></span>
            <span className="scoreBadge">✍️ Uzupełnione pola: <strong>{filledCells}</strong></span>
          </div>
        </div>

        <div className="panel managerSummary">
          <h3>2. Ranking na żywo</h3>
          {ranking.length === 0 ? (
            <div className="managerEmpty">Brak danych do pokazania – zacznij wprowadzać wyniki rund.</div>
          ) : (
            <>
              <div className="tableWrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Gracz</th>
                      <th>Suma pkt</th>
                      <th>Strata</th>
                      <th>Najlepsza runda</th>
                      <th>Najgorsza runda</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranking.map(row => (
                      <Top3Row key={row.player.id} idx={row.position - 1}>
                        <td>{row.position}</td>
                        <td>{row.player.name}</td>
                        <td>{row.total}</td>
                        <td>{row.gap}</td>
                        <td>{row.best != null ? row.best : "—"}</td>
                        <td>{row.worst != null ? row.worst : "—"}</td>
                      </Top3Row>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <strong>Statystyki rund:</strong>
                <ul className="roundStats">
                  {roundStats.map(stat => (
                    <li key={stat.idx}>
                      <span>R{stat.idx}</span>
                      {stat.avg == null ? (
                        <span className="muted">brak danych</span>
                      ) : (
                        <span>
                          <strong>{stat.min}</strong> / {stat.max} • śr. {stat.avg.toFixed(1)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="panel managerTable">
        <h3>3. Wprowadzanie wyników rund</h3>
        {selectedPlayers.length === 0 ? (
          <div className="managerEmpty">Dodaj graczy do rozgrywki, aby rozpocząć notowanie punktów.</div>
        ) : (
          <>
            <div className="roundsHeader" style={{ "--round-count": roundCount }}>
              <span className="hdrSpacer">Gracz</span>
              {Array.from({ length: roundCount }, (_, idx) => (
                <span key={idx}>R{idx + 1}</span>
              ))}
            </div>

            <div className="playersRounds">
              {selectedPlayers.map(p => (
                <div key={p.id} className="playerRow" style={{ "--round-count": roundCount }}>
                  <b className="playerRow__name">{p.name}</b>
                  <div className="hscroll">
                    <div className="rounds" style={{ "--round-count": roundCount }}>
                      {Array.from({ length: roundCount }, (_, idx) => (
                        <input
                          key={idx}
                          type="number"
                          min="0"
                          inputMode="numeric"
                          placeholder={`R${idx + 1}`}
                          value={scores[p.id]?.[idx] ?? ""}
                          onChange={e => setScore(p.id, idx, e.target.value)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="managerActions">
          <button className="btn small" onClick={resetScores}>Wyczyść wyniki</button>
          <button className="btn small" onClick={copyToClipboard}>Skopiuj wyniki do JSON</button>
          {adminName && (
            <button className="btn small" onClick={saveLog}>Zapisz skrót w logach</button>
          )}
        </div>
        {statusMsg && <div className="copyState">{statusMsg}</div>}
      </div>
    </div>
  );
};

/* ============================== */
/*             ADMIN              */
/* ============================== */
const AdminPage = ({
  state,
  onAddPlanned, onAddPlayed, onEditPlanned, onDeleteGP,
  onAddPlayer, onUpdatePlayer, onDeletePlayer,
  onAddPost, onDeletePost, adminName,
  onEditPlayedDate, onEditPlayedResults
}) => {
  const [datePlan,setDatePlan] = useState("");
  const [datePlayed,setDatePlayed] = useState("");
  const [scores,setScores] = useState({});
  const [title,setTitle]=useState(""); const [body,setBody]=useState("");

  const allPlanned = (state.gps||[]).filter(g=>g.planned).sort((a,b)=>a.date.localeCompare(b.date));
  const allPlayed  = (state.gps||[]).filter(g=>!g.planned).sort((a,b)=>a.date.localeCompare(b.date));

  const setScore=(pid,i,val)=>{
    const v=val;
    setScores(prev=>{
      const next={...prev,[pid]:[...(prev[pid]||["","","","",""])]}; next[pid][i]=v; return next;
    });
  };

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

      <div className="panel">
        <h3>Dodaj planowane GP</h3>
        <label>Data
          <input type="date" value={datePlan} onChange={e=>setDatePlan(e.target.value)} />
        </label>
        <button className="btn" onClick={()=>{ if(!datePlan) return alert("Wybierz datę"); onAddPlanned(datePlan); setDatePlan(""); }}>
          Dodaj
        </button>
      </div>

      <div className="panel">
        <h3>Dodaj rozegrane GP (5 rund)</h3>
        <label>Data
          <input type="date" value={datePlayed} onChange={e=>setDatePlayed(e.target.value)} />
        </label>

        <div className="roundsHeader">
          <span className="hdrSpacer">Gracz</span>
          <span>R1</span><span>R2</span><span>R3</span><span>R4</span><span>R5</span>
        </div>

        <div className="playersRounds">
          {(state.players||[]).map(p=>(
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
          (state.players||[]).forEach(p=>{
            const arr = (scores[p.id]||["","","","",""]).map(v=>Number(v===""?0:v));
            results[p.id]=arr;
          });
          onAddPlayed(datePlayed,results); setDatePlayed(""); setScores({});
        }}>Zapisz GP</button>
      </div>

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
                      (state.players||[]).forEach(p=>scores[p.id]=["","","","",""]);
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

      <div className="panel">
        <h3>Nowy post (Gazetka)</h3>
        <label>Tytuł<input value={title} onChange={e=>setTitle(e.target.value)} /></label>
        <label>Treść<textarea rows={3} value={body} onChange={e=>setBody(e.target.value)} /></label>
        <button className="btn" onClick={()=>{ if(!title.trim()||!body.trim()) return alert("Uzupełnij tytuł i treść"); onAddPost({title:title.trim(), body:body.trim()}); setTitle(""); setBody(""); }}>
          Opublikuj
        </button>
        <div className="muted" style={{marginTop:6}}>Ostatnie posty:</div>
        <ul className="list">
          {[...(state.posts||[])].sort((a,b)=>b.date-a.date).slice(0,5).map(p=>(
            <li key={p.id}>
              <a href={`#/post/${p.id}`}><b>{p.title}</b></a> • {new Date(p.date).toLocaleString()} • {p.author}
              <button className="btn small danger" style={{marginLeft:"auto"}} onClick={()=>{ if(confirm("Usunąć post?")) onDeletePost(p.id); }}>Usuń</button>
            </li>
          ))}
        </ul>
      </div>

      <div className="panel">
        <h3>Logi</h3>
        <ul className="log">
          {[...(state.logs||[])].reverse().map((l,i)=>(
            <li key={i}><span className="muted">{new Date(l.ts).toLocaleString()}</span> <b>[{l.type}]</b> {l.msg}</li>
          ))}</ul>
      </div>

      {editPlayed.open && (
        <div className="modal__backdrop" onClick={()=>setEditPlayed({open:false,gpId:null,scores:{}})}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <h3>Edytuj wyniki rozegranego GP</h3>

            <div className="roundsHeader" style={{marginTop:8}}>
              <span className="hdrSpacer">Gracz</span>
              <span>R1</span><span>R2</span><span>R3</span><span>R4</span><span>R5</span>
            </div>

            <div className="playersRounds">
              {(state.players||[]).map(p=>(
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
                const results={}; (state.players||[]).forEach(p=>{
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
          {(state.players||[]).map(p=>(
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
  const state = useCloudState();        // <<< realtime z Firestore
  const [r,setR]=useState(route());
  const [adminName,setAdminName]=useState("");
  const [loginOpen,setLoginOpen]=useState(false);

  useEffect(()=>{ const h=()=>setR(route()); addEventListener("hashchange",h); return ()=>removeEventListener("hashchange",h); },[]);

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

  // LOG wrapper
  const pushLog = async (type,msg) => { try{ await addLog(type,msg);}catch(e){console.error(e);} };

  // MUTACJE -> Firestore
  const onAddPlanned       = async (date)=>{ await addPlanned(date); await pushLog("PLAN_ADD",`Dodano planowane GP na ${date}.`); };
  const onEditPlanned      = async (id,newDate)=>{ await editPlanned(id,newDate); await pushLog("PLAN_EDIT",`Zmieniono datę planowanego GP (${id}) na ${newDate}.`); };
  const onDeleteGPHandler  = async (id)=>{ if(!confirm("Usunąć GP?")) return; await deleteGP(id); await pushLog("GP_DELETE",`Usunięto GP (${id}).`); if(location.hash.startsWith("#/gp/")) location.hash="#/calendar"; };
  const onAddPlayed        = async (date,results)=>{ 
    const normalized={}; Object.entries(results).forEach(([pid,arr])=>normalized[pid]=(arr||[]).map(v=>Number(v??0)));
    await addPlayed(date,normalized); await pushLog("GP_ADD",`Dodano rozegrane GP na ${date}.`); 
  };
  const onEditPlayedDate   = async (id,newDate)=>{ await editPlayedDate(id,newDate); await pushLog("GP_DATE_EDIT",`Zmieniono datę rozegranego GP (${id}) na ${newDate}.`); };
  const onEditPlayedResults= async (id,results)=>{ 
    const normalized={}; Object.entries(results).forEach(([pid,arr])=>normalized[pid]=(arr||[]).map(v=>Number(v??0)));
    await editPlayedResults(id,normalized); await pushLog("GP_RESULTS_EDIT",`Zmieniono wyniki rozegranego GP (${id}).`);
  };

  const onAddPlayer        = async ({name,avatar,bio})=>{ await addPlayer({name,avatar,bio}); await pushLog("PLAYER_ADD",`Dodano gracza: ${name}.`); };
  const onUpdatePlayer     = async (player)=>{ await updatePlayer(player); await pushLog("PLAYER_EDIT",`Edytowano gracza: ${player.name}.`); };
  const onDeletePlayer     = async (id)=>{ if(!confirm("Usunąć gracza?")) return; await deletePlayer(id); await pushLog("PLAYER_DELETE",`Usunięto gracza (${id}).`); };

  const onAddPost          = async ({title,body})=>{ await addPost({title,body,author:adminName||"Admin"}); await pushLog("POST_ADD",`Nowy post: ${title}.`); };
  const onDeletePost       = async (id)=>{ if(!confirm("Usunąć post?")) return; await deletePost(id); await pushLog("POST_DELETE",`Usunięto post (${id}).`); };
  const onAddComment       = async (postId,comment)=>{ await addComment(postId,{nick:comment.nick,text:comment.text}); await pushLog("COMMENT_ADD",`Komentarz do posta (${postId}) od ${comment.nick}.`); };
  const onSaveManagerLog   = async (message)=>{
    if(!message || !message.trim()) return;
    await pushLog("CARD_MANAGER", message.trim());
  };

  return (
    <ErrorBoundary>
      <Shell adminName={adminName} onShowLogin={onShowLogin} onLogout={onLogout}>
        {r.view==="home"    && <Home state={state} />}
        {r.view==="tabela"  && <Tabela state={state} />}
        {r.view==="players" && <Players state={state} />}
        {r.view==="player"  && <PlayerPage state={state} id={r.id} />}
        {r.view==="calendar"&& <CalendarPage state={state} />}
        {r.view==="manager" && <CardManager state={state} adminName={adminName} onSaveLog={onSaveManagerLog} />}
        {r.view==="gp"      && <GPPage state={state} id={r.id} />}
        {r.view==="news"    && <NewsPage state={state} />}
        {r.view==="post"    && <PostPage state={state} id={r.id} onAddComment={onAddComment} />}

        {r.view==="admin" && (adminName
          ? <AdminPage
              state={state}
              onAddPlanned={onAddPlanned}
              onAddPlayed={onAddPlayed}
              onEditPlanned={onEditPlanned}
              onDeleteGP={onDeleteGPHandler}
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

      {/* LOGIN MODAL */}
      <LoginModal open={loginOpen} onClose={onCloseLogin} onSuccess={onLoginSuccess} />
    </ErrorBoundary>
  );
}
