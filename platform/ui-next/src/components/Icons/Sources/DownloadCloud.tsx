import React from 'react';
import type { IconProps } from '../types';

export const DownloadCloud = (props: IconProps) => (
  <svg
    width="24px"
    height="24px"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Cloud */}
      <path d="M18 10h-1.26A5.5 5.5 0 1 0 9 16h9a3.5 3.5 0 1 0 0-6Z" />
      {/* Down arrow */}
      <path d="M12 14v5" />
      <path d="m9 17 3 3 3-3" />
    </g>
  </svg>
);

export default DownloadCloud;
