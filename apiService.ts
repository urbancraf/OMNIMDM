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
    
    // DEBUG LOG
    console.log('🔄 mapOutgoing parent_id:', {
      original: p,
      mapped: mapped.parent_id,
      type: typeof mapped.parent_id
    });
  }
  
  // FIX: Ensure 'type' field is preserved for category taxonomy discrimination
  if ('type' in mapped) {
    mapped.type = mapped.type || 'Primary'; // Default to Primary if not specified
    console.log('🔄 mapOutgoing type:', mapped.type);
  }
  
  // Table 11: mdm_attributes - Map Group ID
  if ('groupId' in mapped) {
    mapped.group_id = mapped.groupId || null;
    delete mapped.groupId;
  }

  // Common Timestamps
  if ('updatedAt' in mapped) { mapped.updated_at = mapped.updatedAt; delete mapped.updatedAt; }
  if ('createdAt' in mapped) { mapped.created_at = mapped.createdAt; delete mapped.createdAt; }

  if ('attributes' in mapped && Array.isArray(mapped.attributes)) {
    mapped.attributes = JSON.stringify(mapped.attributes);
  }
  if ('images' in mapped && Array.isArray(mapped.images)) {
    mapped.images = JSON.stringify(mapped.images);
  }
  if ('config' in mapped && typeof mapped.config === 'object') {
    mapped.config = JSON.stringify(mapped.config);
  }

  return mapped;
};

const mapIncoming = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(mapIncoming);
  
  const mapped = { ...data };
  
  if ('updated_at' in mapped) mapped.updatedAt = mapped.updated_at;
  if ('created_at' in mapped) mapped.createdAt = mapped.created_at;
  
  if ('category_id' in mapped) mapped.primaryCategory = mapped.category_id;
  if ('secondary_category_id' in mapped) mapped.secondaryCategory = mapped.secondary_category_id;
  
  if ('description' in mapped && !mapped.shortDescription) {
    const parts = mapped.description.split('\n\n');
    mapped.shortDescription = parts[0] || '';
    mapped.longDescription = parts.slice(1).join('\n\n') || '';
  }

  // FIX: Map parent_id from database to parentId for UI
  if ('parent_id' in mapped) {
    const p = mapped.parent_id;
    mapped.parentId = (p === null || p === "null" || p === "undefined" || p === "") ? null : p;
    
    // DEBUG LOG
    console.log('🔄 mapIncoming parent_id:', {
      original: p,
      mapped: mapped.parentId,
      type: typeof mapped.parentId
    });
  }

  // FIX: Preserve 'type' field for category discrimination
  if ('type' in mapped) {
    mapped.type = mapped.type || 'Primary';
    console.log('🔄 mapIncoming type:', mapped.type);
  }

  if ('group_id' in mapped) {
    mapped.groupId = mapped.group_id;
  }

  if ('permission_key' in mapped) mapped.code = mapped.permission_key;
  
  const parseJsonSafe = (val: any) => {
    if (!val) return [];
    if (typeof val === 'object') return val;
    try { return JSON.parse(val); } catch { return []; }
  };

  if ('attributes' in mapped) mapped.attributes = parseJsonSafe(mapped.attributes);
  if ('images' in mapped) mapped.images = parseJsonSafe(mapped.images);
  if ('config' in mapped) {
    mapped.config = typeof mapped.config === 'string' ? JSON.parse(mapped.config) : mapped.config;
  }
  
  return mapped;
};

const ensureToken = async (config: SystemConfig): Promise<string | null> => {
  if (cachedToken) return cachedToken;
  if (refreshPromise) return refreshPromise;
  
  refreshPromise = (async () => {
    try {
      const loginUrl = `${config.dbHost.replace(/\/$/, '')}/login`;
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: config.dbUser, password: config.dbPass })
      });
      const data = await response.json();
      const token = data.token || data.accessToken || data.data?.token;
      if (token) {
        cachedToken = token;
        localStorage.setItem('omnipim_infra_token', token);
        return token;
      }
      return null;
    } catch { return null; }
  })();

  const token = await refreshPromise;
  refreshPromise = null;
  return token;
};

const safeFetch = async (url: string, config: SystemConfig, options: RequestInit = {}): Promise<any> => {
  const token = await ensureToken(config);
  if (!token) throw new Error("AUTH_FAILURE");

  let body = options.body;
  if (body && typeof body === 'string') {
    try { 
      const parsedBody = JSON.parse(body);
      const mappedBody = mapOutgoing(parsedBody);
      body = JSON.stringify(mappedBody);
      
      // DEBUG LOG for category operations
      if (url.includes('mdm_categories')) {
        console.log('📤 API Request:', {
          url,
          method: options.method,
          body: mappedBody
        });
      }
    } catch {}
  }

  const response = await fetch(url, {
    ...options,
    body,
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-INFRA-TOKEN': token,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ API Error:', errorText);
    throw new Error(errorText);
  }
  
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    const data = await response.json();
    const mapped = mapIncoming(data);
    
    // DEBUG LOG for category responses
    if (url.includes('mdm_categories') && options.method === 'GET') {
      console.log('📥 API Response:', {
        url,
        count: Array.isArray(mapped) ? mapped.length : 1,
        sample: Array.isArray(mapped) ? mapped.slice(0, 2) : mapped
      });
    }
    
    return mapped;
  }
  return null;
};

const getBaseUrl = (config: SystemConfig) => `${config.dbHost.trim().replace(/\/$/, '')}/api/data`;

export const api = {
  // Products
  async getProducts(config: SystemConfig) { 
    return safeFetch(`${getBaseUrl(config)}/mdm_products`, config); 
  },
  async createProduct(config: SystemConfig, data: any) { 
    const user = JSON.parse(localStorage.getItem('omnipim_user') || '{}');
    return safeFetch(`${getBaseUrl(config)}/mdm_products`, config, { 
      method: 'POST', 
      body: JSON.stringify({ ...data, created_by: user.id }) 
    }); 
  },
  async updateProduct(config: SystemConfig, id: string, data: any) { 
    return safeFetch(`${getBaseUrl(config)}/mdm_products/${encodeURIComponent(id)}`, config, { 
      method: 'PUT', 
      body: JSON.stringify(data) 
    }); 
  },
  async deleteProduct(config: SystemConfig, id: string) { 
    return safeFetch(`${getBaseUrl(config)}/mdm_products/${encodeURIComponent(id)}`, config, { 
      method: 'DELETE' 
    }); 
  },

  // Categories - SINGLE TABLE APPROACH
  async getCategories(config: SystemConfig) { 
    console.log('🔵 Fetching ALL categories from mdm_categories');
    return safeFetch(`${getBaseUrl(config)}/mdm_categories`, config); 
  },
  async createCategory(config: SystemConfig, data: any) { 
    console.log('🔵 Creating category:', data);
    return safeFetch(`${getBaseUrl(config)}/mdm_categories`, config, { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }); 
  },
  async updateCategory(config: SystemConfig, id: string, data: any) { 
    console.log('🔵 Updating category:', id, data);
    return safeFetch(`${getBaseUrl(config)}/mdm_categories/${encodeURIComponent(id)}`, config, { 
      method: 'PUT', 
      body: JSON.stringify(data) 
    }); 
  },
  async deleteCategory(config: SystemConfig, id: string) { 
    console.log('🔵 Deleting category:', id);
    return safeFetch(`${getBaseUrl(config)}/mdm_categories/${encodeURIComponent(id)}`, config, { 
      method: 'DELETE' 
    }); 
  },

  // DEPRECATED: Secondary Categories methods (keep for backward compatibility but not used)
  // These are kept only to prevent errors if old code references them
  async getSecondaryCategories(config: SystemConfig) { 
    console.warn('⚠️ DEPRECATED: getSecondaryCategories() - Use getCategories() instead');
    return []; 
  },
  async createSecondaryCategory(config: SystemConfig, data: any) { 
    console.warn('⚠️ DEPRECATED: createSecondaryCategory() - Use createCategory() instead');
    return null; 
  },
  async updateSecondaryCategory(config: SystemConfig, id: string, data: any) { 
    console.warn('⚠️ DEPRECATED: updateSecondaryCategory() - Use updateCategory() instead');
    return null; 
  },
  async deleteSecondaryCategory(config: SystemConfig, id: string) { 
    console.warn('⚠️ DEPRECATED: deleteSecondaryCategory() - Use deleteCategory() instead');
    return null; 
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

  // Attributes
  async getAttributes(config: SystemConfig) { 
    return safeFetch(`${getBaseUrl(config)}/mdm_attributes`, config); 
  },
  async createAttribute(config: SystemConfig, data: any) { 
    return safeFetch(`${getBaseUrl(config)}/mdm_attributes`, config, { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }); 
  },
  async updateAttribute(config: SystemConfig, id: string, data: any) { 
    return safeFetch(`${getBaseUrl(config)}/mdm_attributes/${encodeURIComponent(id)}`, config, { 
      method: 'PUT', 
      body: JSON.stringify(data) 
    }); 
  },
  async deleteAttribute(config: SystemConfig, id: string) { 
    return safeFetch(`${getBaseUrl(config)}/mdm_attributes/${encodeURIComponent(id)}`, config, { 
      method: 'DELETE' 
    }); 
  },

  // Security, Workflows, Users
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
  async createCapability(config: SystemConfig, data: any) { 
    return safeFetch(`${getBaseUrl(config)}/mdm_capabilities`, config, { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }); 
  },
  async deleteCapability(config: SystemConfig, id: string) { 
    return safeFetch(`${getBaseUrl(config)}/mdm_capabilities/${encodeURIComponent(id)}`, config, { 
      method: 'DELETE' 
    }); 
  },
  async getPermissions(config: SystemConfig) { 
    return safeFetch(`${getBaseUrl(config)}/mdm_permissions`, config); 
  },
  async createPermission(config: SystemConfig, data: any) { 
    return safeFetch(`${getBaseUrl(config)}/mdm_permissions`, config, { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }); 
  },
  async deletePermission(config: SystemConfig, id: string) { 
    return safeFetch(`${getBaseUrl(config)}/mdm_permissions/${encodeURIComponent(id)}`, config, { 
      method: 'DELETE' 
    }); 
  },
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
  },
  async deleteIntegration(config: SystemConfig, id: string) { 
    return safeFetch(`${getBaseUrl(config)}/mdm_integrations/${encodeURIComponent(id)}`, config, { 
      method: 'DELETE' 
    }); 
  },
  async getUsers(config: SystemConfig) { 
    return safeFetch(`${getBaseUrl(config)}/mdm_users`, config); 
  }
};