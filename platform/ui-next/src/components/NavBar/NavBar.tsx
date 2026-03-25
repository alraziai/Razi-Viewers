import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

const stickyClasses = 'sticky top-0';
const notStickyClasses = 'relative';

const NavBar = ({
  className,
  children,
  isSticky,
}: {
  className?: string;
  children?: React.ReactNode;
  isSticky?: boolean;
}) => {
  return (
    <div
      className={classnames(
        'z-20 flex justify-between border-b-2 px-1 py-5',
        isSticky && stickyClasses,
        !isSticky && notStickyClasses,
        className
      )}
      style={{
        background: 'linear-gradient(90deg, #102b40 0%, #143947 50%, #112d41 100%)',
        borderImage: 'linear-gradient(180deg, #2E86D5 0%, #48FFF6 100%) 1',
        borderImageSlice: 1,
        borderStyle: 'solid',
      }}
    >
      {children}
    </div>
  );
};

NavBar.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  isSticky: PropTypes.bool,
};

export default NavBar;
