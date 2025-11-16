import React, { useEffect, useMemo, useState } from 'react';
import { useSystem } from '@ohif/core';
import { createOverlayService } from '../overlayService';
import { getViewportStudyUID, getAllStudiesOverlayLayers } from '../utils/studyOverlays';

type LayerDef = {
  id: string;
  label: string;
  file: string;
  defaultOpacity?: number;
  color?: string;
};

export default function OverlayPanel() {
  const { servicesManager } = useSystem();
  const { viewportGridService, displaySetService } = servicesManager.services;
  const overlay = useMemo(() => createOverlayService(servicesManager), [servicesManager]);

  // Get initial active viewport ID
  const [activeViewportId, setActiveViewportId] = useState<string | null>(
    viewportGridService.getState().activeViewportId
  );

  // Get all layers from all studies
  const [allLayers, setAllLayers] = useState<LayerDef[]>([]);
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

  // Get all layers from all studies and update when display sets change
  useEffect(() => {
    const updateLayers = () => {
      const studiesLayersMap = getAllStudiesOverlayLayers(displaySetService);
      const allLayersList: LayerDef[] = [];

      // Flatten all layers from all studies into a single array
      studiesLayersMap.forEach((studyLayers) => {
        allLayersList.push(...studyLayers);
      });

      setAllLayers(allLayersList);
    };

    // Initial update
    updateLayers();

    // Subscribe to display set changes
    const subscriptions = [
      displaySetService.subscribe(
        displaySetService.EVENTS.DISPLAY_SETS_ADDED,
        updateLayers
      ),
      displaySetService.subscribe(
        displaySetService.EVENTS.DISPLAY_SETS_CHANGED,
        updateLayers
      ),
    ];

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, [displaySetService]);

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

    // Small delay to ensure viewport is fully ready
    const timeoutId = setTimeout(async () => {
      // First, ensure all layers are added (but may be hidden)
      for (const layer of allLayers) {
        if (layer.file) {
          // Check if layer already exists
          const layerExists = overlay.hasLayer?.(activeViewportId, layer.id);
          if (!layerExists) {
            console.log('[AI Overlays Panel] Adding layer:', layer.id, layer.file);
            await overlay.addLayer(activeViewportId, layer, baseImageId);
          }

          // Show or hide based on enabled state
          overlay.show(activeViewportId, layer.id, enabled[layer.id] || false);
        }
      }
    }, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [activeViewportId, baseImageId, allLayers, enabled, overlay]);

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
          {allLayers.length === 0 ? (
            <div className="text-sm text-white">No AI overlay layers available for current studies.</div>
          ) : (
            allLayers.map(layer => (
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
            ))
          )}
        </div>
      )}
    </div>
  );
}
