import { Routes, Route, Navigate } from 'react-router-dom';
import WorkerApp from './apps/worker/WorkerApp';
import ManagerApp from './apps/manager/ManagerApp';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/worker" replace />} />
      <Route path="/worker/*" element={<WorkerApp />} />
      <Route path="/manager/*" element={<ManagerApp />} />
      <Route path="*" element={<Navigate to="/worker" replace />} />
    </Routes>
  );
}

export default App;
