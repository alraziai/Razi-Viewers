import React from 'react';
import PropTypes from 'prop-types';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendPositive?: boolean;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, icon, trend, trendPositive = true }) => {
  return (
    <div className="rounded-lg bg-[#0A1628] border border-[#FFFFFF1A] p-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <span className="text-sm text-[#B0B0B0]">{title}</span>
          <span className="text-3xl font-semibold text-white">{value}</span>
          {trend && (
            <div className={`flex items-center gap-1 text-sm ${trendPositive ? 'text-green-400' : 'text-red-400'}`}>
              <span>{trendPositive ? '+' : '-'}</span>
              <span>{trend}</span>
            </div>
          )}
        </div>
        <div className="text-[#48FFF6]">{icon}</div>
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
