import type { TFunction } from 'i18next';
import { describe, expect, it } from 'vitest';

import { ClusterCatalogItem } from '@osac/types';

import {
  type CatalogItemWithType,
  catalogItemCardSummaryRows,
  catalogItemClusterDetailSpecRows,
  catalogItemExternalIpOffer,
  catalogItemNetworkingLockRows,
  catalogItemNetworkingLockSummary,
  catalogItemResourceLine,
  catalogItemResourceParts,
  filterCatalogItemsBySearch,
} from './catalogItemDisplay';
import {
  catalogItemFieldDefinitions,
  readCatalogItemFieldDefinitions,
} from '../catalogProvision/catalogFieldDefinition';

const identityT = ((key: string, options?: Record<string, unknown>) => {
  if (!options) {
    return key;
  }
  return key.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => {
    const value = options[name];
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    return '';
  });
}) as TFunction;

describe('readCatalogItemFieldDefinitions', () => {
  it('reads snake_case field_definitions from wire JSON', () => {
    const wireItem = {
      id: 'catalog-1',
      field_definitions: [
        {
          path: 'cores',
          display_name: 'vCPUs',
          editable: true,
          default: { number_value: 4 },
          validation_schema: '{"type":"integer","minimum":2}',
        },
      ],
    };

    expect(readCatalogItemFieldDefinitions(wireItem)).toHaveLength(1);
    expect(catalogItemFieldDefinitions(wireItem)).toEqual([
      {
        path: 'cores',
        displayName: 'vCPUs',
        editable: true,
        default: 4,
        validationSchema: { type: 'integer', minimum: 2 },
      },
    ]);
  });

  it('parses post-decode protobuf Value defaults without mutating the catalog item', () => {
    const decodedItem = {
      id: 'catalog-1',
      fieldDefinitions: [
        {
          path: 'cores',
          displayName: 'vCPUs',
          editable: true,
          default: { kind: { case: 'numberValue', value: 4 } },
        },
      ],
    };

    expect(catalogItemFieldDefinitions(decodedItem)).toEqual([
      {
        path: 'cores',
        displayName: 'vCPUs',
        editable: true,
        default: 4,
      },
    ]);
    expect(decodedItem.fieldDefinitions[0]?.default).toEqual({
      kind: { case: 'numberValue', value: 4 },
    });
  });
});

describe('catalog display with wire field_definitions', () => {
  it('renders resource summary from wire catalog item JSON', () => {
    const wireItem: ClusterCatalogItem = {
      $typeName: 'osac.public.v1.ClusterCatalogItem',
      id: 'catalog-1',
      title: 'Workload VM',
      description: '',
      published: true,
      template: '',
      fieldDefinitions: [
        {
          $typeName: 'osac.public.v1.FieldDefinition',
          path: 'cores',
          displayName: 'vCPUs',
          editable: true,
          default: {
            $typeName: 'google.protobuf.Value',
            kind: {
              case: 'numberValue',
              value: 4,
            },
          },
          validationSchema: '',
        },
        {
          $typeName: 'osac.public.v1.FieldDefinition',
          path: 'memory_gib',
          displayName: 'RAM (GiB)',
          editable: true,
          default: {
            $typeName: 'google.protobuf.Value',
            kind: {
              case: 'numberValue',
              value: 8,
            },
          },
          validationSchema: '',
        },
        {
          $typeName: 'osac.public.v1.FieldDefinition',
          path: 'boot_disk.size_gib',
          displayName: 'Boot disk (GiB)',
          editable: true,
          default: {
            $typeName: 'google.protobuf.Value',
            kind: {
              case: 'numberValue',
              value: 40,
            },
          },
          validationSchema: '',
        },
      ],
    };

    expect(catalogItemResourceParts(wireItem)).toEqual([
      '4 vCPUs',
      '8 RAM (GiB)',
      '40 Boot disk (GiB)',
    ]);
    expect(catalogItemResourceLine(wireItem)).toBe('4 vCPUs · 8 RAM (GiB) · 40 Boot disk (GiB)');
  });

  it('renders node set resource summary from cluster catalog item JSON', () => {
    const wireItem: ClusterCatalogItem = {
      $typeName: 'osac.public.v1.ClusterCatalogItem',
      id: '019ecb6a-6cad-7905-b086-a043c388fa60',
      title: 'Development Cluster',
      description: '',
      published: true,
      template: '',
      fieldDefinitions: [
        {
          $typeName: 'osac.public.v1.FieldDefinition',
          path: 'node_sets.fc430.host_type',
          displayName: 'Host Type',
          editable: true,
          default: {
            $typeName: 'google.protobuf.Value',
            kind: {
              case: 'stringValue',
              value: 'fc430',
            },
          },
          validationSchema: '',
        },
        {
          $typeName: 'osac.public.v1.FieldDefinition',
          path: 'node_sets.fc430.size',
          displayName: 'Worker Count',
          editable: true,
          default: {
            $typeName: 'google.protobuf.Value',
            kind: {
              case: 'numberValue',
              value: 2,
            },
          },
          validationSchema: '',
        },
        {
          $typeName: 'osac.public.v1.FieldDefinition',
          path: 'release_image',
          displayName: 'Release Image',
          editable: true,
          default: {
            $typeName: 'google.protobuf.Value',
            kind: {
              case: 'stringValue',
              value: 'quay.io/openshift-release-dev/ocp-release:4.17.0-multi',
            },
          },
          validationSchema: '',
        },
      ],
    };

    expect(catalogItemResourceParts(wireItem)).toEqual(['fc430 Host Type', '2 Worker Count']);
    expect(catalogItemResourceLine(wireItem)).toBe('fc430 Host Type · 2 Worker Count');
  });
});

describe('catalogItemCardSummaryRows', () => {
  it('builds VM size and OS image rows', () => {
    const item: CatalogItemWithType = {
      $typeName: 'osac.public.v1.ComputeInstanceCatalogItem',
      id: 'vm-1',
      title: 'Workload VM',
      description: '',
      published: true,
      template: '',
      type: 'vm',
      fieldDefinitions: [
        {
          $typeName: 'osac.public.v1.FieldDefinition',
          path: 'cores',
          displayName: 'vCPUs',
          editable: true,
          default: {
            $typeName: 'google.protobuf.Value',
            kind: { case: 'numberValue', value: 4 },
          },
          validationSchema: '',
        },
        {
          $typeName: 'osac.public.v1.FieldDefinition',
          path: 'memory_gib',
          displayName: 'RAM (GiB)',
          editable: true,
          default: {
            $typeName: 'google.protobuf.Value',
            kind: { case: 'numberValue', value: 16 },
          },
          validationSchema: '',
        },
        {
          $typeName: 'osac.public.v1.FieldDefinition',
          path: 'spec.image.source_ref',
          displayName: 'VM image',
          editable: true,
          default: {
            $typeName: 'google.protobuf.Value',
            kind: { case: 'stringValue', value: 'RHEL 9.4' },
          },
          validationSchema: '',
        },
      ],
    };

    expect(catalogItemCardSummaryRows(item, identityT)).toEqual([
      { label: 'Size', value: '4 vCPU · 16 GB RAM' },
      { label: 'OS image', value: 'RHEL 9.4' },
    ]);
  });

  it('builds cluster version and node set rows', () => {
    const item: CatalogItemWithType = {
      $typeName: 'osac.public.v1.ClusterCatalogItem',
      id: 'cluster-1',
      title: 'Development Cluster',
      description: '',
      published: true,
      template: '',
      type: 'cluster',
      fieldDefinitions: [
        {
          $typeName: 'osac.public.v1.FieldDefinition',
          path: 'node_sets.fc430.host_type',
          displayName: 'Host Type',
          editable: true,
          default: {
            $typeName: 'google.protobuf.Value',
            kind: { case: 'stringValue', value: 'fc430' },
          },
          validationSchema: '',
        },
        {
          $typeName: 'osac.public.v1.FieldDefinition',
          path: 'node_sets.fc430.size',
          displayName: 'Worker Count',
          editable: true,
          default: {
            $typeName: 'google.protobuf.Value',
            kind: { case: 'numberValue', value: 2 },
          },
          validationSchema: '',
        },
        {
          $typeName: 'osac.public.v1.FieldDefinition',
          path: 'release_image',
          displayName: 'Release Image',
          editable: true,
          default: {
            $typeName: 'google.protobuf.Value',
            kind: {
              case: 'stringValue',
              value: 'quay.io/openshift-release-dev/ocp-release:4.19.0-multi',
            },
          },
          validationSchema: '',
        },
      ],
    };

    expect(catalogItemCardSummaryRows(item, identityT)).toEqual([
      { label: 'Cluster version', value: 'Red Hat OpenShift 4.19.0' },
      { label: 'Node set', value: 'fc430 · 2 workers' },
    ]);
  });
});

describe('catalogItemClusterDetailSpecRows', () => {
  it('builds cluster detail rows including pinned node set and size range', () => {
    const item: ClusterCatalogItem = {
      $typeName: 'osac.public.v1.ClusterCatalogItem',
      id: 'cluster-detail-1',
      title: 'Object schema cluster',
      description:
        'Demonstrates a validation_schema for a whole object-valued field (node_sets.fc430).',
      published: true,
      template: '',
      fieldDefinitions: [
        {
          $typeName: 'osac.public.v1.FieldDefinition',
          path: 'release_image',
          displayName: 'Release Image',
          editable: false,
          default: {
            $typeName: 'google.protobuf.Value',
            kind: {
              case: 'stringValue',
              value: 'quay.io/openshift-release-dev/ocp-release:4.19.0-multi',
            },
          },
          validationSchema: '',
        },
        {
          $typeName: 'osac.public.v1.FieldDefinition',
          path: 'control_plane',
          displayName: 'Control plane',
          editable: false,
          default: {
            $typeName: 'google.protobuf.Value',
            kind: { case: 'stringValue', value: '3× master · highly available' },
          },
          validationSchema: '',
        },
        {
          $typeName: 'osac.public.v1.FieldDefinition',
          path: 'rate',
          displayName: 'Rate',
          editable: false,
          default: {
            $typeName: 'google.protobuf.Value',
            kind: { case: 'stringValue', value: '$22.00/hr · $14,800/mo per instance' },
          },
          validationSchema: '',
        },
        {
          $typeName: 'osac.public.v1.FieldDefinition',
          path: 'cni',
          displayName: 'CNI',
          editable: false,
          default: {
            $typeName: 'google.protobuf.Value',
            kind: { case: 'stringValue', value: 'OVN-Kubernetes' },
          },
          validationSchema: '',
        },
        {
          $typeName: 'osac.public.v1.FieldDefinition',
          path: 'node_sets.fc430',
          displayName: 'Node set fc430',
          editable: false,
          default: {
            $typeName: 'google.protobuf.Value',
            kind: { case: 'nullValue', value: 0 },
          },
          validationSchema: '{"title":"ClusterNodeSet object schema","type":"object"}',
        },
        {
          $typeName: 'osac.public.v1.FieldDefinition',
          path: 'node_sets.fc430.host_type',
          displayName: 'Host Type',
          editable: false,
          default: {
            $typeName: 'google.protobuf.Value',
            kind: { case: 'stringValue', value: 'worker' },
          },
          validationSchema: '',
        },
        {
          $typeName: 'osac.public.v1.FieldDefinition',
          path: 'node_sets.fc430.size',
          displayName: 'Worker Count',
          editable: true,
          default: {
            $typeName: 'google.protobuf.Value',
            kind: { case: 'numberValue', value: 2 },
          },
          validationSchema: '{"type":"integer","minimum":1,"maximum":4}',
        },
      ],
    };

    expect(catalogItemClusterDetailSpecRows(item, identityT)).toEqual([
      {
        label: 'Cluster version',
        value: 'Red Hat OpenShift 4.19.0',
        showRedHatIcon: true,
      },
      { label: 'Rate', value: '$22.00/hr · $14,800/mo per instance' },
      { label: 'Control plane', value: '3× master · highly available' },
      { label: 'Node set', value: 'fc430 · worker (pinned)' },
      { label: 'Size range', value: '1–4 nodes' },
      { label: 'CNI', value: 'OVN-Kubernetes' },
      { label: 'Validation', value: 'ClusterNodeSet object schema' },
    ]);
  });
});

describe('catalogItemNetworkingLockRows', () => {
  it('orders networking lock rows and maps friendly labels', () => {
    const item: ClusterCatalogItem = {
      $typeName: 'osac.public.v1.ClusterCatalogItem',
      id: 'cluster-net-rows',
      title: 'Network Cluster',
      description: '',
      published: true,
      template: '',
      fieldDefinitions: [
        {
          $typeName: 'osac.public.v1.FieldDefinition',
          path: 'network_attachment.security_groups',
          displayName: 'Security groups',
          editable: true,
          validationSchema: '',
        },
        {
          $typeName: 'osac.public.v1.FieldDefinition',
          path: 'networking.virtual_network',
          displayName: 'VN',
          editable: false,
          validationSchema: '',
        },
        {
          $typeName: 'osac.public.v1.FieldDefinition',
          path: 'network_attachment.subnet',
          displayName: 'Subnet id',
          editable: true,
          validationSchema: '',
        },
      ],
    };

    expect(catalogItemNetworkingLockRows(item, identityT)).toEqual([
      { path: 'networking.virtual_network', label: 'Virtual network', locked: true },
      { path: 'network_attachment.subnet', label: 'Subnet', locked: false },
      { path: 'network_attachment.security_groups', label: 'Security group', locked: false },
    ]);
  });
});

describe('catalogItemExternalIpOffer', () => {
  it('reads offer external IP pool boolean defaults', () => {
    const item: ClusterCatalogItem = {
      $typeName: 'osac.public.v1.ClusterCatalogItem',
      id: 'cluster-eip',
      title: 'EIP Cluster',
      description: '',
      published: true,
      template: '',
      fieldDefinitions: [
        {
          $typeName: 'osac.public.v1.FieldDefinition',
          path: 'offer_external_ip_pools',
          displayName: 'Offer external IP pools',
          editable: true,
          default: {
            $typeName: 'google.protobuf.Value',
            kind: { case: 'boolValue', value: false },
          },
          validationSchema: '',
        },
      ],
    };

    expect(catalogItemExternalIpOffer(item)).toEqual({
      path: 'offer_external_ip_pools',
      enabled: false,
    });
  });
});

describe('catalogItemNetworkingLockSummary', () => {
  it('summarizes locked and editable networking fields', () => {
    const item: ClusterCatalogItem = {
      $typeName: 'osac.public.v1.ClusterCatalogItem',
      id: 'cluster-net',
      title: 'Network Cluster',
      description: '',
      published: true,
      template: '',
      fieldDefinitions: [
        {
          $typeName: 'osac.public.v1.FieldDefinition',
          path: 'network.pod_cidr',
          displayName: 'Pod CIDR',
          editable: false,
          default: {
            $typeName: 'google.protobuf.Value',
            kind: { case: 'stringValue', value: '10.128.0.0/14' },
          },
          validationSchema: '',
        },
        {
          $typeName: 'osac.public.v1.FieldDefinition',
          path: 'network.service_cidr',
          displayName: 'Service CIDR',
          editable: true,
          default: {
            $typeName: 'google.protobuf.Value',
            kind: { case: 'stringValue', value: '172.30.0.0/16' },
          },
          validationSchema: '',
        },
        {
          $typeName: 'osac.public.v1.FieldDefinition',
          path: 'release_image',
          displayName: 'Release Image',
          editable: true,
          default: {
            $typeName: 'google.protobuf.Value',
            kind: { case: 'stringValue', value: 'image' },
          },
          validationSchema: '',
        },
      ],
    };

    expect(catalogItemNetworkingLockSummary(item, identityT)).toEqual({
      label: '1 locked · 1 editable',
      tone: 'mixed',
    });
  });

  it('returns all unlocked when no networking fields exist', () => {
    const item: ClusterCatalogItem = {
      $typeName: 'osac.public.v1.ClusterCatalogItem',
      id: 'cluster-none',
      title: 'No Network',
      description: '',
      published: true,
      template: '',
      fieldDefinitions: [],
    };

    expect(catalogItemNetworkingLockSummary(item, identityT)).toEqual({
      label: 'All unlocked',
      tone: 'unlocked',
    });
  });
});

describe('filterCatalogItemsBySearch', () => {
  const items: ClusterCatalogItem[] = [
    {
      $typeName: 'osac.public.v1.ClusterCatalogItem',
      id: '1',
      title: 'Alpha VM',
      description: 'For testing',
      fieldDefinitions: [],
      published: true,
      template: '',
    },
    {
      $typeName: 'osac.public.v1.ClusterCatalogItem',
      id: '2',
      title: 'Beta Cluster',
      description: 'Production workload',
      fieldDefinitions: [],
      published: true,
      template: '',
    },
  ];

  it('returns all items when search is empty or whitespace', () => {
    expect(filterCatalogItemsBySearch(items, '')).toEqual(items);
    expect(filterCatalogItemsBySearch(items, '   ')).toEqual(items);
  });

  it('filters case-insensitively across title and description', () => {
    expect(filterCatalogItemsBySearch(items, 'alpha')).toEqual([items[0]]);
    expect(filterCatalogItemsBySearch(items, 'PRODUCTION')).toEqual([items[1]]);
  });
});
