import type { TFunction } from 'i18next';

import type {
  BareMetalInstanceCatalogItem,
  ClusterCatalogItem,
  ComputeInstanceCatalogItem,
} from '@osac/types';

import {
  CATALOG_ITEM_RESOURCE_FIELD_PATHS,
  type CatalogFieldDefinition,
  type CatalogItemResourceFieldPath,
  catalogItemFieldDefinitions,
  fieldDefinitionDefaultToInputString,
  isCatalogCardResourceFieldPath,
  isCatalogItemResourceFieldPath,
  isClusterCatalogItemResourceFieldPath,
  resolvedFieldDefault,
} from '../catalogProvision/catalogFieldDefinition';
import { findCatalogFieldDefinition } from '../catalogProvision/wizard/catalogOverlay';

export type CatalogItem =
  | ClusterCatalogItem
  | BareMetalInstanceCatalogItem
  | ComputeInstanceCatalogItem;

export type CatalogItemKind = 'vm' | 'cluster' | 'bm';

export type CatalogItemWithType = CatalogItem & { type: CatalogItemKind };

export interface CatalogCardSummaryRow {
  label: string;
  value: string;
  /** Renders Red Hat branding next to cluster version on the detail page. */
  showRedHatIcon?: boolean;
}

export type CatalogNetworkingLockTone = 'locked' | 'mixed' | 'unlocked';

export interface CatalogNetworkingLockSummary {
  label: string;
  tone: CatalogNetworkingLockTone;
}

export const catalogItemTypeBadgeLabel = (kind: CatalogItemKind, t: TFunction): string => {
  switch (kind) {
    case 'vm':
      return t('Virtual Machine');
    case 'bm':
      return t('Bare Metal');
    default:
      return t('Cluster');
  }
};

export const catalogItemManagedFooterText = (kind: CatalogItemKind, t: TFunction): string => {
  switch (kind) {
    case 'bm':
      return t('Hardware pre-configured · Admin-managed');
    case 'cluster':
      return t('Cluster profile pre-configured · Admin-managed');
    default:
      return t('Instance profile pre-configured · Admin-managed');
  }
};

export const catalogItemCreatePath = (kind: CatalogItemKind, id: string): string => {
  switch (kind) {
    case 'vm':
      return `/vms/create/${id}`;
    case 'cluster':
      return `/clusters/create/${id}`;
    case 'bm':
      return `/bare-metal/create/${id}`;
  }
};

const formatFieldDefaultValue = (def: CatalogFieldDefinition): string => {
  const defaultValue = resolvedFieldDefault(def);
  if (defaultValue === undefined || defaultValue === null) {
    return '';
  }
  return fieldDefinitionDefaultToInputString(defaultValue).trim();
};

const findFieldByPaths = (
  definitions: CatalogFieldDefinition[],
  paths: string[],
): CatalogFieldDefinition | undefined => {
  for (const path of paths) {
    const match = findCatalogFieldDefinition(path, definitions);
    if (match) {
      return match;
    }
  }
  return undefined;
};

const findFieldByNameOrPath = (
  definitions: CatalogFieldDefinition[],
  pattern: RegExp,
): CatalogFieldDefinition | undefined => {
  return definitions.find(
    (def) => pattern.test(def.path) || pattern.test(def.displayName),
  );
};

const pushSummaryRow = (
  rows: CatalogCardSummaryRow[],
  label: string,
  value: string | undefined,
  options?: Pick<CatalogCardSummaryRow, 'showRedHatIcon'>,
) => {
  const trimmed = value?.trim();
  if (trimmed) {
    rows.push({ label, value: trimmed, ...options });
  }
};

const buildVmCardSummaryRows = (
  definitions: CatalogFieldDefinition[],
  t: TFunction,
): CatalogCardSummaryRow[] => {
  const rows: CatalogCardSummaryRow[] = [];
  const instanceType = findFieldByPaths(definitions, ['instance_type', 'spec.instance_type']);
  pushSummaryRow(
    rows,
    t('Instance type'),
    instanceType ? formatFieldDefaultValue(instanceType) : undefined,
  );

  const cores = findFieldByPaths(definitions, ['cores', 'spec.cores']);
  const memory = findFieldByPaths(definitions, ['memory_gib', 'spec.memory_gib']);
  const sizeParts: string[] = [];
  if (cores) {
    const coresValue = formatFieldDefaultValue(cores);
    if (coresValue) {
      sizeParts.push(t('{{cores}} vCPU', { cores: coresValue }));
    }
  }
  if (memory) {
    const memoryValue = formatFieldDefaultValue(memory);
    if (memoryValue) {
      sizeParts.push(t('{{memory}} GB RAM', { memory: memoryValue }));
    }
  }
  pushSummaryRow(rows, t('Size'), sizeParts.length ? sizeParts.join(' · ') : undefined);

  const image = findFieldByPaths(definitions, ['image.source_ref', 'spec.image.source_ref']);
  pushSummaryRow(rows, t('OS image'), image ? formatFieldDefaultValue(image) : undefined);

  return rows;
};

const buildBareMetalCardSummaryRows = (
  definitions: CatalogFieldDefinition[],
  t: TFunction,
): CatalogCardSummaryRow[] => {
  const rows: CatalogCardSummaryRow[] = [];
  const cpu =
    findFieldByPaths(definitions, ['cpu', 'spec.cpu']) ||
    findFieldByNameOrPath(definitions, /\bcpu\b/i);
  const ram =
    findFieldByPaths(definitions, ['memory_gib', 'ram', 'spec.memory_gib', 'spec.ram']) ||
    findFieldByNameOrPath(definitions, /\b(ram|memory)\b/i);
  const gpu =
    findFieldByPaths(definitions, ['gpu', 'spec.gpu']) ||
    findFieldByNameOrPath(definitions, /\bgpu\b/i);
  const image = findFieldByPaths(definitions, ['image.source_ref', 'spec.image.source_ref']);

  pushSummaryRow(rows, t('CPU'), cpu ? formatFieldDefaultValue(cpu) : undefined);
  pushSummaryRow(rows, t('RAM'), ram ? formatFieldDefaultValue(ram) : undefined);
  pushSummaryRow(rows, t('GPU'), gpu ? formatFieldDefaultValue(gpu) : undefined);
  pushSummaryRow(rows, t('OS image'), image ? formatFieldDefaultValue(image) : undefined);

  return rows;
};

const formatClusterReleaseImage = (value: string): string => {
  const versionMatch = value.match(/(\d+\.\d+(?:\.\d+)?)/);
  if (versionMatch?.[1]) {
    return `Red Hat OpenShift ${versionMatch[1]}`;
  }
  return value;
};

const buildClusterCardSummaryRows = (
  definitions: CatalogFieldDefinition[],
  t: TFunction,
): CatalogCardSummaryRow[] => {
  const rows: CatalogCardSummaryRow[] = [];
  const releaseImage = findFieldByPaths(definitions, ['release_image', 'spec.release_image']);
  if (releaseImage) {
    const value = formatFieldDefaultValue(releaseImage);
    pushSummaryRow(rows, t('Cluster version'), value ? formatClusterReleaseImage(value) : undefined);
  }

  const controlPlane =
    findFieldByPaths(definitions, [
      'control_plane',
      'spec.control_plane',
      'control_plane_size',
      'spec.control_plane_size',
    ]) || findFieldByNameOrPath(definitions, /control[\s_]?plane/i);
  pushSummaryRow(
    rows,
    t('Control plane'),
    controlPlane ? formatFieldDefaultValue(controlPlane) : undefined,
  );

  const hostTypeDef = definitions.find((def) =>
    /^node_sets\.[^.]+\.host_type$/.test(def.path.replace(/^spec\./, '')),
  );
  const sizeDef = definitions.find((def) =>
    /^node_sets\.[^.]+\.size$/.test(def.path.replace(/^spec\./, '')),
  );
  if (hostTypeDef) {
    const hostType = formatFieldDefaultValue(hostTypeDef);
    const size = sizeDef ? formatFieldDefaultValue(sizeDef) : '';
    const nodeSetValue = size
      ? t('{{hostType}} · {{workers}} workers', { hostType, workers: size })
      : hostType;
    pushSummaryRow(rows, t('Node set'), nodeSetValue);
  }

  return rows;
};

const fallbackSummaryRows = (item: CatalogItem): CatalogCardSummaryRow[] => {
  return catalogItemResourceFieldDefinitions(item)
    .map((def) => {
      const value = formatFieldDefaultValue(def);
      if (!value || !def.displayName) {
        return null;
      }
      return { label: def.displayName, value };
    })
    .filter((row): row is CatalogCardSummaryRow => row != null);
};

/** Type-specific key/value rows for catalog browse cards. */
export const catalogItemCardSummaryRows = (
  item: CatalogItemWithType,
  t: TFunction,
): CatalogCardSummaryRow[] => {
  const definitions = catalogItemFieldDefinitions(item);
  let rows: CatalogCardSummaryRow[];
  switch (item.type) {
    case 'bm':
      rows = buildBareMetalCardSummaryRows(definitions, t);
      break;
    case 'cluster':
      rows = buildClusterCardSummaryRows(definitions, t);
      break;
    default:
      rows = buildVmCardSummaryRows(definitions, t);
      break;
  }
  return rows.length > 0 ? rows : fallbackSummaryRows(item);
};

const normalizeCatalogFieldPath = (path: string): string => path.replace(/^spec\./, '');

export const isCatalogNetworkingFieldPath = (path: string): boolean => {
  const normalized = normalizeCatalogFieldPath(path);
  return (
    normalized.startsWith('network.') ||
    normalized.startsWith('networking.') ||
    normalized.startsWith('network_attachment.') ||
    normalized.includes('pod_cidr') ||
    normalized.includes('service_cidr') ||
    normalized.includes('virtual_network') ||
    normalized.includes('security_group') ||
    /(^|\.)subnet($|\.)/.test(normalized)
  );
};

export const isCatalogExternalIpFieldPath = (path: string): boolean => {
  const normalized = normalizeCatalogFieldPath(path);
  return (
    normalized.includes('external_ip') ||
    normalized.includes('external-ip') ||
    /\boffer_external_ip/.test(normalized)
  );
};

const NETWORKING_FIELD_LABEL_ORDER: Array<{ pattern: RegExp; labelKey: string }> = [
  { pattern: /virtual_network/, labelKey: 'Virtual network' },
  { pattern: /(^|\.)subnet($|\.)/, labelKey: 'Subnet' },
  { pattern: /security_group/, labelKey: 'Security group' },
  { pattern: /pod_cidr/, labelKey: 'Pod CIDR' },
  { pattern: /service_cidr/, labelKey: 'Service CIDR' },
];

const networkingFieldSortIndex = (path: string): number => {
  const normalized = normalizeCatalogFieldPath(path);
  const index = NETWORKING_FIELD_LABEL_ORDER.findIndex(({ pattern }) => pattern.test(normalized));
  return index === -1 ? NETWORKING_FIELD_LABEL_ORDER.length : index;
};

const networkingFieldDisplayName = (def: CatalogFieldDefinition, t: TFunction): string => {
  const normalized = normalizeCatalogFieldPath(def.path);
  for (const { pattern, labelKey } of NETWORKING_FIELD_LABEL_ORDER) {
    if (pattern.test(normalized)) {
      return t(labelKey);
    }
  }
  return def.displayName || def.path;
};

export interface CatalogNetworkingLockRow {
  path: string;
  label: string;
  locked: boolean;
}

export interface CatalogExternalIpOfferSummary {
  path: string;
  enabled: boolean;
}

const parseBooleanFieldDefault = (value: unknown): boolean | undefined => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  return undefined;
};

/** Per-field locked/unlocked rows for catalog detail networking section. */
export const catalogItemNetworkingLockRows = (
  item: CatalogItem,
  t: TFunction,
): CatalogNetworkingLockRow[] => {
  return catalogItemFieldDefinitions(item)
    .filter((def) => isCatalogNetworkingFieldPath(def.path))
    .sort((a, b) => {
      const byKnown = networkingFieldSortIndex(a.path) - networkingFieldSortIndex(b.path);
      if (byKnown !== 0) {
        return byKnown;
      }
      return a.path.localeCompare(b.path);
    })
    .map((def) => ({
      path: def.path,
      label: networkingFieldDisplayName(def, t),
      locked: !def.editable,
    }));
};

/** Optional external IP pool offer flag when present as a catalog field definition. */
export const catalogItemExternalIpOffer = (
  item: CatalogItem,
): CatalogExternalIpOfferSummary | undefined => {
  const def = catalogItemFieldDefinitions(item).find((entry) =>
    isCatalogExternalIpFieldPath(entry.path),
  );
  if (!def) {
    return undefined;
  }
  const parsed = parseBooleanFieldDefault(resolvedFieldDefault(def));
  return {
    path: def.path,
    enabled: parsed ?? false,
  };
};

const formatNodeSetSizeRange = (
  sizeDef: CatalogFieldDefinition | undefined,
  t: TFunction,
): string | undefined => {
  const schema = sizeDef?.validationSchema;
  if (!schema) {
    return undefined;
  }
  const min = typeof schema.minimum === 'number' ? schema.minimum : undefined;
  const max = typeof schema.maximum === 'number' ? schema.maximum : undefined;
  if (min !== undefined && max !== undefined) {
    return t('{{min}}–{{max}} nodes', { min, max });
  }
  if (min !== undefined) {
    return t('{{min}}+ nodes', { min });
  }
  if (max !== undefined) {
    return t('Up to {{max}} nodes', { max });
  }
  return undefined;
};

const formatClusterNodeSetDetail = (
  hostTypeDef: CatalogFieldDefinition,
  t: TFunction,
): string | undefined => {
  const hostType = formatFieldDefaultValue(hostTypeDef);
  if (!hostType) {
    return undefined;
  }
  const normalized = normalizeCatalogFieldPath(hostTypeDef.path);
  const nodeSetMatch = normalized.match(/^node_sets\.([^.]+)\.host_type$/);
  const nodeSetId = nodeSetMatch?.[1];
  if (nodeSetId) {
    return hostTypeDef.editable
      ? t('{{nodeSet}} · {{hostType}}', { nodeSet: nodeSetId, hostType })
      : t('{{nodeSet}} · {{hostType}} (pinned)', { nodeSet: nodeSetId, hostType });
  }
  return hostTypeDef.editable ? hostType : t('{{hostType}} (pinned)', { hostType });
};

const formatClusterValidationSummary = (
  definitions: CatalogFieldDefinition[],
  t: TFunction,
): string | undefined => {
  const objectNodeSetDef = definitions.find((def) => {
    const normalized = normalizeCatalogFieldPath(def.path);
    return /^node_sets\.[^.]+$/.test(normalized) && Boolean(def.validationSchema);
  });
  if (objectNodeSetDef) {
    const title =
      typeof objectNodeSetDef.validationSchema?.title === 'string'
        ? objectNodeSetDef.validationSchema.title.trim()
        : '';
    return title || t('ClusterNodeSet object schema');
  }
  return undefined;
};

/** Detail-page technical specification rows for cluster catalog items. */
export const catalogItemClusterDetailSpecRows = (
  item: CatalogItem,
  t: TFunction,
): CatalogCardSummaryRow[] => {
  const definitions = catalogItemFieldDefinitions(item);
  const rows: CatalogCardSummaryRow[] = [];

  const releaseImage = findFieldByPaths(definitions, ['release_image', 'spec.release_image']);
  if (releaseImage) {
    const value = formatFieldDefaultValue(releaseImage);
    pushSummaryRow(
      rows,
      t('Cluster version'),
      value ? formatClusterReleaseImage(value) : undefined,
      { showRedHatIcon: true },
    );
  }

  const rate =
    findFieldByPaths(definitions, ['rate', 'pricing', 'price']) ||
    findFieldByNameOrPath(definitions, /\b(rate|pricing|price)\b/i);
  pushSummaryRow(rows, t('Rate'), rate ? formatFieldDefaultValue(rate) : undefined);

  const controlPlane =
    findFieldByPaths(definitions, [
      'control_plane',
      'spec.control_plane',
      'control_plane_size',
      'spec.control_plane_size',
    ]) || findFieldByNameOrPath(definitions, /control[\s_]?plane/i);
  pushSummaryRow(
    rows,
    t('Control plane'),
    controlPlane ? formatFieldDefaultValue(controlPlane) : undefined,
  );

  const hostTypeDef = definitions.find((def) =>
    /^node_sets\.[^.]+\.host_type$/.test(normalizeCatalogFieldPath(def.path)),
  );
  const sizeDef = definitions.find((def) =>
    /^node_sets\.[^.]+\.size$/.test(normalizeCatalogFieldPath(def.path)),
  );
  if (hostTypeDef) {
    pushSummaryRow(rows, t('Node set'), formatClusterNodeSetDetail(hostTypeDef, t));
  }
  pushSummaryRow(rows, t('Size range'), formatNodeSetSizeRange(sizeDef, t));

  const cni =
    findFieldByPaths(definitions, ['cni', 'network.cni', 'spec.network.cni']) ||
    findFieldByNameOrPath(definitions, /\bcni\b/i);
  pushSummaryRow(rows, t('CNI'), cni ? formatFieldDefaultValue(cni) : undefined);

  pushSummaryRow(rows, t('Validation'), formatClusterValidationSummary(definitions, t));

  console.log(`=========== ${item.metadata.name} ==============`);
  console.log(definitions);
  console.log(item);
  console.log(rows);
  return rows;
};

export const catalogItemNetworkingLockSummary = (
  item: CatalogItem,
  t: TFunction,
): CatalogNetworkingLockSummary => {
  const networkingFields = catalogItemFieldDefinitions(item).filter((def) =>
    isCatalogNetworkingFieldPath(def.path),
  );
  if (networkingFields.length === 0) {
    return { label: t('All unlocked'), tone: 'unlocked' };
  }
  const locked = networkingFields.filter((def) => !def.editable).length;
  const editable = networkingFields.filter((def) => def.editable).length;
  if (locked === 0) {
    return { label: t('All unlocked'), tone: 'unlocked' };
  }
  if (editable === 0) {
    return { label: t('All locked'), tone: 'locked' };
  }
  return {
    label: t('{{locked}} locked · {{editable}} editable', { locked, editable }),
    tone: 'mixed',
  };
};

export const catalogFieldDefault = (item: CatalogItem, path: string): unknown => {
  const def = catalogItemFieldDefinitions(item).find((entry) => entry.path === path);
  return def ? resolvedFieldDefault(def) : undefined;
};

export const catalogItemSubtitle = (item: CatalogItem): string => {
  const description = item.description?.trim();
  if (description) {
    return description.length <= 120 ? description : `${description.slice(0, 119)}…`;
  }
  return item.metadata?.name ?? item.id;
};

export const catalogItemMetadataLabelEntries = (
  item: CatalogItem,
): Array<{ key: string; value: string }> => {
  const labels = item.metadata?.labels;
  if (!labels) {
    return [];
  }
  return Object.entries(labels)
    .map(([key, value]) => ({ key, value: value.trim() }))
    .filter(({ value }) => value.length > 0)
    .sort((a, b) => a.key.localeCompare(b.key));
};

export const catalogFieldDefinitionForPath = (
  item: CatalogItem,
  path: string,
): CatalogFieldDefinition | undefined => {
  return catalogItemFieldDefinitions(item).find((def) => def.path === path);
};

const FALLBACK_RESOURCE_LABELS: Record<CatalogItemResourceFieldPath, string> = {
  cores: 'vCPU',
  memory_gib: 'Memory',
  'boot_disk.size_gib': 'Boot disk',
};

/** Field definitions shown as resource labels on catalog cards (VM or cluster). */
export const catalogItemResourceFieldDefinitions = (
  item: CatalogItem,
): CatalogFieldDefinition[] => {
  const defs = catalogItemFieldDefinitions(item);
  const byPath = new Map(defs.map((def) => [def.path, def]));

  const vmResourceDefs = CATALOG_ITEM_RESOURCE_FIELD_PATHS.flatMap((path) => {
    const def = byPath.get(path);
    return def ? [def] : [];
  });
  if (vmResourceDefs.length > 0) {
    return vmResourceDefs;
  }

  return defs.filter((def) => isClusterCatalogItemResourceFieldPath(def.path));
};

const formatCatalogResourcePart = (def: CatalogFieldDefinition): string | null => {
  if (!isCatalogCardResourceFieldPath(def.path)) {
    return null;
  }
  const defaultValue = resolvedFieldDefault(def);
  if (defaultValue === undefined || defaultValue === null) {
    return null;
  }
  const value = fieldDefinitionDefaultToInputString(defaultValue).trim();
  if (!value) {
    return null;
  }
  const label = isCatalogItemResourceFieldPath(def.path)
    ? def.displayName || FALLBACK_RESOURCE_LABELS[def.path]
    : def.displayName;
  if (!label) {
    return null;
  }
  return `${value} ${label}`;
};

export const catalogItemResourceParts = (item: CatalogItem): string[] => {
  return catalogItemResourceFieldDefinitions(item)
    .map((def) => formatCatalogResourcePart(def))
    .filter((part): part is string => part != null);
};

export const catalogItemResourceLine = (item: CatalogItem): string | undefined => {
  const parts = catalogItemResourceParts(item);
  return parts.length ? parts.join(' · ') : undefined;
};

export const searchableCatalogItemText = (item: CatalogItem): string => {
  const labels = item.metadata?.labels ?? {};
  const fieldText = catalogItemFieldDefinitions(item)
    .map(
      (def) =>
        `${def.displayName} ${fieldDefinitionDefaultToInputString(resolvedFieldDefault(def))}`,
    )
    .join(' ');

  return [
    item.title,
    item.description,
    item.metadata?.name,
    fieldText,
    ...Object.entries(labels).map(([key, value]) => `${key} ${value}`),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
};

export const filterCatalogItemsBySearch = (
  items: (CatalogItem | CatalogItemWithType)[],
  search: string
): (CatalogItem | CatalogItemWithType)[] => {
  const searchTerm = search.trim().toLowerCase();
  if (!searchTerm) {
    return items;
  }
  return items.filter((item) => searchableCatalogItemText(item).includes(searchTerm));
};

export const formatCatalogFieldDefault = (def: CatalogFieldDefinition): string => {
  const defaultValue = resolvedFieldDefault(def);
  if (defaultValue === undefined) {
    return '—';
  }
  return fieldDefinitionDefaultToInputString(defaultValue) || '—';
};
