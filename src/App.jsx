import { useState } from 'react';

export default function App() {
  const [reveal, setReveal] = useState({ x: 50, y: 50 });

  function updateReveal(event) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const point = event.touches?.[0] || event;
    const x = ((point.clientX - bounds.left) / bounds.width) * 100;
    const y = ((point.clientY - bounds.top) / bounds.height) * 100;

    setReveal({
      x: Math.min(100, Math.max(0, x)),
      y: Math.min(100, Math.max(0, y))
    });
  }

  return (
    <main
      className="birthday-post"
      aria-label="Birthday wish for Nirlep"
      onMouseMove={updateReveal}
      onTouchMove={updateReveal}
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
      <img
        className="birthday-photo birthday-photo-top"
        src="/nirlep-cover-photo.jpg"
        alt="Nirlep birthday cover"
        onError={(event) => {
          event.currentTarget.style.display = 'none';
        }}
      />
      <div className="birthday-eraser" aria-hidden="true"></div>
      <div className="birthday-shade" aria-hidden="true"></div>

      <section className="birthday-message">
        <p className="birthday-kicker">BadmintonDaddy Family</p>
        <h1>Wishes Nirlep a Very Happy Birthday</h1>
        <p className="birthday-line">Keep smashing, keep shining, and make this year championship-level.</p>
      </section>
    </main>
  );
}
