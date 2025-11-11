import React, { useEffect, useMemo, useState } from 'react';
import { useSystem } from '@ohif/core';
import { createOverlayService } from '../overlayService';

type LayerDef = {
  id: string;
  label: string;
  file: string;
  defaultOpacity?: number;
  color?: string;
};

function getStudyUIDFromURL() {
  const p = new URLSearchParams(window.location.search);
  return p.get('StudyInstanceUIDs') || '';
}

export default function OverlayPanel() {
  const { servicesManager } = useSystem();
  const { viewportGridService } = servicesManager.services;
  const overlay = useMemo(() => createOverlayService(servicesManager), [servicesManager]);

  // Get initial active viewport ID
  const [activeViewportId, setActiveViewportId] = useState<string | null>(
    viewportGridService.getState().activeViewportId
  );

  const [layers, setLayers] = useState<LayerDef[]>([
    { id: 'heatmap', label: 'AI Heatmap', file: '', defaultOpacity: 0.5, color: '#ff4444' }, // Red tint
    { id: 'mask', label: 'Mask', file: '', defaultOpacity: 0.35, color: '#343400' }, // Blue tint
  ]);
  const [baseImageId, setBaseImageId] = useState<string | null>(null);
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});

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

  // Build file paths from StudyInstanceUID
  useEffect(() => {
    const study = getStudyUIDFromURL();
    if (!study) {
      console.warn('No StudyInstanceUID found in URL');
      return;
    }
    const base = `/overlays/${study}/`;
    setLayers(prev =>
      prev.map(l => ({ ...l, file: base + (l.id === 'heatmap' ? 'heatmap.png' : 'mask.png') }))
    );
    // Reset enabled state when study changes
    setEnabled({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount - study UID is in URL

  // Detect base imageId for the active viewport
  useEffect(() => {
    if (!activeViewportId) return;
    const vp = (servicesManager.services as any).cornerstoneViewportService.getCornerstoneViewport(
      activeViewportId
    );
    const curr = vp?.getCurrentImageId?.();
    if (curr) setBaseImageId(curr);
  }, [activeViewportId, servicesManager]);

  // Apply overlays on enable/viewport change
  useEffect(() => {
    if (!activeViewportId || !baseImageId) return;

    // Clean up previous overlays
    overlay.removeAll(activeViewportId);

    // Add enabled layers
    layers.forEach(layer => {
      if (enabled[layer.id] && layer.file) {
        overlay.addLayer(activeViewportId, layer, baseImageId);
      }
    });

    // Cleanup on viewport change
    return () => {
      overlay.removeAll(activeViewportId);
    };
  }, [activeViewportId, baseImageId, layers, enabled, overlay]);

  // Handle toggle
  const handleToggle = (layerId: string) => {
    setEnabled(prev => ({
      ...prev,
      [layerId]: !prev[layerId],
    }));
  };

  return (
    <div className="bg-primary-dark h-full overflow-auto p-4">
      <div className="mb-4 text-lg font-semibold text-white">AI Layers</div>
      {!activeViewportId ? (
        <div className="text-sm text-white">No active viewport. Please select a viewport.</div>
      ) : (
        <div className="space-y-3">
          {layers.map(layer => (
            <div
              key={layer.id}
              className="bg-secondary-dark flex items-center justify-between rounded p-2"
            >
              <label className="flex cursor-pointer items-center space-x-2">
                <input
                  type="checkbox"
                  checked={enabled[layer.id] || false}
                  onChange={() => handleToggle(layer.id)}
                  className="h-4 w-4 cursor-pointer"
                />
                <span className="text-sm text-white">{layer.label}</span>
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
