import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/index';
import NavBar from './components/layout/NavBar';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
          <NavBar />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;