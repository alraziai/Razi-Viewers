import React, { useState, useEffect } from 'react';
import usePatientInfo from '../../hooks/usePatientInfo';
import { Icons } from '@ohif/ui-next';

export enum PatientInfoVisibility {
  VISIBLE = 'visible',
  VISIBLE_COLLAPSED = 'visibleCollapsed',
  DISABLED = 'disabled',
  VISIBLE_READONLY = 'visibleReadOnly',
}

type PatientMetaItem = {
  label: string;
  value: string;
};

const formatWithEllipsis = (str: string | null | undefined, maxLength: number) => {
  if (!str) {
    return '';
  }

  if (str.length > maxLength) {
    return str.substring(0, maxLength) + '...';
  }
  return str;
};

function HeaderPatientInfo({ servicesManager, appConfig }: withAppTypes) {
  const initialExpandedState =
    appConfig.showPatientInfo === PatientInfoVisibility.VISIBLE ||
    appConfig.showPatientInfo === PatientInfoVisibility.VISIBLE_READONLY;
  const [expanded, setExpanded] = useState(initialExpandedState);
  const { patientInfo, isMixedPatients } = usePatientInfo(servicesManager);
  const isInteractive =
    !isMixedPatients && appConfig.showPatientInfo !== PatientInfoVisibility.VISIBLE_READONLY;

  useEffect(() => {
    if (isMixedPatients && expanded) {
      setExpanded(false);
    }
  }, [isMixedPatients, expanded]);

  const handleOnClick = () => {
    if (isInteractive) {
      setExpanded(!expanded);
    }
  };

  const formattedPatientName = formatWithEllipsis(patientInfo.PatientName, 30) || 'Patient';
  const formattedPatientID = formatWithEllipsis(patientInfo.PatientID, 15);
  const patientMeta: PatientMetaItem[] = [
    { label: 'MRN', value: formattedPatientID },
    { label: 'Sex', value: patientInfo.PatientSex || '' },
    { label: 'DOB', value: patientInfo.PatientDOB || '' },
  ].filter(item => item.value);

  return (
    <div
      className={`group flex items-center gap-2 rounded-xl border px-2 py-1.5 transition-colors ${
        isInteractive
          ? 'cursor-pointer border-transparent hover:border-[#48FFF6]/20 hover:bg-[#0D2536]'
          : 'cursor-default border-transparent'
      }`}
      onClick={handleOnClick}
    >
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-[#48FFF6]/15 bg-[#0D2536]/80">
        {isMixedPatients ? (
          <Icons.MultiplePatients className="text-[#BFFBFF]" />
        ) : (
          <Icons.Patient className="text-[#BFFBFF]" />
        )}
      </div>
      <div className="flex min-w-0 max-w-[260px] flex-col justify-center">
        {expanded ? (
          <>
            <div
              className="max-w-full truncate text-[15px] font-semibold leading-none text-white"
              title={patientInfo.PatientName || 'Patient'}
            >
              {formattedPatientName}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] leading-none">
              {patientMeta.map(item => (
                <div
                  key={item.label}
                  className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-[#0D2536]/70 px-1.5 py-1"
                  title={item.value}
                >
                  <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-white/45">
                    {item.label}
                  </span>
                  <span className="tabular-nums font-medium text-[#BFFBFF]">{item.value}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="text-[14px] font-medium leading-none text-white">
              {isMixedPatients ? 'Multiple Patients' : 'Patient'}
            </div>
            <div className="mt-1 text-[11px] leading-none text-[#9FD4DF]">
              {isMixedPatients ? 'Patient details unavailable' : 'Expand details'}
            </div>
          </>
        )}
      </div>
      <Icons.ArrowLeft
        className={`flex-shrink-0 text-[#9FD4DF] transition-transform ${
          expanded ? 'rotate-180' : ''
        } ${isInteractive ? '' : 'opacity-60'}`}
      />
    </div>
  );
}

export default HeaderPatientInfo;
