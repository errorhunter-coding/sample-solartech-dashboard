
export enum ViewState {
  Dashboard = 'Dashboard',
  Devices = 'Devices',
  Analysis = 'Analysis',
  Assistant = 'Assistant',
  Maintenance = 'Maintenance',
  Settings = 'Settings'
}

export enum DeviceStatus {
  Online = 'Online',
  Offline = 'Offline',
  Warning = 'Warning',
  Maintenance = 'Maintenance'
}

export interface PanelData {
  id: string;
  group?: string; // String assignment or sub-group
  power: number; // W
  efficiency: number; // %
  status: 'Normal' | 'Low Efficiency' | 'Offline';
  history?: { time: string; power: number }[];
}

export interface ESP32Device {
  id: string;
  name: string;
  location: string;
  status: DeviceStatus;
  voltage: number; // V
  current: number; // A
  temperature: number; // Celsius
  power: number; // W
  lastUpdated: Date;
  group?: string;
  panels?: PanelData[];
}

export interface FaultRecord {
  id: string;
  date: Date;
  imageUrl: string;
  faults: IdentifiedFault[];
}

export interface IdentifiedFault {
  type: 'micro-crack' | 'hotspot' | 'soiling' | 'delamination' | 'discoloration' | 'corrosion' | 'other';
  confidence: number; // 0-100
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  recommendation: string;
}

export enum TaskPriority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Critical = 'Critical'
}

export interface Technician {
  id: string;
  name: string;
  role: string;
  status: 'Available' | 'Busy' | 'On Leave';
  initials: string;
}

export interface MaintenanceLog {
  id: string;
  timestamp: Date;
  message: string;
  author: string;
  type: 'system' | 'user';
}

export interface MaintenanceTask {
  id: string;
  title: string;
  deviceId?: string;
  location?: string;
  priority: TaskPriority;
  status: 'Pending' | 'Assigned' | 'Completed';
  assignedTechId?: string;
  date: string; // YYYY-MM-DD
  aiInsight: string; // The "Why" from AI
  logs?: MaintenanceLog[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface AppSettings {
  language: string;
  darkMode: boolean;
  notifications: {
    email: boolean;
    push: boolean;
    critical: boolean;
    weeklyReport: boolean;
  };
}
