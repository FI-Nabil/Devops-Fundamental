import { useEffect, useState } from 'react';
import './App.css';

const API_BASE = 'http://localhost:5000';

function App() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/notes`);
      if (!res.ok) throw new Error('Failed to load notes');
      const data = await res.json();
      setNotes(data);
    } catch (err) {
      setError('Could not load notes. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });
      if (!res.ok) throw new Error('Failed to create note');
      const newNote = await res.json();
      setNotes((prev) => [newNote, ...prev]);
      setTitle('');
      setContent('');
    } catch (err) {
      setError('Could not create note.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    setError('');
    try {
      const res = await fetch(`${API_BASE}/notes/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete note');
      setNotes((prev) => prev.filter((note) => note.id !== id));
    } catch (err) {
      setError('Could not delete note.');
    }
  }

  return (
    <div className="app">
      <h1>Notes</h1>

      <form className="note-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          placeholder="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
        />
        <button type="submit" disabled={submitting}>
          {submitting ? 'Adding...' : 'Add Note'}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p>Loading notes...</p>
      ) : notes.length === 0 ? (
        <p>No notes yet. Add one above.</p>
      ) : (
        <ul className="note-list">
          {notes.map((note) => (
            <li key={note.id} className="note-item">
              <div>
                <h3>{note.title}</h3>
                {note.content && <p>{note.content}</p>}
              </div>
              <button
                className="delete-btn"
                onClick={() => handleDelete(note.id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
