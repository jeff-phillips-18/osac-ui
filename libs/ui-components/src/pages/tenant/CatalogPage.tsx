import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  EmptyState,
  EmptyStateBody,
  Flex,
  FlexItem,
  SearchInput,
  Stack,
  StackItem,
  ToggleGroup,
  ToggleGroupItem,
} from '@patternfly/react-core';

import { useBareMetalInstanceCatalogItems } from '@osac/ui-components/api/v1/baremetal-instance';
import { useClusterCatalogItems } from '@osac/ui-components/api/v1/cluster-catalog-item';
import { useComputeInstanceCatalogItems } from '@osac/ui-components/api/v1/compute-instance-catalog-item';
import type { CatalogItem, CatalogItemKind, CatalogItemWithType } from '@osac/ui-components/components/catalog/catalogItemDisplay';
import { filterCatalogItemsBySearch } from '@osac/ui-components/components/catalog/catalogItemDisplay';
import { CatalogItemListSection } from '@osac/ui-components/components/catalog/CatalogItemListSection';
import ListPage from '@osac/ui-components/components/Page/ListPage';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

type CatalogTypeFilter = CatalogItemKind;

const mapToItemWithType = (items: CatalogItem[] | undefined, itemType: CatalogTypeFilter): CatalogItemWithType[] => {
  if (!items || !items.length) {
    return [];
  }
  return items.map((item: CatalogItem) => ({ ...item, type: itemType }));
};

const useCatalogItems = (typeFilters: CatalogTypeFilter[]) => {
  const showVms = typeFilters.length === 0 || typeFilters.includes('vm');
  const showClusters = typeFilters.length === 0 || typeFilters.includes('cluster');
  const showBms = typeFilters.length === 0 || typeFilters.includes('bm');
  const vms = useComputeInstanceCatalogItems(undefined, showVms);
  const clusters = useClusterCatalogItems(undefined, showClusters);
  const bms = useBareMetalInstanceCatalogItems(showBms);

  const isLoading = (showVms && vms.isLoading) || (showClusters && clusters.isLoading) || (showBms && bms.isLoading);
  const error = (showVms && vms.error) || (showClusters && clusters.error) || (showBms && bms.error);

  const data: CatalogItemWithType[] = useMemo(() => {
    if (error || isLoading) {
      return [];
    }
    return [
      ...(showVms ? mapToItemWithType(vms.data, 'vm') : []),
      ...(showClusters ? mapToItemWithType(clusters.data, 'cluster') : []),
      ...(showBms ? mapToItemWithType(bms.data, 'bm') : [])
    ];
  }, [showVms, showBms, showClusters, isLoading, error, vms, clusters, bms]);

  return { error, isLoading, data };
};

const CatalogPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [typeFilters, setTypeFilters] = useState<CatalogTypeFilter[]>([]);

  const catalogTypeFilters = useMemo<ReadonlyArray<{ value: CatalogTypeFilter; label: string }>>(
    () => [
      { value: 'vm', label: t('Virtual Machines') },
      { value: 'cluster', label: t('Clusters') },
      { value: 'bm', label: t('Bare Metal Machines') },
    ],
    [t],
  );

  const { data = [], isLoading, error } = useCatalogItems(typeFilters);

  const filteredItems = useMemo(() => filterCatalogItemsBySearch(data, search), [search, data]);

  const searchTerm = search.trim();
  const showEmptyState = !isLoading && !error && filteredItems.length === 0;

  const pageDescription = t(
    'Browse catalog items and launch virtual machines, clusters, or bare metal machines from published offerings.',
  );

  return (
    <ListPage title={t('Catalog')} description={pageDescription}>
      <Stack hasGutter>
        <StackItem>
          <Flex
            spaceItems={{ default: 'spaceItemsSm' }}
            alignItems={{ default: 'alignItemsCenter' }}
            flexWrap={{ default: 'wrap' }}
          >
            <FlexItem>
              <SearchInput
                placeholder={t('Search catalog items')}
                value={search}
                onChange={(_event, value) => setSearch(value)}
                onClear={() => setSearch('')}
                aria-label={t('Filter catalog by keyword')}
                isDisabled={isLoading || !!error}
              />
            </FlexItem>
            <FlexItem>
              <ToggleGroup aria-label={t('Filter catalog by resource type')}>
                {catalogTypeFilters.map((option) => (
                  <ToggleGroupItem
                    key={option.value}
                    text={option.label}
                    buttonId={`catalog-type-filter-${option.value}`}
                    isSelected={typeFilters?.includes(option.value)}
                    onChange={() => setTypeFilters((prev) =>
                      prev.includes(option.value) ?
                        prev.filter(o => o !== option.value) :
                        [...prev, option.value]
                      )}
                  />
                ))}
              </ToggleGroup>
            </FlexItem>
          </Flex>
        </StackItem>

        {showEmptyState ? (
          <StackItem>
            <EmptyState titleText={t('No catalog items found')} headingLevel="h2">
              <EmptyStateBody>
                {searchTerm
                  ? t('No catalog items match your search.')
                  : t('No published catalog items are available yet.')}
              </EmptyStateBody>
            </EmptyState>
          </StackItem>
        ) : (
          <CatalogItemListSection
            items={filteredItems as CatalogItemWithType[]}
            isLoading={isLoading}
            error={error}
            onSelectItem={(item) => navigate(`/catalog/${item.type}/${item.id}`)}
          />
        )}
      </Stack>
    </ListPage>
  );
};

export default CatalogPage;
