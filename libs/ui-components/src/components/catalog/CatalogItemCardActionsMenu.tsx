import { useState } from 'react';
import { Dropdown, DropdownItem, DropdownList, MenuToggle } from '@patternfly/react-core';
import { EllipsisVIcon } from '@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon';

import { useTranslation } from '../../hooks/useTranslation';

interface CatalogItemCardActionsMenuProps {
  itemTitle: string;
  onViewDetails?: () => void;
  onLaunch?: () => void;
}

const CatalogItemCardActionsMenu = ({
  itemTitle,
  onViewDetails,
  onLaunch,
}: CatalogItemCardActionsMenuProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  if (!onViewDetails && !onLaunch) {
    return null;
  }

  return (
    <Dropdown
      isOpen={open}
      onOpenChange={setOpen}
      popperProps={{ position: 'right' }}
      toggle={(ref) => (
        <MenuToggle
          ref={ref}
          variant="plain"
          onClick={(event) => {
            event.stopPropagation();
            setOpen((current) => !current);
          }}
          aria-label={t('Actions for {{title}}', { title: itemTitle })}
        >
          <EllipsisVIcon />
        </MenuToggle>
      )}
    >
      <DropdownList>
        {onViewDetails ? (
          <DropdownItem
            value="view-details"
            onClick={() => {
              setOpen(false);
              onViewDetails();
            }}
          >
            {t('View details')}
          </DropdownItem>
        ) : null}
        {onLaunch ? (
          <DropdownItem
            value="launch"
            onClick={() => {
              setOpen(false);
              onLaunch();
            }}
          >
            {t('Launch instance')}
          </DropdownItem>
        ) : null}
      </DropdownList>
    </Dropdown>
  );
};

export default CatalogItemCardActionsMenu;
