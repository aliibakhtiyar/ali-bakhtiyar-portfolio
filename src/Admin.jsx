import { useEffect, useState } from 'react';
import { Archive, ArrowLeft, Inbox, LockKeyhole, LogOut, Mail, RefreshCw } from 'lucide-react';
import './admin.css';

class ApiError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}

async function api(path, { method = 'GET', data, signal } = {}) {
  const response = await fetch('/api/admin' + path, {
    method,
    credentials: 'same-origin',
    cache: 'no-store',
    signal,
    headers: data ? { 'Content-Type': 'application/json' } : undefined,
    body: data ? JSON.stringify(data) : undefined,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.ok) throw new ApiError(result.message || 'The inbox service is unavailable.', response.status);
  return result;
}

function Login({ onAuthenticated, initialError }) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialError);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/login', { method: 'POST', data: { password } });
      onAuthenticated();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  return <form className="admin-login" onSubmit={submit}>
    <div className="admin-icon"><LockKeyhole size={23}/></div>
    <h1>Admin sign-in</h1>
    <p>Sign in to view messages from the portfolio.</p>
    <label htmlFor="admin-password">Admin password</label>
    <input id="admin-password" type="password" name="password" autoComplete="current-password"
      required maxLength={512} value={password} onChange={(event) => setPassword(event.target.value)}/>
    {error && <p className="admin-error" role="alert">{error}</p>}
    <button className="button primary" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
  </form>;
}

const formatDate = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

function Message({ item, onToggle, busy }) {
  if (!item) return <section className="admin-reading admin-empty"><Mail size={27}/><p>Select a message to read it here.</p></section>;
  return <article className="admin-reading">
    <div className="admin-message-head">
      <div><h2>{item.subject}</h2><p>{item.name} · <time dateTime={item.receivedAt}>{formatDate.format(new Date(item.receivedAt))}</time></p>
        <a className="text-link" href={'mailto:' + encodeURIComponent(item.email)}>{item.email}</a></div>
      <button className="button secondary" type="button" disabled={busy} onClick={() => onToggle(item)}>{item.isRead ? 'Mark unread' : 'Mark read'}</button>
    </div>
    <p className="admin-message-body">{item.message}</p>
    <a className="button primary" href={'mailto:' + encodeURIComponent(item.email) + '?subject=' + encodeURIComponent('Re: ' + item.subject)}><Mail size={17}/> Reply by email</a>
  </article>;
}

function MessageInbox({ onSignedOut }) {
  const [filter, setFilter] = useState('all');
  const [revision, setRevision] = useState(0);
  const [messages, setMessages] = useState([]);
  const [selected, setSelected] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function query(cursor) {
    const params = new URLSearchParams();
    if (filter === 'unread') params.set('unread', '1');
    if (cursor) params.set('cursor', cursor);
    return '/messages?' + params;
  }

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    api(query(), { signal: controller.signal }).then((result) => {
      if (controller.signal.aborted) return;
      setMessages(result.messages);
      setNextCursor(result.nextCursor);
      setSelected((id) => result.messages.some((entry) => entry.id === id) ? id : null);
    }).catch((failure) => {
      if (controller.signal.aborted) return;
      if (failure.status === 401) onSignedOut();
      else setError(failure.message);
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [filter, revision, onSignedOut]);

  async function attempt(action) {
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (failure) {
      if (failure.status === 401) onSignedOut();
      else setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  function update(item) {
    attempt(async () => {
      const isRead = !item.isRead;
      await api('/messages/' + item.id, { method: 'PATCH', data: { isRead } });
      if (filter === 'unread') {
        setRevision((count) => count + 1);
      } else {
        setMessages((list) => list.map((entry) => entry.id === item.id ? { ...entry, isRead } : entry));
      }
    });
  }

  function more() {
    attempt(async () => {
      const next = await api(query(nextCursor));
      setMessages((list) => [...list, ...next.messages]);
      setNextCursor(next.nextCursor);
    });
  }

  function open(id) {
    setSelected(id);
    if (window.matchMedia('(max-width: 760px)').matches) {
      requestAnimationFrame(() => document.getElementById('admin-message')?.scrollIntoView({ block: 'start' }));
    }
  }

  return <>
    <div className="admin-heading">
      <div><p className="eyebrow">Portfolio admin</p><h1>Message inbox</h1></div>
      <button type="button" className="button secondary" disabled={busy} onClick={() => attempt(async () => {
        await api('/logout', { method: 'POST', data: {} });
        onSignedOut();
      })}><LogOut size={17}/> Sign out</button>
    </div>
    <div className="admin-toolbar">
      <div role="group" aria-label="Filter messages">
        <button type="button" aria-pressed={filter === 'all'} disabled={busy} onClick={() => setFilter('all')}><Inbox size={16}/> All</button>
        <button type="button" aria-pressed={filter === 'unread'} disabled={busy} onClick={() => setFilter('unread')}><Mail size={16}/> Unread</button>
      </div>
      <button type="button" className="button secondary" disabled={loading || busy} onClick={() => setRevision((value) => value + 1)}><RefreshCw size={16}/> Refresh</button>
    </div>
    {error && <p className="admin-error" role="alert">{error}</p>}
    <div className="admin-inbox" aria-busy={loading}>
      <section className="admin-message-list" aria-label="Messages">
        {loading ? <p role="status">Loading messages…</p> : messages.length === 0 ? <div className="admin-empty"><Archive size={25}/><p>{filter === 'unread' ? 'No unread messages.' : 'No messages yet.'}</p></div> :
          <ul>{messages.map((item) => <li key={item.id}>
            <button type="button" onClick={() => open(item.id)} aria-pressed={selected === item.id}>
              <span className="admin-message-from">{item.name}{!item.isRead && <small>Unread</small>}</span>
              <strong>{item.subject}</strong>
              <time dateTime={item.receivedAt}>{formatDate.format(new Date(item.receivedAt))}</time>
            </button>
          </li>)}</ul>}
        {!loading && nextCursor && <button type="button" className="button secondary admin-more" disabled={busy} onClick={more}>Load more messages</button>}
      </section>
      <div id="admin-message"><Message item={messages.find((item) => item.id === selected)} onToggle={update} busy={busy || loading}/></div>
    </div>
  </>;
}

export default function Admin() {
  const [state, setState] = useState('checking');
  const [initialError, setInitialError] = useState('');
  useEffect(() => {
    document.title = 'Portfolio inbox | Ali Bakhtiyar';
    const controller = new AbortController();
    api('/session', { signal: controller.signal }).then(() => setState('authenticated')).catch((error) => {
      if (controller.signal.aborted) return;
      if (error.status !== 401) setInitialError(error.message);
      setState('login');
    });
    return () => controller.abort();
  }, []);

  return <main className="admin-page">
    <a className="admin-back" href="/"><ArrowLeft size={17}/> Back to portfolio</a>
    {state === 'checking' && <p role="status">Checking your session…</p>}
    {state === 'login' && <Login initialError={initialError} onAuthenticated={() => setState('authenticated')}/>}
    {state === 'authenticated' && <MessageInbox onSignedOut={() => setState('login')}/>}
  </main>;
}
