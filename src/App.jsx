import { useEffect, useState } from 'react';

const MAX_MEDIA_BYTES = 8 * 1024 * 1024;

async function readJson(response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

export default function App() {
  const [wishes, setWishes] = useState([]);
  const [username, setUsername] = useState('');
  const [wish, setWish] = useState('');
  const [wishStatus, setWishStatus] = useState('');
  const [bursts, setBursts] = useState([]);
  const [media, setMedia] = useState([]);
  const [mediaStatus, setMediaStatus] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    fetch('/api/birthday')
      .then((response) => readJson(response))
      .then((data) => {
        setWishes(Array.isArray(data?.wishes) ? data.wishes : []);
        setMedia(Array.isArray(data?.media) ? data.media : []);
      })
      .catch(() => {
        setWishStatus('Unable to load shared wishes right now.');
        setWishes([]);
        setMedia([]);
      });
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    const cleanUsername = username.trim();
    const cleanWish = wish.trim();
    if (!cleanUsername || !cleanWish) return;

    setWishStatus('');

    try {
      const response = await fetch('/api/wishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUsername, wish: cleanWish })
      });
      const savedWish = await readJson(response);

      if (!response.ok) {
        throw new Error(savedWish?.error || 'Unable to post wish.');
      }

      setWishes((current) => [savedWish, ...current]);
      setUsername('');
      setWish('');
      setWishStatus('Wish posted for everyone.');
    } catch (error) {
      setWishStatus(error.message || 'Unable to post wish.');
    }
  }

  async function handleLike(id) {
    try {
      const response = await fetch(`/api/wishes/${id}/like`, { method: 'POST' });
      const data = await readJson(response);

      if (!response.ok) {
        throw new Error(data?.error || 'Unable to react.');
      }

      setWishes((current) => current.map((item) => (
        item.id === id ? { ...item, likes: data.likes } : item
      )));
      const burstId = `${id}-${Date.now()}`;
      setBursts((current) => [...current, { id: burstId, wishId: id }]);
      window.setTimeout(() => {
        setBursts((current) => current.filter((burst) => burst.id !== burstId));
      }, 900);
    } catch {
      setWishStatus('Reaction could not be saved.');
    }
  }

  function handleMediaUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMediaStatus('Please upload a photo or GIF.');
      event.target.value = '';
      return;
    }

    if (file.size > MAX_MEDIA_BYTES) {
      setMediaStatus('Keep it under 8 MB.');
      event.target.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('media', file);
    setMediaStatus('Uploading...');

    fetch('/api/media', {
      method: 'POST',
      body: formData
    })
      .then((response) => readJson(response).then((data) => ({ response, data })))
      .then(({ response, data }) => {
        if (!response.ok) {
          throw new Error(data?.error || 'Upload failed.');
        }
        setMedia((current) => [data, ...current]);
        setMediaStatus('Saved for everyone.');
      })
      .catch((error) => {
        setMediaStatus(error.message || 'Upload failed. Try a smaller file.');
      })
      .finally(() => {
        event.target.value = '';
      });
  }

  async function removeMedia(id) {
    try {
      const response = await fetch(`/api/media/${id}`, { method: 'DELETE' });
      const data = await readJson(response);

      if (!response.ok) {
        throw new Error(data?.error || 'Unable to remove upload.');
      }

      setMedia((current) => current.filter((item) => item.id !== id));
      setMediaStatus('Removed for everyone.');
    } catch (error) {
      setMediaStatus(error.message || 'Unable to remove upload.');
    }
  }

  return (
    <main className="birthday-post" aria-label="Birthday wish for Nirlep">
      <img
        className="birthday-photo"
        src="/nirlep-birthday-photo.jpg"
        alt="Nirlep birthday celebration"
      />
      <div className="birthday-shade" aria-hidden="true"></div>

      <section className="birthday-message">
        <p className="birthday-kicker">BadmintonDaddy Family</p>
        <h1>Wishes Nirlep a Very Happy Birthday</h1>
        <p className="birthday-line">Keep smashing, keep shining, and make this year championship-level.</p>
      </section>

      <button
        type="button"
        className="wish-panel-toggle"
        onClick={() => setPanelOpen((open) => !open)}
      >
        {panelOpen ? 'Hide wishes' : 'Open wishes'}
      </button>

      <aside className={`wish-board ${panelOpen ? 'open' : ''}`} aria-label="Birthday wishes">
        <div className="wish-board-head">
          <h2>Birthday Board</h2>
          <button type="button" onClick={() => setPanelOpen(false)} aria-label="Close wishes">
            Close
          </button>
        </div>
        <form className="wish-form" onSubmit={handleSubmit}>
          <h2>Birthday Wishes</h2>
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Your username"
            maxLength={24}
            required
          />
          <textarea
            value={wish}
            onChange={(event) => setWish(event.target.value)}
            placeholder="Wish Nirlep happy birthday"
            maxLength={160}
            required
          />
          <button type="submit">Post wish</button>
          {wishStatus && <p className="form-status">{wishStatus}</p>}
        </form>

        <section className="media-uploader" aria-label="Nirlep photo and GIF uploads">
          <div className="media-upload-head">
            <h2>Nirlep Gallery</h2>
            <label className="media-upload-btn">
              Upload
              <input type="file" accept="image/*,.gif" onChange={handleMediaUpload} />
            </label>
          </div>
          {mediaStatus && <p className="media-status">{mediaStatus}</p>}
          {media.length > 0 && (
            <div className="media-grid">
              {media.map((item) => (
                <figure className="media-tile" key={item.id}>
                  <img src={item.src} alt={item.name || 'Uploaded Nirlep memory'} />
                  <button type="button" onClick={() => removeMedia(item.id)} aria-label="Remove upload">
                    Remove
                  </button>
                </figure>
              ))}
            </div>
          )}
        </section>

        <div className="wish-list">
          {wishes.map((item) => (
            <article className="wish-card" key={item.id}>
              <div>
                <strong>@{item.username}</strong>
                <p>{item.wish}</p>
              </div>
              <button type="button" className="wish-like" onClick={() => handleLike(item.id)}>
                <span>React</span>
                <b>{item.likes || 0}</b>
                {bursts
                  .filter((burst) => burst.wishId === item.id)
                  .map((burst) => (
                    <span className="emoji-burst" key={burst.id}>🎉</span>
                  ))}
              </button>
            </article>
          ))}
        </div>
      </aside>
    </main>
  );
}
