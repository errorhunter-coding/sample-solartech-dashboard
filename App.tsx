
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import DeviceManager from './components/DeviceManager';
import FaultDetector from './components/FaultDetector';
import Chatbot from './components/Chatbot';
import MaintenancePlanner from './components/MaintenancePlanner';
import Settings from './components/Settings';
import Onboarding from './components/Onboarding';
import { ViewState, ESP32Device, Technician, AppSettings, MaintenanceTask, TaskPriority } from './types';
import { Menu, Bell } from 'lucide-react';
import { StorageService } from './services/persistence';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.Dashboard);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isOnboardingActive, setIsOnboardingActive] = useState(true);
  
  // Initialize State from Persistence Layer (Mock Backend)
  const [settings, setSettings] = useState<AppSettings>(StorageService.getSettings());
  const [devices, setDevices] = useState<ESP32Device[]>(StorageService.getDevices());
  const [technicians, setTechnicians] = useState<Technician[]>(StorageService.getTechnicians());
  const [tasks, setTasks] = useState<MaintenanceTask[]>(StorageService.getTasks());

  // Persistence Effects (Auto-save to "Backend")
  useEffect(() => {
    StorageService.saveSettings(settings);
    // Apply Dark Mode Side Effect
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  useEffect(() => {
    StorageService.saveDevices(devices);
  }, [devices]);

  useEffect(() => {
    StorageService.saveTechnicians(technicians);
  }, [technicians]);

  useEffect(() => {
    StorageService.saveTasks(tasks);
  }, [tasks]);

  const updateDevice = (updatedDevice: ESP32Device) => {
    setDevices(prev => prev.map(d => d.id === updatedDevice.id ? updatedDevice : d));
  };

  // Calculate pending tasks for header notification
  const pendingTasks = tasks.filter(t => t.status === 'Pending');
  const criticalCount = pendingTasks.filter(t => t.priority === TaskPriority.High || t.priority === TaskPriority.Critical).length;

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const renderView = () => {
    switch (currentView) {
      case ViewState.Dashboard:
        return <Dashboard devices={devices} onViewAll={() => setCurrentView(ViewState.Devices)} />;
      case ViewState.Devices:
        return <DeviceManager devices={devices} />;
      case ViewState.Analysis:
        return <FaultDetector devices={devices} />;
      case ViewState.Assistant:
        return <Chatbot />;
      case ViewState.Maintenance:
        return <MaintenancePlanner 
          devices={devices} 
          technicians={technicians} 
          setTechnicians={setTechnicians} 
          tasks={tasks} 
          setTasks={setTasks} 
        />;
      case ViewState.Settings:
        return <Settings 
          technicians={technicians} 
          setTechnicians={setTechnicians} 
          settings={settings}
          updateSettings={setSettings}
          tasks={tasks}
          setTasks={setTasks}
          devices={devices}
          addDevice={(d) => setDevices([...devices, d])}
          updateDevice={updateDevice}
        />;
      default:
        return <Dashboard devices={devices} onViewAll={() => setCurrentView(ViewState.Devices)} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <Sidebar 
        currentView={currentView} 
        setView={setCurrentView} 
        isMobileMenuOpen={isMobileMenuOpen}
        toggleMobileMenu={toggleMobileMenu}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 md:px-8 z-10 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={toggleMobileMenu} className="md:hidden text-slate-500 hover:text-slate-700 dark:text-slate-400">
              <Menu />
            </button>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white hidden md:block">
              {currentView === ViewState.Dashboard ? 'System Overview' : 
               currentView === ViewState.Devices ? 'IoT Device Management' :
               currentView === ViewState.Analysis ? 'AI Fault Diagnostics' :
               currentView === ViewState.Assistant ? 'SolarBot Assistant' :
               currentView === ViewState.Maintenance ? 'Maintenance Planner' : 'Settings'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            
            {/* Maintenance Alert Bar */}
            {pendingTasks.length > 0 ? (
              <button 
                onClick={() => setCurrentView(ViewState.Maintenance)}
                className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 px-3 py-1.5 rounded-full transition-all hover:bg-amber-100 dark:hover:bg-amber-900/40 group"
              >
                <div className="relative">
                  <Bell size={16} className="text-amber-600 dark:text-amber-400" />
                  {criticalCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
                  )}
                </div>
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase">
                    {criticalCount > 0 ? 'System Alert' : 'Maintenance'}
                  </span>
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400 group-hover:underline">
                    {pendingTasks.length} Task{pendingTasks.length !== 1 ? 's' : ''} Pending
                  </span>
                </div>
                <div className="h-4 w-px bg-amber-200 dark:bg-amber-800 mx-1"></div>
                 <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                    View
                 </span>
              </button>
            ) : null}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {renderView()}
        </main>
      </div>

      <Onboarding isActive={isOnboardingActive} onClose={() => setIsOnboardingActive(false)} />
    </div>
  );
};

export default App;
