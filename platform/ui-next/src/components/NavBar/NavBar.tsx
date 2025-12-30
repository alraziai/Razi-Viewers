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
        'z-20 border-black px-1',
        isSticky && stickyClasses,
        !isSticky && notStickyClasses,
        className
      )}
      style={{
        background: 'linear-gradient(90deg, #48FFF626, #2E86D5, #48FFF626',
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
