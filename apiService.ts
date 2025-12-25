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
  
  // Hierarchy Mapping: Table 9, 10 & Attribute Groups
  if ('parentId' in mapped) { 
    const p = mapped.parentId;
    mapped.parent_id = (p === null || p === undefined || p === "null" || p === "" || p === "undefined") ? null : p; 
    delete mapped.parentId; 
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
  if (!data || typeof data !== 'object') {
    return data;
  }
  else if (Array.isArray(data)) {
    return data.map(mapIncoming);
  }

  // ============================================================================
  // 🔧 FIX APPLIED - 2025-12-25 - BEFORE FIX
  // Issue: parent_id field was not being transformed to parentId
  // Root Cause: API returns wrapper objects { count: 3, data: [...] }
  // The mapIncoming was trying to find parent_id in the wrapper object,
  // not in the individual items within the data array
  // ============================================================================

  // ============================================================================
  // ✨ NEW CODE ADDED - 2025-12-25 - AFTER FIX
  // Solution: Check if data.data exists and is an array
  // If yes, recursively call mapIncoming on each item
  // This ensures each item in the array gets the parent_id → parentId transformation
  // ============================================================================
  console.log('─────────────────────────────────mapped 123--'); 
  if (data.data && Array.isArray(data.data)) {
    return {
      ...data,
      data: data.data.map(mapIncoming)
    };
  }
  // ============================================================================
  // END OF NEW CODE - 2025-12-25
  // ============================================================================

  const mapped = { ...data };
  console.log('─────────────────────────────────mapped --'); 
  console.log(mapped);
  console.log('─────────────────────────────────mapped --');  
  
  if ('updated_at' in mapped) mapped.updatedAt = mapped.updated_at;
  if ('created_at' in mapped) mapped.createdAt = mapped.created_at;
  
  if ('category_id' in mapped) mapped.primaryCategory = mapped.category_id;
  if ('secondary_category_id' in mapped) mapped.secondaryCategory = mapped.secondary_category_id;
  
  if ('description' in mapped && !mapped.shortDescription) {
    const parts = mapped.description.split('\n\n');
    mapped.shortDescription = parts[0] || '';
    mapped.longDescription = parts.slice(1).join('\n\n') || '';
  }
/*
  if ('parent_id' in mapped) {
    const p = mapped.parent_id;
    mapped.parentId = (p === null || p === "null" || p === "undefined" || p === "") ? null : p;
  }
*/
    console.log('┌─────────────────────────────────before1 --');
    console.log('┌─────────────────────────────────before --mapped.group_id-', mapped.group_id);
	console.log('┌─────────────────────────────────before --mapped.parent_id-', mapped.parent_id);
if ('parent_id' in mapped) {
    const p = mapped.parent_id;
    const parentIdValue = (p === null || p === "null" || p === "undefined" || p === "") ? null : p;
    mapped.parentId = parentIdValue;
  
    console.log(
        '%c🔍 FIELD MAPPING DEBUG',
        'background: #4a5568; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold;'
    );
    console.log('┌─────────────────────────────────');
    console.log(`│ Field: parent_id → parentId`);
    console.log(`│ Original value:`, p);
    console.log(`│ Original type:`, typeof p);
    console.log(`│ Mapped value:`, parentIdValue);
    console.log(`│ Mapped type:`, typeof parentIdValue);
    console.log(`│ Transformation logic:`);
    console.log(`│   ${p} === null:`, p === null);
    console.log(`│   ${p} === "null":`, p === "null");
    console.log(`│   ${p} === "undefined":`, p === "undefined");
    console.log(`│   ${p} === "":`, p === "");
    console.log(`│   Result:`, parentIdValue);
    console.log('└─────────────────────────────────');
}

    console.log('┌─────────────────────────────────after ---');
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
    try { body = JSON.stringify(mapOutgoing(JSON.parse(body))); } catch {}
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

  if (!response.ok) throw new Error(await response.text());
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    const data = await response.json();
    return mapIncoming(data);
  }
  return null;
};

const getBaseUrl = (config: SystemConfig) => `${config.dbHost.trim().replace(/\/$/, '')}/api/data`;

export const api = {
  // Products
  async getProducts(config: SystemConfig) { return safeFetch(`${getBaseUrl(config)}/mdm_products`, config); },
  async createProduct(config: SystemConfig, data: any) { 
    const user = JSON.parse(localStorage.getItem('omnipim_user') || '{}');
    return safeFetch(`${getBaseUrl(config)}/mdm_products`, config, { method: 'POST', body: JSON.stringify({ ...data, created_by: user.id }) }); 
  },
  async updateProduct(config: SystemConfig, id: string, data: any) { return safeFetch(`${getBaseUrl(config)}/mdm_products/${encodeURIComponent(id)}`, config, { method: 'PUT', body: JSON.stringify(data) }); },
  async deleteProduct(config: SystemConfig, id: string) { return safeFetch(`${getBaseUrl(config)}/mdm_products/${encodeURIComponent(id)}`, config, { method: 'DELETE' }); },

  /**
   * CHANGE: Consolidate all category logic into mdm_categories.
   * Both primary and secondary categories now live in the same table, 
   * distinguished by the 'type' field.
   */
  async getCategories(config: SystemConfig) { return safeFetch(`${getBaseUrl(config)}/mdm_categories`, config); },
  async createCategory(config: SystemConfig, data: any) { return safeFetch(`${getBaseUrl(config)}/mdm_categories`, config, { method: 'POST', body: JSON.stringify(data) }); },
  async updateCategory(config: SystemConfig, id: string, data: any) { return safeFetch(`${getBaseUrl(config)}/mdm_categories/${encodeURIComponent(id)}`, config, { method: 'PUT', body: JSON.stringify(data) }); },
  async deleteCategory(config: SystemConfig, id: string) { return safeFetch(`${getBaseUrl(config)}/mdm_categories/${encodeURIComponent(id)}`, config, { method: 'DELETE' }); },

  /**
   * CHANGE: Secondary category methods now also point to mdm_categories.
   * This ensures that any existing logic still works while using the correct unified table.
   */
  async getSecondaryCategories(config: SystemConfig) { return safeFetch(`${getBaseUrl(config)}/mdm_categories`, config); },
  async createSecondaryCategory(config: SystemConfig, data: any) { return safeFetch(`${getBaseUrl(config)}/mdm_categories`, config, { method: 'POST', body: JSON.stringify(data) }); },
  async updateSecondaryCategory(config: SystemConfig, id: string, data: any) { return safeFetch(`${getBaseUrl(config)}/mdm_categories/${encodeURIComponent(id)}`, config, { method: 'PUT', body: JSON.stringify(data) }); },
  async deleteSecondaryCategory(config: SystemConfig, id: string) { return safeFetch(`${getBaseUrl(config)}/mdm_categories/${encodeURIComponent(id)}`, config, { method: 'DELETE' }); },

  // Attribute Groups (Best Practice UI)
  async getAttributeGroups(config: SystemConfig) { return safeFetch(`${getBaseUrl(config)}/mdm_attribute_groups`, config); },
  async createAttributeGroup(config: SystemConfig, data: any) { return safeFetch(`${getBaseUrl(config)}/mdm_attribute_groups`, config, { method: 'POST', body: JSON.stringify(data) }); },
  async updateAttributeGroup(config: SystemConfig, id: string, data: any) { return safeFetch(`${getBaseUrl(config)}/mdm_attribute_groups/${encodeURIComponent(id)}`, config, { method: 'PUT', body: JSON.stringify(data) }); },
  async deleteAttributeGroup(config: SystemConfig, id: string) { return safeFetch(`${getBaseUrl(config)}/mdm_attribute_groups/${encodeURIComponent(id)}`, config, { method: 'DELETE' }); },

  // Attributes (Table 11)
  async getAttributes(config: SystemConfig) { return safeFetch(`${getBaseUrl(config)}/mdm_attributes`, config); },
  async createAttribute(config: SystemConfig, data: any) { return safeFetch(`${getBaseUrl(config)}/mdm_attributes`, config, { method: 'POST', body: JSON.stringify(data) }); },
  async updateAttribute(config: SystemConfig, id: string, data: any) { return safeFetch(`${getBaseUrl(config)}/mdm_attributes/${encodeURIComponent(id)}`, config, { method: 'PUT', body: JSON.stringify(data) }); },
  async deleteAttribute(config: SystemConfig, id: string) { return safeFetch(`${getBaseUrl(config)}/mdm_attributes/${encodeURIComponent(id)}`, config, { method: 'DELETE' }); },

  // Security, Workflows, Users
  async getRoles(config: SystemConfig) { return safeFetch(`${getBaseUrl(config)}/mdm_roles`, config); },
  async createRole(config: SystemConfig, data: any) { return safeFetch(`${getBaseUrl(config)}/mdm_roles`, config, { method: 'POST', body: JSON.stringify(data) }); },
  async updateRole(config: SystemConfig, id: string, data: any) { return safeFetch(`${getBaseUrl(config)}/mdm_roles/${encodeURIComponent(id)}`, config, { method: 'PUT', body: JSON.stringify(data) }); },
  async deleteRole(config: SystemConfig, id: string) { return safeFetch(`${getBaseUrl(config)}/mdm_roles/${encodeURIComponent(id)}`, config, { method: 'DELETE' }); },
  async getCapabilities(config: SystemConfig) { return safeFetch(`${getBaseUrl(config)}/mdm_capabilities`, config); },
  async createCapability(config: SystemConfig, data: any) { return safeFetch(`${getBaseUrl(config)}/mdm_capabilities`, config, { method: 'POST', body: JSON.stringify(data) }); },
  async deleteCapability(config: SystemConfig, id: string) { return safeFetch(`${getBaseUrl(config)}/mdm_capabilities/${encodeURIComponent(id)}`, config, { method: 'DELETE' }); },
  async getPermissions(config: SystemConfig) { return safeFetch(`${getBaseUrl(config)}/mdm_permissions`, config); },
  async createPermission(config: SystemConfig, data: any) { return safeFetch(`${getBaseUrl(config)}/mdm_permissions`, config, { method: 'POST', body: JSON.stringify(data) }); },
  async deletePermission(config: SystemConfig, id: string) { return safeFetch(`${getBaseUrl(config)}/mdm_permissions/${encodeURIComponent(id)}`, config, { method: 'DELETE' }); },
  async getWorkflows(config: SystemConfig) { return safeFetch(`${getBaseUrl(config)}/mdm_workflows`, config); },
  async createWorkflow(config: SystemConfig, data: any) { return safeFetch(`${getBaseUrl(config)}/mdm_workflows`, config, { method: 'POST', body: JSON.stringify(data) }); },
  async updateWorkflow(config: SystemConfig, id: string, data: any) { return safeFetch(`${getBaseUrl(config)}/mdm_workflows/${encodeURIComponent(id)}`, config, { method: 'PUT', body: JSON.stringify(data) }); },
  async deleteWorkflow(config: SystemConfig, id: string) { return safeFetch(`${getBaseUrl(config)}/mdm_workflows/${encodeURIComponent(id)}`, config, { method: 'DELETE' }); },
  async getIntegrations(config: SystemConfig) { return safeFetch(`${getBaseUrl(config)}/mdm_integrations`, config); },
  async createIntegration(config: SystemConfig, data: any) { return safeFetch(`${getBaseUrl(config)}/mdm_integrations`, config, { method: 'POST', body: JSON.stringify(data) }); },
  async updateIntegration(config: SystemConfig, id: string, data: any) { return safeFetch(`${getBaseUrl(config)}/mdm_integrations/${encodeURIComponent(id)}`, config, { method: 'PUT', body: JSON.stringify(data) }); },
  async deleteIntegration(config: SystemConfig, id: string) { return safeFetch(`${getBaseUrl(config)}/mdm_integrations/${encodeURIComponent(id)}`, config, { method: 'DELETE' }); },
  async getUsers(config: SystemConfig) { return safeFetch(`${getBaseUrl(config)}/mdm_users`, config); }
};