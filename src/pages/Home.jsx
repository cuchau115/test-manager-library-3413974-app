export default function Home() {
  return (
    <section>
      <h2>Panel de la biblioteca</h2>
      <p>
        Base del frontend React 18 + Vite. Consume la API REST en{' '}
        <code>{import.meta.env.VITE_API_URL}</code>.
      </p>
    </section>
  );
}
