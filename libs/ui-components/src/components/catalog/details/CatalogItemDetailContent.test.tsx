import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { ClusterCatalogItem } from '@osac/types';

import { CatalogItemDetailContent } from './CatalogItemDetailContent';
import type { CatalogItemWithType } from '../catalogItemDisplay';

vi.mock('../../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
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
    },
  }),
}));

const clusterItem: CatalogItemWithType = {
  $typeName: 'osac.public.v1.ClusterCatalogItem',
  id: 'cluster-1',
  title: 'Object schema cluster',
  description:
    'Demonstrates a validation_schema for a whole object-valued field (node_sets.fc430).',
  published: true,
  template: '',
  type: 'cluster',
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
    {
      $typeName: 'osac.public.v1.FieldDefinition',
      path: 'networking.virtual_network',
      displayName: 'Virtual network',
      editable: false,
      validationSchema: '',
    },
    {
      $typeName: 'osac.public.v1.FieldDefinition',
      path: 'network_attachment.subnet',
      displayName: 'Subnet',
      editable: true,
      validationSchema: '',
    },
    {
      $typeName: 'osac.public.v1.FieldDefinition',
      path: 'network_attachment.security_groups',
      displayName: 'Security group',
      editable: true,
      validationSchema: '',
    },
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
} as ClusterCatalogItem & { type: 'cluster' };

describe('CatalogItemDetailContent cluster layout', () => {
  it('renders service, status, specs, networking locks, and external IP offer', () => {
    render(<CatalogItemDetailContent item={clusterItem} />);

    expect(screen.getByText(/Demonstrates a validation_schema/)).toBeInTheDocument();
    expect(screen.getByText('Service')).toBeInTheDocument();
    expect(screen.getByText('Cluster')).toBeInTheDocument();
    expect(screen.getByText('Live')).toBeInTheDocument();
    expect(screen.getByText('Red Hat OpenShift 4.19.0')).toBeInTheDocument();
    expect(screen.getByText('fc430 · worker (pinned)')).toBeInTheDocument();
    expect(screen.getByText('1–4 nodes')).toBeInTheDocument();

    expect(screen.getByText('Networking')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Locked fields are fixed for launch. Unlocked fields can be chosen when you create an instance.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Lock Virtual network for launch')).toBeChecked();
    expect(screen.getByLabelText('Lock Subnet for launch')).not.toBeChecked();
    expect(screen.getByLabelText('Lock Security group for launch')).not.toBeChecked();

    expect(screen.getByText('External IP pool')).toBeInTheDocument();
    expect(screen.getByLabelText('Offer external IP pools')).not.toBeChecked();
    expect(screen.getByText('Off')).toBeInTheDocument();
  });
});
