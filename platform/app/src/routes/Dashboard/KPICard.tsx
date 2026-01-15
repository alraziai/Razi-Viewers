import React from 'react';
import PropTypes from 'prop-types';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendPositive?: boolean;
}
const LineGraphIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M3 12L9 6L13 10L21 2M21 2H15M21 2V8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3 18H21"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);
const KPICard: React.FC<KPICardProps> = ({ title, value, icon, trend, trendPositive = true }) => {
  return (
    <div className="rounded-3xl bg-white bg-opacity-[5%] border border-[#FFFFFF1A] p-6">
      <div className="flex justify-between">
        <div className="flex flex-col gap-4">
          <div className="text-[#2E86D5]">{icon}</div>
          <span className="text-lg text-[#FFFFFF99]">{title}</span>
          <span className="text-3xl font-semibold text-white">{value}</span>
        </div>
        <div className='justify-start content-start h-full'>
          {trend && (
            <div className={`flex items-center gap-0.5 text-lg font-normal ${trendPositive ? 'text-[#2E86D5]' : 'text-red-400'}`}>
              <LineGraphIcon />
              <span>{trendPositive ? '+' : '-'}</span>
              <span>{trend}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

KPICard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.node.isRequired,
  trend: PropTypes.string,
  trendPositive: PropTypes.bool,
};

export default KPICard;
