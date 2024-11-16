import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TopBar } from './components/layout/TopBar';
import { AuthProvider } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { CompanyCreate } from './pages/CompanyCreate';
import { EmployeeManagement } from './pages/EmployeeManagement';
import { ClientManagement } from './pages/ClientManagement';
import { ProjectManagement } from './pages/ProjectManagement';
import { TimeEntry } from './pages/TimeEntry';
import { Profile } from './pages/Profile';
import { AcceptInvite } from './pages/AcceptInvite';
import { PrivateRoute } from './components/auth/PrivateRoute';
import { RequireRole } from './components/auth/RequireRole';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/accept-invite" element={<AcceptInvite />} />
            <Route
              path="/*"
              element={
                <PrivateRoute>
                  <div className="flex flex-col min-h-screen">
                    <TopBar />
                    <main className="flex-1">
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/time" element={<TimeEntry />} />
                        <Route
                          path="/company/create"
                          element={
                            <RequireRole role="admin">
                              <CompanyCreate />
                            </RequireRole>
                          }
                        />
                        <Route
                          path="/employees"
                          element={
                            <RequireRole role="manager">
                              <EmployeeManagement />
                            </RequireRole>
                          }
                        />
                        <Route
                          path="/clients"
                          element={
                            <RequireRole role="admin">
                              <ClientManagement />
                            </RequireRole>
                          }
                        />
                        <Route
                          path="/projects"
                          element={
                            <RequireRole role="admin">
                              <ProjectManagement />
                            </RequireRole>
                          }
                        />
                      </Routes>
                    </main>
                  </div>
                </PrivateRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}