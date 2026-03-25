import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';

import { Icons } from '@ohif/ui-next';

const arrowClasses =
  'cursor-pointer flex items-center justify-center shrink-0 rounded text-[#48FFF6] active:text-white hover:bg-[#102b40]/85';

/**
 * A small set of left/right arrow icons for stepping through slices or series.
 */
function ViewportActionArrows({ onArrowsClick, className }) {
  return (
    <div className={classNames(className, 'flex')}>
      <div className={arrowClasses}>
        <Icons.ArrowLeftBold onClick={() => onArrowsClick(-1)} />
      </div>
      <div className={arrowClasses}>
        <Icons.ArrowRightBold onClick={() => onArrowsClick(1)} />
      </div>
    </div>
  );
}

ViewportActionArrows.propTypes = {
  onArrowsClick: PropTypes.func.isRequired,
  className: PropTypes.string,
};

export { ViewportActionArrows };
