/**
 * Minimal display set shape used for overlay utilities.
 * Matches @ohif/core DisplaySet for the fields we use.
 */
type DisplaySetLike = {
  displaySetInstanceUID: string;
  SeriesInstanceUID?: string;
  label?: string;
  StudyInstanceUID?: string;
  Modality?: string;
  SeriesDescription?: string;
  SeriesNumber?: number;
  unsupported?: boolean;
  imageIds?: string[];
  images?: unknown[];
};

type DisplaySetServiceLike = {
  getActiveDisplaySets(): DisplaySetLike[];
  getDisplaySetByUID(uid: string): DisplaySetLike | undefined;
};

type ViewportGridServiceLike = {
  getDisplaySetsUIDsForViewport(viewportId: string): string[] | undefined;
};

/**
 * Get a unique identifier for a display set to use in file paths
 */
export function getDisplaySetIdentifier(displaySet: DisplaySetLike): string {
  // Use displaySetInstanceUID as the primary identifier
  // Fallback to SeriesInstanceUID or label if needed
  return (
    displaySet.displaySetInstanceUID ||
    displaySet.SeriesInstanceUID ||
    displaySet.label ||
    'unknown'
  );
}

/**
 * Extract SOP Instance UID from a Cornerstone/OHIF imageId.
 * Used to match the current viewport image to diagnosis layers (dicom_instance_uid).
 */
export function getInstanceUIDFromImageId(imageId: string): string | null {
  if (!imageId || typeof imageId !== 'string') {
    return null;
  }
  // wadors:https://.../studies/StudyUID/series/SeriesUID/instances/SOPInstanceUID/frames/...
  if (imageId.startsWith('wadors:')) {
    const afterInstances = imageId.split('/instances/')[1];
    if (afterInstances) {
      const uid = afterInstances.split('/')[0].split('?')[0];
      return uid || null;
    }
    const stripped = imageId.split('/studies/')[1];
    if (stripped) {
      const parts = stripped.split('/');
      return parts[4] || null; // StudyUID, 'series', SeriesUID, 'instances', SOPInstanceUID
    }
    return null;
  }
  // WADO query string: ...?studyUID=...&seriesUID=...&objectUID=SOPInstanceUID
  if (imageId.includes('requestType=WADO') || imageId.includes('objectUID=')) {
    const match = imageId.match(/objectUID=([^&]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }
  // Any URL path containing /instances/UID
  const instancesMatch = imageId.match(/\/instances\/([^/?&#]+)/);
  if (instancesMatch) {
    return decodeURIComponent(instancesMatch[1]);
  }
  return null;
}

/**
 * Generate a unique color for a data overlay's heatmap or mask
 * Uses a hash function to generate consistent colors based on display set ID and layer type
 */
export function generateOverlayColor(displaySetId: string, layerType: 'heatmap' | 'mask'): string {
  // Create a hash from the display set ID and layer type
  const hashString = `${displaySetId}-${layerType}`;
  let hash = 0;
  for (let i = 0; i < hashString.length; i++) {
    const char = hashString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Generate RGB values with good saturation and brightness
  // Use different hue ranges for heatmap vs mask
  const hueBase = layerType === 'heatmap' ? 0 : 180; // Red range for heatmap, cyan range for mask
  const hue = (Math.abs(hash) % 60) + hueBase; // 60 degree range
  const saturation = 70 + (Math.abs(hash) % 20); // 70-90%
  const lightness = 45 + (Math.abs(hash) % 15); // 45-60%

  // Convert HSL to hex
  const h = hue / 360;
  const s = saturation / 100;
  const l = lightness / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
  const m = l - c / 2;

  let r = 0,
    g = 0,
    b = 0;
  if (h < 1 / 6) {
    r = c;
    g = x;
    b = 0;
  } else if (h < 2 / 6) {
    r = x;
    g = c;
    b = 0;
  } else if (h < 3 / 6) {
    r = 0;
    g = c;
    b = x;
  } else if (h < 4 / 6) {
    r = 0;
    g = x;
    b = c;
  } else if (h < 5 / 6) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }

  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Get all display sets from all active studies that can have AI overlays
 * This includes all display sets except unsupported ones and non-image types
 */
export function getAllDisplaySetsForOverlays(
  displaySetService: DisplaySetServiceLike
): DisplaySetLike[] {
  const allDisplaySets = displaySetService.getActiveDisplaySets();

  console.log('[AI Overlays] Total display sets:', allDisplaySets.length);

  // Filter out unsupported display sets and non-image types
  // Include all display sets that can be displayed in a viewport
  const validDisplaySets = allDisplaySets.filter(displaySet => {
    // Exclude unsupported display sets
    if (displaySet.unsupported) {
      console.log(
        '[AI Overlays] Excluding unsupported display set:',
        displaySet.displaySetInstanceUID
      );
      return false;
    }

    // Exclude display sets without StudyInstanceUID (shouldn't happen, but safety check)
    if (!displaySet.StudyInstanceUID) {
      console.log(
        '[AI Overlays] Excluding display set without StudyInstanceUID:',
        displaySet.displaySetInstanceUID
      );
      return false;
    }

    // Exclude display sets without image data (like SR, PDF, etc. that don't have images)
    // But include them if they have imageIds or images
    if (!displaySet.imageIds && (!displaySet.images || displaySet.images.length === 0)) {
      // Check if it's a display set type that typically doesn't have images
      const nonImageModalities = ['SR', 'PR', 'KO', 'AU', 'PDF'];
      if (displaySet.Modality && nonImageModalities.includes(displaySet.Modality)) {
        console.log(
          '[AI Overlays] Excluding non-image modality:',
          displaySet.Modality,
          displaySet.displaySetInstanceUID
        );
        return false;
      }
      // If no modality info and no images, still include it (might be a valid display set)
    }

    return true;
  });

  console.log('[AI Overlays] Valid display sets for overlays:', validDisplaySets.length);
  return validDisplaySets;
}

/**
 * Get all display sets for a specific study that can have AI overlays
 */
export function getStudyDisplaySetsForOverlays(
  studyInstanceUID: string,
  displaySetService: DisplaySetServiceLike
): DisplaySetLike[] {
  const allDisplaySets = getAllDisplaySetsForOverlays(displaySetService);
  return allDisplaySets.filter(displaySet => displaySet.StudyInstanceUID === studyInstanceUID);
}

/**
 * Get the study UID for a specific viewport
 */
export function getViewportStudyUID(
  viewportId: string,
  viewportGridService: ViewportGridServiceLike,
  displaySetService: DisplaySetServiceLike
): string | null {
  const displaySetUIDs = viewportGridService.getDisplaySetsUIDsForViewport(viewportId);
  if (!displaySetUIDs || displaySetUIDs.length === 0) {
    return null;
  }

  const firstDisplaySet = displaySetService.getDisplaySetByUID(displaySetUIDs[0]);
  return firstDisplaySet?.StudyInstanceUID || null;
}

/**
 * Generate AI overlay layer definitions for all display sets in all studies
 * Each display set gets a heatmap and mask layer
 */
export function getAllStudiesOverlayLayers(
  displaySetService: DisplaySetServiceLike
): Map<
  string,
  Array<{
    id: string;
    label: string;
    file: string;
    defaultOpacity?: number;
    color?: string;
    displaySetId: string;
    studyUID: string;
  }>
> {
  const allDisplaySets = getAllDisplaySetsForOverlays(displaySetService);
  const layersMap = new Map<
    string,
    Array<{
      id: string;
      label: string;
      file: string;
      defaultOpacity?: number;
      color?: string;
      displaySetId: string;
      studyUID: string;
    }>
  >();

  console.log(
    '[AI Overlays] Found display sets for overlays:',
    allDisplaySets.length,
    allDisplaySets.map(ds => ({
      id: ds.displaySetInstanceUID,
      modality: ds.Modality,
      studyUID: ds.StudyInstanceUID,
      seriesDesc: ds.SeriesDescription,
      label: ds.label,
    }))
  );

  allDisplaySets.forEach(displaySet => {
    const studyUID = displaySet.StudyInstanceUID;
    const displaySetId = getDisplaySetIdentifier(displaySet);

    // Get a friendly name for the display set
    const displaySetName =
      displaySet.SeriesDescription ||
      displaySet.label ||
      `${displaySet.Modality || 'Series'}-${displaySet.SeriesNumber || ''}`.trim() ||
      `Series-${displaySetId.substring(0, 8)}`;

    if (!layersMap.has(studyUID)) {
      layersMap.set(studyUID, []);
    }

    const studyLayers = layersMap.get(studyUID)!;

    // Create heatmap layer
    const heatmapColor = generateOverlayColor(displaySetId, 'heatmap');
    studyLayers.push({
      id: `heatmap-${displaySetId}`,
      label: `Heatmap: ${displaySetName}`,
      file: `/overlays/${studyUID}/${displaySetId}/heatmap.png`,
      defaultOpacity: 0.5,
      color: heatmapColor,
      displaySetId,
      studyUID,
    });

    // Create mask layer
    const maskColor = generateOverlayColor(displaySetId, 'mask');
    studyLayers.push({
      id: `mask-${displaySetId}`,
      label: `Mask: ${displaySetName}`,
      file: `/overlays/${studyUID}/${displaySetId}/mask.png`,
      defaultOpacity: 0.35,
      color: maskColor,
      displaySetId,
      studyUID,
    });
  });

  return layersMap;
}

/**
 * Get AI overlay layers for a specific study
 * Returns heatmap and mask layers for all display sets in the study
 */
export function getStudyOverlayLayers(
  studyInstanceUID: string,
  displaySetService: DisplaySetServiceLike
): Array<{
  id: string;
  label: string;
  file: string;
  defaultOpacity?: number;
  color?: string;
  displaySetId: string;
  studyUID: string;
}> {
  const allLayersMap = getAllStudiesOverlayLayers(displaySetService);
  return allLayersMap.get(studyInstanceUID) || [];
}
