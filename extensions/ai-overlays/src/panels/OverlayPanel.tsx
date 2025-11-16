import React, { useEffect, useState } from 'react';
import { useSystem } from '@ohif/core';

// Dummy data for summary tables
const dummySummaryData = {
  studyMetrics: [
    { metric: 'Total Lesions', value: '12', unit: 'count' },
    { metric: 'Average Size', value: '3.4', unit: 'cm³' },
    { metric: 'Largest Lesion', value: '8.2', unit: 'cm³' },
    { metric: 'Total Volume', value: '41.8', unit: 'cm³' },
  ],
  findings: [
    {
      finding: 'Mass detected',
      location: 'Right upper lobe',
      confidence: '95%',
      status: 'Confirmed',
    },
    {
      finding: 'Nodule detected',
      location: 'Left lower lobe',
      confidence: '87%',
      status: 'Pending',
    },
    {
      finding: 'Opacity detected',
      location: 'Right middle lobe',
      confidence: '72%',
      status: 'Review',
    },
  ],
  aiAnalysis: [
    {
      analysis: 'Malignancy Risk',
      score: 'High',
      value: '0.82',
      recommendation: 'Biopsy recommended',
    },
    {
      analysis: 'Growth Rate',
      score: 'Moderate',
      value: '0.15',
      recommendation: 'Follow-up in 3 months',
    },
    {
      analysis: 'Texture Analysis',
      score: 'Irregular',
      value: 'N/A',
      recommendation: 'Further imaging',
    },
  ],
};

export default function OverlayPanel() {
  const { servicesManager } = useSystem();
  const { viewportGridService } = servicesManager.services;

  // Get initial active viewport ID
  const [activeViewportId, setActiveViewportId] = useState<string | null>(
    viewportGridService.getState().activeViewportId
  );

  // Subscribe to viewport changes
  useEffect(() => {
    const handleViewportChange = ({ viewportId }: { viewportId: string }) => {
      setActiveViewportId(viewportId);
    };

    const subscription = viewportGridService.subscribe(
      viewportGridService.EVENTS.ACTIVE_VIEWPORT_ID_CHANGED,
      handleViewportChange
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [viewportGridService]);

  return (
    <div className="bg-primary-dark h-full overflow-auto p-4">
      <div className="mb-4 text-lg font-semibold text-white">Summary</div>
      {!activeViewportId ? (
        <div className="text-sm text-white">No active viewport. Please select a viewport.</div>
      ) : (
        <div className="space-y-4">
          {/* Study Metrics Table */}
          <div className="bg-secondary-dark rounded p-3">
            <div className="mb-2 text-sm font-semibold text-white">Study Metrics</div>
            <div className="space-y-2">
              {dummySummaryData.studyMetrics.map((item, idx) => (
                <div
                  key={idx}
                  className="border-primary-dark flex justify-between border-b pb-1 text-sm"
                >
                  <span className="text-secondary-light">{item.metric}</span>
                  <span className="text-white">
                    {item.value} <span className="text-secondary-light">{item.unit}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Findings Table */}
          <div className="bg-secondary-dark rounded p-3">
            <div className="mb-2 text-sm font-semibold text-white">Findings</div>
            <div className="space-y-2">
              {dummySummaryData.findings.map((item, idx) => (
                <div
                  key={idx}
                  className="border-primary-dark border-b pb-2 text-sm last:border-b-0"
                >
                  <div className="mb-1 flex justify-between">
                    <span className="font-medium text-white">{item.finding}</span>
                    <span className="text-secondary-light">{item.confidence}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-secondary-light">{item.location}</span>
                    <span className="text-white">{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Analysis Table */}
          <div className="bg-secondary-dark rounded p-3">
            <div className="mb-2 text-sm font-semibold text-white">AI Analysis</div>
            <div className="space-y-2">
              {dummySummaryData.aiAnalysis.map((item, idx) => (
                <div
                  key={idx}
                  className="border-primary-dark border-b pb-2 text-sm last:border-b-0"
                >
                  <div className="mb-1 flex justify-between">
                    <span className="font-medium text-white">{item.analysis}</span>
                    <span className="text-secondary-light">{item.score}</span>
                  </div>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-secondary-light">Score: {item.value}</span>
                  </div>
                  <div className="text-secondary-light text-xs">{item.recommendation}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
