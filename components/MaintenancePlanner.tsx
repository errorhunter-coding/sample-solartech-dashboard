import React, { useState } from 'react';
import { 
  Calendar, 
  User, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Sparkles, 
  RefreshCw,
  X,
  Activity,
  FileText,
  Send,
  MapPin,
  ChevronRight,
  Plus,
  Users,
  Briefcase,
  Hash
} from 'lucide-react';
import { ESP32Device, DeviceStatus, Technician, MaintenanceTask, TaskPriority, MaintenanceLog } from '../types';

interface MaintenancePlannerProps {
  devices: ESP32Device[];
  technicians: Technician[];
  setTechnicians: React.Dispatch<React.SetStateAction<Technician[]>>;
  tasks: MaintenanceTask[];
  setTasks: React.Dispatch<React.SetStateAction<MaintenanceTask[]>>;
}

const MaintenancePlanner: React.FC<MaintenancePlannerProps> = ({ devices, technicians, setTechnicians, tasks, setTasks }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Completed'>('All');
  const [selectedTask, setSelectedTask] = useState<MaintenanceTask | null>(null);
  const [newLogEntry, setNewLogEntry] = useState('');
  const [manualAssignId, setManualAssignId] = useState('');
  
  // Team Management State (kept for quick access modal)
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [newTechName, setNewTechName] = useState('');
  const [newTechRole, setNewTechRole] = useState('Maintenance Tech');

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.Critical: return 'bg-red-100 text-red-700 border-red-200';
      case TaskPriority.High: return 'bg-orange-100 text-orange-700 border-orange-200';
      case TaskPriority.Medium: return 'bg-blue-100 text-blue-700 border-blue-200';
      case TaskPriority.Low: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(date);
  };

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
    // Keep modal open to allow adding more or seeing the list update
  };

  const handleGeneratePlan = () => {
    setIsLoading(true);
    
    // Simulate AI processing
    setTimeout(() => {
      const newTasks: MaintenanceTask[] = [];
      
      // Logic: Generate tasks based on device status
      devices.forEach(device => {
        if (device.status === DeviceStatus.Offline) {
          newTasks.push({
            id: `auto-${Date.now()}-${device.id}`,
            title: `Investigate Connection Loss: ${device.name}`,
            deviceId: device.id,
            location: device.location,
            priority: TaskPriority.Critical,
            status: 'Pending',
            date: new Date().toISOString().split('T')[0],
            aiInsight: 'Device has been unresponsive for > 30 mins. Sudden voltage drop recorded.',
            logs: [{ id: `l-${Date.now()}`, timestamp: new Date(), message: 'Critical alert triggered by watchdog.', author: 'System', type: 'system' }]
          });
        } else if (device.temperature > 50) {
          newTasks.push({
            id: `auto-${Date.now()}-${device.id}`,
            title: `Cooling Check: ${device.name}`,
            deviceId: device.id,
            location: device.location,
            priority: TaskPriority.High,
            status: 'Pending',
            date: new Date().toISOString().split('T')[0],
            aiInsight: `Abnormal temperature spike (${device.temperature}°C) detected. Potential hotspot or ventilation blockage.`,
            logs: [{ id: `l-${Date.now()}`, timestamp: new Date(), message: 'Thermal anomaly detected.', author: 'System', type: 'system' }]
          });
        } else if (device.status === DeviceStatus.Warning) {
          newTasks.push({
            id: `auto-${Date.now()}-${device.id}`,
            title: `Performance Diagnostic: ${device.name}`,
            deviceId: device.id,
            location: device.location,
            priority: TaskPriority.Medium,
            status: 'Pending',
            date: new Date().toISOString().split('T')[0],
            aiInsight: 'Power output is 15% below expected value for current irradiance levels.',
            logs: [{ id: `l-${Date.now()}`, timestamp: new Date(), message: 'Efficiency dropped below threshold.', author: 'System', type: 'system' }]
          });
        }
      });

      // Add a weather based task if not already present (simulated unique check)
      if (!tasks.some(t => t.title.includes('Post-Storm'))) {
        newTasks.push({
          id: `auto-weather-${Date.now()}`,
          title: 'Post-Storm Integrity Check',
          location: 'All Sectors',
          priority: TaskPriority.Medium,
          status: 'Pending',
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          aiInsight: 'Forecast predicts high winds (45km/h) tomorrow afternoon. Pre-emptive securing recommended.',
          logs: [{ id: `l-${Date.now()}`, timestamp: new Date(), message: 'Weather warning integrated into planner.', author: 'System', type: 'system' }]
        });
      }

      if (newTasks.length === 0) {
        // Fallback if everything is fine
        alert("System healthy. No new maintenance tasks required.");
      } else {
        setTasks(prev => [...newTasks, ...prev]);
      }
      setIsLoading(false);
    }, 1500);
  };

  const handleAssignTech = (taskId: string, techId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const tech = technicians.find(tech => tech.id === techId);
        const newLog: MaintenanceLog = {
          id: `l-${Date.now()}`,
          timestamp: new Date(),
          message: `Assigned to ${tech?.name}`,
          author: 'System',
          type: 'system'
        };
        
        // Update tech status
        setTechnicians(currTechs => currTechs.map(tk => 
          tk.id === techId ? { ...tk, status: 'Busy' } : tk
        ));

        return { ...t, assignedTechId: techId, status: 'Assigned', logs: [...(t.logs || []), newLog] };
      }
      return t;
    }));
    
    if (selectedTask?.id === taskId) {
      // Update selected task view if open
      const tech = technicians.find(tech => tech.id === techId);
      setSelectedTask(prev => prev ? { ...prev, assignedTechId: techId, status: 'Assigned' } : null);
    }
  };
  
  const handleManualAssign = () => {
    if (!selectedTask || !manualAssignId.trim()) return;
    
    const tech = technicians.find(t => t.id === manualAssignId.trim());
    if (tech) {
      handleAssignTech(selectedTask.id, tech.id);
      setManualAssignId('');
    } else {
      alert(`Technician with ID "${manualAssignId}" not found.`);
    }
  };

  const handleStatusChange = (taskId: string, newStatus: 'Pending' | 'Assigned' | 'Completed') => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
         const newLog: MaintenanceLog = {
          id: `l-${Date.now()}`,
          timestamp: new Date(),
          message: `Status updated to ${newStatus}`,
          author: 'User',
          type: 'system'
        };
        
        // If completed, free up the tech
        if (newStatus === 'Completed' && t.assignedTechId) {
           setTechnicians(currTechs => currTechs.map(tk => 
            tk.id === t.assignedTechId ? { ...tk, status: 'Available' } : tk
          ));
        }

        return { ...t, status: newStatus, logs: [...(t.logs || []), newLog] };
      }
      return t;
    }));
    
    if (selectedTask?.id === taskId) {
      setSelectedTask(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !newLogEntry.trim()) return;

    const log: MaintenanceLog = {
      id: `l-${Date.now()}`,
      timestamp: new Date(),
      message: newLogEntry,
      author: 'You', // In a real app this comes from auth context
      type: 'user'
    };

    const updatedTask = {
      ...selectedTask,
      logs: [...(selectedTask.logs || []), log]
    };

    setTasks(prev => prev.map(t => t.id === selectedTask.id ? updatedTask : t));
    setSelectedTask(updatedTask);
    setNewLogEntry('');
  };

  // --- Render ---

  const filteredTasks = filter === 'All' ? tasks : tasks.filter(t => t.status === filter);

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Maintenance Planner</h2>
          <p className="text-slate-500">AI-driven scheduling and task management</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsTeamModalOpen(true)}
            className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl font-medium transition-colors"
          >
            <Users size={18} />
            Manage Team
          </button>
          <button 
            onClick={handleGeneratePlan}
            disabled={isLoading}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-xl font-medium shadow-lg shadow-primary-200 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? <RefreshCw size={18} className="animate-spin" /> : <Sparkles size={18} />}
            Generate AI Plan
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 border-b border-slate-200 pb-1 flex-shrink-0 overflow-x-auto">
        {(['All', 'Pending', 'Completed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              filter === f 
                ? 'bg-primary-50 text-primary-700' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            {f} Tasks
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto pr-2 pb-4">
        {filteredTasks.map((task) => (
          <div 
            key={task.id}
            onClick={() => setSelectedTask(task)}
            className={`bg-white p-5 rounded-xl shadow-sm border transition-all cursor-pointer hover:shadow-md ${
              selectedTask?.id === task.id ? 'border-primary-500 ring-1 ring-primary-500' : 'border-slate-100'
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </span>
              <span className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${
                task.status === 'Completed' ? 'bg-green-100 text-green-700' : 
                task.status === 'Assigned' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {task.status === 'Completed' && <CheckCircle2 size={12} />}
                {task.status}
              </span>
            </div>
            
            <h3 className="font-bold text-slate-800 mb-1">{task.title}</h3>
            <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
              <div className="flex items-center gap-1">
                <MapPin size={14} />
                {task.location}
              </div>
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                {task.date}
              </div>
            </div>

            {task.assignedTechId ? (
               <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-50">
                 <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center text-[10px] font-bold text-primary-700">
                   {technicians.find(t => t.id === task.assignedTechId)?.initials}
                 </div>
                 <span className="text-xs font-medium text-slate-600">
                   {technicians.find(t => t.id === task.assignedTechId)?.name}
                 </span>
               </div>
            ) : (
              <div className="mt-4 pt-3 border-t border-slate-50 text-xs text-orange-500 font-medium flex items-center gap-1">
                <AlertTriangle size={12} /> Unassigned
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedTask(null)} />
          <div className="bg-white w-full md:max-w-2xl md:rounded-2xl rounded-t-2xl shadow-2xl relative z-10 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-start flex-shrink-0">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${getPriorityColor(selectedTask.priority)}`}>
                    {selectedTask.priority}
                  </span>
                  <span className="text-slate-400 text-sm">ID: {selectedTask.id.split('-')[0]}...</span>
                </div>
                <h2 className="text-xl font-bold text-slate-800">{selectedTask.title}</h2>
              </div>
              <button onClick={() => setSelectedTask(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* AI Insight Section */}
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                <div className="flex items-start gap-3">
                  <Sparkles className="text-indigo-600 mt-0.5 flex-shrink-0" size={18} />
                  <div>
                    <h4 className="font-bold text-indigo-900 text-sm">AI Insight</h4>
                    <p className="text-indigo-800 text-sm mt-1 leading-relaxed">{selectedTask.aiInsight}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 flex items-center gap-2">
                    <Activity size={18} className="text-slate-400" />
                    Details
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <span className="text-xs font-bold text-slate-400 uppercase">Location</span>
                      <p className="font-medium text-slate-700">{selectedTask.location || 'N/A'}</p>
                    </div>
                    
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <span className="text-xs font-bold text-slate-400 uppercase">Device ID</span>
                      <p className="font-medium text-slate-700 font-mono">{selectedTask.deviceId || 'General Infrastructure'}</p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg">
                      <span className="text-xs font-bold text-slate-400 uppercase">Assignee</span>
                      <div className="mt-1 space-y-3">
                        <select 
                          className="w-full bg-white border border-slate-200 rounded-md px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                          value={selectedTask.assignedTechId || ''}
                          onChange={(e) => handleAssignTech(selectedTask.id, e.target.value)}
                        >
                          <option value="">Select Technician...</option>
                          {technicians.map(tech => (
                            <option key={tech.id} value={tech.id}>
                              {tech.name} ({tech.status})
                            </option>
                          ))}
                        </select>

                        <div className="relative flex items-center py-1">
                          <div className="flex-grow border-t border-slate-200"></div>
                          <span className="flex-shrink-0 mx-2 text-[10px] font-bold text-slate-400 uppercase">OR Assign by ID</span>
                          <div className="flex-grow border-t border-slate-200"></div>
                        </div>

                        <div className="flex gap-2">
                           <div className="relative flex-1">
                             <Hash size={14} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-400" />
                             <input 
                               type="text"
                               value={manualAssignId}
                               onChange={(e) => setManualAssignId(e.target.value)}
                               onKeyDown={(e) => e.key === 'Enter' && handleManualAssign()}
                               placeholder="Enter Tech ID"
                               className="w-full bg-white border border-slate-200 rounded-md pl-8 pr-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                             />
                           </div>
                           <button 
                             onClick={handleManualAssign}
                             className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3 rounded-md transition-colors"
                           >
                             Assign
                           </button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg">
                       <span className="text-xs font-bold text-slate-400 uppercase">Status</span>
                       <div className="flex gap-2 mt-2">
                         {(['Pending', 'Assigned', 'Completed'] as const).map(s => (
                           <button 
                             key={s}
                             onClick={() => handleStatusChange(selectedTask.id, s)}
                             className={`flex-1 py-1 text-xs font-medium rounded border ${
                               selectedTask.status === s 
                                 ? 'bg-white border-slate-300 shadow-sm text-slate-800' 
                                 : 'border-transparent text-slate-400 hover:bg-slate-200'
                             }`}
                           >
                             {s}
                           </button>
                         ))}
                       </div>
                    </div>
                  </div>
                </div>

                {/* Logs Section */}
                <div className="flex flex-col h-full">
                   <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                    <FileText size={18} className="text-slate-400" />
                    Activity Log
                  </h4>
                  
                  <div className="flex-1 bg-slate-50 rounded-xl p-4 space-y-4 overflow-y-auto max-h-64 mb-4">
                    {selectedTask.logs?.map((log) => (
                      <div key={log.id} className="flex gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${
                          log.type === 'system' ? 'bg-slate-200 text-slate-600' : 'bg-primary-100 text-primary-700'
                        }`}>
                          {log.author === 'System' ? 'AI' : log.author.substring(0,2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-700">{log.author}</span>
                            <span className="text-[10px] text-slate-400">{formatDate(log.timestamp)} {formatTime(log.timestamp)}</span>
                          </div>
                          <p className="text-sm text-slate-600 mt-0.5">{log.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleAddLog} className="relative">
                    <input
                      type="text"
                      value={newLogEntry}
                      onChange={(e) => setNewLogEntry(e.target.value)}
                      placeholder="Add a note..."
                      className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                    />
                    <button type="submit" className="absolute right-2 top-2 text-primary-600 hover:text-primary-700 p-0.5">
                      <Send size={16} />
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end gap-3 flex-shrink-0">
              <button 
                onClick={() => setSelectedTask(null)}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-white hover:shadow-sm rounded-lg transition-all"
              >
                Close
              </button>
              {selectedTask.status !== 'Completed' && (
                <button 
                  onClick={() => handleStatusChange(selectedTask.id, 'Completed')}
                  className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 shadow-sm transition-colors"
                >
                  Mark Complete
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Team Management Modal (Simplified for quick access) */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsTeamModalOpen(false)} />
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Briefcase className="text-primary-500" size={20}/>
                Quick Add Team Member
              </h3>
              <button onClick={() => setIsTeamModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h4 className="text-sm font-bold text-slate-700 mb-3">Add New Technician</h4>
                <form onSubmit={handleAddTechnician} className="grid grid-cols-1 gap-3">
                  <div>
                    <input 
                      type="text" 
                      placeholder="Full Name"
                      value={newTechName}
                      onChange={(e) => setNewTechName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={newTechRole}
                      onChange={(e) => setNewTechRole(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-200 outline-none text-sm bg-white"
                    >
                      <option>Maintenance Tech</option>
                      <option>Senior Electrician</option>
                      <option>Panel Specialist</option>
                      <option>Site Supervisor</option>
                    </select>
                    <button 
                      type="submit"
                      className="bg-slate-800 hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                    >
                      <Plus size={16} /> Add
                    </button>
                  </div>
                </form>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-400">Visit Settings &gt; Team Management for full controls.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenancePlanner;