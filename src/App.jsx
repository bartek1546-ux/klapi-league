import { useEffect, useState } from "react";
import {
  subPosts, addPost,
  subPlayers, addPlayer,
  subEvents, addEvent,
  subResultsByEvent, addResult
} from "./db";

export default function App() {
  // POSTS
  const [posts, setPosts] = useState([]);
  const [pTitle, setPTitle] = useState("");
  const [pBody, setPBody] = useState("");

  // PLAYERS
  const [players, setPlayers] = useState([]);
  const [nick, setNick] = useState("");

  // EVENTS
  const [events, setEvents] = useState([]);
  const [evTitle, setEvTitle] = useState("");
  const [evDate, setEvDate] = useState(() => new Date().toISOString().slice(0,16));
  const [evLoc, setEvLoc] = useState("");
  const [activeEvent, setActiveEvent] = useState("");

  // RESULTS
  const [results, setResults] = useState([]);
  const [who, setWho] = useState("");
  const [pts, setPts] = useState(0);

  // realtime subskrypcje
  useEffect(() => {
    const u1 = subPosts(setPosts);
    const u2 = subPlayers(setPlayers);
    const u3 = subEvents((ev) => {
      setEvents(ev);
      if (!activeEvent && ev[0]) setActiveEvent(ev[0].id);
    });
    let u4 = () => {};
    if (activeEvent) u4 = subResultsByEvent(activeEvent, setResults);
    return () => { u1(); u2(); u3(); u4(); };
  }, [activeEvent]);

  return (
    <div style={{maxWidth:980,margin:"40px auto",padding:16,fontFamily:"system-ui"}}>
      <h1>Kłapi League × Firebase ✅</h1>

      {/* POSTS */}
      <section style={card}>
        <h2>Aktualności</h2>
        <div style={row}>
          <input style={inp} placeholder="Tytuł"
                 value={pTitle} onChange={e=>setPTitle(e.target.value)} />
          <input style={inp} placeholder="Treść"
                 value={pBody} onChange={e=>setPBody(e.target.value)} />
          <button style={btn} onClick={()=>pTitle&&pBody&&addPost({title:pTitle,body:pBody}).then(()=>{setPTitle("");setPBody("");})}>
            Dodaj
          </button>
        </div>
        <ul>{posts.map(p=>(<li key={p.id}><b>{p.title}</b> — {p.body}</li>))}</ul>
      </section>

      {/* PLAYERS */}
      <section style={card}>
        <h2>Gracze</h2>
        <div style={row}>
          <input style={inp} placeholder="Nick"
                 value={nick} onChange={e=>setNick(e.target.value)} />
          <button style={btn} onClick={()=>nick&&addPlayer({nickname:nick}).then(()=>setNick(""))}>
            Dodaj gracza
          </button>
        </div>
        <ul>{players.map(p=>(<li key={p.id}>{p.nickname}</li>))}</ul>
      </section>

      {/* EVENTS */}
      <section style={card}>
        <h2>Grand Prix</h2>
        <div style={row}>
          <input style={inp} placeholder="Tytuł GP"
                 value={evTitle} onChange={e=>setEvTitle(e.target.value)} />
          <input style={inp} type="datetime-local"
                 value={evDate} onChange={e=>setEvDate(e.target.value)} />
          <input style={inp} placeholder="Lokalizacja"
                 value={evLoc} onChange={e=>setEvLoc(e.target.value)} />
          <button style={btn} onClick={()=>evTitle&&addEvent({title:evTitle,event_date:new Date(evDate).toISOString(),location:evLoc}).then(()=>{setEvTitle("");setEvLoc("");})}>
            Dodaj GP
          </button>
        </div>
        <select style={inp} value={activeEvent} onChange={e=>setActiveEvent(e.target.value)}>
          <option value="">— wybierz GP —</option>
          {events.map(e=><option key={e.id} value={e.id}>{e.title}</option>)}
        </select>
      </section>

      {/* RESULTS */}
      <section style={card}>
        <h2>Wyniki {activeEvent && `— ${events.find(e=>e.id===activeEvent)?.title||""}`}</h2>
        <div style={row}>
          <select style={inp} value={who} onChange={e=>setWho(e.target.value)}>
            <option value="">— gracz —</option>
            {players.map(p=><option key={p.id} value={p.id}>{p.nickname}</option>)}
          </select>
          <input style={inp} type="number" value={pts} onChange={e=>setPts(e.target.value)} />
          <button style={btn} onClick={()=>activeEvent&&who&&addResult({event_id:activeEvent,player_id:who,points:pts}).then(()=>setPts(0))}>
            Dodaj wynik
          </button>
        </div>
        <ol>{results.map(r=>(<li key={r.id}>
          {players.find(p=>p.id===r.player_id)?.nickname || r.player_id} — <b>{r.points}</b> pkt
        </li>))}</ol>
      </section>
    </div>
  );
}

const card={background:"#111",color:"#eee",padding:16,borderRadius:12,margin:"16px 0",border:"1px solid #333"};
const row ={display:"grid",gridTemplateColumns:"1fr 1fr 1fr auto",gap:8,margin:"8px 0"};
const inp ={padding:"8px 10px",borderRadius:8,border:"1px solid #333",background:"#1b1b1b",color:"#fff"};
const btn ={padding:"8px 12px",borderRadius:8,border:"1px solid #555",background:"#242424",color:"#fff",cursor:"pointer"};
