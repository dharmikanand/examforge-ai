export type IntelligenceMode = 'survival' | 'weaponizer' | 'trap-detector' | 'mcq-generator';

export interface FileData {
  name: string;
  type: string;
  size: number;
  dataUri?: string;
  textContent?: string;
}