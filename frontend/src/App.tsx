
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { JobDashboard } from './components/JobDashboard';
import { MouseTrailer } from './components/MouseTrailer';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MouseTrailer />
      <JobDashboard />
    </QueryClientProvider>
  );
}

export default App;
