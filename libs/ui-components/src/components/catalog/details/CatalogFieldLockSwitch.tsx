import { Flex, FlexItem, Switch } from '@patternfly/react-core';

import { useTranslation } from '../../../hooks/useTranslation.ts';

interface CatalogFieldLockSwitchProps {
  id: string;
  fieldLabel: string;
  locked: boolean;
}

export const CatalogFieldLockSwitch = ({ id, fieldLabel, locked }: CatalogFieldLockSwitchProps) => {
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
          isChecked={locked}
          isDisabled
          hasCheckIcon
          aria-label={t('Lock {{field}} for launch', { field: fieldLabel })}
        />
      </FlexItem>
      <FlexItem>
        <span aria-hidden="true">{locked ? t('Locked') : t('Unlocked')}</span>
      </FlexItem>
    </Flex>
  );
};
