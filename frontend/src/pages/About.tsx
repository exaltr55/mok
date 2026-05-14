export default function About() {
  return (
    <section className="mok-prose">
      <p className="mok-hero-eyebrow">About Mokshly</p>
      <h1 className="mok-section-title" style={{ fontSize: 36 }}>
        Technology in service of human flourishing.
      </h1>
      <p className="mok-muted" style={{ fontSize: 17 }}>
        Mokshly creates a new category — <strong>Human Elevation</strong> — the
        work of developing the foundational human capacities that determine how
        a person operates in the world.
      </p>

      <h2>What we believe</h2>
      <p>
        Companies are spending billions on AI tools and underinvesting in the
        humans who must work alongside them. The wellness category was not
        built to address it. Mokshly is.
      </p>

      <h2>The system</h2>
      <p>
        Two pillars: the <strong>5S Framework</strong> (Source, Seed, Soil,
        Seasons, Sowing) gives you the philosophy. The{' '}
        <strong>7 Practices</strong> (Breathing, Thinking, Talking, Writing,
        Moving, Resetting, Aligning) give you the daily living. Together they
        develop foundational human capacities over years, not minutes.
      </p>

      <h2>What makes it different</h2>
      <ul style={{ paddingLeft: 18, lineHeight: 1.8 }}>
        <li><strong>Awareness-first, not completion-driven.</strong> No checklist of seven practices.</li>
        <li><strong>Anti-engagement design.</strong> Every feature has a built-in ceiling.</li>
        <li><strong>Self-competition only.</strong> No leaderboards. Your MCI is yours alone.</li>
        <li><strong>Cohort intimacy over community scale.</strong> 5 members, 15 minutes a week.</li>
        <li><strong>Privacy as a product feature.</strong> Tenants see only aggregate signals.</li>
        <li><strong>Return-friendly.</strong> Absence is expected. No catch-up pressure.</li>
      </ul>
    </section>
  );
}
