// No strict Cornerstone types. Avoids red squiggles across versions.
import { imageLoader, metaData } from '@cornerstonejs/core';

interface OverlayImageLike {
  imageId: string;
  getPixelData: () => Uint8ClampedArray;
  rows: number;
  columns: number;
  height: number;
  width: number;
  color: boolean;
  rgba: boolean;
  numberOfComponents: number;
  minPixelValue: number;
  maxPixelValue: number;
  slope: number;
  intercept: number;
  windowCenter: number[];
  windowWidth: number[];
  sizeInBytes: number;
  __overlayTarget?: string;
}

// imageId: overlay:/overlays/<StudyUID>/<file>.png|targetImageId=<urlencoded base imageId>
export function registerOverlayLoader() {
  // Overlay loader returns a minimal image shape; Cornerstone accepts it at runtime
  imageLoader.registerImageLoader('overlay', ((imageId: string) => {
    const raw = imageId.slice('overlay:'.length);
    const [urlPart, queryPart] = raw.split('|');
    const url = urlPart;
    const params = new URLSearchParams(queryPart || '');
    const targetImageId = params.get('targetImageId') || '';

    const promise = (async () => {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Overlay fetch failed: ${url}`);
      }
      const blob = await res.blob();
      const bmp = await createImageBitmap(blob);
      const width = bmp.width;
      const height = bmp.height;

      const canvas =
        typeof OffscreenCanvas !== 'undefined'
          ? new OffscreenCanvas(width, height)
          : (document.createElement('canvas') as HTMLCanvasElement);

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(bmp, 0, 0);
      const { data } = ctx.getImageData(0, 0, width, height);
      const pixelData = new Uint8ClampedArray(data.buffer); // RGBA

      const image: OverlayImageLike = {
        imageId,
        getPixelData: () => pixelData,
        rows: height,
        columns: width,
        height,
        width,
        color: true,
        rgba: true,
        numberOfComponents: 4,
        minPixelValue: 0,
        maxPixelValue: 255,
        slope: 1,
        intercept: 0,
        windowCenter: [127],
        windowWidth: [255],
        sizeInBytes: pixelData.length,
        // link target so meta provider can retrieve geometry if needed
        __overlayTarget: targetImageId,
      };

      return image;
    })();

    return { promise, cancelFn: () => {} };
  }) as Parameters<typeof imageLoader.registerImageLoader>[1]);

  // Register metadata provider to copy geometry from target image
  metaData.addProvider((type: string, imageId: string) => {
    if (type !== 'imagePlaneModule') {
      return;
    }

    // Try to extract target imageId from overlay imageId
    if (!imageId.startsWith('overlay:')) {
      return;
    }

    const raw = imageId.slice('overlay:'.length);
    const [, queryPart] = raw.split('|');
    const params = new URLSearchParams(queryPart || '');
    const targetImageId = params.get('targetImageId');

    if (!targetImageId) {
      return;
    }

    // Get metadata from target image
    const targetMeta = metaData.get('imagePlaneModule', targetImageId);
    return targetMeta;
  }, 10_000); // High priority
}
