import React from 'react';
import PropTypes from 'prop-types';
import { Icons } from '@ohif/ui-next';
import classNames from 'classnames';

interface DashboardTableRow {
  patientInitials: string;
  patientName: string;
  scanId: string;
  studyType: string;
  referral: string;
  status: 'completed' | 'processing' | 'pending' | '';
  aiAccuracy: number | null;
  findings: string;
  time: string;
  isUrgent?: boolean;
}

interface DashboardTableProps {
  data: DashboardTableRow[];
}

const DashboardTable: React.FC<DashboardTableProps> = ({ data }) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400">
            <Icons.StatusSuccess className="h-3 w-3" />
            Completed
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-medium text-yellow-400">
            <Icons.LoadingSpinner className="h-3 w-3 animate-spin" />
            Processing
          </span>
        );
      default:
        return null;
    }
  };

  const getStudyTypeIcon = (studyType: string) => {
    const type = studyType.toLowerCase();
    if (type.includes('ct')) {
      return <Icons.IconMPR className="h-5 w-5 text-[#48FFF6]" />;
    } else if (type.includes('mri')) {
      return <Icons.Series className="h-5 w-5 text-[#48FFF6]" />;
    } else if (type.includes('x-ray') || type.includes('xray') || type.includes('cr') || type.includes('dr')) {
      return <Icons.Patient className="h-5 w-5 text-[#48FFF6]" />;
    }
    return <Icons.Series className="h-5 w-5 text-[#48FFF6]" />;
  };

  return (
    <div className="rounded-lg bg-[#0A1628] border border-[#FFFFFF1A] overflow-hidden">
      <div className="p-6 border-b border-[#FFFFFF1A]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Recent updated Scans</h2>
            <p className="text-sm text-[#B0B0B0] mt-1">Real-time analysis and results</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 rounded-lg border border-[#FFFFFF1A] bg-[#FFFFFF0D] px-4 py-2 text-sm text-white hover:bg-[#FFFFFF1A] transition-colors">
              <Icons.Sorting className="h-4 w-4" />
              Filter
            </button>
            <button className="flex items-center gap-2 rounded-lg border border-[#FFFFFF1A] bg-[#FFFFFF0D] px-4 py-2 text-sm text-white hover:bg-[#FFFFFF1A] transition-colors">
              Mark as
              <Icons.ChevronDown className="h-4 w-4" />
            </button>
            <button className="flex items-center gap-2 rounded-lg border border-[#FFFFFF1A] bg-[#FFFFFF0D] px-4 py-2 text-sm text-white hover:bg-[#FFFFFF1A] transition-colors">
              <Icons.Trash className="h-4 w-4" />
              Delete
            </button>
            <button className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#2E86D5] to-[#48FFF6] px-4 py-2 text-sm font-medium text-[#0A1628] hover:opacity-90 transition-opacity">
              Add Demo Case
            </button>
            <button className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#2E86D5] to-[#48FFF6] px-4 py-2 text-sm font-medium text-[#0A1628] hover:opacity-90 transition-opacity">
              <Icons.Upload className="h-4 w-4" />
              Upload Scan
            </button>
            <button className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#2E86D5] to-[#48FFF6] px-4 py-2 text-sm font-medium text-[#0A1628] hover:opacity-90 transition-opacity">
              Review Case
              <Icons.ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#083A4A] border-b border-[#FFFFFF1A]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#B0B0B0] uppercase tracking-wider">
                <input type="checkbox" className="rounded border-[#FFFFFF1A] bg-[#0A1628] text-[#48FFF6]" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#B0B0B0] uppercase tracking-wider">Patient</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#B0B0B0] uppercase tracking-wider">Scan ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#B0B0B0] uppercase tracking-wider">Study Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#B0B0B0] uppercase tracking-wider">Referral</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#B0B0B0] uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#B0B0B0] uppercase tracking-wider">AI Accuracy</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#B0B0B0] uppercase tracking-wider">Findings</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#B0B0B0] uppercase tracking-wider">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#B0B0B0] uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#FFFFFF1A]">
            {data.map((row, index) => (
              <tr
                key={index}
                className={classNames(
                  'hover:bg-[#083A4A] transition-colors',
                  row.isUrgent && 'bg-blue-500/10'
                )}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <input type="checkbox" className="rounded border-[#FFFFFF1A] bg-[#0A1628] text-[#48FFF6]" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#2E86D5] to-[#48FFF6] text-sm font-medium text-[#0A1628]">
                      {row.patientInitials}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-white">{row.patientName}</span>
                      {row.isUrgent && (
                        <span className="text-xs text-[#48FFF6]">Case status: Urgent</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#B0B0B0]">{row.scanId}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {getStudyTypeIcon(row.studyType)}
                    <span className="text-sm text-white">{row.studyType}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#B0B0B0]">{row.referral || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(row.status)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  {row.aiAccuracy !== null ? `${row.aiAccuracy}%` : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{row.findings}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#B0B0B0]">{row.time}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <button className="text-[#B0B0B0] hover:text-[#48FFF6] transition-colors">
                      <Icons.ArrowDown className="h-4 w-4 rotate-180" />
                    </button>
                    <button className="text-[#B0B0B0] hover:text-[#48FFF6] transition-colors">
                      <Icons.EyeVisible className="h-4 w-4" />
                    </button>
                    <button className="text-[#B0B0B0] hover:text-[#48FFF6] transition-colors">
                      <Icons.Download className="h-4 w-4" />
                    </button>
                    <button className="text-[#B0B0B0] hover:text-[#48FFF6] transition-colors">
                      <Icons.Export className="h-4 w-4" />
                    </button>
                    <button className="ml-2 flex items-center gap-1 rounded-lg bg-gradient-to-r from-[#2E86D5] to-[#48FFF6] px-3 py-1 text-xs font-medium text-[#0A1628] hover:opacity-90 transition-opacity">
                      Review Case
                      <Icons.ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

DashboardTable.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      patientInitials: PropTypes.string.isRequired,
      patientName: PropTypes.string.isRequired,
      scanId: PropTypes.string.isRequired,
      studyType: PropTypes.string.isRequired,
      referral: PropTypes.string,
      status: PropTypes.oneOf(['completed', 'processing', 'pending', '']),
      aiAccuracy: PropTypes.number,
      findings: PropTypes.string.isRequired,
      time: PropTypes.string.isRequired,
      isUrgent: PropTypes.bool,
    })
  ).isRequired,
};

export default DashboardTable;
