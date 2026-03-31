/**
 * MCP Tool Browser — Type definitions
 */

export interface ParamDef {
  name: string
  type: 'string' | 'number' | 'boolean' | 'object'
  required: boolean
  description?: string
}

export interface ToolDef {
  name: string
  description: string
  domain: string
  params?: ParamDef[]
}

export interface DomainGroup {
  domain: string
  label: string
  description: string
  tools: ToolDef[]
}
