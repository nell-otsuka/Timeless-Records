import { Navigate, Route, Routes } from 'react-router';
import { TrackerDataProvider } from '@/context/TrackerDataContext';
import { MovieTrackerPage } from '@/pages/MovieTrackerPage';
import { PlannerPage } from '@/pages/PlannerPage';
import { TicketsPage } from '@/pages/TicketsPage';

export function App() {
  return (
    <TrackerDataProvider>
      <Routes>
        <Route path="/" element={<MovieTrackerPage />} />
        <Route path="/planner" element={<PlannerPage />} />
        <Route path="/tickets" element={<TicketsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </TrackerDataProvider>
  );
}
