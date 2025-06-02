
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeToggle } from './components/ThemeToggle';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import Dashboard from './pages/Dashboard';
import WorkspaceDetail from './pages/WorkspaceDetail'; 
import BoardDetail from './pages/BoardDetail' 

function App() {

  return (
    <>
      <BrowserRouter>
      <Navbar />
      <main className="pt-16 container mx-auto p-6">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="workspaces/:id" element={<WorkspaceDetail />} />
           <Route path="board/:id" element={<BoardDetail />} />  
          {/* Route pour tout ce qui ne matche pas : page 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      </BrowserRouter>
      
      <ThemeToggle />
    </>
  );
}

export default App;
