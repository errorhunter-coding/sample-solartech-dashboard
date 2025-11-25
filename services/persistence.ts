import { ESP32Device, DeviceStatus, Technician, MaintenanceTask, TaskPriority, AppSettings } from '../types';

const KEYS = {
  DEVICES: 'solartech_devices',
  TECHNICIANS: 'solartech_technicians',
  TASKS: 'solartech_tasks',
  SETTINGS: 'solartech_settings'
};

// --- Mock Data Generators ---

const mockHistoryNormal = [
  { time: '10:00', power: 45 }, { time: '10:15', power: 48 }, { time: '10:30', power: 50 }, { time: '10:45', power: 52 }, { time: '11:00', power: 53 }
];
const mockHistoryLow = [
  { time: '10:00', power: 30 }, { time: '10:15', power: 28 }, { time: '10:30', power: 25 }, { time: '10:45', power: 20 }, { time: '11:00', power: 18 }
];
const mockHistoryOffline = [
  { time: '10:00', power: 0 }, { time: '10:15', power: 0 }, { time: '10:30', power: 0 }, { time: '10:45', power: 0 }, { time: '11:00', power: 0 }
];

const DEFAULT_DEVICES: ESP32Device[] = [
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
        { 
          id: 'P1', group: 'West String', power: 45, efficiency: 85, status: 'Low Efficiency', history: mockHistoryLow,
          recentFaults: [{ type: 'micro-crack', confidence: 88, severity: 'Medium', recommendation: 'Monitor for propagation. Schedule thermal inspection.' }]
        },
        { 
          id: 'P2', group: 'West String', power: 30, efficiency: 60, status: 'Low Efficiency', history: mockHistoryLow.map(h => ({...h, power: h.power - 10})),
          recentFaults: [{ type: 'soiling', confidence: 95, severity: 'High', recommendation: 'Clean panel surface immediately to restore efficiency.' }]
        },
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
];

const DEFAULT_TECHNICIANS: Technician[] = [
    { id: 't1', name: 'Sarah Jenkins', role: 'Senior Electrician', status: 'Available', initials: 'SJ' },
    { id: 't2', name: 'Mike Ross', role: 'Panel Specialist', status: 'Busy', initials: 'MR' },
    { id: 't3', name: 'Alex Thompson', role: 'Maintenance Tech', status: 'Available', initials: 'AT' },
];

const DEFAULT_TASKS: MaintenanceTask[] = [
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
];

const DEFAULT_SETTINGS: AppSettings = {
    language: 'English (US)',
    darkMode: false,
    notifications: {
      email: true,
      push: true,
      critical: true,
      weeklyReport: false
    }
};

// Helper to handle Date serialization
const dateReviver = (key: string, value: any) => {
    // Simple regex to detect ISO date strings
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
        return new Date(value);
    }
    return value;
};

export const StorageService = {
    getDevices: () => {
        const data = localStorage.getItem(KEYS.DEVICES);
        return data ? JSON.parse(data, dateReviver) : DEFAULT_DEVICES;
    },
    saveDevices: (data: ESP32Device[]) => localStorage.setItem(KEYS.DEVICES, JSON.stringify(data)),
    
    getTechnicians: () => {
        const data = localStorage.getItem(KEYS.TECHNICIANS);
        return data ? JSON.parse(data, dateReviver) : DEFAULT_TECHNICIANS;
    },
    saveTechnicians: (data: Technician[]) => localStorage.setItem(KEYS.TECHNICIANS, JSON.stringify(data)),

    getTasks: () => {
        const data = localStorage.getItem(KEYS.TASKS);
        return data ? JSON.parse(data, dateReviver) : DEFAULT_TASKS;
    },
    saveTasks: (data: MaintenanceTask[]) => localStorage.setItem(KEYS.TASKS, JSON.stringify(data)),

    getSettings: () => {
        const data = localStorage.getItem(KEYS.SETTINGS);
        return data ? JSON.parse(data, dateReviver) : DEFAULT_SETTINGS;
    },
    saveSettings: (data: AppSettings) => localStorage.setItem(KEYS.SETTINGS, JSON.stringify(data))
};
