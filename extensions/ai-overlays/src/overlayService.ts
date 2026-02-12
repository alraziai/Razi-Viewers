import type { ServicesManager } from '@ohif/core';
import { Enums, utilities, metaData } from '@cornerstonejs/core';

type LayerDef = { id: string; label: string; file: string; defaultOpacity?: number; color?: string };
type OverlayHandle = {
  canvas: HTMLCanvasElement;
  imageData: ImageBitmap | null;
  opacity: number;
  visible: boolean;
  color?: string;
};

export function createOverlayService(servicesManager: ServicesManager) {
  const { cornerstoneViewportService } = (servicesManager as any).services;

  const handles = new Map<string, Map<string, OverlayHandle>>();
  const viewportElements = new Map<string, HTMLElement>();

  function getVp(viewportId: string): any {
    return cornerstoneViewportService.getCornerstoneViewport(viewportId);
  }

  function getViewportElement(viewportId: string): HTMLElement | null {
    if (viewportElements.has(viewportId)) {
      return viewportElements.get(viewportId)!;
    }
    // Find the viewport element
    const element = document.querySelector(`[data-viewportid="${viewportId}"]`) as HTMLElement;
    if (element) {
      viewportElements.set(viewportId, element);
    }
    return element;
  }

  function createOverlayCanvas(viewportId: string, layerId: string): HTMLCanvasElement {
    const viewportElement = getViewportElement(viewportId);
    if (!viewportElement) {
      throw new Error(`Viewport element not found for ${viewportId}`);
    }

    // Check if canvas already exists
    const existing = viewportElement.parentElement?.querySelector(`canvas[data-overlay="${layerId}"]`) as HTMLCanvasElement;
    if (existing) {
      return existing;
    }

    // Find the viewport wrapper
    const viewportWrapper = viewportElement.closest('.viewport-wrapper') || viewportElement.parentElement;
    if (!viewportWrapper) {
      throw new Error(`Viewport wrapper not found for ${viewportId}`);
    }

    const canvas = document.createElement('canvas');
    canvas.setAttribute('data-overlay', layerId);
    canvas.setAttribute('data-viewportid', viewportId);
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '10';
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    // Insert canvas in the viewport wrapper
    viewportWrapper.appendChild(canvas);
    return canvas;
  }

  function renderOverlay(viewportId: string, layerId: string) {
    const vp = getVp(viewportId);
    const handle = handles.get(viewportId)?.get(layerId);
    if (!vp || !handle || !handle.imageData || !handle.visible) return;

    const canvas = handle.canvas;
    const viewportElement = getViewportElement(viewportId);
    if (!viewportElement) return;

    // Get viewport dimensions
    const { width, height } = viewportElement.getBoundingClientRect();
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    try {
      const currentImageId = vp.getCurrentImageId();
      if (!currentImageId) return;

      const image = vp.getImageData();
      if (!image) return;

      // Get image dimensions from metadata (for StackViewport)
      const imagePixelModule = metaData.get('imagePixelModule', currentImageId);
      const imageWidth = imagePixelModule?.columns || image.width || image.columns;
      const imageHeight = imagePixelModule?.rows || image.height || image.rows;

      if (!imageWidth || !imageHeight) {
        console.warn('Could not determine image dimensions', { image, imagePixelModule });
        return;
      }

      // Get the camera to understand the current view
      const camera = vp.getCamera();
      if (!camera) return;

      // For StackViewport, get world coordinates using imageToWorldCoords
      // Image coordinates are 1-indexed, so top-left is (1,1)
      let imageTopLeftWorld: number[];

      try {
        imageTopLeftWorld = utilities.imageToWorldCoords(currentImageId, [1, 1]);

        // Ensure we have 3D coordinates
        if (imageTopLeftWorld.length < 3) {
          imageTopLeftWorld = [...imageTopLeftWorld, 0];
        }
      } catch (error) {
        console.warn('Failed to convert image to world coordinates:', error);
        // Fallback: use simple world coordinates for StackViewport
        imageTopLeftWorld = [0, 0, 0];
      }

      // Convert top-left world coordinate to canvas
      const imageTopLeftCanvas = vp.worldToCanvas(imageTopLeftWorld);

      // Calculate bottom-right by getting world coords for a point offset by image dimensions
      // Use a point near the bottom-right (slightly inside to avoid edge issues)
      let imageBottomRightWorld: number[];
      try {
        imageBottomRightWorld = utilities.imageToWorldCoords(currentImageId, [imageWidth - 0.5, imageHeight - 0.5]);
        if (imageBottomRightWorld.length < 3) {
          imageBottomRightWorld = [...imageBottomRightWorld, 0];
        }
      } catch (error) {
        // Fallback: calculate from top-left + image dimensions in world space
        imageBottomRightWorld = [
          imageTopLeftWorld[0] + imageWidth,
          imageTopLeftWorld[1] + imageHeight,
          imageTopLeftWorld[2] || 0
        ];
      }

      const imageBottomRightCanvas = vp.worldToCanvas(imageBottomRightWorld);

      // Check if conversion was successful
      if (!imageTopLeftCanvas || !imageBottomRightCanvas ||
          imageTopLeftCanvas.length < 2 || imageBottomRightCanvas.length < 2) {
        console.warn('Failed to convert world to canvas coordinates', {
          imageTopLeftCanvas,
          imageBottomRightCanvas,
          imageTopLeftWorld,
          imageBottomRightWorld,
        });
        return;
      }

      const overlayWidth = imageBottomRightCanvas[0] - imageTopLeftCanvas[0];
      const overlayHeight = imageBottomRightCanvas[1] - imageTopLeftCanvas[1];
      const overlayX = imageTopLeftCanvas[0];
      const overlayY = imageTopLeftCanvas[1];

      // Validate coordinates
      if (
        isNaN(overlayX) ||
        isNaN(overlayY) ||
        isNaN(overlayWidth) ||
        isNaN(overlayHeight) ||
        overlayWidth <= 0 ||
        overlayHeight <= 0
      ) {
        console.warn('Invalid overlay coordinates', {
          overlayX,
          overlayY,
          overlayWidth,
          overlayHeight,
          imageTopLeftCanvas,
          imageBottomRightCanvas,
          imageWidth,
          imageHeight,
        });
        return;
      }

      // Draw overlay image with proper transforms and color tinting
      if (handle.imageData) {
        ctx.save();
        ctx.globalAlpha = handle.opacity;

        // Draw the overlay image
        ctx.drawImage(
          handle.imageData,
          0,
          0,
          handle.imageData.width,
          handle.imageData.height,
          overlayX,
          overlayY,
          overlayWidth,
          overlayHeight
        );

        // Apply color tint if specified
        if (handle.color) {
          ctx.globalCompositeOperation = 'multiply';
          ctx.fillStyle = handle.color;
          ctx.fillRect(overlayX, overlayY, overlayWidth, overlayHeight);
          ctx.globalCompositeOperation = 'source-over';
        }

        ctx.restore();
      }
    } catch (error) {
      console.warn('Error rendering overlay:', error);
    }
  }

  async function addLayer(viewportId: string, layer: LayerDef, baseImageId: string) {
    const vp = getVp(viewportId);
    if (!vp) {
      console.warn(`Viewport ${viewportId} not found`);
      return;
    }

    // Check if layer already exists
    if (handles.get(viewportId)?.has(layer.id)) {
      return; // Already added
    }

    try {
      // Fetch and load the overlay image
      console.log(`[Overlay Service] Fetching overlay image: ${layer.file}`);
      const response = await fetch(layer.file);

      let imageBitmap: ImageBitmap;

      // Check if response is ok and is an image
      if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) {
        console.warn(`[Overlay Service] Failed to fetch overlay or not an image: ${layer.file}`, response.status, response.statusText);
        // Create a dummy colored overlay for testing
        console.log(`[Overlay Service] Creating dummy overlay for testing`);
        const dummyCanvas = document.createElement('canvas');
        dummyCanvas.width = 512;
        dummyCanvas.height = 512;
        const ctx = dummyCanvas.getContext('2d');
        if (ctx) {
          // Fill with semi-transparent color for testing
          ctx.fillStyle = layer.color || 'transparent';
          ctx.globalAlpha = 0.3;
          ctx.fillRect(0, 0, 512, 512);
        }
        imageBitmap = await createImageBitmap(dummyCanvas);
        console.log(`[Overlay Service] Created dummy overlay: ${layer.id}`);
      } else {
        const blob = await response.blob();
        try {
          imageBitmap = await createImageBitmap(blob);
          console.log(`[Overlay Service] Successfully loaded overlay image: ${layer.file}`, imageBitmap.width, imageBitmap.height);
        } catch (decodeError) {
          console.warn(`[Overlay Service] Failed to decode image, creating dummy: ${layer.file}`, decodeError);
          // Create dummy if decode fails
          const dummyCanvas = document.createElement('canvas');
          dummyCanvas.width = 512;
          dummyCanvas.height = 512;
          const ctx = dummyCanvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = layer.color || 'transparent';
            ctx.globalAlpha = 0.3;
            ctx.fillRect(0, 0, 512, 512);
          }
          imageBitmap = await createImageBitmap(dummyCanvas);
        }
      }

      // Create canvas for this layer
      const canvas = createOverlayCanvas(viewportId, layer.id);

      // Store image data
      const handle: OverlayHandle = {
        canvas,
        imageData: imageBitmap as any,
        opacity: layer.defaultOpacity ?? 0.5,
        visible: true,
        color: layer.color,
      };

      if (!handles.has(viewportId)) handles.set(viewportId, new Map());
      handles.get(viewportId)!.set(layer.id, handle);

      // Render the overlay
      renderOverlay(viewportId, layer.id);

      // Listen to viewport events to re-render overlay
      const viewportElement = getViewportElement(viewportId);
      if (viewportElement) {
        const renderHandler = () => {
          renderOverlay(viewportId, layer.id);
        };
        viewportElement.addEventListener(Enums.Events.CAMERA_MODIFIED, renderHandler);
        viewportElement.addEventListener(Enums.Events.IMAGE_RENDERED, renderHandler);
      }
    } catch (error) {
      console.error(`Error adding overlay layer ${layer.id}:`, error);
    }
  }

  function show(viewportId: string, layerId: string, visible: boolean) {
    const handle = handles.get(viewportId)?.get(layerId);
    if (!handle) {
      console.warn(`[Overlay Service] Layer ${layerId} not found for viewport ${viewportId}`);
      return;
    }

    handle.visible = visible;
    handle.canvas.style.display = visible ? 'block' : 'none';

    if (visible) {
      renderOverlay(viewportId, layerId);
    }
  }

  function hasLayer(viewportId: string, layerId: string): boolean {
    return handles.get(viewportId)?.has(layerId) || false;
  }

  function setOpacity(viewportId: string, layerId: string, opacity: number) {
    const handle = handles.get(viewportId)?.get(layerId);
    if (!handle) return;

    handle.opacity = opacity;
    renderOverlay(viewportId, layerId);
  }

  function removeLayer(viewportId: string, layerId: string) {
    const handle = handles.get(viewportId)?.get(layerId);
    if (!handle) return;

    handle.canvas.remove();
    handles.get(viewportId)?.delete(layerId);
  }

  function removeAll(viewportId: string) {
    const layerMap = handles.get(viewportId);
    if (!layerMap) return;

    layerMap.forEach((handle, layerId) => {
      handle.canvas.remove();
    });
    handles.delete(viewportId);
  }

  return {
    addLayer,
    show,
    setOpacity,
    removeLayer,
    removeAll,
    hasLayer,
  };
}
