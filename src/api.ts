import { ProjectDetails, Vulnerability, CreateProject } from './types';
import { Config } from './config';

export class DradisAPI {
  private apiToken: string;
  private baseUrl: string;

  constructor(config: Config) {
    this.apiToken = config.DRADIS_API_TOKEN;
    this.baseUrl = config.DRADIS_URL;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Token token=${this.apiToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  async getProjectDetails(projectId: number): Promise<ProjectDetails> {
    return this.request<ProjectDetails>(`/pro/api/projects/${projectId}`);
  }

  async createProject(project: CreateProject): Promise<ProjectDetails> {
    return this.request<ProjectDetails>('/pro/api/projects', {
      method: 'POST',
      body: JSON.stringify({ project }),
    });
  }

  async getVulnerability(projectId: number, vulnerabilityId: number): Promise<any> {
    return this.request(`/pro/api/issues/${vulnerabilityId}`, {
      headers: {
        'Dradis-Project-Id': projectId.toString(),
      },
    });
  }

  async createVulnerability(projectId: number, vulnerability: Vulnerability): Promise<any> {
    return this.request('/pro/api/issues', {
      method: 'POST',
      headers: {
        'Dradis-Project-Id': projectId.toString(),
      },
      body: JSON.stringify({ issue: vulnerability }),
    });
  }

  async getVulnerabilities(projectId: number): Promise<any[]> {
    return this.request(`/pro/api/issues`, {
      headers: {
        'Dradis-Project-Id': projectId.toString(),
      },
    });
  }

  async updateVulnerability(projectId: number, issueId: number, vulnerability: Vulnerability): Promise<any> {
    return this.request(`/pro/api/issues/${issueId}`, {
      method: 'PUT',
      headers: {
        'Dradis-Project-Id': projectId.toString(),
      },
      body: JSON.stringify({ issue: vulnerability }),
    });
  }
}
