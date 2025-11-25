
import React, { useState, useMemo } from 'react';
import { MapPin, Server, WifiOff, AlertTriangle, CheckCircle2, Wrench, ChevronDown, ChevronUp, LayoutGrid, Zap, Download, Layers, Activity, Thermometer, ScanEye } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, Tooltip } from 'recharts';
import { ESP32Device, DeviceStatus, PanelData } from '../types';

interface DeviceManagerProps {
  devices: ESP32Device[];
}

const DeviceManager: React.FC<DeviceManagerProps> = ({ devices }) => {
  const [expandedDeviceId, setExpandedDeviceId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedDeviceId(expandedDeviceId === id ? null : id);
  };

  // --- Calculation Logic ---

  const calculateHealthScore = (device: ESP32Device) => {
    if (device.status === DeviceStatus.Offline) {
      return { score: 0, label: 'System Offline', color: 'text-red-600', bg: 'bg-red-100', reasons: ['Device unreachable'] };
    }

    let score = 100;
    const reasons: string[] = [];

    // 1. Efficiency Impact (Weight: 50%)
    // Calculate average panel efficiency
    const avgEfficiency = device.panels && device.panels.length > 0
        ? device.panels.reduce((acc, p) => acc + p.efficiency, 0) / device.panels.length
        : 0;
    
    // Lose 0.5 points for every 1% drop below 98%
    if (avgEfficiency < 98) {
      const effPenalty = Math.min(40, (98 - avgEfficiency) * 0.8);
      score -= effPenalty;
      if (effPenalty > 5) reasons.push(`Low Efficiency (-${Math.floor(effPenalty)})`);
    }

    // 2. Temperature Impact (Weight: 30%)
    // Ideal < 45. Penalty for higher.
    if (device.temperature > 45) {
        const tempPenalty = Math.min(30, (device.temperature - 45) * 1.5);
        score -= tempPenalty;
        reasons.push(`High Temp (-${Math.floor(tempPenalty)})`);
    }

    // 3. Status Impact
    if (device.status === DeviceStatus.Warning) {
      score -= 20;
      reasons.push('Status Warning (-20)');
    }
    
    // 4. Maintenance Mode
    if (device.status === DeviceStatus.Maintenance) {
       score = 50; // Hard cap
       reasons.push('Maintenance Mode');
    }

    // Clamp
    score = Math.max(0, Math.min(100, Math.floor(score)));

    // Determine Label/Color
    let label = 'Excellent';
    let color = 'text-emerald-600';
    let bg = 'bg-emerald-100';
    let barColor = 'bg-emerald-500';

    if (score < 50) {
       label = 'Critical';
       color = 'text-red-600';
       bg = 'bg-red-100';
       barColor = 'bg-red-500';
    } else if (score < 75) {
       label = 'Fair';
       color = 'text-amber-600';
       bg = 'bg-amber-100';
       barColor = 'bg-amber-500';
    } else if (score < 90) {
       label = 'Good';
       color = 'text-blue-600';
       bg = 'bg-blue-100';
       barColor = 'bg-blue-500';
    }

    return { score, label, color, bg, barColor, reasons };
  };

  // --- Data Logic ---

  // Group devices logic for Main View
  const groupedDevices = useMemo(() => {
    const groups: Record<string, ESP32Device[]> = {};
    devices.forEach(device => {
      const groupName = device.group || 'Unassigned';
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(device);
    });
    return groups;
  }, [devices]);

  const getStatusStyle = (status: DeviceStatus) => {
    switch (status) {
      case DeviceStatus.Online:
        return {
          bg: 'bg-emerald-100',
          text: 'text-emerald-700',
          border: 'border-emerald-200',
          icon: <CheckCircle2 size={14} className="text-emerald-600" />
        };
      case DeviceStatus.Offline:
        return {
          bg: 'bg-red-100',
          text: 'text-red-700',
          border: 'border-red-200',
          icon: <WifiOff size={14} className="text-red-600" />
        };
      case DeviceStatus.Warning:
        return {
          bg: 'bg-amber-100',
          text: 'text-amber-800',
          border: 'border-amber-200',
          icon: <AlertTriangle size={14} className="text-amber-600" />
        };
      case DeviceStatus.Maintenance:
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-700',
          border: 'border-blue-200',
          icon: <Wrench size={14} className="text-blue-600" />
        };
      default:
        return {
          bg: 'bg-slate-100',
          text: 'text-slate-700',
          border: 'border-slate-200',
          icon: <Server size={14} className="text-slate-500" />
        };
    }
  };

  // --- Export Logic ---

  const downloadCSV = (data: any[], filename: string) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(fieldName => JSON.stringify(row[fieldName])).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleExportDeviceCSV = (device: ESP32Device) => {
    if (!device.panels) return;
    const data = device.panels.map(p => ({
      DeviceID: device.id,
      DeviceName: device.name,
      Location: device.location,
      PanelGroup: p.group || 'Unassigned',
      PanelID: p.id,
      Power_W: p.power,
      Efficiency_Percent: p.efficiency,
      Status: p.status,
      Timestamp: new Date().toISOString()
    }));
    downloadCSV(data, `${device.name.replace(/\s+/g, '_')}_panels.csv`);
  };

  const handleExportGroupCSV = (groupName: string, devicesInGroup: ESP32Device[]) => {
    const data: any[] = [];
    devicesInGroup.forEach(device => {
        if(device.panels) {
            device.panels.forEach(p => {
                data.push({
                    DeviceID: device.id,
                    DeviceName: device.name,
                    DeviceLocation: device.location,
                    DeviceGroup: groupName,
                    PanelGroup: p.group || 'Unassigned',
                    PanelID: p.id,
                    Power_W: p.power,
                    Efficiency_Percent: p.efficiency,
                    Status: p.status,
                    Timestamp: new Date().toISOString()
                });
            });
        }
    });
    if (data.length > 0) {
        downloadCSV(data, `${groupName.replace(/\s+/g, '_')}_full_report.csv`);
    } else {
      alert('No panel data available for this group.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">IoT Device Monitor</h2>
          <p className="text-slate-500 dark:text-slate-400">Real-time status of your solar infrastructure</p>
        </div>
      </div>

      {/* Grouped Device List */}
      <div className="space-y-8">
        {(Object.entries(groupedDevices) as [string, ESP32Device[]][]).map(([groupName, groupDevices]) => (
          <div key={groupName} className="animate-fade-in">
            
            {/* Group Header */}
            <div className="flex items-center justify-between mb-3 px-2">
               <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Layers size={16} /> 
                  {groupName} 
                  <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full text-xs min-w-[24px] text-center">
                    {groupDevices.length}
                  </span>
               </h3>
               <button 
                 onClick={() => handleExportGroupCSV(groupName, groupDevices)}
                 className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
               >
                 <Download size={14} /> Export Report
               </button>
            </div>

            {/* Device Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-32">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Device</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Location</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Config</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Telemetry</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">View</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {groupDevices.map((device) => {
                      const style = getStatusStyle(device.status);
                      const health = calculateHealthScore(device);

                      // Organize sub-groups (strings)
                      const panelGroups = (device.panels || []).reduce((acc, panel) => {
                        const group = panel.group || 'Default String';
                        if (!acc[group]) acc[group] = [];
                        acc[group].push(panel);
                        return acc;
                      }, {} as Record<string, PanelData[]>);

                      return (
                        <React.Fragment key={device.id}>
                          <tr className={`group hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${expandedDeviceId === device.id ? 'bg-slate-50 dark:bg-slate-700/30' : ''}`}>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${style.bg} ${style.text} ${style.border}`}>
                                {style.icon}
                                {device.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded-lg text-slate-500 dark:text-slate-400">
                                  <Server size={18} />
                                </div>
                                <div>
                                  <p className="font-bold text-slate-800 dark:text-white text-sm">{device.name}</p>
                                  <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wide">{device.id}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-300">
                                <MapPin size={14} className="text-slate-400" />
                                {device.location}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-300">
                                <LayoutGrid size={14} className="text-slate-400" />
                                {device.panels?.length || 0} Panels
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <div className="flex items-baseline gap-1">
                                  <span className="font-bold text-slate-800 dark:text-white">{device.power}</span>
                                  <span className="text-xs text-slate-400">W</span>
                                </div>
                                <span className="text-xs text-slate-400">{device.temperature}°C</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button 
                                onClick={() => toggleExpand(device.id)}
                                className={`p-2 rounded-full transition-all ${
                                  expandedDeviceId === device.id 
                                    ? 'bg-white dark:bg-slate-600 text-primary-600 shadow-sm' 
                                    : 'hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-400 hover:text-slate-600'
                                }`}
                              >
                                {expandedDeviceId === device.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                              </button>
                            </td>
                          </tr>
                          
                          {/* Expanded Detail View */}
                          {expandedDeviceId === device.id && (
                            <tr>
                              <td colSpan={6} className="p-0">
                                <div className="bg-slate-50 dark:bg-slate-700/20 p-6 border-b border-slate-100 dark:border-slate-700 shadow-inner">
                                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                                    <div>
                                      <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                        <LayoutGrid size={18} className="text-primary-500"/>
                                        Detailed Panel Status
                                      </h3>
                                      <p className="text-xs text-slate-500 dark:text-slate-400 ml-6.5">Real-time efficiency and power output metrics</p>
                                    </div>
                                    <button 
                                      onClick={() => handleExportDeviceCSV(device)}
                                      className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-primary-500 px-4 py-2 rounded-lg transition-all shadow-sm"
                                    >
                                      <Download size={14} />
                                      Download CSV
                                    </button>
                                  </div>

                                  {/* --- Real-time Health Score Card --- */}
                                  <div className="mb-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-600 p-5 shadow-sm flex flex-col md:flex-row gap-6 items-center">
                                     <div className="flex-shrink-0 relative flex items-center justify-center w-24 h-24">
                                        {/* Background Ring */}
                                        <svg className="w-full h-full transform -rotate-90">
                                          <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100 dark:text-slate-700" />
                                          <circle 
                                            cx="48" cy="48" r="40" 
                                            stroke="currentColor" 
                                            strokeWidth="8" 
                                            fill="transparent" 
                                            strokeDasharray={251.2} 
                                            strokeDashoffset={251.2 - (251.2 * health.score) / 100} 
                                            className={`${health.color} transition-all duration-1000 ease-out`}
                                            strokeLinecap="round"
                                          />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                           <span className={`text-2xl font-bold ${health.color}`}>{health.score}</span>
                                           <span className="text-[10px] text-slate-400 uppercase font-bold">Score</span>
                                        </div>
                                     </div>
                                     
                                     <div className="flex-1 w-full">
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <h4 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                              {health.label} Health
                                              <span className={`text-xs px-2 py-0.5 rounded-full border ${health.bg} ${health.color} border-transparent bg-opacity-50`}>
                                                {device.status}
                                              </span>
                                            </h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                              Based on power efficiency, temp, and connectivity.
                                            </p>
                                          </div>
                                        </div>

                                        <div className="mt-4 space-y-2">
                                           {/* Factors contributing to score */}
                                           {health.reasons.length > 0 ? (
                                              <div className="flex flex-wrap gap-2">
                                                {health.reasons.map((reason, idx) => (
                                                  <span key={idx} className="text-xs font-medium bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 rounded flex items-center gap-1">
                                                    <AlertTriangle size={10} /> {reason}
                                                  </span>
                                                ))}
                                              </div>
                                           ) : (
                                              <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded w-fit">
                                                <CheckCircle2 size={12} /> Operating at peak performance
                                              </div>
                                           )}
                                        </div>
                                     </div>

                                     <div className="flex-shrink-0 w-full md:w-48 space-y-3 border-l border-slate-100 dark:border-slate-700 pl-0 md:pl-6">
                                        <div className="flex justify-between items-center">
                                           <span className="text-xs text-slate-500 flex items-center gap-1"><Thermometer size={12}/> Temp Impact</span>
                                           <span className={`text-xs font-bold ${device.temperature > 45 ? 'text-red-500' : 'text-emerald-500'}`}>
                                              {device.temperature > 45 ? '- High' : 'Normal'}
                                           </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                           <span className="text-xs text-slate-500 flex items-center gap-1"><Zap size={12}/> Eff. Factor</span>
                                           <span className="text-xs font-bold text-slate-700 dark:text-slate-300">~{Math.round((device.panels?.reduce((a,b)=>a+b.efficiency,0) || 0)/(device.panels?.length||1))}%</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                           <span className="text-xs text-slate-500 flex items-center gap-1"><Activity size={12}/> Uptime</span>
                                           <span className="text-xs font-bold text-slate-700 dark:text-slate-300">99.8%</span>
                                        </div>
                                     </div>
                                  </div>
                                  
                                  {/* Render Sub-groups (Strings) */}
                                  <div className="grid grid-cols-1 gap-6">
                                    {(Object.entries(panelGroups) as [string, PanelData[]][]).map(([stringName, panels]) => (
                                      <div key={stringName} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-600 p-4">
                                         <h4 className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-4 border-b border-slate-50 dark:border-slate-700 pb-2">
                                            <Zap size={12} className="text-yellow-500" /> 
                                            {stringName}
                                            <span className="ml-auto text-[10px] normal-case bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-500">
                                              Total: {panels.reduce((a,b) => a + b.power, 0)}W
                                            </span>
                                         </h4>
                                         
                                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {panels.map(panel => (
                                                <div key={panel.id} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 border border-slate-100 dark:border-slate-700 hover:border-primary-200 transition-colors">
                                                  <div className="flex justify-between items-start mb-2">
                                                    <span className="font-bold text-sm text-slate-700 dark:text-slate-200">Panel {panel.id}</span>
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                                        panel.status === 'Normal' ? 'bg-emerald-100 text-emerald-700' : 
                                                        panel.status === 'Offline' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                        {panel.status}
                                                    </span>
                                                  </div>
                                                  
                                                  <div className="flex justify-between items-end mb-3">
                                                    <div>
                                                      <div className="text-lg font-bold text-slate-800 dark:text-white">{panel.power} <span className="text-xs font-normal text-slate-400">W</span></div>
                                                      <div className="text-xs text-slate-500 dark:text-slate-400">Eff: {panel.efficiency}%</div>
                                                    </div>
                                                    <div className="w-12 h-12">
                                                      <div className={`w-full h-1 rounded-full mb-1 ${panel.status === 'Normal' ? 'bg-emerald-200' : 'bg-amber-200'}`}>
                                                        <div className={`h-full rounded-full ${panel.status === 'Normal' ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{width: `${panel.efficiency}%`}}></div>
                                                      </div>
                                                    </div>
                                                  </div>

                                                  {/* History Mini Chart */}
                                                  {panel.history && panel.history.length > 0 ? (
                                                    <div className="h-16 w-full border-t border-slate-100 dark:border-slate-600 pt-2">
                                                      <ResponsiveContainer width="100%" height="100%">
                                                        <BarChart data={panel.history}>
                                                          <Tooltip 
                                                            cursor={{fill: 'rgba(0,0,0,0.05)'}}
                                                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '4px', padding: '2px 6px', fontSize: '10px' }}
                                                            itemStyle={{ color: '#fff', padding: 0 }}
                                                            labelStyle={{ display: 'none' }}
                                                            formatter={(value: number) => [`${value}W`]}
                                                          />
                                                          <Bar 
                                                            dataKey="power" 
                                                            fill={panel.status === 'Normal' ? '#0ea5e9' : panel.status === 'Offline' ? '#ef4444' : '#f59e0b'} 
                                                            radius={[2, 2, 0, 0]} 
                                                          />
                                                        </BarChart>
                                                      </ResponsiveContainer>
                                                    </div>
                                                  ) : (
                                                    <div className="h-16 flex items-center justify-center text-[10px] text-slate-300 border-t border-slate-100 dark:border-slate-600">
                                                      No history
                                                    </div>
                                                  )}

                                                  {/* Recent AI Faults Indicator */}
                                                  {panel.recentFaults && panel.recentFaults.length > 0 && (
                                                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-600">
                                                      <div className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 mb-1">
                                                        <ScanEye size={12} />
                                                        <span>AI Fault Detected</span>
                                                      </div>
                                                      {panel.recentFaults.map((fault, i) => (
                                                        <div key={i} className="bg-amber-50 dark:bg-amber-900/20 p-1.5 rounded text-[10px] text-amber-800 dark:text-amber-200 mb-1 last:mb-0 leading-tight">
                                                          <span className="font-bold capitalize">{fault.type.replace('-', ' ')}</span> ({fault.confidence}%): {fault.recommendation}
                                                        </div>
                                                      ))}
                                                    </div>
                                                  )}
                                                </div>
                                            ))}
                                         </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DeviceManager;
