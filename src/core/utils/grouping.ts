import { resolveEntityName } from './entityName.js';
import type { PluginStep, Flow, WebResource, FormDefinition, BusinessRule } from '../types/blueprint.js';
import type { ClassicWorkflow } from '../types/classicWorkflow.js';
import type { BusinessProcessFlow } from '../types/businessProcessFlow.js';
import type { CustomAPI } from '../types/customApi.js';

/**
 * Group flows by entity.
 * Uses resolveEntityName to normalize entity field; flows without a valid entity are grouped under 'Manual/Scheduled'.
 */
export function groupFlowsByEntity(flows: Flow[]): Map<string, Flow[]> {
  const grouped = new Map<string, Flow[]>();

  for (const flow of flows) {
    const entity = resolveEntityName(flow.entity) ?? 'Manual/Scheduled';
    if (!grouped.has(entity)) {
      grouped.set(entity, []);
    }
    grouped.get(entity)!.push(flow);
  }

  return grouped;
}

/**
 * Group plugins by entity.
 * Plugins without an entity are grouped under 'global'.
 */
export function groupPluginsByEntity(plugins: PluginStep[]): Map<string, PluginStep[]> {
  const grouped = new Map<string, PluginStep[]>();

  for (const plugin of plugins) {
    const entity = plugin.entity?.toLowerCase() ?? 'global';
    if (!grouped.has(entity)) {
      grouped.set(entity, []);
    }
    grouped.get(entity)!.push(plugin);
  }

  return grouped;
}

/**
 * Group plugins by assembly, then by entity within each assembly.
 * Used by MarkdownReporter for Plugin Packages section.
 */
export function groupPluginsByAssembly(plugins: PluginStep[]): Map<string, Map<string, PluginStep[]>> {
  const grouped = new Map<string, Map<string, PluginStep[]>>();

  for (const plugin of plugins) {
    if (!grouped.has(plugin.assemblyName)) {
      grouped.set(plugin.assemblyName, new Map());
    }

    const entities = grouped.get(plugin.assemblyName)!;
    const entityKey = plugin.entity ?? 'Global';
    if (!entities.has(entityKey)) {
      entities.set(entityKey, []);
    }

    entities.get(entityKey)!.push(plugin);
  }

  return grouped;
}

/**
 * Group business rules by entity.
 */
export function groupBusinessRulesByEntity(rules: BusinessRule[]): Map<string, BusinessRule[]> {
  const grouped = new Map<string, BusinessRule[]>();

  for (const rule of rules) {
    if (!grouped.has(rule.entity)) {
      grouped.set(rule.entity, []);
    }
    grouped.get(rule.entity)!.push(rule);
  }

  return grouped;
}

/**
 * Group classic workflows by entity.
 */
export function groupClassicWorkflowsByEntity(workflows: ClassicWorkflow[]): Map<string, ClassicWorkflow[]> {
  const grouped = new Map<string, ClassicWorkflow[]>();

  for (const workflow of workflows) {
    if (!grouped.has(workflow.entity)) {
      grouped.set(workflow.entity, []);
    }
    grouped.get(workflow.entity)!.push(workflow);
  }

  return grouped;
}

/**
 * Group Business Process Flows by primary entity.
 */
export function groupBusinessProcessFlowsByEntity(bpfs: BusinessProcessFlow[]): Map<string, BusinessProcessFlow[]> {
  const grouped = new Map<string, BusinessProcessFlow[]>();

  for (const bpf of bpfs) {
    const entity = bpf.primaryEntityDisplayName || bpf.primaryEntity;
    if (!grouped.has(entity)) {
      grouped.set(entity, []);
    }
    grouped.get(entity)!.push(bpf);
  }

  return grouped;
}

/**
 * Alias for groupBusinessProcessFlowsByEntity.
 * MarkdownReporter uses 'Bpfs' abbreviation.
 */
export const groupBpfsByEntity = groupBusinessProcessFlowsByEntity;

/**
 * Group web resources by type.
 */
export function groupWebResourcesByType(resources: WebResource[]): Map<string, WebResource[]> {
  const grouped = new Map<string, WebResource[]>();

  for (const resource of resources) {
    if (!grouped.has(resource.typeName)) {
      grouped.set(resource.typeName, []);
    }
    grouped.get(resource.typeName)!.push(resource);
  }

  return grouped;
}

/**
 * Group custom APIs by binding type.
 */
export function groupCustomAPIsByBinding(apis: CustomAPI[]): Map<string, CustomAPI[]> {
  const grouped = new Map<string, CustomAPI[]>();

  for (const api of apis) {
    if (!grouped.has(api.bindingType)) {
      grouped.set(api.bindingType, []);
    }
    grouped.get(api.bindingType)!.push(api);
  }

  return grouped;
}

/**
 * Group forms by entity.
 */
export function groupFormsByEntity(forms: FormDefinition[]): Map<string, FormDefinition[]> {
  const grouped = new Map<string, FormDefinition[]>();

  for (const form of forms) {
    const entity = form.entity.toLowerCase();
    if (!grouped.has(entity)) {
      grouped.set(entity, []);
    }
    grouped.get(entity)!.push(form);
  }

  return grouped;
}
