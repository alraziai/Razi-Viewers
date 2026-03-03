/**
 * Message Listener for Al-Razi Dashboard Integration
 *
 * This file should be placed in:
 * /home/yusuf/Work/alriza/medical-imaging-app/Razi-Viewers/extensions/ai-overlays/src/messageListener.ts
 *
 * Listens for diagnosis data from the dashboard and loads AI overlays
 */

import type { ServicesManager } from '@ohif/core';
import { createOverlayService } from './overlayService';
import { diagnosisStore } from './diagnosisStore';
import { getInstanceUIDFromImageId } from './utils/studyOverlays';
import { decrypt } from '../../../platform/ui-next/src/lib/crypto';

type DiagnosisMessage = {
  type: string;
  payload?: {
    studyInstanceUID: string;
    patientId: string;
    studyId: string;
    patient: unknown;
    diagnoses: DiagnosisData[];
    timestamp: string;
  };
  data?: {
    studyId: string;
    diagnoses: DiagnosisData[];
  };
  diagnoses?: DiagnosisData[];
  extensionId?: string;
};

type DiagnosisData = {
  id: number;
  radiologist_id: number;
  dicom_instance_id: number;
  dicom_instance_uid: string;
  series_uid?: string;
  study_uid: string;
  modality?: string;
  series_description?: string;
  report: string | null;
  observation: string | null;
  status?: string;
  created_at: string;
  updated_at: string;
  diagnosis_images?: DiagnosisImage[];
};

type DiagnosisImage = {
  id: number;
  diagnosis_id: number;
  image_path: string;
  type:
    | 'source_img'
    | 'contour_img'
    | 'all_labels_img'
    | 'alignment_lines_img'
    | 'Intervertebral_space_img';
  created_at: string;
  updated_at: string;
};

/** Viewport shape with getCurrentImageId (Cornerstone Stack/Volume viewport) */
type ViewportWithImageId = { getCurrentImageId?: () => string };

let isListenerRegistered = false;
let overlayService: ReturnType<typeof createOverlayService> | null = null;

/**
 * Initialize the message listener to receive diagnosis data from the dashboard
 */
export function initializeMessageListener(servicesManager: ServicesManager) {
  if (isListenerRegistered) {
    console.log('[AI Overlays] Message listener already registered');
    return;
  }

  overlayService = createOverlayService(servicesManager);

  // Send handshake to dashboard to signal OHIF is ready
  const sendHandshake = () => {
    if (window.parent && window.parent !== window) {
      console.log('[AI Overlays] Sending handshake to dashboard...');
      window.parent.postMessage(
        {
          type: 'ALRAZI_EXTENSION_READY',
          timestamp: new Date().toISOString(),
        },
        '*' // In production, specify the exact dashboard origin
      );
    }
  };

  // Listen for messages from the dashboard
  const handleMessage = async (event: MessageEvent) => {
    // Security: In production, verify the origin
    if (event.origin !== 'https://radiology.alrazi.ai') {
      return;
    }

    // --- NEW: Extract auth token from URL if present ---
    try {
      const url = new URL(window.location.href);
      const authToken = url.searchParams.get('auth_token');
      if (authToken) {
        const decryptedToken = await decrypt(authToken);
        sessionStorage.setItem('auth_token', decryptedToken);
        console.log('[AI Overlays] Stored decrypted auth token in sessionStorage');
      }
    } catch (e) {
      // Ignore if URL parsing fails
    }

    const message = event.data as DiagnosisMessage;
    console.log('[AI Overlays] Received message:', message.type, message);

    // Handle different message formats
    let diagnoses: DiagnosisData[] = [];
    let studyUID: string | undefined;

    if (message.type === 'ALRAZI_AI_DIAGNOSIS' && message.payload) {
      diagnoses = message.payload.diagnoses;
      studyUID = message.payload.studyInstanceUID;
      console.log('[AI Overlays] Processing ALRAZI_AI_DIAGNOSIS format');
    } else if (message.type === 'AI_DIAGNOSIS_DATA' && message.data) {
      diagnoses = message.data.diagnoses;
      console.log('[AI Overlays] Processing AI_DIAGNOSIS_DATA format');
    } else if (
      message.type === 'EXTENSION_DATA' &&
      message.extensionId === 'ai-overlays' &&
      message.payload
    ) {
      diagnoses = (message.payload as { diagnoses?: DiagnosisData[] }).diagnoses;
      studyUID = (message.payload as { studyInstanceUID?: string }).studyInstanceUID;
      console.log('[AI Overlays] Processing EXTENSION_DATA format');
    } else if (message.type === 'DIAGNOSES' && message.diagnoses) {
      diagnoses = message.diagnoses;
      console.log('[AI Overlays] Processing DIAGNOSES format');
    } else {
      // Not a diagnosis message we care about
      return;
    }

    // Process the diagnoses and load overlays
    if (diagnoses && diagnoses.length > 0) {
      console.log('[AI Overlays] Processing', diagnoses.length, 'diagnoses');
      await processDiagnoses(diagnoses, studyUID, servicesManager);
    } else {
      console.log('[AI Overlays] No diagnoses to process');
    }
  };

  window.addEventListener('message', handleMessage);
  isListenerRegistered = true;
  console.log('[AI Overlays] Message listener registered');

  // Send initial handshake
  setTimeout(sendHandshake, 500);

  // Also send handshake when viewport changes (in case dashboard loads later)
  type ServicesWithGrid = {
    services: {
      viewportGridService?: {
        subscribe: (event: string, cb: () => void) => void;
        EVENTS: { ACTIVE_VIEWPORT_ID_CHANGED: string };
      };
    };
  };
  const { viewportGridService } = (servicesManager as unknown as ServicesWithGrid).services;
  if (viewportGridService) {
    viewportGridService.subscribe(
      viewportGridService.EVENTS.ACTIVE_VIEWPORT_ID_CHANGED,
      sendHandshake
    );
  }
}

/**
 * Process diagnosis data and load overlays into viewports
 */
async function processDiagnoses(
  diagnoses: DiagnosisData[],
  studyUID: string | undefined,
  servicesManager: ServicesManager
) {
  if (!overlayService) {
    console.error('[AI Overlays] Overlay service not initialized');
    return;
  }

  type ProcessServices = {
    cornerstoneViewportService: { getCornerstoneViewport: (id: string) => ViewportWithImageId };
    viewportGridService: {
      getState: () => { viewports?: Array<{ viewportId?: string }>; layout?: { viewports?: Record<string, { viewportId?: string }> } };
      getDisplaySetsUIDsForViewport?: (viewportId: string) => string[];
      subscribe: (event: string, cb: () => void) => void;
      EVENTS: { ACTIVE_VIEWPORT_ID_CHANGED: string };
    };
    displaySetService: { getDisplaySetByUID?: (uid: string) => { StudyInstanceUID?: string } | undefined };
  };
  const { cornerstoneViewportService, viewportGridService, displaySetService } = (
    servicesManager as unknown as { services: ProcessServices }
  ).services;

  // Store diagnoses in the diagnosis store for panel display
  if (studyUID) {
    diagnosisStore.setDiagnoses(studyUID, diagnoses);
    console.log('[AI Overlays] Stored', diagnoses.length, 'diagnoses for study', studyUID);
  }

  // Get all active viewports
  const gridState = viewportGridService.getState();
  console.log('[AI Overlays] Grid state:', gridState);

  // Handle different viewport grid state structures
  let viewportIds: string[] = [];
  if (gridState?.viewports && Array.isArray(gridState.viewports)) {
    viewportIds = gridState.viewports
      .map((vp: { viewportId?: string }) => vp.viewportId)
      .filter((id): id is string => id != null);
  } else if (gridState?.layout?.viewports) {
    // Alternative structure: state.layout.viewports
    const viewports = gridState.layout.viewports;
    viewportIds = Object.keys(viewports).map(key => viewports[key].viewportId || key);
  } else {
    // Fallback: try to get viewport IDs from viewport service
    console.warn('[AI Overlays] Could not find viewports in grid state, using fallback');
    viewportIds = ['default']; // Common default viewport ID
  }

  console.log('[AI Overlays] Active viewport IDs:', viewportIds); // Process each diagnosis and create overlay layers
  for (const diagnosis of diagnoses) {
    console.log('[AI Overlays] Processing diagnosis:', diagnosis.id, diagnosis.status);

    // Skip if no overlay images
    if (!diagnosis.diagnosis_images || diagnosis.diagnosis_images.length === 0) {
      console.log('[AI Overlays] No overlay images for diagnosis', diagnosis.id);
      continue;
    }

    // Get the current image ID for this diagnosis (if available)
    const targetStudyUID = diagnosis.study_uid || studyUID;

    // Find viewports that are showing this study AND the current image is this diagnosis's instance
    const instanceUID = diagnosis.dicom_instance_uid;
    const relevantViewports = viewportIds.filter((viewportId: string) => {
      try {
        const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
        if (!viewport) {
          return false;
        }

        const currentImageId = viewport.getCurrentImageId?.();
        if (!currentImageId) {
          return false;
        }

        // Require current image to be this diagnosis's instance (per-image overlays)
        const viewportInstanceUID = getInstanceUIDFromImageId(currentImageId);
        if (instanceUID) {
          if (viewportInstanceUID) {
            if (viewportInstanceUID !== instanceUID) return false;
          } else {
            if (!currentImageId.includes(instanceUID)) return false;
          }
        }

        // Check if this viewport is showing the study
        if (targetStudyUID && currentImageId.includes(targetStudyUID)) {
          return true;
        }

        // Alternative: check display sets
        const displaySetUIDs = viewportGridService.getDisplaySetsUIDsForViewport?.(viewportId) ?? [];
        for (const dsUID of displaySetUIDs) {
          const displaySet = displaySetService.getDisplaySetByUID?.(dsUID);
          if (displaySet && displaySet.StudyInstanceUID === targetStudyUID) {
            return true;
          }
        }

        return false;
      } catch (error) {
        console.warn('[AI Overlays] Error checking viewport:', error);
        return false;
      }
    });

    console.log(
      '[AI Overlays] Found',
      relevantViewports.length,
      'viewports for diagnosis instance',
      instanceUID
    );

    // Load overlays into each relevant viewport
    for (const viewportId of relevantViewports) {
      try {
        const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
        if (!viewport) {
          continue;
        }

        const currentImageId = viewport.getCurrentImageId?.();
        if (!currentImageId) {
          continue;
        }

        // Load each diagnosis image as an overlay layer
        for (const diagImage of diagnosis.diagnosis_images) {
          const layerId = `diagnosis-${diagnosis.id}-${diagImage.type}-${diagImage.id}`;

          // Skip if layer already exists
          if (overlayService.hasLayer()(viewportId, layerId)) {
            console.log('[AI Overlays] Layer already exists:', layerId);
            continue;
          }

          // Determine the overlay image URL
          // The image_path from API should be a relative or absolute path
          const overlayImageUrl = getOverlayImageUrl(diagImage.image_path);

          // Determine color based on image type
          const color = getOverlayColor(diagImage.type);

          // Create layer definition
          const layer = {
            id: layerId,
            label: `${diagnosis.status || 'Diagnosis'} - ${diagImage.type}`,
            file: overlayImageUrl,
            defaultOpacity: getDefaultOpacity(diagImage.type),
            color,
          };

          console.log('[AI Overlays] Adding layer:', layer);

          // Add the layer to the viewport
          await overlayService.addLayer(viewportId, layer, currentImageId);

          console.log('[AI Overlays] Successfully added layer:', layerId);
        }
      } catch (error) {
        console.error('[AI Overlays] Error adding overlay to viewport:', viewportId, error);
      }
    }
  }
}

/**
 * Get the full URL for an overlay image
 */
function getOverlayImageUrl(imagePath: string): string {
  // If it's already a full URL, return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // If it starts with /, it's absolute from the API root
  if (imagePath.startsWith('/')) {
    // Use the dashboard API base URL
    const apiBase = 'https://api.alrazi.ai/api'; // Update this to match your dashboard URL
    return `${apiBase}${imagePath}`;
  }

  // Otherwise, treat as relative to API
  const apiBase = 'https://api.alrazi.ai/api';
  return `${apiBase}/${imagePath}`;
}

/**
 * Get color for overlay based on image type
 */
function getOverlayColor(type: string): string {
  const colorMap: Record<string, string> = {
    //     source_img: "#00ff00", // Green for source
    //     contour_img: "#ff0000", // Red for contours
    //     all_labels_img: "#ffff00", // Yellow for labels
    //     alignment_lines_img: "#00ffff", // Cyan for alignment
    //     Intervertebral_space_img: "#ff00ff", // Magenta for intervertebral
  };

  return colorMap[type] || 'transparent';
}

/**
 * Get default opacity based on image type
 */
function getDefaultOpacity(type: string): number {
  const opacityMap: Record<string, number> = {
    source_img: 0.3,
    contour_img: 0.6,
    all_labels_img: 0.5,
    alignment_lines_img: 0.4,
    Intervertebral_space_img: 0.5,
  };

  return opacityMap[type] || 0.5;
}
