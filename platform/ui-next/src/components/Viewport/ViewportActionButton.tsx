import React from 'react';
import PropTypes from 'prop-types';

/**
 * A button that can trigger commands when clicked.
 */
function ViewportActionButton({ onInteraction, commands, id, children }) {
  return (
    <div
      className="ml-1 cursor-pointer rounded border border-[#48FFF6]/20 bg-[#102b40]/90 px-1.5 text-[#48FFF6] transition-colors hover:bg-[#143947] hover:text-white"
      // Using onMouseUp because onClick wasn't firing if pointer-events are none.
      onMouseUp={() => {
        onInteraction({
          itemId: id,
          commands,
        });
      }}
    >
      {children}
    </div>
  );
}

ViewportActionButton.propTypes = {
  id: PropTypes.string,
  onInteraction: PropTypes.func.isRequired,
  commands: PropTypes.array,
  children: PropTypes.node,
};

export { ViewportActionButton };
