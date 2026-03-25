import React from 'react';
import PropTypes from 'prop-types';
import Typography from '../Typography';
import { Icons } from '@ohif/ui-next';

const ContextMenu = ({ items, ...props }) => {
  if (!items) {
    return null;
  }

  return (
    <div
      data-cy="context-menu"
      className="bg-[linear-gradient(90deg,_#102b40_0%,_#143947_50%,_#112d41_100%)] relative z-50 block w-48 overflow-hidden rounded-lg border border-[#48FFF6]/20 shadow-lg"
      onContextMenu={e => e.preventDefault()}
    >
      {items.map((item, index) => (
        <div
          key={index}
          data-cy="context-menu-item"
          onClick={() => item.action(item, props)}
          style={{ justifyContent: 'space-between' }}
          className="flex cursor-pointer items-center border-b border-[#48FFF6]/10 px-4 py-3 transition-colors duration-200 hover:bg-[#083A4A] last:border-b-0"
        >
          <Typography className="text-white">{item.label}</Typography>
          {item.iconRight && (
            <Icons.ByName
              name={item.iconRight}
              className="inline text-white"
            />
          )}
        </div>
      ))}
    </div>
  );
};

ContextMenu.propTypes = {
  defaultPosition: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number,
  }),
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      action: PropTypes.func.isRequired,
    })
  ),
};

export default ContextMenu;
