import {
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  FlexItem,
  Label,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';

import { CatalogFieldEditabilityLabel } from './CatalogFieldEditabilityLabel.tsx';
import ClusterCatalogItemDetailContent from './ClusterCatalogItemDetailContent.tsx';
import { useTranslation } from '../../../hooks/useTranslation.ts';
import { catalogItemFieldDefinitions } from '../../catalogProvision/catalogFieldDefinition.ts';
import { SubtleContent } from '../../SubtleContent/SubtleContent.tsx';
import {
  type CatalogItemWithType,
  catalogItemMetadataLabelEntries,
  catalogItemResourceParts,
  formatCatalogFieldDefault,
} from '../catalogItemDisplay.ts';

import './CatalogItemDetailContent.css';

interface CatalogItemDetailContentProps {
  item: CatalogItemWithType;
}

const GenericCatalogItemDetailContent = ({ item }: CatalogItemDetailContentProps) => {
  const { t } = useTranslation();
  const resources = catalogItemResourceParts(item);
  const metadataLabels = catalogItemMetadataLabelEntries(item);
  const fieldDefinitions = catalogItemFieldDefinitions(item);

  return (
    <Stack hasGutter className="catalog-item-detail-content">
      <StackItem>
        <DescriptionList isCompact>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Catalog name')}</DescriptionListTerm>
            <DescriptionListDescription>{item.metadata?.name ?? '—'}</DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </StackItem>

      {item.description?.trim() ? (
        <StackItem>
          <Title headingLevel="h3" size="md" className="catalog-item-detail-content__section-title">
            {t('Description')}
          </Title>
          <Content component="p">{item.description}</Content>
        </StackItem>
      ) : null}

      {resources.length > 0 ? (
        <StackItem>
          <Title headingLevel="h3" size="md" className="catalog-item-detail-content__section-title">
            {t('Default resources')}
          </Title>
          <Flex flexWrap={{ default: 'wrap' }} gap={{ default: 'gapSm' }}>
            {resources.map((resource, index) => (
              <FlexItem key={`${item.id}-detail-resource-${index}`}>
                <Label variant="outline" color="blue" isCompact>
                  {resource}
                </Label>
              </FlexItem>
            ))}
          </Flex>
        </StackItem>
      ) : null}

      {metadataLabels.length > 0 ? (
        <StackItem>
          <Title headingLevel="h3" size="md" className="catalog-item-detail-content__section-title">
            {t('Labels')}
          </Title>
          <Flex flexWrap={{ default: 'wrap' }} gap={{ default: 'gapSm' }}>
            {metadataLabels.map(({ key, value }) => (
              <FlexItem key={`${item.id}-detail-label-${key}`}>
                <Label variant="outline" color="grey" isCompact>
                  <span className="catalog-item-detail-content__label-key">{key}</span>
                  {': '}
                  {value}
                </Label>
              </FlexItem>
            ))}
          </Flex>
        </StackItem>
      ) : null}

      {fieldDefinitions.length > 0 ? (
        <StackItem>
          <Stack hasGutter={false}>
            <StackItem>
              <Title
                headingLevel="h3"
                size="md"
                className="catalog-item-detail-content__section-title"
              >
                {t('Configuration defaults')}
              </Title>
            </StackItem>
            <StackItem>
              <SubtleContent component="p">
                {t(
                  'Editable fields can be changed when creating from this catalog item. Fixed fields use the default value shown.',
                )}
              </SubtleContent>
            </StackItem>
          </Stack>
          <DescriptionList isCompact className="pf-v6-u-mt-sm">
            {fieldDefinitions.map((def) => (
              <DescriptionListGroup key={def.path}>
                <DescriptionListTerm>
                  <Flex
                    alignItems={{ default: 'alignItemsCenter' }}
                    gap={{ default: 'gapSm' }}
                    flexWrap={{ default: 'wrap' }}
                  >
                    <FlexItem>{def.displayName}</FlexItem>
                    <FlexItem>
                      <CatalogFieldEditabilityLabel editable={def.editable} />
                    </FlexItem>
                  </Flex>
                </DescriptionListTerm>
                <DescriptionListDescription>
                  {formatCatalogFieldDefault(def)}
                </DescriptionListDescription>
              </DescriptionListGroup>
            ))}
          </DescriptionList>
        </StackItem>
      ) : null}
    </Stack>
  );
};

export const CatalogItemDetailContent = ({ item }: CatalogItemDetailContentProps) => {
  if (item.type === 'cluster') {
    return <ClusterCatalogItemDetailContent item={item} />;
  }
  return <GenericCatalogItemDetailContent item={item} />;
};
