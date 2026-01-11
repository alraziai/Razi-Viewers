import React, { useState } from 'react';
import classNames from 'classnames';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
}

interface SideNavBarProps {
  activeItem?: string;
  onItemClick?: (itemId: string) => void;
  className?: string;
}

// Bar Chart Icon Component
const BarChartIcon = ({ className }: { className?: string }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect x="3" y="12" width="3" height="5" fill="currentColor" />
    <rect x="8" y="8" width="3" height="9" fill="currentColor" />
    <rect x="13" y="4" width="3" height="13" fill="currentColor" />
  </svg>
);

// Scan/Focus Icon Component
const ScanIcon = ({ className }: { className?: string }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M2 2L6 2M14 2L18 2M2 6L2 2M2 14L2 18M18 6L18 2M18 14L18 18M6 18L2 18M18 18L14 18"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

// Brain Icon Component
const BrainIcon = ({ className }: { className?: string }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M12 2C8 2 6 4 6 8C6 10 7 11.5 8 12C7 12.5 6 14 6 16C6 20 8 22 12 22C16 22 18 20 18 16C18 14 17 12.5 16 12C17 11.5 18 10 18 8C18 4 16 2 12 2Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M9 10C9 10.5 9.5 11 10 11C10.5 11 11 10.5 11 10"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M13 10C13 10.5 13.5 11 14 11C14.5 11 15 10.5 15 10"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const SideNavBar: React.FC<SideNavBarProps> = ({
  activeItem = 'overview',
  onItemClick,
  className,
}) => {
  const [currentActive, setCurrentActive] = useState(activeItem);

  const navItems: NavItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <BarChartIcon />,
    },
    {
      id: 'recent-scans',
      label: 'Recent Scans',
      icon: <ScanIcon />,
    },
  ];

  const handleItemClick = (itemId: string) => {
    setCurrentActive(itemId);
    onItemClick?.(itemId);
  };

  return (
    <div
      className={classNames(
        'relative flex w-[280px] flex-col',
        className
      )}
      style={{
        height: 'calc(100vh - 100px)',
        background: 'radial-gradient(ellipse at top left, rgba(13, 90, 111, 0.8) 0%, rgba(8, 58, 74, 1) 100%)',
      }}
    >
      {/* Bright cyan vertical line on the right edge */}
      <div className="absolute right-0 top-0 h-full w-[2px] bg-[#48FFF6]" />

      {/* Navigation Items */}
      <div className="flex flex-col gap-2 p-4 pt-6">
        {navItems.map((item) => {
          const isActive = currentActive === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={classNames(
                'flex h-12 w-full items-center gap-3 rounded-lg px-4 transition-all',
                isActive
                  ? 'bg-gradient-to-r from-[#2E86D5] to-[#48FFF6] shadow-lg'
                  : 'bg-[#0A4A5C80] hover:bg-[#0A4A5CAA]'
              )}
            >
              <div
                className={classNames(
                  'flex items-center justify-center',
                  isActive ? 'text-[#0A1628]' : 'text-[#B0B0B0]'
                )}
              >
                {item.icon}
              </div>
              <span
                className={classNames(
                  'text-sm font-medium',
                  isActive ? 'text-[#0A1628]' : 'text-[#B0B0B0]'
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* AI System Status - Bottom */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="rounded-lg bg-[#0A4A5C80] p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center">
              <BrainIcon className="text-[#48FFF6]" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-[#B0B0B0]">AI System</span>
              <span className="text-xs text-[#48FFF6]">Online</span>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#083A4A]">
            <div
              className="h-full rounded-full bg-[#48FFF6] transition-all duration-300"
              style={{ width: '35%' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SideNavBar;
