import AppHeader from './components/AppHeader.jsx';
import Home from './pages/Home.jsx';

export default function App() {
  return (
    <div className="app">
      <AppHeader />
      <main className="app-main">
        <Home />
      </main>
    </div>
  );
}
