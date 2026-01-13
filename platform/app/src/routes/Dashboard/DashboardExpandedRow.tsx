import React from 'react';
import PropTypes from 'prop-types';

interface DashboardExpandedRowProps {
  seriesTableColumns: Record<string, string>;
  seriesTableDataSource: Array<Record<string, string | number>>;
  children: React.ReactNode;
}

const DashboardExpandedRow: React.FC<DashboardExpandedRowProps> = ({
  seriesTableColumns,
  seriesTableDataSource,
  children,
}) => {
  return (
    <div className="w-full bg-[#0A1628] border-t border-[#FFFFFF1A] py-6 px-6">
      <div className="block mb-4">{children}</div>
      <div className="mt-4">
        <div className="overflow-x-auto">
          <table className="w-full text-white">
            <thead className="bg-[#083A4A] border-b border-[#FFFFFF1A]">
              <tr>
                {Object.keys(seriesTableColumns).map(columnKey => (
                  <th
                    key={columnKey}
                    className="px-4 py-3 text-left text-xs font-medium text-[#B0B0B0] uppercase tracking-wider"
                  >
                    {seriesTableColumns[columnKey]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#FFFFFF1A]">
              {seriesTableDataSource.map((row, i) => (
                <tr
                  key={i}
                  className="hover:bg-[#083A4A] transition-colors"
                >
                  {Object.keys(row).map(cellKey => {
                    const content = row[cellKey];
                    return (
                      <td
                        key={cellKey}
                        className="px-4 py-3 text-sm text-white truncate"
                      >
                        {content}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

DashboardExpandedRow.propTypes = {
  seriesTableDataSource: PropTypes.arrayOf(PropTypes.object).isRequired,
  seriesTableColumns: PropTypes.object.isRequired,
  children: PropTypes.node.isRequired,
};

export default DashboardExpandedRow;
