import React, { useEffect, useMemo, useState } from 'react';
import { cn, Icons, useIconPresentation, Popover, PopoverTrigger, PopoverContent, Button } from '@ohif/ui-next';
import { useSystem } from '@ohif/core';
import { Enums } from '@cornerstonejs/core';
import { createOverlayService } from '../../overlayService';
import { getViewportStudyUID, getStudyOverlayLayers, getDisplaySetIdentifier } from '../../utils/studyOverlays';

type LayerDef = {
  id: string;
  label: string;
  file: string;
  defaultOpacity?: number;
  color?: string;
  displaySetId?: string;
  studyUID?: string;
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
  const { toolbarService, cornerstoneViewportService, viewportGridService, displaySetService } = servicesManager.services;
  const { IconContainer, className: iconClassName, containerProps } = useIconPresentation();
  const overlay = useMemo(() => createOverlayService(servicesManager), [servicesManager]);

  const [allStudyLayers, setAllStudyLayers] = useState<LayerDef[]>([]);
  const [layers, setLayers] = useState<LayerDef[]>([]);
  const [baseImageId, setBaseImageId] = useState<string | null>(null);
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});
  const [studyUID, setStudyUID] = useState<string | null>(null);
  const [currentDisplaySetIds, setCurrentDisplaySetIds] = useState<string[]>([]);

  // Get study UID for this viewport and get all study layers
  useEffect(() => {
    if (!viewportId) return;

    const updateStudyLayers = () => {
      const currentStudyUID = getViewportStudyUID(viewportId, viewportGridService, displaySetService);
      console.log('[AI Overlays Menu] Viewport study UID:', currentStudyUID, 'Viewport ID:', viewportId);
      if (currentStudyUID) {
        if (currentStudyUID !== studyUID) {
          setStudyUID(currentStudyUID);
          setEnabled({}); // Reset enabled state when study changes
        }
        const studyLayers = getStudyOverlayLayers(currentStudyUID, displaySetService);
        console.log('[AI Overlays Menu] Study layers found:', studyLayers.length, studyLayers);
        setAllStudyLayers(studyLayers);
      } else {
        console.log('[AI Overlays Menu] No study UID found for viewport');
        setAllStudyLayers([]);
      }
    };

    // Initial update
    updateStudyLayers();

    // Subscribe to display set changes
    const subscriptions = [
      displaySetService.subscribe(
        displaySetService.EVENTS.DISPLAY_SETS_ADDED,
        updateStudyLayers
      ),
      displaySetService.subscribe(
        displaySetService.EVENTS.DISPLAY_SETS_CHANGED,
        updateStudyLayers
      ),
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
    if (!viewportId) return;

    const updateCurrentDisplaySets = () => {
      const displaySetUIDs = viewportGridService.getDisplaySetsUIDsForViewport(viewportId) || [];
      const displaySets = displaySetUIDs
        .map(uid => displaySetService.getDisplaySetByUID(uid))
        .filter(Boolean);

      // Get display set IDs using the same function as used for layer creation
      // This ensures we match correctly with the layer's displaySetId
      const displaySetIds = displaySets.map(ds => getDisplaySetIdentifier(ds));
      setCurrentDisplaySetIds(displaySetIds);

      console.log('[AI Overlays Menu] Current display sets:', displaySetIds, displaySets.map(ds => ({
        displaySetInstanceUID: ds.displaySetInstanceUID,
        SeriesInstanceUID: ds.SeriesInstanceUID,
        label: ds.label,
        SeriesDescription: ds.SeriesDescription,
      })));
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

  // Filter layers to only show those for current display sets
  useEffect(() => {
    if (currentDisplaySetIds.length === 0) {
      setLayers([]);
      return;
    }

    // Filter layers to only include those matching current display set IDs
    // Each layer has a displaySetId property that matches the displaySetInstanceUID
    const filteredLayers = allStudyLayers.filter(layer => {
      // Extract displaySetId from layer.id (format: "heatmap-{displaySetId}" or "mask-{displaySetId}")
      const layerDisplaySetId = (layer as any).displaySetId;
      return layerDisplaySetId && currentDisplaySetIds.includes(layerDisplaySetId);
    });

    console.log('[AI Overlays Menu] Filtered layers for current display sets:', filteredLayers.length, filteredLayers);
    setLayers(filteredLayers);
  }, [allStudyLayers, currentDisplaySetIds]);

  // Detect base imageId for the viewport and listen to image changes
  useEffect(() => {
    if (!viewportId) return;

    // Wait a bit for viewport to be ready
    const checkViewport = () => {
      const vp = cornerstoneViewportService.getCornerstoneViewport(viewportId);
      if (!vp) {
        // Retry after a short delay if viewport isn't ready
        setTimeout(checkViewport, 100);
        return;
      }

      const updateImageId = () => {
        const curr = vp?.getCurrentImageId?.();
        if (curr) {
          setBaseImageId(curr);
        }
      };

      // Get initial image ID
      updateImageId();

      // Listen to image changes
      const element = vp.element;
      if (element) {
        element.addEventListener(Enums.Events.IMAGE_RENDERED, updateImageId);
        element.addEventListener(Enums.Events.NEW_IMAGE_SET, updateImageId);
        return () => {
          element.removeEventListener(Enums.Events.IMAGE_RENDERED, updateImageId);
          element.removeEventListener(Enums.Events.NEW_IMAGE_SET, updateImageId);
        };
      }
    };

    checkViewport();
  }, [viewportId, cornerstoneViewportService]);

  // Apply overlays on enable/viewport change
  useEffect(() => {
    if (!viewportId || !baseImageId) {
      // Clean up if we don't have what we need
      if (viewportId) {
        overlay.removeAll(viewportId);
      }
      return;
    }

    // Small delay to ensure viewport is fully ready
    const timeoutId = setTimeout(async () => {
      // First, ensure all layers are added (but may be hidden)
      for (const layer of layers) {
        if (layer.file) {
          // Check if layer already exists
          const layerExists = overlay.hasLayer?.(viewportId, layer.id);
          if (!layerExists) {
            console.log('[AI Overlays Menu] Adding layer:', layer.id, layer.file);
            await overlay.addLayer(viewportId, layer, baseImageId);
          }

          // Show or hide based on enabled state
          overlay.show(viewportId, layer.id, enabled[layer.id] || false);
        }
      }
    }, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [viewportId, baseImageId, layers, enabled, overlay]);

  const handleToggle = (layerId: string) => {
    setEnabled(prev => ({
      ...prev,
      [layerId]: !prev[layerId],
    }));
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

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
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
        className="h-auto w-[250px] max-h-[400px] overflow-y-auto flex-shrink-0 flex-col items-start rounded p-1"
        align={align}
        side={side}
        style={{ left: 0 }}
      >
        {layers.length === 0 ? (
          <div className="px-2 py-2 text-sm text-white">
            No AI overlay layers available for this study.
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
