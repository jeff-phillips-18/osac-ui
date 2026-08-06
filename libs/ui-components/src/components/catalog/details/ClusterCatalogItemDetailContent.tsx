import {
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Divider,
  Flex,
  FlexItem,
  Label,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';
import RedhatIcon from '@patternfly/react-icons/dist/esm/icons/redhat-icon';

import { CatalogFieldLockSwitch } from './CatalogFieldLockSwitch.tsx';
import { CatalogOfferSwitch } from './CatalogOfferSwitch.tsx';
import { useTranslation } from '../../../hooks/useTranslation.ts';
import { SubtleContent } from '../../SubtleContent/SubtleContent.tsx';
import {
  type CatalogItemWithType,
  catalogItemClusterDetailSpecRows,
  catalogItemExternalIpOffer,
  catalogItemNetworkingLockRows,
  catalogItemTypeBadgeLabel,
} from '../catalogItemDisplay.ts';

interface ClusterCatalogItemDetailContentProps {
  item: CatalogItemWithType;
}

const ClusterCatalogItemDetailContent = ({ item }: ClusterCatalogItemDetailContentProps) => {
  const { t } = useTranslation();
  const description = item.description?.trim();
  const serviceLabel = catalogItemTypeBadgeLabel(item.type, t);
  const specRows = catalogItemClusterDetailSpecRows(item, t);
  const networkingRows = catalogItemNetworkingLockRows(item, t);
  const externalIpOffer = catalogItemExternalIpOffer(item);

  return (
    <Stack hasGutter className="catalog-item-detail-content catalog-item-detail-content--cluster">
      {description ? (
        <StackItem>
          <Content component="p">{description}</Content>
        </StackItem>
      ) : null}

      <StackItem>
        <DescriptionList>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Service')}</DescriptionListTerm>
            <DescriptionListDescription>{serviceLabel}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Status')}</DescriptionListTerm>
            <DescriptionListDescription>
              {item.published ? (
                <Label color="green" isCompact>
                  {t('Live')}
                </Label>
              ) : (
                <Label color="grey" isCompact>
                  {t('Draft')}
                </Label>
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </StackItem>

      {specRows.length > 0 ? (
        <>
          <StackItem>
            <Divider />
          </StackItem>
          <StackItem>
            <DescriptionList>
              {specRows.map((row) => (
                <DescriptionListGroup key={`${item.id}-spec-${row.label}`}>
                  <DescriptionListTerm>{row.label}</DescriptionListTerm>
                  <DescriptionListDescription>
                    {row.showRedHatIcon ? (
                      <Flex
                        alignItems={{ default: 'alignItemsCenter' }}
                        gap={{ default: 'gapSm' }}
                        flexWrap={{ default: 'nowrap' }}
                      >
                        <FlexItem>
                          <RedhatIcon aria-hidden />
                        </FlexItem>
                        <FlexItem>{row.value}</FlexItem>
                      </Flex>
                    ) : (
                      row.value
                    )}
                  </DescriptionListDescription>
                </DescriptionListGroup>
              ))}
            </DescriptionList>
          </StackItem>
        </>
      ) : null}

      {networkingRows.length > 0 ? (
        <>
          <StackItem>
            <Divider />
          </StackItem>
          <StackItem>
            <Stack hasGutter={false}>
              <StackItem>
                <Title
                  headingLevel="h3"
                  size="md"
                  className="catalog-item-detail-content__section-title"
                >
                  {t('Networking')}
                </Title>
              </StackItem>
              <StackItem>
                <SubtleContent component="p">
                  {t(
                    'Locked fields are fixed for launch. Unlocked fields can be chosen when you create an instance.',
                  )}
                </SubtleContent>
              </StackItem>
            </Stack>
            <DescriptionList className="pf-v6-u-mt-md">
              {networkingRows.map((row) => (
                <DescriptionListGroup key={`${item.id}-net-${row.path}`}>
                  <DescriptionListTerm>{row.label}</DescriptionListTerm>
                  <DescriptionListDescription>
                    <CatalogFieldLockSwitch
                      id={`${item.id}-lock-${row.path}`}
                      fieldLabel={row.label}
                      locked={row.locked}
                    />
                  </DescriptionListDescription>
                </DescriptionListGroup>
              ))}
            </DescriptionList>
          </StackItem>
        </>
      ) : null}

      {externalIpOffer ? (
        <>
          <StackItem>
            <Divider />
          </StackItem>
          <StackItem>
            <Stack hasGutter={false}>
              <StackItem>
                <Title
                  headingLevel="h3"
                  size="md"
                  className="catalog-item-detail-content__section-title"
                >
                  {t('External IP pool')}
                </Title>
              </StackItem>
              <StackItem>
                <SubtleContent component="p">
                  {t(
                    'When on, tenants can attach an address from the pools you allow for this offering. Manage pool inventory under Networking → External IP pools.',
                  )}
                </SubtleContent>
              </StackItem>
            </Stack>
            <DescriptionList className="pf-v6-u-mt-md">
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Offer external IP pools')}</DescriptionListTerm>
                <DescriptionListDescription>
                  <CatalogOfferSwitch
                    id={`${item.id}-external-ip-offer`}
                    offerLabel={t('Offer external IP pools')}
                    enabled={externalIpOffer.enabled}
                  />
                </DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </StackItem>
        </>
      ) : null}
    </Stack>
  );
};

export default ClusterCatalogItemDetailContent;
