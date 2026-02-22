import React from 'react';
import PropTypes from 'prop-types';

interface Metric {
  label: string;
  value: number;
}

interface PerformanceCardProps {
  title: string;
  icon: React.ReactNode;
  metrics: Metric[];
}

const PerformanceCard: React.FC<PerformanceCardProps> = ({ title, icon, metrics }) => {
  return (
    <div className="rounded-3xl bg-[#FFFFFF0D] border border-[#FFFFFF1A] p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="text-[#48FFF6]">{icon}</div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      <div className="space-y-4">
        {metrics.map((metric, index) => (
          <div key={index}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#B0B0B0]">{metric.label}</span>
              <span className="text-sm font-medium text-white">{metric.value}%</span>
            </div>
            <div className="h-2 w-full bg-[#083A4A] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#2E86D5] to-[#48FFF6] rounded-full transition-all duration-300"
                style={{ width: `${metric.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

PerformanceCard.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.node.isRequired,
  metrics: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired,
    })
  ).isRequired,
};

export default PerformanceCard;
