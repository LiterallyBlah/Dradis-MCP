import { 
  Vulnerability, 
  CreateProject, 
  CreateVulnerabilityRequest, 
  VulnerabilityListItem,
  ProjectDetails,
  ContentBlock,
  UpdateContentBlock,
  DocumentProperty,
  CreateDocumentProperties,
  UpdateVulnerabilityRequest,
  ContentBlockSchema,
} from './types.js';
import { Config } from './config.js';
import * as fs from 'fs';
import { UnexpectedStateError } from 'fastmcp';

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

  private ConstructDradisResponse(data: any): string {
    let construction: string ='';
    Object.keys(data).forEach((key) => {
      construction += `#[${key}]#\r\n${data[key]}\r\n\r\n`;
    });
    return construction;
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

  async getVulnerabilities(projectId: number, page?: number): Promise<VulnerabilityListItem[]> {
    const url = page ? `/pro/api/issues?page=${page}` : '/pro/api/issues';
    const response = this.request<Vulnerability[]>(url, {
      headers: {
        'Dradis-Project-Id': projectId.toString(),
      },
    });
  
    return (await response).map((vulnerability: Vulnerability) => ({
      id: vulnerability.id,
      title: vulnerability.title,
      fields: {
        Rating: vulnerability.fields.Rating,
      },
    }));
  }

  async getAllVulnerabilityDetails(projectId: number, page?: number): Promise<VulnerabilityListItem[]> {
    const url = page ? `/pro/api/issues?page=${page}` : '/pro/api/issues';
    const response = this.request<Vulnerability[]>(url, {
      headers: {
        'Dradis-Project-Id': projectId.toString(),
      },
    });
  
    return (await response).map((vulnerability: Vulnerability) => ({
      id: vulnerability.id,
      title: vulnerability.title,
      fields: vulnerability.fields
    }));
  }

  async getVulnerability(projectId: number, vulnerabilityId: number): Promise<Vulnerability> {
    const response = await this.request<Vulnerability>(`/pro/api/issues/${vulnerabilityId}`, {
      headers: {
        'Dradis-Project-Id': projectId.toString(),
      },
    }); 
  
    let construction: any = { 
      id: response.id,
      author: response.author,
    };
  
    for (const key in response.fields) {
      construction[key] = response.fields[key];
    }
  
    return construction;
  }
  

  async createVulnerability(projectId: number, vulnerability: any): Promise<Vulnerability> {
    const compiledVulnerability = this.ConstructDradisResponse(vulnerability);
    return this.request<Vulnerability>('/pro/api/issues', {
      method: 'POST',
      headers: {
        'Dradis-Project-Id': projectId.toString(),
      },
      body: JSON.stringify({ issue: { text: compiledVulnerability } }),
    });
  }

  async updateVulnerability(
    projectId: number,
    issueId: number,
    vulnerability: UpdateVulnerabilityRequest
  ): Promise<Vulnerability> {
      let getVulnerability = await this.getVulnerability(projectId, issueId);
      
      // Clone the fetched vulnerability to avoid mutation
      const updatedVulnerability: Vulnerability = { ...getVulnerability };
  
      // Ensure only defined string properties are updated
      Object.entries(vulnerability).forEach(([key, value]) => {
          if (typeof value === "string" && value.trim() !== "" || value != undefined) {
              updatedVulnerability[key] = value;
          }
      });
  
      const dradisConstruct = this.ConstructDradisResponse(updatedVulnerability);
  
      return this.request<Vulnerability>(`/pro/api/issues/${issueId}`, {
          method: 'PUT',
          headers: {
              'Dradis-Project-Id': projectId.toString(),
          },
          body: JSON.stringify({ issue: { text: dradisConstruct } }),
      });
  }
  
  


  async getContentBlocks(projectId: number): Promise<{ id: number; fields: object }[]> {
    const blocks = await this.request<ContentBlock[]>(`/pro/api/content_blocks`, {
      headers: {
        'Dradis-Project-Id': projectId.toString(),
      },
    });
    
    return blocks.map(block => ({
      id: block.id,
      fields: block.fields
    }));
  }

  async getContentBlock(projectId: number, blockId: number): Promise<ContentBlock> {
    return this.request<ContentBlock>(`/pro/api/content_blocks/${blockId}`, {
      headers: {
        'Dradis-Project-Id': projectId.toString(),
      },
    });
  }

  async updateContentBlock(projectId: number, blockId: number, contentBlock: UpdateContentBlock): Promise<ContentBlock> {
    const contentBlockInfo = await this.getContentBlock(projectId, blockId)

    const content = (typeof contentBlock.content === 'object' && contentBlock.content !== null) ? Object.fromEntries(
        Object.entries(contentBlock.content).filter(
          ([, value]) => typeof value === 'string'
        )
      )
    : {};

    for (const key in contentBlock.content) {
      if (Object.prototype.hasOwnProperty.call(contentBlock.content, key)) {
        contentBlockInfo.fields[key] = (contentBlock.content as Record<string, string>)[key];
      }
    }    
    
    const dradisConstruct = await this.ConstructDradisResponse(contentBlockInfo.fields)
    return this.request<ContentBlock>(`/pro/api/content_blocks/${blockId}`, {
      method: 'PUT',
      headers: {
        'Dradis-Project-Id': projectId.toString(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content_block: {block_group: contentBlock.block_group, content: dradisConstruct} }),
    });
  }

  async getDocumentProperties(projectId: number): Promise<DocumentProperty[]> {
    return this.request<DocumentProperty[]>('/pro/api/document_properties', {
      headers: {
        'Dradis-Project-Id': projectId.toString(),
      },
    });
  }

  async upsertDocumentProperty(projectId: number, propertyName: string, value: string): Promise<DocumentProperty> {
    const docProperties = await this.getDocumentProperties(projectId)
    if (docProperties.some(property => propertyName in property && property[propertyName] !== undefined && property[propertyName] !== null)) {
      return this.request<DocumentProperty>(`/pro/api/document_properties/${propertyName}`, {
        method: 'PUT',
        headers: {
          'Dradis-Project-Id': projectId.toString(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_property: {
            value: value
          }
        }),
      });
      }
    return this.request<DocumentProperty>('/pro/api/document_properties', {
      method: 'POST',
      headers: {
      'Dradis-Project-Id': projectId.toString(),
      'Content-Type': 'application/json',
      },
      body: JSON.stringify({
      document_properties: { [propertyName]: value }
      }),
    });
  }
}
