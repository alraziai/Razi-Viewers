import React, { useEffect, useState } from 'react';
import { useSystem } from '@ohif/core';
import { diagnosisStore } from '../diagnosisStore';
import { getViewportStudyUID } from '../utils/studyOverlays';

// Helper to parse observations JSON
function parseObservations(observationsStr: string | null): any {
  if (!observationsStr) return null;
  try {
    return JSON.parse(observationsStr);
  } catch (e) {
    console.error('[Overlay Panel] Failed to parse observations:', e);
    return null;
  }
}

// Helper to render observations in a structured way
function ObservationsDisplay({ observations }: { observations: any }) {
  if (!observations || typeof observations !== 'object') {
    return null;
  }

  // Helper to render a table section
  const renderTable = (title: string, data: Record<string, any>) => {
    const entries = Object.entries(data);
    if (entries.length === 0) return null;

    return (
      <div className="mb-3">
        <div className="text-sm font-semibold text-white mb-2">{title}</div>
        <div className="border border-[#2E86D5] rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <tbody>
              {entries.map(([key, value], index) => (
                <tr key={key} className={index !== entries.length - 1 ? 'border-b border-[#2E86D5]' : ''}>
                  <td className="px-6 py-5 text-white font-medium bg-[#FFFFFF1A] border-r border-[#2E86D5]" style={{ width: '40%' }}>
                    {key.replace(/_/g, ' ')}
                  </td>
                  <td className="px-6 py-5 text-white/80 bg-transparent">
                    {String(value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-2 space-y-3">
      {/* View Type - inline display */}
      {observations.view && (
        <div className="text-sm">
          <span className="font-semibold text-white">View:</span>{' '}
          <span className="text-white/80">{observations.view.replace(/_/g, ' ')}</span>
        </div>
      )}

      {/* Soft Tissue Line Observation */}
      {observations.soft_tissue_line_observation &&
        renderTable('Soft Tissue Line Observation', observations.soft_tissue_line_observation)}

      {/* Predental Space */}
      {observations.predental_space &&
        renderTable('Predental Space', observations.predental_space)}

      {/* Alignment Observation */}
      {observations.alignment_observation &&
        renderTable('Alignment Observation', observations.alignment_observation)}

      {/* Vertebrae Present */}
      {observations.vertebrae_observation && (
        <div className="mb-3">
          <div className="text-sm font-semibold text-white mb-2">Vertebrae Present</div>
          <div className="px-6 py-5 text-white/80 bg-[#102b40] border border-[#2E86D5] rounded-lg text-xs">
            {Object.entries(observations.vertebrae_observation)
              .filter(([_, val]) => val === 'yes')
              .map(([key]) => key)
              .join(', ')}
          </div>
        </div>
      )}

      {/* Osteophytes */}
      {observations.osteophytes_observation && (
        <div className="mb-3">
          <div className="text-sm font-semibold text-white mb-2">Osteophytes</div>
          <div className="px-6 py-5 text-white/80 bg-[#102b40] border border-[#2E86D5] rounded-lg text-xs">
            {Object.entries(observations.osteophytes_observation)
              .filter(([_, val]) => val === 'Yes')
              .map(([key]) => key)
              .join(', ') || 'None detected'}
          </div>
        </div>
      )}

      {/* Intervertebral Space Observation */}
      {observations.intervertebral_space_observation && (
        <div className="mb-3">
          <div className="text-sm font-semibold text-white mb-2">Intervertebral Spacing</div>
          {Object.entries(observations.intervertebral_space_observation).map(([category, spaces]) => (
            <div key={category} className="mb-2">
              <div className="text-xs font-medium text-white/90 mb-1 ml-1">
                {category.replace(/_/g, ' ')}:
              </div>
              <div className="border border-[#2E86D5] rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <tbody>
                    {typeof spaces === 'object' && Object.entries(spaces as Record<string, any>).map(([key, value], index, arr) => (
                      <tr key={key} className={index !== arr.length - 1 ? 'border-b border-[#2E86D5]' : ''}>
                        <td className="px-6 py-5 text-white font-medium bg-[#FFFFFF1A] border-r border-[#2E86D5]" style={{ width: '40%' }}>
                          {key}
                        </td>
                        <td className="px-6 py-5 text-white/80 bg-transparent">
                          {String(value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


export default function OverlayPanel() {
  const { servicesManager } = useSystem();
  const { viewportGridService, displaySetService } = servicesManager.services;

  const [activeViewportId, setActiveViewportId] = useState<string | null>(null);
  const [studyUID, setStudyUID] = useState<string | null>(null);
  const [diagnoses, setDiagnoses] = useState<any[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize viewport on mount and subscribe to changes
  useEffect(() => {
    // Get initial viewport ID
    const gridState = viewportGridService.getState();
    const initialViewportId = gridState?.activeViewportId;
    
    if (initialViewportId) {
      setActiveViewportId(initialViewportId);
      setIsInitialized(true);
    }

    const handleViewportChange = ({ viewportId }: { viewportId: string }) => {
      setActiveViewportId(viewportId);
      setIsInitialized(true);
    };

    const subscription = viewportGridService.subscribe(
      viewportGridService.EVENTS.ACTIVE_VIEWPORT_ID_CHANGED,
      handleViewportChange
    );

    // Fallback: If no viewport after a short delay, check again
    const timeoutId = setTimeout(() => {
      const currentGridState = viewportGridService.getState();
      const currentViewportId = currentGridState?.activeViewportId;
      if (currentViewportId && !activeViewportId) {
        setActiveViewportId(currentViewportId);
        setIsInitialized(true);
      }
    }, 500);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [viewportGridService]);

  // Update study UID when viewport changes
  useEffect(() => {
    if (!activeViewportId) {
      setStudyUID(null);
      return;
    }

    const currentStudyUID = getViewportStudyUID(activeViewportId, viewportGridService, displaySetService);
    setStudyUID(currentStudyUID);
  }, [activeViewportId, viewportGridService, displaySetService]);

  // Subscribe to diagnosis store and update when diagnoses change
  useEffect(() => {
    const updateDiagnoses = () => {
      if (!studyUID) {
        setDiagnoses([]);
        return;
      }

      const storeDiagnoses = diagnosisStore.getDiagnoses(studyUID);
      console.log('[Overlay Panel] Updated diagnoses:', storeDiagnoses.length);
      setDiagnoses(storeDiagnoses);
    };

    // Initial update
    updateDiagnoses();

    // Subscribe to changes
    const unsubscribe = diagnosisStore.subscribe(updateDiagnoses);

    return unsubscribe;
  }, [studyUID]);

  // Calculate metrics from diagnoses
  const metrics = React.useMemo(() => {
    const totalDiagnoses = diagnoses.length;
    const totalImages = diagnoses.reduce((sum, d) => sum + (d.diagnosis_images?.length || 0), 0);
    const statusCounts = diagnoses.reduce((acc, d) => {
      const status = d.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalDiagnoses,
      totalImages,
      statusCounts,
    };
  }, [diagnoses]);

  return (
    <div className="overflow-auto p-4"
      style={{
        background: "linear-gradient(90deg, #102b40ff 0%, #102b40ff 100%)",
        borderImage: "linear-gradient(180deg, #2E86D5 0%, #48FFF6 100%) 1",
        borderImageSlice: 1,
      }}
    >
      <div className="mb-4 text-lg font-semibold text-white">AI Diagnosis Summary</div>
      {!activeViewportId ? (
        <div className="text-sm text-white">
          <p className="mb-2">Initializing viewer...</p>
          <p className="text-xs text-white/60">
            {isInitialized ? 'No viewport selected.' : 'Loading study data...'}
          </p>
        </div>
      ) : !studyUID ? (
        <div className="text-sm text-white">No study loaded in viewport.</div>
      ) : diagnoses.length === 0 ? (
        <div className="text-sm text-white">
          <p className="mb-2">Waiting for AI diagnosis data...</p>
          <p className="text-xs text-white/60">
            Diagnosis data will appear here when received from the dashboard.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Study Metrics */}
          <div className="rounded bg-[#083A4A] p-3">
            <div className="mb-2 text-sm font-semibold text-white">Study Metrics</div>
            <div className="space-y-2">
              <div className="border-primary-dark flex justify-between border-b pb-1 text-sm">
                <span className="text-white">Total Diagnoses</span>
                <span className="text-white">{metrics.totalDiagnoses}</span>
              </div>
              <div className="border-primary-dark flex justify-between border-b pb-1 text-sm">
                <span className="text-white">Total Overlay Images</span>
                <span className="text-white">{metrics.totalImages}</span>
              </div>
              {Object.entries(metrics.statusCounts).map(([status, count]) => (
                <div key={status} className="border-primary-dark flex justify-between border-b pb-1 text-sm">
                  <span className="text-white capitalize">{status}</span>
                  <span className="text-white">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Diagnoses Details */}
          <div className="rounded bg-[#083A4A] p-3">
            <div className="mb-2 text-sm font-semibold text-white">Diagnoses</div>
            <div className="space-y-3">
              {diagnoses.map((diagnosis, idx) => {
                const observations = parseObservations(diagnosis.observations || diagnosis.observation);

                return (
                  <div
                    key={diagnosis.id}
                    className="border-primary-dark border-b pb-3 text-sm last:border-b-0"
                  >
                    <div className="mb-1 flex justify-between">
                      <span className="font-medium text-white">Diagnosis #{diagnosis.id}</span>
                      <span className="rounded bg-[#2E86D5]/20 px-2 py-0.5 text-xs text-white capitalize">
                        {diagnosis.status || 'Unknown'}
                      </span>
                    </div>

                    {/* Image types */}
                    {diagnosis.diagnosis_images && diagnosis.diagnosis_images.length > 0 && (
                      <div className="mt-2 text-xs text-white/70">
                        <span className="font-semibold text-white">Overlay Images ({diagnosis.diagnosis_images.length}):</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {diagnosis.diagnosis_images.map((img: any) => (
                            <span key={img.id} className="rounded bg-[#48FFF6]/20 px-2 py-0.5 text-xs text-white">
                              {img.type.replace('_img', '').replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Observations - Structured Display */}
                    {observations && (
                      <div className='mt-2'>
                        <div className="mb-1 text-xs font-semibold text-white">Clinical Observations:</div>
                        <ObservationsDisplay observations={observations} />
                      </div>
                    )}

                    {/* Report */}
                    {diagnosis.report && (
                      <div className="mt-2 text-xs text-white/80">
                        <span className="font-semibold text-white">Report: </span>
                        {diagnosis.report}
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="mt-2 text-xs text-white/50">
                      Instance: {diagnosis.dicom_instance_uid?.slice(-12) || 'N/A'} •
                      Modality: {diagnosis.modality || 'N/A'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Image Types Legend */}
          {metrics.totalImages > 0 && (
            <div className="rounded bg-[#083A4A] p-3">
              <div className="mb-2 text-sm font-semibold text-white">Overlay Types</div>
              <div className="space-y-1">
                {[
                  { type: 'source_img', label: 'Source Image', color: '#00ff00' },
                  { type: 'contour_img', label: 'Contour', color: '#ff0000' },
                  { type: 'all_labels_img', label: 'Labels', color: '#ffff00' },
                  { type: 'alignment_lines_img', label: 'Alignment', color: '#00ffff' },
                  { type: 'Intervertebral_space_img', label: 'Intervertebral', color: '#ff00ff' },
                ].map(({ type, label, color }) => {
                  const count = diagnoses.reduce(
                    (sum, d) =>
                      sum + (d.diagnosis_images?.filter((img: any) => img.type === type).length || 0),
                    0
                  );
                  if (count === 0) return null;
                  return (
                    <div key={type} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-white">{label}</span>
                      </div>
                      <span className="text-white">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
