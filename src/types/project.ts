export interface AppProject {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  formIds: string[];
  botIds: string[];
  docIds: string[];
  createdAt: number;
  updatedAt: number;
}
