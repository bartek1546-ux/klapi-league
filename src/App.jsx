import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function App() {
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  // odczyt przy starcie
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(20);
      if (!error) setPosts(data);
    })();
  }, []);

  // zapis
  const addPost = async () => {
    if (!title.trim() || !body.trim()) return;
    const { error } = await supabase
      .from('posts')
      .insert({ title: title.trim(), body: body.trim(), author: 'admin' });
    if (!error) {
      setTitle(''); setBody('');
      // odśwież listę
      const { data } = await supabase
        .from('posts').select('*').order('created_at', { ascending: false }).limit(20);
      setPosts(data || []);
    }
  };

  return (
    <div style={{maxWidth:800,margin:'40px auto',padding:16,fontFamily:'system-ui'}}>
      <h1>Kłapi League × Supabase</h1>
      <div style={{display:'grid',gridTemplateColumns:'1fr 2fr auto',gap:8,margin:'12px 0'}}>
        <input placeholder="Tytuł" value={title} onChange={e=>setTitle(e.target.value)} />
        <input placeholder="Treść" value={body} onChange={e=>setBody(e.target.value)} />
        <button onClick={addPost}>Dodaj post</button>
      </div>
      <ul>
        {posts.map(p=>(
          <li key={p.id}><b>{p.title}</b> — {new Date(p.created_at).toLocaleString()}<br/>{p.body}</li>
        ))}
      </ul>
    </div>
  );
}
