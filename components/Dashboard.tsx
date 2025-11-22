
import React, { useState } from 'react';
import { 
  Sun, 
  CloudRain, 
  Wind, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronDown
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { ESP32Device, DeviceStatus } from '../types';

// Base Mock Data
const SYSTEM_POWER_DATA = [
  { time: '06:00', actual: 0, predicted: 0 },
  { time: '08:00', actual: 120, predicted: 150 },
  { time: '10:00', actual: 450, predicted: 480 },
  { time: '12:00', actual: 890, predicted: 950 },
  { time: '14:00', actual: 820, predicted: 900 },
  { time: '16:00', actual: 400, predicted: 450 },
  { time: '18:00', actual: 100, predicted: 80 },
];

const weatherForecast = [
  { time: 'Now', temp: 24, icon: Sun },
  { time: '15:00', temp: 25, icon: Sun },
  { time: '16:00', temp: 23, icon: CloudRain },
  { time: '17:00', temp: 21, icon: Wind },
  { time: '18:00', temp: 20, icon: CloudRain },
];

interface DashboardProps {
  devices: ESP32Device[];
  onViewAll?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ devices, onViewAll }) => {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('all');
  
  const activeDevices = devices.filter(d => d.status === DeviceStatus.Online).length;
  const totalPower = devices.reduce((acc, curr) => acc + curr.power, 0);

  // Get unique groups for dropdown
  const deviceGroups = Array.from(new Set(devices.map(d => d.group || 'Other')));

  // Generate chart data based on selection
  const getChartData = () => {
    if (selectedDeviceId === 'all') {
      return SYSTEM_POWER_DATA;
    }

    // Simulate individual device data
    // We use the device index to create slight variations so they don't look identical
    const deviceIndex = devices.findIndex(d => d.id === selectedDeviceId);
    // Base scale: assumes approx 4 devices make up the total, so ~0.25 scale
    // Variance: +/- 10% based on index
    const variance = 1.0 + ((deviceIndex % 3) - 1) * 0.1;
    const scale = 0.25 * variance;

    return SYSTEM_POWER_DATA.map(item => ({
      time: item.time,
      actual: Math.floor(item.actual * scale),
      predicted: Math.floor(item.predicted * scale)
    }));
  };

  const chartData = getChartData();
  
  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-32 relative overflow-hidden">
           <div className="absolute right-0 top-0 p-4 opacity-5">
             <Zap size={100} />
           </div>
           <div>
             <p className="text-slate-500 text-sm font-medium">Total Output</p>
             <h3 className="text-3xl font-bold text-slate-800 mt-1">{(totalPower / 1000).toFixed(2)} kW</h3>
           </div>
           <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded-full">
             <span>+12% vs yesterday</span>
           </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-32">
           <div>
             <p className="text-slate-500 text-sm font-medium">Active Arrays</p>
             <h3 className="text-3xl font-bold text-slate-800 mt-1">{activeDevices} <span className="text-slate-400 text-lg font-normal">/ {devices.length}</span></h3>
           </div>
           <div className="flex items-center gap-2">
             <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
               <div className="h-full bg-primary-500 rounded-full" style={{ width: `${(activeDevices/devices.length)*100}%`}}></div>
             </div>
           </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-32">
           <div>
             <p className="text-slate-500 text-sm font-medium">System Health</p>
             <h3 className="text-3xl font-bold text-slate-800 mt-1">98%</h3>
           </div>
           <div className="flex items-center gap-1 text-xs text-slate-500">
             <CheckCircle2 size={14} className="text-emerald-500" />
             <span>All systems nominal</span>
           </div>
        </div>

        <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-5 rounded-2xl shadow-lg shadow-primary-200 text-white flex flex-col justify-between h-32">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-primary-100 text-sm font-medium">Weather Impact</p>
               <h3 className="text-2xl font-bold mt-1">High Efficiency</h3>
             </div>
             <Sun className="text-yellow-300 animate-pulse" />
           </div>
           <p className="text-xs text-primary-100 bg-white/10 px-2 py-1 rounded-lg w-fit">
             Clear skies projected until 16:00
           </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Power Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Power Generation</h2>
              <p className="text-sm text-slate-500">Predicted vs Actual Output</p>
            </div>
            <div className="relative">
              <select 
                value={selectedDeviceId} 
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 block w-full pl-4 pr-10 py-2 outline-none cursor-pointer"
              >
                <option value="all">System Total</option>
                {deviceGroups.map(group => (
                  <optgroup key={group} label={group}>
                     {devices.filter(d => (d.group || 'Other') === group).map(device => (
                       <option key={device.id} value={device.id}>{device.name}</option>
                     ))}
                  </optgroup>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#0ea5e9" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorActual)" 
                  name={selectedDeviceId === 'all' ? "System Actual (W)" : "Panel Actual (W)"} 
                  animationDuration={1000}
                />
                <Line 
                  type="monotone" 
                  dataKey="predicted" 
                  stroke="#94a3b8" 
                  strokeDasharray="5 5" 
                  strokeWidth={2} 
                  dot={false} 
                  name={selectedDeviceId === 'all' ? "System Predicted (W)" : "Panel Predicted (W)"}
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weather Widget */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Hourly Forecast</h2>
          <div className="space-y-4">
            {weatherForecast.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-slate-500 w-12">{item.time}</span>
                  <item.icon size={20} className={item.icon === Sun ? "text-yellow-500" : "text-slate-400"} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">{item.temp}°C</span>
                  <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-yellow-400 to-orange-500" 
                      style={{ width: `${(item.temp / 30) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
             <div className="flex gap-3 items-start">
               <AlertTriangle className="text-blue-500 mt-0.5 flex-shrink-0" size={18} />
               <div>
                 <h4 className="text-sm font-bold text-blue-800">Cloud Cover Alert</h4>
                 <p className="text-xs text-blue-600 mt-1 leading-relaxed">
                   Efficiency drop of ~15% expected at 16:00 due to incoming cloud front.
                 </p>
               </div>
             </div>
          </div>
        </div>
      </div>

      {/* Device Grid Preview */}
      <div>
        <div className="flex justify-between items-center mb-4">
           <h2 className="text-lg font-bold text-slate-800">Live Device Status</h2>
           <button 
             onClick={onViewAll} 
             className="text-sm text-primary-600 font-medium hover:text-primary-700"
           >
             View All
           </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {devices.slice(0, 4).map((device) => (
            <div key={device.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${device.status === DeviceStatus.Online ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                  <span className="font-semibold text-slate-700">{device.name}</span>
                </div>
                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] uppercase font-bold">ESP32</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 p-2 rounded-lg">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Power</p>
                  <p className="text-sm font-bold text-slate-800">{device.power} W</p>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Temp</p>
                  <p className="text-sm font-bold text-slate-800">{device.temperature}°C</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
