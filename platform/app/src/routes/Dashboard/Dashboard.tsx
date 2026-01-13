import React, { useMemo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import isEqual from 'lodash.isequal';
import {
  Header,
  Icons,
  SideNavBar,
  ScrollArea,
  useModal,
  InputFilter,
} from '@ohif/ui-next';
import { useAppConfig } from '@state';
import { Types } from '@ohif/ui';
import { utils } from '@ohif/core';
import { preserveQueryParameters } from '../../utils/preserveQueryParameters';
import filtersMeta from '../WorkList/filtersMeta';
import KPICard from './KPICard';
import DashboardTable from './DashboardTable';
import PerformanceCard from './PerformanceCard';
import DashboardFilterBar from './DashboardFilterBar';

const PatientInfoVisibility = Types.PatientInfoVisibility;
const { sortBySeriesDate } = utils;

const defaultFilterValues = {
  patientName: '',
  mrn: '',
  studyDate: {
    startDate: null,
    endDate: null,
  },
  description: '',
  modalities: [],
  accession: '',
  sortBy: '',
  sortDirection: 'none',
};

// Line Graph Icon for KPIs
const LineGraphIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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

// People Icon
const PeopleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M23 21V19C22.9993 18.1137 22.7044 17.2478 22.1574 16.5443C21.6103 15.8408 20.8352 15.345 19.947 15.13"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Target Icon
const TargetIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="2" />
  </svg>
);

// Clock Icon
const ClockIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
    <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// Brain Icon for AI Analysis
const BrainIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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

// Line Graph Icon for System Performance
const SystemPerformanceIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M3 3V21H21"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7 16L11 12L15 14L21 8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

function Dashboard({
  data: studies,
  dataTotal: studiesTotal,
  isLoadingData,
  dataSource,
  servicesManager,
  dataPath,
}: withAppTypes) {
  const { t } = useTranslation();
  const [appConfig] = useAppConfig();
  const { customizationService } = servicesManager.services;

  // Track expanded rows
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const [studiesWithSeriesData, setStudiesWithSeriesData] = useState<string[]>([]);
  const seriesInStudiesMap = new Map();

  // Filter state
  const [filterValues, setFilterValues] = useState(defaultFilterValues);
  const [showFilterBar, setShowFilterBar] = useState(false);

  const isFiltering = useMemo(() => {
    return !isEqual(filterValues, defaultFilterValues);
  }, [filterValues]);

  const { sortBy, sortDirection } = filterValues;
  const filterSorting = { sortBy, sortDirection };
  const setFilterSorting = (sortingValues: any) => {
    setFilterValues({
      ...filterValues,
      ...sortingValues,
    });
  };
  const isSortingEnabled = studiesTotal > 0 && studiesTotal <= 100;

  // Reset expanded rows when filters change
  useEffect(() => {
    setExpandedRows([]);
  }, [filterValues]);

  // Filter studies based on filter values
  const filteredStudies = useMemo(() => {
    return studies.filter(study => {
      // Patient Name filter
      if (filterValues.patientName) {
        const patientName = (study.patientName || '').toLowerCase();
        if (!patientName.includes(filterValues.patientName.toLowerCase())) {
          return false;
        }
      }

      // MRN filter
      if (filterValues.mrn) {
        const mrn = (study.mrn || '').toLowerCase();
        if (!mrn.includes(filterValues.mrn.toLowerCase())) {
          return false;
        }
      }

      // Description filter
      if (filterValues.description) {
        const description = (study.description || '').toLowerCase();
        if (!description.includes(filterValues.description.toLowerCase())) {
          return false;
        }
      }

      // Accession filter
      if (filterValues.accession) {
        const accession = (study.accession || '').toLowerCase();
        if (!accession.includes(filterValues.accession.toLowerCase())) {
          return false;
        }
      }

      // Modalities filter
      if (filterValues.modalities && filterValues.modalities.length > 0) {
        const studyModalities = (study.modalities || '').toUpperCase();
        const hasMatchingModality = filterValues.modalities.some((mod: string) => {
          const modUpper = mod.toUpperCase();
          // Check if the modality string contains the filter value
          // This handles cases like "DX" matching "DX/RF"
          return studyModalities.includes(modUpper);
        });
        if (!hasMatchingModality) {
          return false;
        }
      }

      // Date range filter
      if (filterValues.studyDate?.startDate || filterValues.studyDate?.endDate) {
        const studyDate = study.date;
        if (studyDate) {
          const dateFormat = studyDate.length === 8 ? 'YYYYMMDD' : 'YYYY.MM.DD';
          const studyMoment = moment(studyDate, dateFormat, true);

          if (filterValues.studyDate.startDate) {
            const startMoment = moment(filterValues.studyDate.startDate);
            if (studyMoment.isBefore(startMoment, 'day')) {
              return false;
            }
          }

          if (filterValues.studyDate.endDate) {
            const endMoment = moment(filterValues.studyDate.endDate);
            if (studyMoment.isAfter(endMoment, 'day')) {
              return false;
            }
          }
        }
      }

      return true;
    });
  }, [studies, filterValues]);

  // Sort filtered studies
  const sortedFilteredStudies = useMemo(() => {
    if (!isSortingEnabled || !sortBy) {
      return filteredStudies;
    }

    return [...filteredStudies].sort((s1, s2) => {
      const s1Prop = s1[sortBy];
      const s2Prop = s2[sortBy];
      const sortModifier = sortDirection === 'descending' ? 1 : -1;

      if (typeof s1Prop === 'string' && typeof s2Prop === 'string') {
        return s1Prop.localeCompare(s2Prop) * sortModifier;
      } else if (typeof s1Prop === 'number' && typeof s2Prop === 'number') {
        return (s1Prop > s2Prop ? 1 : -1) * sortModifier;
      } else if (!s1Prop && s2Prop) {
        return -1 * sortModifier;
      } else if (!s2Prop && s1Prop) {
        return 1 * sortModifier;
      } else if (sortBy === 'studyDate') {
        const s1Date = moment(s1.date, ['YYYYMMDD', 'YYYY.MM.DD'], true);
        const s2Date = moment(s2.date, ['YYYYMMDD', 'YYYY.MM.DD'], true);
        if (s1Date.isValid() && s2Date.isValid()) {
          return (s1Date.toISOString() > s2Date.toISOString() ? 1 : -1) * sortModifier;
        }
      }

      return 0;
    });
  }, [filteredStudies, sortBy, sortDirection, isSortingEnabled]);

  // Query for series information when rows are expanded
  useEffect(() => {
    const fetchSeries = async (studyInstanceUid: string) => {
      try {
        const series = await dataSource.query.series.search(studyInstanceUid);
        seriesInStudiesMap.set(studyInstanceUid, sortBySeriesDate(series));
        setStudiesWithSeriesData(prev => [...prev, studyInstanceUid]);
      } catch (ex) {
        console.warn(ex);
      }
    };

    expandedRows.forEach((rowIndex) => {
      // Use sortedFilteredStudies to get the correct study after filtering
      if (rowIndex >= 0 && rowIndex < sortedFilteredStudies.length) {
        const study = sortedFilteredStudies[rowIndex];
        if (study && study.studyInstanceUid) {
          if (!studiesWithSeriesData.includes(study.studyInstanceUid)) {
            fetchSeries(study.studyInstanceUid);
          }
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedRows, sortedFilteredStudies, dataSource]);

  // Transform study data to dashboard table format
  const dashboardTableData = useMemo(() => {
    return sortedFilteredStudies.slice(0, 10).map((study, index) => {
      const {
        studyInstanceUid,
        accession,
        modalities,
        description,
        patientName,
        date,
        time,
      } = study;

      // Get patient initials
      const getInitials = (name: string) => {
        if (!name) return 'AN';
        const parts = name.split(' ');
        if (parts.length >= 2) {
          return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
      };

      // Format study type
      const formatStudyType = (modality: string) => {
        if (modality.includes('CT')) return 'CT Scan';
        if (modality.includes('MR')) return 'MRI';
        if (modality.includes('CR') || modality.includes('DR') || modality.includes('DX')) return 'X-Ray';
        return modality || 'Unknown';
      };

      // Calculate relative time
      const getRelativeTime = (dateStr: string, timeStr: string) => {
        if (!dateStr) return 'Unknown';
        try {
          const dateFormat = dateStr.length === 8 ? 'YYYYMMDD' : 'YYYY.MM.DD';
          const timeFormat = timeStr?.length === 6 ? 'HHmmss' : timeStr?.length === 4 ? 'HHmm' : 'HH';
          const studyDateTime = moment(`${dateStr}${timeStr || ''}`, `${dateFormat}${timeStr ? timeFormat : ''}`);
          if (studyDateTime.isValid()) {
            return studyDateTime.fromNow();
          }
        } catch (e) {
          // Fallback
        }
        return `${index + 1} min ago`;
      };

      // Mock AI accuracy (in real app, this would come from AI analysis)
      const aiAccuracy = index % 3 === 0 ? null : 95 + (index % 5);

      // Mock findings
      const findingsOptions = ['Normal', 'Analyzing...', 'Abnormality detected'];
      const findings = index === 1 ? 'Analyzing...' : index % 2 === 0 ? 'Normal' : 'Abnormality detected';

      // Mock status
      const status = index === 1 ? 'processing' : 'completed';

      return {
        patientInitials: getInitials(patientName || 'Anonymous'),
        patientName: patientName || 'Anonymous',
        scanId: accession || studyInstanceUid?.substring(0, 8) || '12345678',
        studyType: formatStudyType(modalities || ''),
        referral: index % 3 === 0 ? 'Information' : index % 3 === 1 ? '' : 'No referral',
        status: status as 'completed' | 'processing' | 'pending' | '',
        aiAccuracy,
        findings,
        time: getRelativeTime(date || '', time || ''),
        isUrgent: index === 1,
        studyInstanceUid,
        study,
        modalities,
        isExpanded: expandedRows.includes(index),
      };
    });
  }, [sortedFilteredStudies, expandedRows]);

  // Calculate KPIs from study data
  const activePatients = useMemo(() => {
    const uniquePatients = new Set(studies.map(s => s.patientName || s.mrn));
    return uniquePatients.size;
  }, [studies]);

  const avgAccuracy = useMemo(() => {
    // Mock calculation - in real app, this would come from AI analysis
    return 98.5;
  }, [studies]);

  const menuOptions = [
    {
      title: 'About',
      icon: 'info',
      onClick: () => {},
    },
    {
      title: 'Preferences',
      icon: 'settings',
      onClick: () => {},
    },
  ];

  if (appConfig.oidc) {
    menuOptions.push({
      icon: 'power-off',
      title: 'Logout',
      onClick: () => {},
    });
  }

  // AI Analysis metrics (mock data)
  const aiAnalysisMetrics = [
    { label: 'Image Quality', value: 95 },
    { label: 'Feature Detection', value: 98 },
    { label: 'Pattern Recognition', value: 97 },
    { label: 'Anomaly Detection', value: 99 },
  ];

  // System Performance metrics (mock data)
  const systemPerformanceMetrics = [
    { label: 'CPU Usage', value: 45 },
    { label: 'GPU Usage', value: 78 },
    { label: 'Memory', value: 62 },
    { label: 'Network', value: 34 },
  ];

  return (
    <div className="flex h-screen flex-col bg-black">
      <Header
        isSticky
        menuOptions={menuOptions}
        isReturnEnabled={false}
        WhiteLabeling={appConfig.whiteLabeling}
        showPatientInfo={PatientInfoVisibility.DISABLED}
        Secondary={
          <div className="flex items-center gap-4">
            <InputFilter
              placeholder="Search patients, scans, reports..."
              className="w-[500px]"
            >
              <InputFilter.SearchIcon />
              <InputFilter.Input
                placeholder="Search patients, scans, reports..."
                className="pl-9 pr-9 bg-[#0A1628] border border-[#FFFFFF1A] text-white placeholder:text-[#B0B0B0]"
              />
              <InputFilter.ClearButton />
            </InputFilter>
            <button className="text-[#B0B0B0] hover:text-[#48FFF6] transition-colors">
              <Icons.NotificationInfo className="h-6 w-6" />
            </button>
          </div>
        }
      />
      <div className="flex h-full flex-row overflow-hidden">
        <SideNavBar activeItem="overview" />
        <div className="flex h-full flex-1 flex-col overflow-y-auto bg-black">
          <ScrollArea>
            <div className="relative h-full overflow-hidden">
              <div className="h-full w-full rounded-[inherit]">
                <div className="flex grow flex-col gap-6 p-6">
                  {/* Welcome and KPIs Section */}
                  <div>
                    <h1 className="text-3xl font-semibold text-white mb-6">
                      Welcome back, Doctor name
                    </h1>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <KPICard
                        title="Active Patients"
                        value={activePatients}
                        icon={<LineGraphIcon />}
                        trend="+12%"
                        trendPositive={true}
                      />
                      <KPICard
                        title="Active Patients"
                        value={studiesTotal}
                        icon={<PeopleIcon />}
                        trend="+5%"
                        trendPositive={true}
                      />
                      <KPICard
                        title="Avg Accuracy"
                        value={`${avgAccuracy}%`}
                        icon={<TargetIcon />}
                        trend="+0.3%"
                        trendPositive={true}
                      />
                      <KPICard
                        title="Time Saved"
                        value="34h"
                        icon={<ClockIcon />}
                        trend="+18%"
                        trendPositive={true}
                      />
                    </div>
                  </div>

                  {/* Recent Updated Scans Table */}
                  <div>
                    {showFilterBar && (
                      <DashboardFilterBar
                        filtersMeta={filtersMeta}
                        filterValues={filterValues}
                        onChange={setFilterValues}
                        clearFilters={() => setFilterValues(defaultFilterValues)}
                        isFiltering={isFiltering}
                        numOfStudies={sortedFilteredStudies.length}
                        filterSorting={filterSorting}
                        onSortingChange={setFilterSorting}
                        isSortingEnabled={isSortingEnabled}
                      />
                    )}
                    <DashboardTable
                      data={dashboardTableData}
                      expandedRows={expandedRows}
                      onToggleRow={(index: number) => {
                        setExpandedRows(prev =>
                          prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
                        );
                      }}
                      seriesInStudiesMap={seriesInStudiesMap}
                      appConfig={appConfig}
                      dataPath={dataPath}
                      t={t}
                      onFilterClick={() => setShowFilterBar(!showFilterBar)}
                    />
                  </div>

                  {/* Real-time AI Analysis & System Performance */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <PerformanceCard
                      title="Real-time AI Analysis"
                      icon={<BrainIcon />}
                      metrics={aiAnalysisMetrics}
                    />
                    <PerformanceCard
                      title="System Performance"
                      icon={<SystemPerformanceIcon />}
                      metrics={systemPerformanceMetrics}
                    />
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

Dashboard.propTypes = {
  data: PropTypes.array.isRequired,
  dataTotal: PropTypes.number.isRequired,
  isLoadingData: PropTypes.bool.isRequired,
  dataSource: PropTypes.shape({
    query: PropTypes.object.isRequired,
    getConfig: PropTypes.func,
  }).isRequired,
  servicesManager: PropTypes.object.isRequired,
};

export default Dashboard;
