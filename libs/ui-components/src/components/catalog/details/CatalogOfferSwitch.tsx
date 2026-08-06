import { Flex, FlexItem, Switch } from '@patternfly/react-core';

import { useTranslation } from '../../../hooks/useTranslation.ts';

interface CatalogOfferSwitchProps {
  id: string;
  offerLabel: string;
  enabled: boolean;
}

export const CatalogOfferSwitch = ({ id, offerLabel, enabled }: CatalogOfferSwitchProps) => {
  const { t } = useTranslation();

  return (
    <Flex
      alignItems={{ default: 'alignItemsCenter' }}
      gap={{ default: 'gapSm' }}
      flexWrap={{ default: 'nowrap' }}
    >
      <FlexItem>
        <Switch
          id={id}
          isChecked={enabled}
          isDisabled
          hasCheckIcon
          aria-label={offerLabel}
        />
      </FlexItem>
      <FlexItem>
        <span aria-hidden="true">{enabled ? t('On') : t('Off')}</span>
      </FlexItem>
    </Flex>
  );
};
