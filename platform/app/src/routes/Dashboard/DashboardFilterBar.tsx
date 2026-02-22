import React from 'react';
import PropTypes from 'prop-types';
import { Icons } from '@ohif/ui-next';
import { InputGroup } from '@ohif/ui';

interface DashboardFilterBarProps {
  filtersMeta: any[];
  filterValues: any;
  onChange: (values: any) => void;
  clearFilters: () => void;
  isFiltering: boolean;
  numOfStudies: number;
  filterSorting: { sortBy: string; sortDirection: string };
  onSortingChange: (sorting: any) => void;
  isSortingEnabled: boolean;
}

const DashboardFilterBar: React.FC<DashboardFilterBarProps> = ({
  filtersMeta,
  filterValues,
  onChange,
  clearFilters,
  isFiltering,
  numOfStudies,
  filterSorting,
  onSortingChange,
  isSortingEnabled,
}) => {
  return (
    <div className="sticky top-0 z-10 mb-4 overflow-hidden transition-all duration-100">
      <div className="pt-4 pb-4 px-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            {isFiltering && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 rounded-lg border border-[#FFFFFF1A] bg-[#FFFFFF0D] px-3 py-1.5 text-xs text-white hover:bg-[#FFFFFF1A] transition-colors"
              >
                <Icons.Cancel className="h-4 w-4" />
                Clear Filters
              </button>
            )}
          </div>
        </div>
        <InputGroup
          inputMeta={filtersMeta}
          values={filterValues}
          onValuesChange={onChange}
          sorting={filterSorting}
          onSortingChange={onSortingChange}
          isSortingEnabled={isSortingEnabled}
        />
        {numOfStudies > 100 && (
          <div className="mt-3 rounded-lg bg-gradient-to-r from-[#2E86D5] to-[#48FFF6] px-4 py-2 text-center text-sm text-[#0A1628]">
            Filter list to 100 studies or less to enable sorting
          </div>
        )}
      </div>
    </div>
  );
};

DashboardFilterBar.propTypes = {
  filtersMeta: PropTypes.array.isRequired,
  filterValues: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  clearFilters: PropTypes.func.isRequired,
  isFiltering: PropTypes.bool.isRequired,
  numOfStudies: PropTypes.number.isRequired,
  filterSorting: PropTypes.shape({
    sortBy: PropTypes.string,
    sortDirection: PropTypes.string,
  }).isRequired,
  onSortingChange: PropTypes.func.isRequired,
  isSortingEnabled: PropTypes.bool.isRequired,
};

export default DashboardFilterBar;
