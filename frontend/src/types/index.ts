export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface VitalsSnapshot {
  heart_rate: number;
  systolic_bp: number;
  diastolic_bp: number;
  spo2: number;
  temperature: number;
  respiratory_rate: number;
  wbc: number;
  lactate: number;
  gcs: number;
}

export interface Patient {
  patient_id: string;
  patient_name: string;
  age: number;
  ward: string;
  timestamp: string;
  heart_rate: number;
  systolic_bp: number;
  diastolic_bp: number;
  spo2: number;
  temperature: number;
  respiratory_rate: number;
  wbc: number;
  lactate: number;
  gcs: number;
  risk_level: RiskLevel;
  risk_score: number;
  qsofa_score: number;
  flags: string[];
}

export interface Alert {
  alert_id: string;
  patient_id: string;
  patient_name: string;
  ward: string;
  timestamp: string;
  risk_level: RiskLevel;
  risk_score: number;
  qsofa_score: number;
  flags: string[];
  vitals_snapshot: VitalsSnapshot;
}

export interface VitalsHistoryPoint {
  timestamp: string;
  heart_rate: number;
  systolic_bp: number;
  spo2: number;
  temperature: number;
  respiratory_rate: number;
  lactate: number;
  risk_score: number;
}

export interface ICUStats {
  total_patients: number;
  critical: number;
  high: number;
  stable: number;
}

export interface WSMessage {
  type: "snapshot" | "vitals_update" | "alert";
  patients?: Patient[];
  alerts?: Alert[];
  vitals_history?: Record<string, VitalsHistoryPoint[]>;
  stats?: ICUStats;
  vitals?: Patient;
  alert?: Alert;
  timestamp?: string;
}
