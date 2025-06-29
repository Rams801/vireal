
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Home, Search, PlusSquare, Heart, MessageCircle, User, Film, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Explore', path: '/explore' },
    { icon: PlusSquare, label: 'Create', path: '/create' },
    { icon: Film, label: 'Reels', path: '/reels' },
    { icon: Heart, label: 'Notifications', path: '/notifications' },
    { icon: MessageCircle, label: 'Messages', path: '/messages' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="flex">
        {/* Sidebar */}
        <div className="fixed left-0 top-0 h-full w-64 bg-slate-800/90 backdrop-blur-sm border-r border-purple-500/20 p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">Social</h1>
          </div>
          
          <nav className="space-y-2">
            {navItems.map((item) => (
              <Button
                key={item.path}
                variant={location.pathname === item.path ? "default" : "ghost"}
                className={`w-full justify-start text-left ${
                  location.pathname === item.path 
                    ? 'bg-purple-600 hover:bg-purple-700' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
                onClick={() => navigate(item.path)}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.label}
              </Button>
            ))}
            
            <Button
              variant="ghost"
              className="w-full justify-start text-left text-slate-300 hover:text-white hover:bg-slate-700 mt-8"
              onClick={handleSignOut}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign Out
            </Button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="ml-64 flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
