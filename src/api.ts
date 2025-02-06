import { 
  Vulnerability, 
  CreateProject, 
  CreateVulnerabilityRequest, 
  VulnerabilityListItem,
  ProjectDetails,
  ContentBlock,
  UpdateContentBlock,
  DocumentProperty,
  UpdateDocumentProperty,
} from './types.js';
import { Config } from './config.js';

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

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      let errorBody: unknown;
      try {
        errorBody = await response.clone().json();
      } catch {
        errorBody = await response.clone().text();
      }

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status} ${response.statusText} for ${url}\n` +
          `Response: ${typeof errorBody === 'string' ? errorBody : JSON.stringify(errorBody)}`
        );
      }

      return await response.json() as T;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Network error while accessing ${url}: ${String(error)}`);
    }
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

  async getVulnerability(projectId: number, vulnerabilityId: number): Promise<Vulnerability> {
    return this.request<Vulnerability>(`/pro/api/issues/${vulnerabilityId}`, {
      headers: {
        'Dradis-Project-Id': projectId.toString(),
      },
    });
  }

  async createVulnerability(projectId: number, vulnerability: CreateVulnerabilityRequest): Promise<Vulnerability> {
    return this.request<Vulnerability>('/pro/api/issues', {
      method: 'POST',
      headers: {
        'Dradis-Project-Id': projectId.toString(),
      },
      body: JSON.stringify({ issue: vulnerability }),
    });
  }

  async getVulnerabilities(projectId: number, page?: number): Promise<VulnerabilityListItem[]> {
    const url = page ? `/pro/api/issues?page=${page}` : '/pro/api/issues';
    return this.request<VulnerabilityListItem[]>(url, {
      headers: {
        'Dradis-Project-Id': projectId.toString(),
      },
    });
  }

  async updateVulnerability(projectId: number, issueId: number, vulnerability: CreateVulnerabilityRequest): Promise<Vulnerability> {
    return this.request<Vulnerability>(`/pro/api/issues/${issueId}`, {
      method: 'PUT',
      headers: {
        'Dradis-Project-Id': projectId.toString(),
      },
      body: JSON.stringify({ issue: vulnerability }),
    });
  }

  async getContentBlocks(projectId: number): Promise<{ id: number; title: string; content: string }[]> {
    const blocks = await this.request<ContentBlock[]>(`/pro/api/content_blocks`, {
      headers: {
        'Dradis-Project-Id': projectId.toString(),
      },
    });
    
    return blocks.map(block => ({
      id: block.id,
      title: block.title,
      content: block.content
    }));
  }

  async updateContentBlock(projectId: number, blockId: number, contentBlock: UpdateContentBlock): Promise<ContentBlock> {
    return this.request<ContentBlock>(`/pro/api/content_blocks/${blockId}`, {
      method: 'PUT',
      headers: {
        'Dradis-Project-Id': projectId.toString(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content_block: contentBlock }),
    });
  }

  async getDocumentProperties(projectId: number): Promise<DocumentProperty[]> {
    return this.request<DocumentProperty[]>('/pro/api/document_properties', {
      headers: {
        'Dradis-Project-Id': projectId.toString(),
      },
    });
  }

  async updateDocumentProperty(projectId: number, propertyName: string, update: UpdateDocumentProperty): Promise<DocumentProperty> {
    return this.request<DocumentProperty>(`/pro/api/document_properties/${propertyName}`, {
      method: 'PUT',
      headers: {
        'Dradis-Project-Id': projectId.toString(),
      },
      body: JSON.stringify({ document_property: update }),
    });
  }
}
