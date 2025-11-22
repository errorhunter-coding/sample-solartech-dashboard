
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import DeviceManager from './components/DeviceManager';
import FaultDetector from './components/FaultDetector';
import Chatbot from './components/Chatbot';
import MaintenancePlanner from './components/MaintenancePlanner';
import Settings from './components/Settings';
import Onboarding from './components/Onboarding';
import { ViewState, ESP32Device, DeviceStatus, Technician, AppSettings, MaintenanceTask, TaskPriority } from './types';
import { Menu, Bell } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.Dashboard);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isOnboardingActive, setIsOnboardingActive] = useState(true);
  
  // Global App Settings
  const [settings, setSettings] = useState<AppSettings>({
    language: 'English (US)',
    darkMode: false,
    notifications: {
      email: true,
      push: true,
      critical: true,
      weeklyReport: false
    }
  });

  // Handle Dark Mode Side Effect
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);
  
  // Mock History Data Helpers
  const mockHistoryNormal = [
    { time: '10:00', power: 45 }, { time: '10:15', power: 48 }, { time: '10:30', power: 50 }, { time: '10:45', power: 52 }, { time: '11:00', power: 53 }
  ];
  const mockHistoryLow = [
    { time: '10:00', power: 30 }, { time: '10:15', power: 28 }, { time: '10:30', power: 25 }, { time: '10:45', power: 20 }, { time: '11:00', power: 18 }
  ];
  const mockHistoryOffline = [
    { time: '10:00', power: 0 }, { time: '10:15', power: 0 }, { time: '10:30', power: 0 }, { time: '10:45', power: 0 }, { time: '11:00', power: 0 }
  ];

  // State for devices to be shared across Dashboard and DeviceManager
  const [devices, setDevices] = useState<ESP32Device[]>([
    { 
      id: 'esp32-001', 
      name: 'Panel Array A1', 
      location: 'San Francisco, CA', 
      status: DeviceStatus.Online, 
      voltage: 24.2, 
      current: 8.5, 
      power: 205, 
      temperature: 42, 
      lastUpdated: new Date(), 
      group: 'Main Roof',
      panels: [
        { id: 'P1', group: 'String A', power: 52, efficiency: 98, status: 'Normal', history: mockHistoryNormal },
        { id: 'P2', group: 'String A', power: 51, efficiency: 97, status: 'Normal', history: mockHistoryNormal.map(h => ({...h, power: h.power - 1})) },
        { id: 'P3', group: 'String B', power: 50, efficiency: 96, status: 'Normal', history: mockHistoryNormal.map(h => ({...h, power: h.power - 2})) },
        { id: 'P4', group: 'String B', power: 52, efficiency: 99, status: 'Normal', history: mockHistoryNormal }
      ]
    },
    { 
      id: 'esp32-002', 
      name: 'Panel Array A2', 
      location: 'San Francisco, CA', 
      status: DeviceStatus.Online, 
      voltage: 24.1, 
      current: 8.2, 
      power: 198, 
      temperature: 43, 
      lastUpdated: new Date(), 
      group: 'Main Roof',
      panels: [
        { id: 'P1', group: 'String A', power: 49, efficiency: 94, status: 'Normal', history: mockHistoryNormal.map(h => ({...h, power: h.power - 3})) },
        { id: 'P2', group: 'String A', power: 50, efficiency: 95, status: 'Normal', history: mockHistoryNormal.map(h => ({...h, power: h.power - 2})) },
        { id: 'P3', group: 'String A', power: 49, efficiency: 94, status: 'Normal', history: mockHistoryNormal.map(h => ({...h, power: h.power - 3})) },
        { id: 'P4', group: 'String A', power: 50, efficiency: 95, status: 'Normal', history: mockHistoryNormal.map(h => ({...h, power: h.power - 2})) }
      ]
    },
    { 
      id: 'esp32-003', 
      name: 'Panel Array B1', 
      location: 'London, UK', 
      status: DeviceStatus.Warning, 
      voltage: 22.5, 
      current: 6.1, 
      power: 137, 
      temperature: 55, 
      lastUpdated: new Date(), 
      group: 'Garden',
      panels: [
        { id: 'P1', group: 'West String', power: 45, efficiency: 85, status: 'Low Efficiency', history: mockHistoryLow },
        { id: 'P2', group: 'West String', power: 30, efficiency: 60, status: 'Low Efficiency', history: mockHistoryLow.map(h => ({...h, power: h.power - 10})) },
        { id: 'P3', group: 'East String', power: 48, efficiency: 92, status: 'Normal', history: mockHistoryNormal.map(h => ({...h, power: h.power - 4})) },
        { id: 'P4', group: 'East String', power: 14, efficiency: 30, status: 'Low Efficiency', history: mockHistoryLow.map(h => ({...h, power: h.power - 20})) }
      ]
    },
    { 
      id: 'esp32-004', 
      name: 'Panel Array B2', 
      location: 'London, UK', 
      status: DeviceStatus.Offline, 
      voltage: 0, 
      current: 0, 
      power: 0, 
      temperature: 20, 
      lastUpdated: new Date(), 
      group: 'Garden',
      panels: [
        { id: 'P1', group: 'String 1', power: 0, efficiency: 0, status: 'Offline', history: mockHistoryOffline },
        { id: 'P2', group: 'String 1', power: 0, efficiency: 0, status: 'Offline', history: mockHistoryOffline },
        { id: 'P3', group: 'String 1', power: 0, efficiency: 0, status: 'Offline', history: mockHistoryOffline },
        { id: 'P4', group: 'String 1', power: 0, efficiency: 0, status: 'Offline', history: mockHistoryOffline }
      ]
    },
  ]);

  const updateDevice = (updatedDevice: ESP32Device) => {
    setDevices(prev => prev.map(d => d.id === updatedDevice.id ? updatedDevice : d));
  };

  // Shared Technicians State
  const [technicians, setTechnicians] = useState<Technician[]>([
    { id: 't1', name: 'Sarah Jenkins', role: 'Senior Electrician', status: 'Available', initials: 'SJ' },
    { id: 't2', name: 'Mike Ross', role: 'Panel Specialist', status: 'Busy', initials: 'MR' },
    { id: 't3', name: 'Alex Thompson', role: 'Maintenance Tech', status: 'Available', initials: 'AT' },
  ]);

  // Shared Maintenance Tasks State
  const [tasks, setTasks] = useState<MaintenanceTask[]>([
    {
      id: 'm1',
      title: 'Quarterly Inverter Inspection',
      location: 'Main Control Room',
      priority: TaskPriority.Medium,
      status: 'Pending',
      date: '2025-03-25',
      aiInsight: 'Scheduled preventative maintenance based on 3-month cycle.',
      logs: [
        { id: 'l1', timestamp: new Date('2025-03-20T09:00:00'), message: 'Task automatically generated by System.', author: 'System', type: 'system' }
      ]
    },
    {
      id: 'm2',
      title: 'Clear Debris from East Array',
      location: 'East Wing Roof',
      priority: TaskPriority.Low,
      status: 'Completed',
      assignedTechId: 't3',
      date: '2025-03-20',
      aiInsight: 'Visual analysis detected 15% soiling coverage.',
      logs: [
        { id: 'l2', timestamp: new Date('2025-03-19T14:20:00'), message: 'Fault detected by drone surveillance.', author: 'System', type: 'system' },
        { id: 'l3', timestamp: new Date('2025-03-20T10:15:00'), message: 'Assigned to Alex Thompson.', author: 'System', type: 'system' },
        { id: 'l4', timestamp: new Date('2025-03-20T11:30:00'), message: 'Cleared branches and leaves. Efficiency restored.', author: 'Alex Thompson', type: 'user' }
      ]
    }
  ]);

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
        return <FaultDetector />;
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
            ) : (
              // Placeholder to keep alignment if you wanted consistent layout, but strictly following design:
              // If no tasks, maybe just show the empty space or a clean status.
              // The user previously asked to align notification. If empty, we don't show it.
              null
            )}
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
