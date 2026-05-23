import { useEffect, useRef, useState } from 'react';

const ERASE_KEY = 'nirlepBirthday:erasedCover';
const WISHES_KEY = 'nirlepBirthday:wishes';
const LIKES_KEY = 'nirlepBirthday:likes';
const ERASER_SIZE = 150;

function readStoredJson(key, fallback) {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const canvasRef = useRef(null);
  const coverImageRef = useRef(null);
  const saveTimerRef = useRef(null);
  const [reveal, setReveal] = useState({ x: 50, y: 50 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [wishes, setWishes] = useState([]);
  const [likes, setLikes] = useState({});
  const [username, setUsername] = useState('');
  const [wish, setWish] = useState('');
  const [bursts, setBursts] = useState([]);

  useEffect(() => {
    const storedWishes = readStoredJson(WISHES_KEY, null);
    const storedLikes = readStoredJson(LIKES_KEY, {});

    setLikes(storedLikes);

    if (storedWishes) {
      setWishes(storedWishes);
      return;
    }

    fetch('/birthday-wishes.json')
      .then((response) => response.json())
      .then((data) => {
        const seedWishes = Array.isArray(data?.wishes) ? data.wishes : [];
        setWishes(seedWishes);
      })
      .catch(() => {
        setWishes([]);
      });
  }, []);

  useEffect(() => {
    if (wishes.length > 0) {
      window.localStorage.setItem(WISHES_KEY, JSON.stringify(wishes));
    }
  }, [wishes]);

  useEffect(() => {
    window.localStorage.setItem(LIKES_KEY, JSON.stringify(likes));
  }, [likes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = '/nirlep-cover-photo.jpg';
    coverImageRef.current = image;

    function drawCover() {
      if (!canvas || !coverImageRef.current?.complete) return;

      const context = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(rect.width * ratio));
      canvas.height = Math.max(1, Math.floor(rect.height * ratio));
      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      const storedCanvas = window.localStorage.getItem(ERASE_KEY);
      if (storedCanvas) {
        const saved = new Image();
        saved.onload = () => {
          context.clearRect(0, 0, rect.width, rect.height);
          context.drawImage(saved, 0, 0, rect.width, rect.height);
        };
        saved.src = storedCanvas;
        return;
      }

      const scale = Math.max(rect.width / image.naturalWidth, rect.height / image.naturalHeight);
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;
      const x = (rect.width - width) / 2;
      const y = (rect.height - height) / 2;

      context.clearRect(0, 0, rect.width, rect.height);
      context.drawImage(image, x, y, width, height);
    }

    image.onload = drawCover;
    image.onerror = () => {
      const context = canvas?.getContext('2d');
      if (context) context.clearRect(0, 0, canvas.width, canvas.height);
    };

    window.addEventListener('resize', drawCover);
    return () => {
      window.removeEventListener('resize', drawCover);
      window.clearTimeout(saveTimerRef.current);
    };
  }, []);

  function saveCanvasSoon() {
    window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      window.localStorage.setItem(ERASE_KEY, canvas.toDataURL('image/png'));
    }, 180);
  }

  function eraseAt(event) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const bounds = canvas.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    const xPercent = (x / bounds.width) * 100;
    const yPercent = (y / bounds.height) * 100;
    const context = canvas.getContext('2d');

    setReveal({
      x: Math.min(100, Math.max(0, xPercent)),
      y: Math.min(100, Math.max(0, yPercent))
    });

    context.save();
    context.globalCompositeOperation = 'destination-out';
    context.beginPath();
    context.arc(x, y, ERASER_SIZE, 0, Math.PI * 2);
    context.fill();
    context.restore();
    saveCanvasSoon();
  }

  function handlePointerMove(event) {
    if (event.target.closest('.wish-board')) return;
    eraseAt(event);
  }

  function handleSubmit(event) {
    event.preventDefault();
    const cleanUsername = username.trim();
    const cleanWish = wish.trim();
    if (!cleanUsername || !cleanWish) return;

    setWishes((current) => [
      {
        id: `wish-${Date.now()}`,
        username: cleanUsername,
        wish: cleanWish,
        createdAt: new Date().toISOString()
      },
      ...current
    ]);
    setUsername('');
    setWish('');
  }

  function handleLike(id) {
    setLikes((current) => ({ ...current, [id]: (current[id] || 0) + 1 }));
    const burstId = `${id}-${Date.now()}`;
    setBursts((current) => [...current, { id: burstId, wishId: id }]);
    window.setTimeout(() => {
      setBursts((current) => current.filter((burst) => burst.id !== burstId));
    }, 900);
  }

  return (
    <main
      className="birthday-post"
      aria-label="Birthday wish for Nirlep"
      onPointerDown={(event) => {
        if (event.target.closest('.wish-board')) return;
        setIsDrawing(true);
        eraseAt(event);
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={() => setIsDrawing(false)}
      onPointerLeave={() => setIsDrawing(false)}
      style={{
        '--reveal-x': `${reveal.x}%`,
        '--reveal-y': `${reveal.y}%`
      }}
    >
      <img
        className="birthday-photo birthday-photo-bottom"
        src="/nirlep-birthday-photo.jpg"
        alt="Nirlep birthday reveal"
      />
      <canvas ref={canvasRef} className="birthday-cover-canvas" aria-hidden="true" />
      <div className={`birthday-eraser ${isDrawing ? 'active' : ''}`} aria-hidden="true"></div>
      <div className="birthday-shade" aria-hidden="true"></div>

      <section className="birthday-message">
        <p className="birthday-kicker">BadmintonDaddy Family</p>
        <h1>Wishes Nirlep a Very Happy Birthday</h1>
        <p className="birthday-line">Keep smashing, keep shining, and make this year championship-level.</p>
      </section>

      <aside className="wish-board" aria-label="Birthday wishes">
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
        </form>

        <div className="wish-list">
          {wishes.map((item) => (
            <article className="wish-card" key={item.id}>
              <div>
                <strong>@{item.username}</strong>
                <p>{item.wish}</p>
              </div>
              <button type="button" className="wish-like" onClick={() => handleLike(item.id)}>
                <span>React</span>
                <b>{likes[item.id] || 0}</b>
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
