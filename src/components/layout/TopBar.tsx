import { LogOut, Menu, User, Users, Building, FolderGit2, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useRBAC } from '@/hooks/useRBAC';

export function TopBar() {
  const { signOut, user } = useAuth();
  const { isManager, isAdmin } = useRBAC();

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Menu className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">BusinessOS</span>
            </div>
            <nav className="hidden sm:ml-6 sm:flex sm:space-x-4">
              <Link
                to="/"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900"
              >
                Dashboard
              </Link>
              <Link
                to="/time"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900"
              >
                <Clock className="h-4 w-4 mr-1" />
                Time Entry
              </Link>
              {isManager && (
                <Link
                  to="/employees"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900"
                >
                  <Users className="h-4 w-4 mr-1" />
                  Employees
                </Link>
              )}
              {isAdmin && (
                <>
                  <Link
                    to="/clients"
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900"
                  >
                    <Building className="h-4 w-4 mr-1" />
                    Clients
                  </Link>
                  <Link
                    to="/projects"
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900"
                  >
                    <FolderGit2 className="h-4 w-4 mr-1" />
                    Projects
                  </Link>
                </>
              )}
            </nav>
          </div>
          
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link to="/profile">
                <Button
                  variant="ghost"
                  className="flex items-center"
                >
                  <User className="h-5 w-5 mr-2" />
                  <span>{user?.email}</span>
                </Button>
              </Link>
            </div>
            <div className="ml-4">
              <Button
                variant="ghost"
                onClick={signOut}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}