import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  cn,
  Icons,
  useIconPresentation,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Button,
} from '@ohif/ui-next';
import { useSystem } from '@ohif/core';
import { Enums } from '@cornerstonejs/core';
import { createOverlayService } from '../../overlayService';
import { getViewportStudyUID, getDisplaySetIdentifier, getInstanceUIDFromImageId } from '../../utils/studyOverlays';
import { diagnosisStore } from '../../diagnosisStore';

type LayerDef = {
  id: string;
  label: string;
  file: string;
  defaultOpacity?: number;
  color?: string;
  displaySetId?: string;
  instanceUID?: string;
  studyUID?: string;
  diagnosisId?: number;
  imageType?: string;
};

function ViewportAIOverlaysMenu({
  location,
  viewportId,
  isOpen = false,
  onOpen,
  onClose,
  disabled,
  ...props
}: withAppTypes<{
  location?: string;
  viewportId: string;
  isOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  disabled?: boolean;
}>) {
  const { servicesManager } = useSystem();
  const { toolbarService, cornerstoneViewportService, viewportGridService, displaySetService } =
    servicesManager.services;
  const { IconContainer, className: iconClassName, containerProps } = useIconPresentation();
  const overlay = useMemo(() => createOverlayService(servicesManager), [servicesManager]);

  const [allStudyLayers, setAllStudyLayers] = useState<LayerDef[]>([]);
  const [layers, setLayers] = useState<LayerDef[]>([]);
  const [baseImageId, setBaseImageId] = useState<string | null>(null);
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});
  const [studyUID, setStudyUID] = useState<string | null>(null);
  const [currentDisplaySetIds, setCurrentDisplaySetIds] = useState<string[]>([]);
  const prevDisplaySetIdsRef = useRef<string[]>([]);
  const prevBaseImageIdRef = useRef<string | null>(null);
  const enabledRef = useRef<Record<string, boolean>>({});

  // Subscribe to diagnosis store changes and update layers
  useEffect(() => {
    const unsubscribe = diagnosisStore.subscribe(() => {
      if (!studyUID) {
        return;
      }

      // Get layers from diagnosis store
      const storeLayers = diagnosisStore.getLayers(studyUID);
      console.log('[AI Overlays Menu] Diagnosis store updated, layers:', storeLayers.length);
      setAllStudyLayers(storeLayers);
    });

    return unsubscribe;
  }, [studyUID]);

  // Get study UID for this viewport and get layers from diagnosis store
  useEffect(() => {
    if (!viewportId) {
      return;
    }

    const updateStudyLayers = () => {
      const currentStudyUID = getViewportStudyUID(
        viewportId,
        viewportGridService,
        displaySetService
      );
      console.log(
        '[AI Overlays Menu] Viewport study UID:',
        currentStudyUID,
        'Viewport ID:',
        viewportId
      );

      if (currentStudyUID) {
        if (currentStudyUID !== studyUID) {
          setStudyUID(currentStudyUID);
          setEnabled({}); // Reset enabled state when study changes
        }

        // Get layers from diagnosis store (real data from dashboard)
        const storeLayers = diagnosisStore.getLayers(currentStudyUID);
        console.log('[AI Overlays Menu] Layers from diagnosis store:', storeLayers.length);
        setAllStudyLayers(storeLayers);
      } else {
        console.log('[AI Overlays Menu] No study UID found for viewport');
        setAllStudyLayers([]);
      }
    };

    // Initial update
    updateStudyLayers();

    // Subscribe to display set changes
    const subscriptions = [
      displaySetService.subscribe(displaySetService.EVENTS.DISPLAY_SETS_ADDED, updateStudyLayers),
      displaySetService.subscribe(displaySetService.EVENTS.DISPLAY_SETS_CHANGED, updateStudyLayers),
      viewportGridService.subscribe(
        viewportGridService.EVENTS.GRID_STATE_CHANGED,
        updateStudyLayers
      ),
    ];

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, [viewportId, viewportGridService, displaySetService, studyUID]);

  // Get current display sets for the viewport and filter layers
  useEffect(() => {
    if (!viewportId) {
      return;
    }

    const updateCurrentDisplaySets = () => {
      const displaySetUIDs = viewportGridService.getDisplaySetsUIDsForViewport(viewportId) || [];
      const displaySets = displaySetUIDs
        .map(uid => displaySetService.getDisplaySetByUID(uid))
        .filter(Boolean);

      // Get display set IDs
      const displaySetIds = displaySets.map(ds => getDisplaySetIdentifier(ds));

      // Also get series instance UIDs to match with diagnosis data
      const seriesUIDs = displaySets.map(ds => ds.SeriesInstanceUID).filter(Boolean);

      setCurrentDisplaySetIds([...displaySetIds, ...seriesUIDs]);

      console.log('[AI Overlays Menu] Current display sets:', {
        displaySetIds,
        seriesUIDs,
        displaySets: displaySets.map(ds => ({
          displaySetInstanceUID: ds.displaySetInstanceUID,
          SeriesInstanceUID: ds.SeriesInstanceUID,
          label: ds.label,
          SeriesDescription: ds.SeriesDescription,
        })),
      });
    };

    // Initial update
    updateCurrentDisplaySets();

    // Subscribe to viewport display set changes
    const subscriptions = [
      viewportGridService.subscribe(
        viewportGridService.EVENTS.GRID_STATE_CHANGED,
        updateCurrentDisplaySets
      ),
      viewportGridService.subscribe(
        viewportGridService.EVENTS.ACTIVE_VIEWPORT_ID_CHANGED,
        updateCurrentDisplaySets
      ),
    ];

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, [viewportId, viewportGridService, displaySetService]);

  // Filter layers to only show those for current display sets and current instance (image)
  useEffect(() => {
    if (currentDisplaySetIds.length === 0) {
      setLayers([]);
      return;
    }

    // Filter by display set / series first
    const byDisplaySet = allStudyLayers.filter(layer => {
      const layerDisplaySetId = layer.displaySetId;
      return layerDisplaySetId && currentDisplaySetIds.includes(layerDisplaySetId);
    });

    // Then filter by current instance: only show layers for the image currently displayed
    // When baseImageId is unknown, show NO instance-specific layers (avoid showing all 10)
    const currentInstanceUID = baseImageId ? getInstanceUIDFromImageId(baseImageId) : null;
    const hasInstanceLayers = byDisplaySet.some(l => l.instanceUID);
    let filteredLayers: LayerDef[];
    if (!baseImageId && hasInstanceLayers) {
      filteredLayers = [];
    } else if (baseImageId && hasInstanceLayers) {
      filteredLayers = byDisplaySet.filter(layer => {
        if (!layer.instanceUID) return true;
        if (currentInstanceUID) {
          return layer.instanceUID === currentInstanceUID;
        }
        return baseImageId.includes(layer.instanceUID);
      });
    } else {
      filteredLayers = byDisplaySet;
    }

    console.log(
      '[AI Overlays Menu] Filtered layers for current display sets and instance:',
      filteredLayers.length
    );
    setLayers(filteredLayers);
  }, [allStudyLayers, currentDisplaySetIds, baseImageId]);

  // Keep enabledRef in sync with enabled state
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  // Automatically uncheck and hide layers from previous display set or instance when switching
  useEffect(() => {
    if (!viewportId || allStudyLayers.length === 0) {
      return;
    }

    // Check if display set IDs or current image (instance) changed
    const displaySetIdsChanged =
      prevDisplaySetIdsRef.current.length !== currentDisplaySetIds.length ||
      prevDisplaySetIdsRef.current.some((id, idx) => id !== currentDisplaySetIds[idx]);
    const instanceChanged = prevBaseImageIdRef.current !== baseImageId;

    if (!displaySetIdsChanged && !instanceChanged) {
      return;
    }

    prevDisplaySetIdsRef.current = [...currentDisplaySetIds];
    prevBaseImageIdRef.current = baseImageId;

    // Get IDs of layers that belong to current display sets and current instance
    const currentInstanceUID = baseImageId ? getInstanceUIDFromImageId(baseImageId) : null;
    const currentLayerIds =
      currentDisplaySetIds.length > 0
        ? allStudyLayers
            .filter(layer => {
              const matchesDisplaySet =
                layer.displaySetId && currentDisplaySetIds.includes(layer.displaySetId);
              const matchesInstance = !layer.instanceUID
                ? true
                : currentInstanceUID
                  ? layer.instanceUID === currentInstanceUID
                  : baseImageId
                    ? baseImageId.includes(layer.instanceUID)
                    : false;
              return matchesDisplaySet && matchesInstance;
            })
            .map(layer => layer.id)
        : [];

    // Get current enabled state from ref
    const currentEnabled = enabledRef.current;

    // Find layers that need to be hidden
    const layersToHide = Object.keys(currentEnabled).filter(
      layerId => currentEnabled[layerId] && !currentLayerIds.includes(layerId)
    );

    // Hide layers immediately
    if (layersToHide.length > 0) {
      console.log('[AI Overlays Menu] Hiding layers from previous display set:', layersToHide);
      layersToHide.forEach(layerId => {
        if (overlay.hasLayer?.()(viewportId, layerId)) {
          overlay.removeLayer?.()(viewportId, layerId);
        }
      });
    }

    // Update enabled state
    setEnabled(prev => {
      const updated: Record<string, boolean> = {};
      currentLayerIds.forEach(layerId => {
        if (prev[layerId]) {
          updated[layerId] = true;
        }
      });
      return updated;
    });
  }, [currentDisplaySetIds, baseImageId, allStudyLayers, viewportId, overlay]);

  // Detect base imageId for the viewport
  useEffect(() => {
    if (!viewportId) {
      return;
    }

    const checkViewport = () => {
      const vp = cornerstoneViewportService.getCornerstoneViewport(viewportId);
      if (!vp) {
        setTimeout(checkViewport, 100);
        return;
      }

      const updateImageId = () => {
        const curr = (vp as { getCurrentImageId?: () => string })?.getCurrentImageId?.();
        if (curr) {
          setBaseImageId(curr);
        }
      };

      updateImageId();

      const element = (vp as { element?: HTMLElement }).element;
      const events = Enums.Events as Record<string, string>;
      if (element) {
        element.addEventListener(events.IMAGE_RENDERED ?? 'IMAGE_RENDERED', updateImageId);
        element.addEventListener(events.NEW_IMAGE_SET ?? 'NEW_IMAGE_SET', updateImageId);
        return () => {
          element.removeEventListener(events.IMAGE_RENDERED ?? 'IMAGE_RENDERED', updateImageId);
          element.removeEventListener(events.NEW_IMAGE_SET ?? 'NEW_IMAGE_SET', updateImageId);
        };
      }
    };

    checkViewport();
  }, [viewportId, cornerstoneViewportService]);

  // Apply overlays on enable/viewport change
  // Do NOT call removeAll when baseImageId is null (causes black screen during image switch)
  useEffect(() => {
    if (!viewportId) {
      return;
    }
    if (!baseImageId) {
      return;
    }

    const timeoutId = setTimeout(async () => {
      for (const layer of layers) {
        if (!layer.file) continue;
        const layerExists = overlay.hasLayer?.()(viewportId, layer.id);
        if (enabled[layer.id]) {
          if (!layerExists) {
            await overlay.addLayer(viewportId, layer, baseImageId);
          }
          overlay.show?.()(viewportId, layer.id);
        } else {
          if (layerExists) {
            overlay.removeLayer?.()(viewportId, layer.id);
          }
        }
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [viewportId, baseImageId, layers, enabled, overlay]);

  const handleToggle = (layerId: string) => {
    setEnabled(prev => {
      const next = { ...prev, [layerId]: !prev[layerId] };
      const layer = layers.find(l => l.id === layerId);
      if (!layer || !viewportId || !baseImageId) {
        return next;
      }
      if (next[layerId]) {
        // Enable: add and show overlay
        if (!overlay.hasLayer?.()(viewportId, layerId)) {
          overlay.addLayer(viewportId, layer, baseImageId);
        }
        overlay.show?.()(viewportId, layerId);
      } else {
        // Disable: remove overlay
        overlay.removeLayer?.()(viewportId, layerId);
      }
      return next;
    });
  };

  const handleOpenChange = (openState: boolean) => {
    if (openState) {
      onOpen?.();
    } else {
      onClose?.();
    }
  };

  const { align, side } = toolbarService.getAlignAndSide(Number(location));
  const Icon = <Icons.GroupLayers className={iconClassName} />;

  // Check if we have diagnoses for this study
  const hasDiagnosisData = studyUID ? diagnosisStore.hasDiagnoses(studyUID) : false;

  return (
    <Popover
      open={isOpen}
      onOpenChange={handleOpenChange}
    >
      <PopoverTrigger
        asChild
        className={cn('flex items-center justify-center')}
      >
        <div>
          {IconContainer ? (
            <IconContainer
              disabled={disabled}
              icon="GroupLayers"
              {...props}
              {...containerProps}
            >
              {Icon}
            </IconContainer>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              disabled={disabled}
              onClick={() => {}}
            >
              {Icon}
            </Button>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="h-auto max-h-[400px] w-[250px] flex-shrink-0 flex-col items-start overflow-y-auto rounded p-1"
        align={align}
        side={side}
        style={{
          background: 'linear-gradient(90deg, #102b40ff 0%, #102b40ff 100%)',
          left: 0,
        }}
      >
        {layers.length === 0 ? (
          <div className="px-2 py-2 text-sm text-white">
            {hasDiagnosisData
              ? 'No AI overlays available for this image series.'
              : 'Waiting for AI diagnosis data from dashboard...'}
          </div>
        ) : (
          layers.map(layer => (
            <Button
              key={layer.id}
              variant="ghost"
              className="flex h-7 w-full flex-shrink-0 items-center justify-start self-stretch px-1 py-0"
              onClick={() => handleToggle(layer.id)}
            >
              <div className="mr-1 flex w-6 items-center justify-start">
                {enabled[layer.id] ? (
                  <Icons.Checked className="text-primary h-6 w-6" />
                ) : (
                  <div className="h-6 w-6" />
                )}
              </div>
              <div className="flex-1 text-left text-xs">{layer.label}</div>
            </Button>
          ))
        )}
      </PopoverContent>
    </Popover>
  );
}

export default ViewportAIOverlaysMenu;
