import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import CandidatesPage from './pages/CandidatesPage';
import CandidateFormPage from './pages/CandidateFormPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/candidates" replace />} />
        <Route path="/candidates" element={<CandidatesPage />} />
        <Route path="/register" element={<CandidateFormPage />} />
        <Route path="/candidates/:id/edit" element={<CandidateFormPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
