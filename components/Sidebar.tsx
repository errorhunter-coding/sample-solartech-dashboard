import React from 'react';
import { ViewState } from '../types';
import { 
  LayoutDashboard, 
  Cpu, 
  ScanEye, 
  Bot, 
  Settings, 
  Wrench,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, isMobileMenuOpen, toggleMobileMenu }) => {
  
  const navItems = [
    { id: ViewState.Dashboard, icon: LayoutDashboard, label: 'Dashboard' },
    { id: ViewState.Devices, icon: Cpu, label: 'IoT Devices' },
    { id: ViewState.Analysis, icon: ScanEye, label: 'AI Fault Detector' },
    { id: ViewState.Assistant, icon: Bot, label: 'SolarBot AI' },
    { id: ViewState.Maintenance, icon: Wrench, label: 'Maintenance' },
    { id: ViewState.Settings, icon: Settings, label: 'Settings' },
  ];

  const handleNavClick = (view: ViewState) => {
    setView(view);
    if (window.innerWidth < 768) {
      toggleMobileMenu();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Sidebar with Acrylic White Effect */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-30 w-64 
        bg-white/80 backdrop-blur-xl border-r border-white/50 shadow-xl md:shadow-none
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 flex flex-col
      `}>
        <div className="p-6 border-b border-slate-100/50 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-200">
             <span className="text-white font-bold text-xl">S</span>
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-lg tracking-tight">SolarTech</h1>
            <p className="text-xs text-slate-500 font-medium">Pro Monitor v2.0</p>
          </div>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              id={`nav-${item.id.toLowerCase()}`}
              onClick={() => handleNavClick(item.id)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                ${currentView === item.id 
                  ? 'bg-white/60 text-primary-700 shadow-sm ring-1 ring-primary-100 backdrop-blur-sm' 
                  : 'text-slate-600 hover:bg-white/40 hover:text-slate-900'}
              `}
            >
              <item.icon className={`w-5 h-5 ${currentView === item.id ? 'text-primary-500' : 'text-slate-400'}`} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100/50">
          <div className="bg-slate-900 rounded-xl p-4 mb-4 relative overflow-hidden group cursor-pointer shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-primary-700 opacity-10 group-hover:opacity-20 transition-opacity"></div>
            <div className="relative z-10">
              <p className="text-xs text-primary-400 font-bold uppercase mb-1">Environment</p>
              <p className="text-white text-sm font-semibold">240kg CO₂ Saved</p>
              <p className="text-slate-400 text-xs mt-1">≈ 12 Trees Planted 🌳</p>
            </div>
          </div>
          <button className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-500 hover:text-red-500 transition-colors">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;