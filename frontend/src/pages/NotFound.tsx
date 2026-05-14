import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section style={{ textAlign: 'center', padding: '48px 0' }}>
      <h1 style={{ margin: '0 0 8px', fontSize: 40 }}>404</h1>
      <p className="muted">The page you're looking for isn't here.</p>
      <p>
        <Link to="/" className="btn btn-primary" style={{ marginTop: 12 }}>
          Back to home
        </Link>
      </p>
    </section>
  );
}
