import { SystemConfig, User } from './types.ts';

// Cache for the infrastructure token
let cachedToken: string | null = localStorage.getItem('omnipim_infra_token');
let refreshPromise: Promise<string | null> | null = null;

const mapOutgoing = (data: any) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return data;
  const mapped = { ...data };
  
  if ('code' in mapped) { mapped.permission_key = mapped.code; delete mapped.code; }

  // Table 7: mdm_products mapping
  if ('primaryCategory' in mapped) { mapped.category_id = mapped.primaryCategory; delete mapped.primaryCategory; }
  if ('secondaryCategory' in mapped) { mapped.secondary_category_id = mapped.secondaryCategory; delete mapped.secondaryCategory; }
  
  if ('shortDescription' in mapped || 'longDescription' in mapped) {
    mapped.description = `${mapped.shortDescription || ''}\n\n${mapped.longDescription || ''}`.trim();
    delete mapped.shortDescription;
    delete mapped.longDescription;
  }
  
  // Hierarchy Mapping: Table 9 (Categories) - CRITICAL FIX
  if ('parentId' in mapped) { 
    const p = mapped.parentId;
    // FIX: Ensure parent_id is explicitly sent as null if it's missing or nullish
    mapped.parent_id = (p === null || p === undefined || p === "null" || p === "" || p === "undefined") ? null : p;
    delete mapped.parentId; 
  }

  return mapped;
};

const mapIncoming = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  
  // FIX 1: Recursively map arrays
  if (Array.isArray(data)) {
    return data.map(mapIncoming);
  }

  // FIX 2: Handle Backend Wrapper { data: [...] }
  // This ensures items inside the data property are mapped correctly
  if (data.data && Array.isArray(data.data)) {
    return {
      ...data,
      data: data.data.map(mapIncoming)
    };
  }

  const mapped = { ...data };

  // Permission mapping
  if ('permission_key' in mapped) { mapped.code = mapped.permission_key; }

  // Product category mapping
  if ('category_id' in mapped) { mapped.primaryCategory = mapped.category_id; }
  if ('secondary_category_id' in mapped) { mapped.secondaryCategory = mapped.secondary_category_id; }

  // Description splitting
  if ('description' in mapped && typeof mapped.description === 'string') {
    const parts = mapped.description.split('\n\n');
    mapped.shortDescription = parts[0] || '';
    mapped.longDescription = parts.slice(1).join('\n\n') || '';
  }

  // FIX 3: Hierarchy Mapping (Resilient parentId)
  // Ensures the UI can match string IDs in the currentPath stack
  if ('parent_id' in mapped) { 
    const p = mapped.parent_id;
    mapped.parentId = (p === null || p === undefined || p === "null" || p === "undefined" || String(p).trim() === "") ? null : String(p);
  }
  console.log("Mapped Data:", mapped);
  return mapped;
};

const getBaseUrl = (config: SystemConfig) => {
  const host = config.apiHost.replace(/\/$/, '');
  const port = config.apiPort ? `:${config.apiPort}` : '';
  return `${host}${port}/api/v1`;
};

const getAuthHeader = (config: SystemConfig) => {
  return `Basic ${btoa(`${config.apiUser}:${config.apiPassword}`)}`;
};

async function getInfraToken(config: SystemConfig): Promise<string | null> {
  if (cachedToken) return cachedToken;
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${getBaseUrl(config)}/infrastructure/token`, {
        method: 'POST',
        headers: { 'Authorization': getAuthHeader(config) }
      });
      if (!response.ok) throw new Error('Failed to get infra token');
      const data = await response.json();
      const token = data.token || data.data?.token;
      if (token) {
        localStorage.setItem('omnipim_infra_token', token);
        cachedToken = token;
      }
      return token;
    } catch (error) {
      console.error('Infra Token Error:', error);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function safeFetch(url: string, config: SystemConfig, options: RequestInit = {}) {
  const token = await getInfraToken(config);
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': getAuthHeader(config),
    ...(token ? { 'X-Infra-Token': token } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(url, { ...options, headers });
  
  if (response.status === 401) {
    localStorage.removeItem('omnipim_infra_token');
    cachedToken = null;
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  const rawData = await response.json();
  return mapIncoming(rawData);
}

export const api = {
  // Products
  async getProducts(config: SystemConfig) { 
    return safeFetch(`${getBaseUrl(config)}/mdm_products`, config); 
  },
  async createProduct(config: SystemConfig, data: any) { 
    return safeFetch(`${getBaseUrl(config)}/mdm_products`, config, { 
      method: 'POST', 
      body: JSON.stringify(mapOutgoing(data)) 
    }); 
  },
  async updateProduct(config: SystemConfig, id: string, data: any) { 
    return safeFetch(`${getBaseUrl(config)}/mdm_products/${encodeURIComponent(id)}`, config, { 
      method: 'PUT', 
      body: JSON.stringify(mapOutgoing(data)) 
    }); 
  },
  async deleteProduct(config: SystemConfig, id: string) { 
    return safeFetch(`${getBaseUrl(config)}/mdm_products/${encodeURIComponent(id)}`, config, { 
      method: 'DELETE' 
    }); 
  },

  // Categories
  async getCategories(config: SystemConfig) { 
    return safeFetch(`${getBaseUrl(config)}/mdm_categories`, config); 
  },
  async createCategory(config: SystemConfig, data: any) { 
    return safeFetch(`${getBaseUrl(config)}/mdm_categories`, config, { 
      method: 'POST', 
      body: JSON.stringify(mapOutgoing(data)) 
    }); 
  },
  async updateCategory(config: SystemConfig, id: string, data: any) { 
    return safeFetch(`${getBaseUrl(config)}/mdm_categories/${encodeURIComponent(id)}`, config, { 
      method: 'PUT', 
      body: JSON.stringify(mapOutgoing(data)) 
    }); 
  },
  async deleteCategory(config: SystemConfig, id: string) { 
    return safeFetch(`${getBaseUrl(config)}/mdm_categories/${encodeURIComponent(id)}`, config, { 
      method: 'DELETE' 
    }); 
  },

  // Attributes
  async getAttributes(config: SystemConfig) { 
    return safeFetch(`${getBaseUrl(config)}/mdm_attributes`, config); 
  },
  async createAttribute(config: SystemConfig, data: any) { 
    return safeFetch(`${getBaseUrl(config)}/mdm_attributes`, config, { 
      method: 'POST', 
      body: JSON.stringify(mapOutgoing(data)) 
    }); 
  },
  async updateAttribute(config: SystemConfig, id: string, data: any) { 
    return safeFetch(`${getBaseUrl(config)}/mdm_attributes/${encodeURIComponent(id)}`, config, { 
      method: 'PUT', 
      body: JSON.stringify(mapOutgoing(data)) 
    }); 
  },
  async deleteAttribute(config: SystemConfig, id: string) { 
    return safeFetch(`${getBaseUrl(config)}/mdm_attributes/${encodeURIComponent(id)}`, config, { 
      method: 'DELETE' 
    }); 
  },

  // Attribute Groups
  async getAttributeGroups(config: SystemConfig) { 
    return safeFetch(`${getBaseUrl(config)}/mdm_attribute_groups`, config); 
  },
  async createAttributeGroup(config: SystemConfig, data: any) { 
    return safeFetch(`${getBaseUrl(config)}/mdm_attribute_groups`, config, { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }); 
  },
  async updateAttributeGroup(config: SystemConfig, id: string, data: any) { 
    return safeFetch(`${getBaseUrl(config)}/mdm_attribute_groups/${encodeURIComponent(id)}`, config, { 
      method: 'PUT', 
      body: JSON.stringify(data) 
    }); 
  },
  async deleteAttributeGroup(config: SystemConfig, id: string) { 
    return safeFetch(`${getBaseUrl(config)}/mdm_attribute_groups/${encodeURIComponent(id)}`, config, { 
      method: 'DELETE' 
    }); 
  },

  // Roles & Permissions
  async getRoles(config: SystemConfig) { 
    return safeFetch(`${getBaseUrl(config)}/mdm_roles`, config); 
  },
  async createRole(config: SystemConfig, data: any) { 
    return safeFetch(`${getBaseUrl(config)}/mdm_roles`, config, { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }); 
  },
  async updateRole(config: SystemConfig, id: string, data: any) { 
    return safeFetch(`${getBaseUrl(config)}/mdm_roles/${encodeURIComponent(id)}`, config, { 
      method: 'PUT', 
      body: JSON.stringify(data) 
    }); 
  },
  async deleteRole(config: SystemConfig, id: string) { 
    return safeFetch(`${getBaseUrl(config)}/mdm_roles/${encodeURIComponent(id)}`, config, { 
      method: 'DELETE' 
    }); 
  },

  async getCapabilities(config: SystemConfig) { 
    return safeFetch(`${getBaseUrl(config)}/mdm_capabilities`, config); 
  },
  async getPermissions(config: SystemConfig) { 
    return safeFetch(`${getBaseUrl(config)}/mdm_permissions`, config); 
  },
  async updatePermission(config: SystemConfig, id: string, data: any) { 
    return safeFetch(`${getBaseUrl(config)}/mdm_permissions/${encodeURIComponent(id)}`, config, { 
      method: 'PUT', 
      body: JSON.stringify(mapOutgoing(data)) 
    }); 
  },

  // Users
  async getUsers(config: SystemConfig) { 
    return safeFetch(`${getBaseUrl(config)}/mdm_users`, config); 
  },
  async createUser(config: SystemConfig, data: any) { 
    return safeFetch(`${getBaseUrl(config)}/mdm_users`, config, { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }); 
  },
  async updateUser(config: SystemConfig, id: string, data: any) { 
    return safeFetch(`${getBaseUrl(config)}/mdm_users/${encodeURIComponent(id)}`, config, { 
      method: 'PUT', 
      body: JSON.stringify(data) 
    }); 
  },
  async deleteUser(config: SystemConfig, id: string) { 
    return safeFetch(`${getBaseUrl(config)}/mdm_users/${encodeURIComponent(id)}`, config, { 
      method: 'DELETE' 
    }); 
  },

  // Workflows & Integrations
  async getWorkflows(config: SystemConfig) { 
    return safeFetch(`${getBaseUrl(config)}/mdm_workflows`, config); 
  },
  async createWorkflow(config: SystemConfig, data: any) { 
    return safeFetch(`${getBaseUrl(config)}/mdm_workflows`, config, { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }); 
  },
  async updateWorkflow(config: SystemConfig, id: string, data: any) { 
    return safeFetch(`${getBaseUrl(config)}/mdm_workflows/${encodeURIComponent(id)}`, config, { 
      method: 'PUT', 
      body: JSON.stringify(data) 
    }); 
  },
  async deleteWorkflow(config: SystemConfig, id: string) { 
    return safeFetch(`${getBaseUrl(config)}/mdm_workflows/${encodeURIComponent(id)}`, config, { 
      method: 'DELETE' 
    }); 
  },
  async getIntegrations(config: SystemConfig) { 
    return safeFetch(`${getBaseUrl(config)}/mdm_integrations`, config); 
  },
  async createIntegration(config: SystemConfig, data: any) { 
    return safeFetch(`${getBaseUrl(config)}/mdm_integrations`, config, { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }); 
  },
  async updateIntegration(config: SystemConfig, id: string, data: any) { 
    return safeFetch(`${getBaseUrl(config)}/mdm_integrations/${encodeURIComponent(id)}`, config, { 
      method: 'PUT', 
      body: JSON.stringify(data) 
    }); 
  }
};