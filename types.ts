
export enum ProductStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export enum AttributeType {
  DESCRIPTIVE = 'DESCRIPTIVE',
  SPECIFICATION = 'SPECIFICATION',
  FACETABLE = 'FACETABLE'
}

export interface ProductAttribute {
  key: string;
  value: string;
}

export interface ProductImage {
  id: string;
  url: string;
  isPrimary: boolean;
}

export interface WorkflowStep {
  id: string;
  label: string;
  assignedRole: string;
  status: 'pending' | 'completed';
}

export interface WorkflowBlueprint {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  isActive: boolean;
  isDefault: boolean;
}

export interface SystemConfig {
  dbHost: string;
  dbUser: string;
  dbPass: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  primaryCategory: string;
  secondaryCategory?: string;
  brand: string;
  brandName?: string;
  mrp: string | number;
  sellingPrice: string | number;
  tax: string | number;
  status: ProductStatus;
  images: ProductImage[];
  attributes: ProductAttribute[];
  createdAt: string;
  updatedAt: string;
  isInWorkflow?: boolean;
  workflowType?: string;
  currentStepIndex?: number;
  workflowSteps?: WorkflowStep[];
  mrpPrice?: string;
  taxRate?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
}

export interface AttributeGroup {
  id: string;
  name: string;
  description?: string;
  displayOrder?: number;
}

export interface MasterAttribute {
  id: string;
  name: string;
  description: string;
  type: AttributeType;
  groupId?: string; // Link to mdm_attribute_groups
  scopedCategory?: string; 
  scopedCategoryType?: 'Primary' | 'Secondary';
}

export interface Permission {
  id: string;
  code: string; 
  description: string;
}

export interface Capability {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

export interface UserRole {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export enum RuleType {
  MANDATORY_ATTRIBUTE = 'MANDATORY_ATTRIBUTE',
  SKU_FORMAT = 'SKU_FORMAT',
  TAX_LIMIT = 'TAX_LIMIT',
  JS_VALIDATION = 'JS_VALIDATION'
}

export interface BusinessRule {
  id: string;
  name: string;
  type: RuleType;
  isActive: boolean;
  isCritical: boolean;
  config: any;
}

export enum IntegrationDirection {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND'
}

export interface Integration {
  id: string;
  name: string;
  direction: IntegrationDirection;
  provider: string;
  status: 'IDLE' | 'SYNCING' | 'ERROR';
  lastSync?: string;
  config: {
    endpoint: string;
    apiKey?: string;
  };
}

export interface IntegrationLog {
  id: string;
  integrationId: string;
  timestamp: string;
  status: 'SUCCESS' | 'FAILED';
  message: string;
  itemsProcessed: number;
}
