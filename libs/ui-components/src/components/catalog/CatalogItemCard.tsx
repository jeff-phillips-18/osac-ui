import { useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
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
} from '@patternfly/react-core';
import LockIcon from '@patternfly/react-icons/dist/esm/icons/lock-icon';
import RocketIcon from '@patternfly/react-icons/dist/esm/icons/rocket-icon';

import CatalogItemCardActionsMenu from './CatalogItemCardActionsMenu';
import {
  type CatalogItemWithType,
  type CatalogNetworkingLockTone,
  catalogItemCardSummaryRows,
  catalogItemCreatePath,
  catalogItemManagedFooterText,
  catalogItemNetworkingLockSummary,
  catalogItemTypeBadgeLabel,
} from './catalogItemDisplay';
import { useTranslation } from '../../hooks/useTranslation';
import { CatalogItemIcon } from '../../icons';

interface CatalogItemCardProps {
  item: CatalogItemWithType;
  ouiaId?: string;
  onOpenDetails?: () => void;
}

const networkingLabelColor = (
  tone: CatalogNetworkingLockTone,
): 'grey' | 'orange' | 'blue' => {
  switch (tone) {
    case 'locked':
      return 'grey';
    case 'mixed':
      return 'orange';
    default:
      return 'blue';
  }
};

const CatalogItemCard = ({
  item,
  ouiaId,
  onOpenDetails,
}: CatalogItemCardProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const summaryRows = catalogItemCardSummaryRows(item, t);
  const networkingSummary = catalogItemNetworkingLockSummary(item, t);
  const cardId = `catalog-item-card-${item.id}`;
  const titleId = `${cardId}-title`;
  const typeLabel = catalogItemTypeBadgeLabel(item.type, t);
  const managedFooterText = catalogItemManagedFooterText(item.type, t);
  const showNetworkingLockIcon = networkingSummary.tone !== 'unlocked';

  const handleOpenDetails = () => {
    onOpenDetails?.();
  };

  const handleLaunch = () => {
    navigate(catalogItemCreatePath(item.type, item.id));
  };

  return (
    <Card
      id={cardId}
      ouiaId={ouiaId}
      isFullHeight
      className="catalog-item-card"
    >
      <CardHeader
        actions={{
          actions: (
            <Flex
              alignItems={{ default: 'alignItemsCenter' }}
              gap={{ default: 'gapSm' }}
              flexWrap={{ default: 'nowrap' }}
            >
              <FlexItem>
                <Label color="blue" isCompact>
                  {typeLabel}
                </Label>
              </FlexItem>
              {item.published ? (
                <FlexItem>
                  <Label color="green" isCompact>
                    {t('Live')}
                  </Label>
                </FlexItem>
              ) : null}
              <FlexItem>
                <CatalogItemCardActionsMenu itemTitle={item.title} onLaunch={handleLaunch}/>
              </FlexItem>
            </Flex>
          ),
        }}
      >
        <span className="catalog-item-card__icon-tile">
          <CatalogItemIcon kind={item.$typeName} />
        </span>
      </CardHeader>

      <CardTitle id={titleId} className="catalog-item-card__title">
        {onOpenDetails ? (
          <Button
            variant="link"
            isInline
            onClick={(event) => {
              event.stopPropagation();
              handleOpenDetails();
            }}
            aria-label={t('Open catalog item details for {{title}}', {
              title: item.title,
            })}
          >
            {item.title}
          </Button>
        ) : (
          item.title
        )}
      </CardTitle>

      <CardBody>
        <Stack hasGutter>
          <StackItem isFilled>
            {summaryRows.length > 0 ? (
              <DescriptionList isHorizontal isCompact horizontalTermWidthModifier={{ default: '15ch' }}>
                {summaryRows.map((row) => (
                  <DescriptionListGroup key={`${item.id}-${row.label}`}>
                    <DescriptionListTerm>{row.label}</DescriptionListTerm>
                    <DescriptionListDescription>{row.value}</DescriptionListDescription>
                  </DescriptionListGroup>
                ))}
              </DescriptionList>
            ) : null}
          </StackItem>

          <StackItem>
            <Divider />
          </StackItem>

          <StackItem>
            <Flex
              alignItems={{ default: 'alignItemsCenter' }}
              justifyContent={{ default: 'justifyContentSpaceBetween' }}
              gap={{ default: 'gapSm' }}
              flexWrap={{ default: 'wrap' }}
            >
              <FlexItem className="catalog-item-card__networking-label">
                {t('Networking')}
              </FlexItem>
              <FlexItem>
                <Label
                  variant="filled"
                  color={networkingLabelColor(networkingSummary.tone)}
                  isCompact
                  icon={showNetworkingLockIcon ? <LockIcon /> : undefined}
                >
                  {networkingSummary.label}
                </Label>
              </FlexItem>
            </Flex>
          </StackItem>
        </Stack>
      </CardBody>

      <CardFooter>
        <Stack hasGutter>
          <StackItem>
            <Flex
              alignItems={{ default: 'alignItemsCenter' }}
              gap={{ default: 'gapXs' }}
              className="catalog-item-card__footer-note2"
            >
              <FlexItem>
                <LockIcon aria-hidden />
              </FlexItem>
              <FlexItem>{managedFooterText}</FlexItem>
            </Flex>
          </StackItem>
          <StackItem>
            <Button
              variant="primary"
              isBlock
              icon={<RocketIcon />}
              onClick={(event) => {
                event.stopPropagation();
                handleLaunch();
              }}
            >
              {t('Launch instance')}
            </Button>
          </StackItem>
        </Stack>
      </CardFooter>
    </Card>
  );
};

export default CatalogItemCard;
