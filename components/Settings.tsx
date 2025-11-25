
import React, { useState } from 'react';
import { 
  Bell, 
  Shield, 
  Users, 
  Globe, 
  Moon, 
  Smartphone, 
  Mail, 
  Trash2,
  Plus,
  Save,
  Check,
  Briefcase,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  ListChecks,
  Cpu,
  Server,
  QrCode,
  X,
  Link,
  Key,
  Terminal,
  Copy,
  MapPin,
  LayoutGrid,
  Layers,
  Edit3,
  Zap,
  WifiOff,
  CalendarDays,
  List
} from 'lucide-react';
import { Technician, AppSettings, MaintenanceTask, ESP32Device, DeviceStatus, PanelData, TaskPriority } from '../types';

interface SettingsProps {
  technicians: Technician[];
  setTechnicians: React.Dispatch<React.SetStateAction<Technician[]>>;
  settings: AppSettings;
  updateSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  tasks: MaintenanceTask[];
  setTasks: React.Dispatch<React.SetStateAction<MaintenanceTask[]>>;
  devices: ESP32Device[];
  addDevice: (device: ESP32Device) => void;
  updateDevice: (device: ESP32Device) => void;
}

const Settings: React.FC<SettingsProps> = ({ technicians, setTechnicians, settings, updateSettings, tasks, setTasks, devices, addDevice, updateDevice }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'team' | 'devices'>('general');
  const [isSaved, setIsSaved] = useState(false);
  
  // Local state for form inputs (Team)
  const [newTechName, setNewTechName] = useState('');
  const [newTechRole, setNewTechRole] = useState('Maintenance Tech');
  const [expandedTechId, setExpandedTechId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  // Calendar Task Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState<{
    techId: string;
    date: string;
    title: string;
    priority: TaskPriority;
  }>({
    techId: '',
    date: '',
    title: '',
    priority: TaskPriority.Medium
  });

  // --- Device Management State ---
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [editingDevice, setEditingDevice] = useState<ESP32Device | null>(null);
  
  // New Device Form
  const [newDeviceForm, setNewDeviceForm] = useState<Partial<ESP32Device>>({
    name: '',
    location: '',
    group: 'Default Array'
  });
  const [panelCount, setPanelCount] = useState<number>(4);
  const [panelsPerString, setPanelsPerString] = useState<number>(10);
  const [generateCredentials, setGenerateCredentials] = useState(true);
  const [provisioningData, setProvisioningData] = useState<{
    id: string;
    endpoint: string;
    apiKey: string;
  } | null>(null);

  // --- Actions ---

  const handleAddTechnician = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTechName.trim()) return;

    const newTech: Technician = {
      id: `t-${Date.now()}`,
      name: newTechName,
      role: newTechRole,
      status: 'Available',
      initials: newTechName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    };

    setTechnicians([...technicians, newTech]);
    setNewTechName('');
  };

  const handleRemoveTechnician = (id: string) => {
    if (confirm('Are you sure you want to remove this technician?')) {
      setTechnicians(technicians.filter(t => t.id !== id));
    }
  };

  const handleUpdateStatus = (id: string, status: 'Available' | 'Busy' | 'On Leave') => {
    setTechnicians(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  };

  const handleUpdateRole = (id: string, role: string) => {
    setTechnicians(prev => prev.map(t => t.id === id ? { ...t, role } : t));
  };

  const toggleNotification = (key: keyof AppSettings['notifications']) => {
    updateSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key]
      }
    }));
  };

  const allNotificationsEnabled = Object.values(settings.notifications).every(Boolean);

  const toggleAllNotifications = () => {
    const newState = !allNotificationsEnabled;
    updateSettings(prev => ({
      ...prev,
      notifications: {
        email: newState,
        push: newState,
        critical: newState,
        weeklyReport: newState
      }
    }));
  };

  const toggleDarkMode = () => {
    updateSettings(prev => ({ ...prev, darkMode: !prev.darkMode }));
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateSettings(prev => ({ ...prev, language: e.target.value }));
  };

  const handleSave = () => {
    // In a real app, this would trigger an API call. 
    // Since state is already lifted to App.tsx, it's "saved" locally.
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  // --- Calendar Logic ---
  const getNextDays = (days = 7) => {
    const dates = [];
    const today = new Date();
    // Start from today
    for (let i = 0; i < days; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        dates.push(d);
    }
    return dates;
  };
  const calendarDays = getNextDays(7);

  const handleOpenAddTask = (techId: string, date: string) => {
    setTaskForm({
      techId,
      date,
      title: '',
      priority: TaskPriority.Medium
    });
    setIsTaskModalOpen(true);
  };

  const handleSubmitTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;

    const newTask: MaintenanceTask = {
      id: `mt-cal-${Date.now()}`,
      title: taskForm.title,
      priority: taskForm.priority,
      status: 'Assigned',
      assignedTechId: taskForm.techId,
      date: taskForm.date,
      location: 'General Site',
      aiInsight: 'Scheduled manually via Team Calendar',
      logs: [{
        id: `l-${Date.now()}`,
        timestamp: new Date(),
        message: 'Task assigned via Calendar View',
        author: 'Admin',
        type: 'user'
      }]
    };

    setTasks(prev => [...prev, newTask]);
    setIsTaskModalOpen(false);
  };

  // --- Device Actions ---

  const resetRegModal = () => {
    setIsRegModalOpen(false);
    setIsScanning(false);
    setProvisioningData(null);
    setNewDeviceForm({ name: '', location: '', group: 'Default Array' });
    setPanelCount(4);
    setPanelsPerString(10);
    setGenerateCredentials(true);
  };

  const handleAddDevice = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `esp32-${Math.random().toString(36).substr(2, 9)}`;
    
    const generatedPanels: PanelData[] = Array.from({ length: panelCount }, (_, i) => ({
      id: `P${i + 1}`,
      group: `String ${Math.ceil((i + 1) / panelsPerString)}`,
      power: Math.floor(50 + Math.random() * 20),
      efficiency: Math.floor(90 + Math.random() * 10),
      status: 'Normal',
      history: []
    }));

    const totalPower = generatedPanels.reduce((acc, curr) => acc + curr.power, 0);

    const device: ESP32Device = {
      id: newId,
      name: newDeviceForm.name || 'New Device',
      location: newDeviceForm.location || 'Unknown',
      group: newDeviceForm.group,
      status: DeviceStatus.Online,
      voltage: 24.0,
      current: parseFloat((totalPower / 24).toFixed(1)),
      power: totalPower,
      temperature: 25,
      lastUpdated: new Date(),
      panels: generatedPanels
    };
    
    addDevice(device);

    if (generateCredentials) {
      setProvisioningData({
        id: newId,
        endpoint: `https://api.solartech.ai/v1/devices/${newId}/telemetry`,
        apiKey: `sk_live_${Math.random().toString(36).substr(2, 18)}`
      });
    } else {
      resetRegModal();
    }
  };

  const handleSimulateScan = () => {
    setTimeout(() => {
      const randomId = Math.floor(Math.random() * 1000);
      setNewDeviceForm({
        name: `Solar Array ${randomId}`,
        location: 'London, UK',
        group: 'Scanned Devices'
      });
      setPanelCount(8);
      setPanelsPerString(4);
      setIsScanning(false);
    }, 2000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleSaveDeviceEdit = () => {
    if (editingDevice) {
      updateDevice(editingDevice);
      setEditingDevice(null);
      handleSave(); // trigger save feedback
    }
  };

  const handlePanelGroupChange = (panelId: string, newGroup: string) => {
    if (editingDevice && editingDevice.panels) {
      const updatedPanels = editingDevice.panels.map(p => 
        p.id === panelId ? { ...p, group: newGroup } : p
      );
      setEditingDevice({ ...editingDevice, panels: updatedPanels });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Settings</h2>
        <p className="text-slate-500 dark:text-slate-400">Manage application preferences and team access</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-900 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-700 p-4 flex-shrink-0">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('general')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                activeTab === 'general' 
                  ? 'bg-white dark:bg-slate-800 text-primary-600 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Globe size={18} />
              General
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                activeTab === 'notifications' 
                  ? 'bg-white dark:bg-slate-800 text-primary-600 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Bell size={18} />
              Notifications
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                activeTab === 'team' 
                  ? 'bg-white dark:bg-slate-800 text-primary-600 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Users size={18} />
              Team Management
            </button>
            <button
              onClick={() => setActiveTab('devices')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                activeTab === 'devices' 
                  ? 'bg-white dark:bg-slate-800 text-primary-600 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Cpu size={18} />
              Device Configuration
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-8 max-w-2xl">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">System Preferences</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-slate-100 dark:border-slate-700 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded-lg text-slate-600 dark:text-slate-300"><Globe size={20} /></div>
                      <div>
                        <p className="font-medium text-slate-700 dark:text-slate-200">Language</p>
                        <p className="text-xs text-slate-400">System default language</p>
                      </div>
                    </div>
                    <select 
                      value={settings.language}
                      onChange={handleLanguageChange}
                      className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm font-medium outline-none focus:ring-2 focus:ring-primary-500 dark:text-slate-200"
                    >
                      <option>English (US)</option>
                      <option>Spanish</option>
                      <option>French</option>
                      <option>German</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-slate-100 dark:border-slate-700 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded-lg text-slate-600 dark:text-slate-300"><Moon size={20} /></div>
                      <div>
                        <p className="font-medium text-slate-700 dark:text-slate-200">Dark Mode</p>
                        <p className="text-xs text-slate-400">Toggle dark theme</p>
                      </div>
                    </div>
                    <div 
                      onClick={toggleDarkMode}
                      className={`relative inline-block w-11 h-6 transition duration-200 ease-in-out rounded-full cursor-pointer ${
                        settings.darkMode ? 'bg-primary-600' : 'bg-slate-200 dark:bg-slate-600'
                      }`}
                    >
                       <span className={`translate-x-0 inline-block w-5 h-5 m-0.5 bg-white rounded-full shadow transform transition-transform ${
                         settings.darkMode ? 'translate-x-5' : 'translate-x-0'
                       }`}></span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Application Info</h3>
                 <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-700 space-y-2">
                   <div className="flex justify-between text-sm">
                     <span className="text-slate-500 dark:text-slate-400">Version</span>
                     <span className="font-mono text-slate-700 dark:text-slate-200">v2.4.0-beta</span>
                   </div>
                   <div className="flex justify-between text-sm">
                     <span className="text-slate-500 dark:text-slate-400">Build</span>
                     <span className="font-mono text-slate-700 dark:text-slate-200">2025.03.15</span>
                   </div>
                   <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-600">
                      <button className="text-primary-600 text-sm font-medium hover:underline">Check for updates</button>
                   </div>
                 </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-8 max-w-2xl">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">Alert Configuration</h3>
                  <button 
                    onClick={toggleAllNotifications}
                    className="flex items-center gap-2 text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors hover:bg-primary-100"
                  >
                    <ListChecks size={14} />
                    {allNotificationsEnabled ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Choose how you want to be notified about system anomalies and maintenance requests.</p>
                
                <div className="space-y-3">
                  {[
                    { id: 'email', label: 'Email Notifications', desc: 'Receive daily summaries and critical alerts via email.', icon: Mail },
                    { id: 'push', label: 'Push Notifications', desc: 'Real-time alerts on your mobile device.', icon: Smartphone },
                    { id: 'critical', label: 'Critical Fault Alerts', desc: 'Immediate notification for system failures (High Priority).', icon: Shield },
                    { id: 'weeklyReport', label: 'Weekly Reports', desc: 'Receive a summary PDF every Sunday.', icon: Globe },
                  ].map((item) => (
                    <div key={item.id} className="flex items-start justify-between p-4 border border-slate-100 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <div className="flex gap-3">
                        <div className="bg-primary-50 dark:bg-slate-700 text-primary-600 dark:text-primary-400 p-2 rounded-lg">
                          <item.icon size={20} />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 dark:text-slate-200">{item.label}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xs">{item.desc}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => toggleNotification(item.id as keyof AppSettings['notifications'])}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.notifications[item.id as keyof AppSettings['notifications']] ? 'bg-primary-600' : 'bg-slate-200 dark:bg-slate-600'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.notifications[item.id as keyof AppSettings['notifications']] ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end">
                 <button 
                  onClick={handleSave}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                    isSaved 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-slate-900 dark:bg-primary-600 text-white hover:bg-black dark:hover:bg-primary-700'
                  }`}
                 >
                   {isSaved ? <Check size={18} /> : <Save size={18} />}
                   {isSaved ? 'Saved!' : 'Save Preferences'}
                 </button>
              </div>
            </div>
          )}

          {/* Team Tab */}
          {activeTab === 'team' && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                   <h3 className="text-lg font-bold text-slate-800 dark:text-white">Team Management</h3>
                   <p className="text-sm text-slate-500 dark:text-slate-400">Manage authorized technicians, roles, and assignments.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex bg-slate-100 dark:bg-slate-700/50 rounded-lg p-1">
                      <button
                          onClick={() => setViewMode('list')}
                          className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-2 transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-600 text-primary-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                      >
                          <List size={14} /> List
                      </button>
                      <button
                          onClick={() => setViewMode('calendar')}
                          className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-2 transition-all ${viewMode === 'calendar' ? 'bg-white dark:bg-slate-600 text-primary-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                      >
                          <CalendarDays size={14} /> Calendar
                      </button>
                  </div>
                  <div className="text-xs font-medium bg-primary-50 dark:bg-slate-700 text-primary-700 dark:text-primary-400 px-3 py-1 rounded-full">
                    {technicians.length} Active Users
                  </div>
                </div>
              </div>

              {viewMode === 'list' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* List View */}
                  <div className="lg:col-span-2 space-y-3">
                    {technicians.map((tech) => {
                      const assignedTasks = tasks.filter(t => t.assignedTechId === tech.id && t.status !== 'Completed');
                      const completedTasks = tasks.filter(t => t.assignedTechId === tech.id && t.status === 'Completed');
                      const isExpanded = expandedTechId === tech.id;

                      return (
                      <div key={tech.id} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden group hover:border-primary-200 dark:hover:border-slate-600 transition-all">
                          <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                                tech.status === 'Available' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                              }`}>
                                {tech.initials}
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-800 dark:text-slate-200">{tech.name}</h4>
                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                  <select 
                                    value={tech.role}
                                    onChange={(e) => handleUpdateRole(tech.id, e.target.value)}
                                    className="bg-transparent border-none p-0 font-medium text-xs focus:ring-0 cursor-pointer hover:text-primary-600 dark:bg-slate-800"
                                  >
                                    <option>Maintenance Tech</option>
                                    <option>Senior Electrician</option>
                                    <option>Panel Specialist</option>
                                    <option>Site Supervisor</option>
                                    <option>Administrator</option>
                                  </select>
                                  <span>•</span>
                                  <span className="font-mono">ID: {tech.id}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <select
                                value={tech.status}
                                onChange={(e) => handleUpdateStatus(tech.id, e.target.value as any)}
                                className={`text-xs font-bold px-2 py-1 rounded-full border-none outline-none cursor-pointer ${
                                  tech.status === 'Available' ? 'bg-emerald-50 text-emerald-600' : 
                                  tech.status === 'Busy' ? 'bg-orange-50 text-orange-600' : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                <option value="Available">Available</option>
                                <option value="Busy">Busy</option>
                                <option value="On Leave">On Leave</option>
                              </select>
                              
                              <button 
                                onClick={() => setExpandedTechId(isExpanded ? null : tech.id)}
                                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                              >
                                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                              </button>
                              
                              <button 
                                onClick={() => handleRemoveTechnician(tech.id)}
                                className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                title="Remove User"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                          
                          {/* Expanded Task View */}
                          {isExpanded && (
                            <div className="bg-slate-50 dark:bg-slate-700/30 border-t border-slate-100 dark:border-slate-700 p-4 space-y-6">
                              
                              {/* Active Assignments */}
                              <div>
                                  <h5 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                                  <Briefcase size={14} />
                                  Active Assignments ({assignedTasks.length})
                                  </h5>
                                  {assignedTasks.length > 0 ? (
                                  <div className="space-y-2">
                                      {assignedTasks.map(task => (
                                      <div key={task.id} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-600 flex justify-between items-center">
                                          <div>
                                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{task.title}</p>
                                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                              <Calendar size={12} />
                                              <span>Due: {task.date}</span>
                                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                              task.priority === 'High' || task.priority === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                                              }`}>{task.priority}</span>
                                          </div>
                                          </div>
                                          <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                          {task.status}
                                          </span>
                                      </div>
                                      ))}
                                  </div>
                                  ) : (
                                  <p className="text-sm text-slate-400 italic">No active tasks assigned.</p>
                                  )}
                              </div>

                              {/* Past Maintenance Logs (Completed) */}
                              <div>
                                  <h5 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                                  <Clock size={14} />
                                  Past Maintenance Logs ({completedTasks.length})
                                  </h5>
                                  {completedTasks.length > 0 ? (
                                  <div className="space-y-2">
                                      {completedTasks.map(task => (
                                      <div key={task.id} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-600 flex justify-between items-center opacity-75">
                                          <div>
                                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{task.title}</p>
                                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                              <CheckCircle2 size={12} className="text-emerald-500"/>
                                              <span>Completed: {task.date}</span>
                                          </div>
                                          </div>
                                          <button className="text-xs text-slate-400 hover:text-primary-600 font-medium">View Logs</button>
                                      </div>
                                      ))}
                                  </div>
                                  ) : (
                                  <p className="text-sm text-slate-400 italic">No past maintenance records.</p>
                                  )}
                              </div>
                            </div>
                          )}
                      </div>
                    )})}
                  </div>

                  {/* Add Form */}
                  <div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-100 dark:border-slate-700 sticky top-0">
                      <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <Plus size={18} className="text-primary-500" />
                        Add New Member
                      </h4>
                      <form onSubmit={handleAddTechnician} className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Full Name</label>
                          <input 
                            type="text"
                            value={newTechName}
                            onChange={(e) => setNewTechName(e.target.value)}
                            placeholder="e.g. John Doe"
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Role</label>
                          <select
                            value={newTechRole}
                            onChange={(e) => setNewTechRole(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                          >
                            <option>Maintenance Tech</option>
                            <option>Senior Electrician</option>
                            <option>Panel Specialist</option>
                            <option>Site Supervisor</option>
                            <option>Administrator</option>
                          </select>
                        </div>
                        <button 
                          type="submit"
                          className="w-full bg-slate-900 hover:bg-black dark:bg-primary-600 dark:hover:bg-primary-700 text-white font-medium py-2.5 rounded-xl transition-colors shadow-lg shadow-slate-200 dark:shadow-none"
                        >
                          Add Member
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              ) : (
                // --- Calendar View ---
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden overflow-x-auto relative">
                  <table className="w-full min-w-[900px]">
                    <thead>
                      <tr>
                        <th className="w-56 p-4 bg-slate-50 dark:bg-slate-700/50 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase sticky left-0 z-20 border-b border-slate-100 dark:border-slate-700 backdrop-blur-md">
                          Technician / Availability
                        </th>
                        {calendarDays.map(date => (
                          <th key={date.toISOString()} className="p-4 bg-slate-50 dark:bg-slate-700/50 text-center border-l border-b border-slate-100 dark:border-slate-700 min-w-[120px]">
                            <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                            <div className="text-[10px] text-slate-400 uppercase">{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {technicians.map(tech => (
                        <tr key={tech.id} className="group">
                          <td className="p-4 bg-white dark:bg-slate-800 sticky left-0 z-10 border-r border-slate-100 dark:border-slate-700 group-hover:bg-slate-50 dark:group-hover:bg-slate-700/30 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${
                                tech.status === 'Available' ? 'bg-emerald-100 text-emerald-700' : 
                                tech.status === 'Busy' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {tech.initials}
                              </div>
                              <div>
                                <div className="text-sm font-bold text-slate-800 dark:text-white">{tech.name}</div>
                                <div className="text-[10px] text-slate-400">{tech.role}</div>
                              </div>
                            </div>
                            <div className="mt-2 text-[10px] font-medium px-2 py-0.5 rounded bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 inline-block">
                              {tech.status}
                            </div>
                          </td>
                          {calendarDays.map(date => {
                            const dateStr = date.toISOString().split('T')[0];
                            const dayTasks = tasks.filter(t => t.assignedTechId === tech.id && t.date === dateStr);
                            const isToday = new Date().toISOString().split('T')[0] === dateStr;

                            return (
                              <td key={dateStr} className={`p-2 border-l border-slate-100 dark:border-slate-700 h-32 align-top relative transition-colors ${
                                isToday ? 'bg-slate-50/50 dark:bg-slate-700/20' : ''
                              } group-hover:bg-slate-50/50 dark:group-hover:bg-slate-700/10`}>
                                {dayTasks.map(task => (
                                  <div key={task.id} className={`mb-1.5 p-2 rounded-lg text-[10px] font-medium border shadow-sm transition-all hover:scale-[1.02] cursor-default ${
                                    task.status === 'Completed' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800' :
                                    task.priority === 'High' || task.priority === 'Critical' ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-100 dark:border-orange-800' :
                                    'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600'
                                  }`}>
                                    <div className="truncate font-bold mb-0.5" title={task.title}>{task.title}</div>
                                    <div className="text-[9px] opacity-75 flex items-center gap-1">
                                      <MapPin size={8} /> {task.location?.split(',')[0] || 'Site'}
                                    </div>
                                  </div>
                                ))}
                                {dayTasks.length === 0 && tech.status === 'On Leave' && (
                                  <div className="absolute inset-0 m-2 rounded border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center">
                                    <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest -rotate-12 select-none">On Leave</span>
                                  </div>
                                )}
                                {dayTasks.length === 0 && tech.status !== 'On Leave' && (
                                  <div className="opacity-0 group-hover:opacity-100 absolute bottom-2 right-2 transition-opacity">
                                     <button 
                                        onClick={() => handleOpenAddTask(tech.id, dateStr)}
                                        className="p-1.5 bg-primary-50 hover:bg-primary-100 text-primary-600 rounded-lg shadow-sm transition-colors" 
                                        title="Assign Task"
                                     >
                                       <Plus size={14} />
                                     </button>
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Simple Add Task Modal within Calendar Context */}
                  {isTaskModalOpen && (
                    <div className="absolute inset-0 z-50 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-2xl w-full max-w-sm animate-fade-in-up border border-slate-100 dark:border-slate-700">
                            <div className="flex justify-between items-start mb-4">
                                <h4 className="font-bold text-slate-800 dark:text-white">Assign Task</h4>
                                <button onClick={() => setIsTaskModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                    <X size={18} />
                                </button>
                            </div>
                            <form onSubmit={handleSubmitTask} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Task Title</label>
                                    <input 
                                        autoFocus
                                        type="text"
                                        value={taskForm.title}
                                        onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                                        placeholder="e.g. Inspect Panel A"
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Priority</label>
                                    <select
                                        value={taskForm.priority}
                                        onChange={(e) => setTaskForm({...taskForm, priority: e.target.value as TaskPriority})}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                                    >
                                        <option value={TaskPriority.Low}>Low</option>
                                        <option value={TaskPriority.Medium}>Medium</option>
                                        <option value={TaskPriority.High}>High</option>
                                        <option value={TaskPriority.Critical}>Critical</option>
                                    </select>
                                </div>
                                <button 
                                    type="submit" 
                                    className="w-full bg-slate-900 hover:bg-black dark:bg-primary-600 dark:hover:bg-primary-700 text-white font-bold py-2 rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    <Plus size={16} /> Create Assignment
                                </button>
                            </form>
                        </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Devices Tab */}
          {activeTab === 'devices' && (
             <div className="space-y-8">
              {editingDevice ? (
                // --- Device Editor Mode ---
                <div className="animate-fade-in">
                  <div className="flex justify-between items-center mb-6">
                    <button 
                      onClick={() => setEditingDevice(null)}
                      className="text-sm font-medium text-slate-500 hover:text-slate-700 flex items-center gap-1"
                    >
                       &larr; Back to List
                    </button>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                       <Edit3 className="text-primary-500" size={20} />
                       Editing: {editingDevice.name}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                     {/* Main Settings */}
                     <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
                           <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wider">Device Properties</h4>
                           
                           <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">Device Name</label>
                              <input 
                                type="text"
                                value={editingDevice.name}
                                onChange={(e) => setEditingDevice({...editingDevice, name: e.target.value})}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:bg-slate-900 dark:border-slate-600 dark:text-white text-sm"
                              />
                           </div>
                           <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">Location</label>
                              <input 
                                type="text"
                                value={editingDevice.location}
                                onChange={(e) => setEditingDevice({...editingDevice, location: e.target.value})}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:bg-slate-900 dark:border-slate-600 dark:text-white text-sm"
                              />
                           </div>
                           <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">Main Group</label>
                              <input 
                                type="text"
                                value={editingDevice.group || ''}
                                onChange={(e) => setEditingDevice({...editingDevice, group: e.target.value})}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:bg-slate-900 dark:border-slate-600 dark:text-white text-sm"
                              />
                           </div>
                        </div>
                        
                        <button 
                          onClick={handleSaveDeviceEdit}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-emerald-200 dark:shadow-none flex items-center justify-center gap-2"
                        >
                          <Save size={18} />
                          Save Configuration
                        </button>
                     </div>

                     {/* Panel Configurations */}
                     <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                           <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                              <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                <LayoutGrid size={16}/> Panel Configuration
                              </h4>
                              <span className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
                                {editingDevice.panels?.length} Panels
                              </span>
                           </div>
                           
                           <div className="overflow-x-auto">
                              <table className="w-full text-left text-sm">
                                 <thead className="bg-slate-50 dark:bg-slate-700 text-xs text-slate-500 uppercase">
                                    <tr>
                                       <th className="px-4 py-3 font-bold">Panel ID</th>
                                       <th className="px-4 py-3 font-bold">Group Assignment</th>
                                       <th className="px-4 py-3 font-bold">Status</th>
                                    </tr>
                                 </thead>
                                 <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {editingDevice.panels?.map(panel => (
                                       <tr key={panel.id}>
                                          <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300 font-bold">{panel.id}</td>
                                          <td className="px-4 py-3">
                                             <input 
                                               type="text"
                                               value={panel.group || ''}
                                               onChange={(e) => handlePanelGroupChange(panel.id, e.target.value)}
                                               className="w-full px-2 py-1.5 rounded border border-slate-200 dark:bg-slate-900 dark:border-slate-600 dark:text-white text-xs focus:ring-2 focus:ring-primary-500 outline-none"
                                               placeholder="Assign Group"
                                             />
                                          </td>
                                          <td className="px-4 py-3">
                                             <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                                panel.status === 'Normal' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                                             }`}>{panel.status}</span>
                                          </td>
                                       </tr>
                                    ))}
                                 </tbody>
                              </table>
                           </div>
                        </div>
                     </div>
                  </div>
                </div>
              ) : (
                // --- Device List Mode ---
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white">Registered Devices</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Monitor and configure IoT hardware.</p>
                    </div>
                    <button 
                      onClick={() => setIsRegModalOpen(true)}
                      className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl font-medium shadow-lg shadow-primary-200 dark:shadow-none transition-all"
                    >
                      <Plus size={18} />
                      Register New Device
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {devices.map(device => (
                      <div key={device.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm hover:border-primary-200 dark:hover:border-slate-600 transition-all">
                         <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                               <div className="bg-slate-100 dark:bg-slate-700 p-2.5 rounded-lg text-slate-600 dark:text-slate-300">
                                 <Server size={20} />
                               </div>
                               <div>
                                 <h4 className="font-bold text-slate-800 dark:text-white">{device.name}</h4>
                                 <p className="text-xs text-slate-500 font-mono mt-0.5">{device.id}</p>
                               </div>
                            </div>
                            <div className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 ${
                               device.status === 'Online' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                            }`}>
                               {device.status === 'Online' ? <CheckCircle2 size={12}/> : <WifiOff size={12}/>}
                               {device.status}
                            </div>
                         </div>
                         
                         <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-slate-50 dark:bg-slate-700/30 p-2 rounded-lg">
                               <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Location</span>
                               <span className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1">
                                 <MapPin size={12} /> {device.location}
                               </span>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-700/30 p-2 rounded-lg">
                               <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Configuration</span>
                               <span className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1">
                                 <LayoutGrid size={12} /> {device.panels?.length || 0} Panels
                               </span>
                            </div>
                         </div>

                         <button 
                           onClick={() => setEditingDevice(device)}
                           className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                         >
                           <Edit3 size={16} />
                           Configure Panels & Groups
                         </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
             </div>
          )}
        </div>
      </div>

      {/* Registration Modal (Moved from DeviceManager) */}
      {isRegModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={resetRegModal} />
          
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100/50 dark:border-slate-700/50 flex justify-between items-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-md absolute top-0 left-0 right-0 z-20">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                {provisioningData ? <CheckCircle2 className="text-emerald-500"/> : isScanning ? <QrCode className="text-primary-500" /> : <Plus className="text-primary-500" />}
                {provisioningData ? 'Device Registered' : isScanning ? 'Scan Device QR' : 'Add New Device'}
              </h3>
              <button onClick={resetRegModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto pt-24">
              {provisioningData ? (
                <div className="space-y-6 animate-fade-in">
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl p-4 flex items-start gap-3">
                    <div className="bg-emerald-100 dark:bg-emerald-800 text-emerald-600 dark:text-emerald-300 p-2 rounded-full">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-emerald-900 dark:text-emerald-200 text-sm">Provisioning Successful</h4>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">Device ID: <span className="font-mono font-bold">{provisioningData.id}</span></p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">
                        <Link size={14} /> HTTPS Endpoint
                      </label>
                      <div className="flex gap-2">
                        <input 
                          readOnly
                          value={provisioningData.endpoint}
                          className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-xs font-mono text-slate-600 dark:text-slate-300 focus:outline-none"
                        />
                        <button 
                          onClick={() => copyToClipboard(provisioningData.endpoint)}
                          className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-slate-500 dark:text-slate-400 transition-colors"
                          title="Copy Endpoint"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">
                        <Key size={14} /> API Authorization Key
                      </label>
                      <div className="flex gap-2">
                        <input 
                          readOnly
                          value={provisioningData.apiKey}
                          className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-xs font-mono text-slate-600 dark:text-slate-300 focus:outline-none"
                        />
                        <button 
                          onClick={() => copyToClipboard(provisioningData.apiKey)}
                          className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-slate-500 dark:text-slate-400 transition-colors"
                          title="Copy API Key"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={resetRegModal}
                    className="w-full bg-slate-900 hover:bg-black dark:bg-primary-600 dark:hover:bg-primary-700 text-white font-bold py-3 rounded-xl transition-colors"
                  >
                    Done
                  </button>
                </div>
              ) : isScanning ? (
                <div className="flex flex-col items-center space-y-4 animate-fade-in">
                  <div className="relative w-64 h-64 bg-black rounded-2xl overflow-hidden shadow-inner border-4 border-slate-800 group">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 z-10"></div>
                    <style>{`
                      @keyframes scan {
                        0%, 100% { top: 0%; opacity: 0; }
                        10% { opacity: 1; }
                        90% { opacity: 1; }
                        100% { top: 100%; opacity: 0; }
                      }
                    `}</style>
                    <div 
                      className="absolute left-0 right-0 h-1 bg-primary-400 shadow-[0_0_15px_rgba(56,189,248,0.8)] z-20"
                      style={{ animation: 'scan 2s cubic-bezier(0.4, 0, 0.2, 1) infinite' }}
                    ></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-white/50 text-xs font-mono">Align QR Code</p>
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-sm font-medium text-slate-800 dark:text-white">Scanning for ESP32-CAM...</p>
                    <button onClick={handleSimulateScan} className="text-xs text-primary-600 hover:underline">(Click to simulate scan success)</button>
                  </div>
                  <button onClick={() => setIsScanning(false)} className="text-sm text-slate-500 font-medium">Cancel Scan</button>
                </div>
              ) : (
                <form onSubmit={handleAddDevice} className="space-y-5">
                  <div className="flex p-1 bg-slate-100 dark:bg-slate-700 rounded-xl mb-6">
                    <button type="button" className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold shadow-sm bg-white dark:bg-slate-600 text-primary-600 dark:text-white transition-all">
                      <Server size={16} /> Manual Entry
                    </button>
                    <button type="button" onClick={() => setIsScanning(true)} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600/50 transition-all">
                      <QrCode size={16} /> Scan QR
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Device Name</label>
                      <input 
                          type="text" 
                          placeholder="e.g. Roof Array 3"
                          value={newDeviceForm.name}
                          onChange={(e) => setNewDeviceForm({...newDeviceForm, name: e.target.value})}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                          required
                        />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Location</label>
                      <input 
                          type="text" 
                          placeholder="e.g. London, UK"
                          value={newDeviceForm.location}
                          onChange={(e) => setNewDeviceForm({...newDeviceForm, location: e.target.value})}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                          required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Total Panels</label>
                         <input 
                             type="number" 
                             min="1"
                             max="200"
                             value={panelCount}
                             onChange={(e) => setPanelCount(parseInt(e.target.value) || 1)}
                             className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                             required
                           />
                      </div>
                      <div>
                         <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Panels / String</label>
                         <input 
                             type="number" 
                             min="1"
                             max={panelCount}
                             value={panelsPerString}
                             onChange={(e) => setPanelsPerString(parseInt(e.target.value) || 1)}
                             className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                             required
                           />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Group Assignment</label>
                      <input 
                          type="text" 
                          placeholder="e.g. Main Roof"
                          value={newDeviceForm.group}
                          onChange={(e) => setNewDeviceForm({...newDeviceForm, group: e.target.value})}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                        />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-primary-200 dark:shadow-none mt-2 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={18} />
                    Complete Registration
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
