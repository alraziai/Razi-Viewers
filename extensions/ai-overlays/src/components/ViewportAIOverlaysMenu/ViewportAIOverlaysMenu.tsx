import React, { useEffect, useMemo, useState } from 'react';
import { cn, Icons, useIconPresentation, Popover, PopoverTrigger, PopoverContent, Button } from '@ohif/ui-next';
import { useSystem } from '@ohif/core';
import { Enums } from '@cornerstonejs/core';
import { createOverlayService } from '../../overlayService';

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
  const { toolbarService, cornerstoneViewportService } = servicesManager.services;
  const { IconContainer, className: iconClassName, containerProps } = useIconPresentation();
  const overlay = useMemo(() => createOverlayService(servicesManager), [servicesManager]);

  const [layers, setLayers] = useState<LayerDef[]>([
    { id: 'heatmap', label: 'AI Heatmap', file: '', defaultOpacity: 0.5, color: '#ff4444' },
    { id: 'mask', label: 'Mask', file: '', defaultOpacity: 0.35, color: '#343400' },
  ]);
  const [baseImageId, setBaseImageId] = useState<string | null>(null);
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});

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
    setEnabled({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const timeoutId = setTimeout(() => {
      overlay.removeAll(viewportId);

      layers.forEach(layer => {
        if (enabled[layer.id] && layer.file) {
          overlay.addLayer(viewportId, layer, baseImageId);
        }
      });
    }, 50);

    return () => {
      clearTimeout(timeoutId);
      overlay.removeAll(viewportId);
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
        className="h-auto w-[150px] flex-shrink-0 flex-col items-start rounded p-1"
        align={align}
        side={side}
        style={{ left: 0 }}
      >
        {layers.map(layer => (
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
            <div className="flex-1 text-left">{layer.label}</div>
          </Button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

export default ViewportAIOverlaysMenu;
