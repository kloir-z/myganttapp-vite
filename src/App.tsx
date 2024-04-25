import { BrowserRouter as Router, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import Gantt from './Gantt';
import SettingsModal from './components/Setting/SettingsModal';
import DummyComp from './DummyComp'; {/* ダミー */ }

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route path="files" element={<DummyComp />} />
          <Route path="settings" element={<SettingsModal />} />
        </Route>
      </Routes>
    </Router>
  );
}

function Layout() {
  const location = useLocation();
  const showGantt = location.pathname !== '/files';

  return (
    <div>
      {showGantt && <Gantt />}
      <Outlet />
    </div>
  );
}

export default App;