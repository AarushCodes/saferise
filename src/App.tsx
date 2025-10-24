import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './shared/hooks/useAuth';
import WorkerApp from './apps/worker/WorkerApp';
import ManagerApp from './apps/manager/ManagerApp';
import ContractorApp from './apps/contractor/ContractorApp';
import SelectPortal from './SelectPortal';

function App() {
  return (
    <Routes>
      <Route path="/" element={<SelectPortal />} />
      <Route path="/worker/*" element={<WorkerApp />} />
      <Route path="/manager/*" element={<ManagerApp />} />
      <Route path="/contractor/*" element={<ContractorApp />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
