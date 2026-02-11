/**
 * Message Listener for Al-Razi Dashboard Integration
 * Listens for diagnosis data from the dashboard and stores it in the diagnosis store
 */

import type { ServicesManager } from '@ohif/core';
import { diagnosisStore } from './diagnosisStore';

type DiagnosisMessage = {
  type: string;
  payload?: {
    studyInstanceUID: string;
    patientId: string;
    studyId: string;
    patient: Record<string, unknown>;
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
  diagnose_images?: DiagnoseImage[];
};

type DiagnoseImage = {
  id: number;
  diagnose_id: number;
  image_path: string;
  type: 'source_img' | 'contour_img' | 'all_labels_img' | 'alignment_lines_img' | 'Intervertebral_space_img';
  created_at: string;
  updated_at: string;
};

let isListenerRegistered = false;

/**
 * Initialize the message listener to receive diagnosis data from the dashboard
 */
export function initializeMessageListener(servicesManager: ServicesManager) {
  if (isListenerRegistered) {
    console.log('[AI Overlays] Message listener already registered');
    return;
  }

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
    // if (event.origin !== 'https://dashboard.alrazi.com') return;
    
    const message = event.data as DiagnosisMessage;
    
    // Handle different message formats
    let diagnoses: DiagnosisData[] = [];
    let studyUID: string | undefined;

    if (message.type === 'ALRAZI_AI_DIAGNOSIS' && message.payload) {
      diagnoses = message.payload.diagnoses;
      studyUID = message.payload.studyInstanceUID;
      console.log('[AI Overlays] Received ALRAZI_AI_DIAGNOSIS:', diagnoses.length, 'diagnoses for study', studyUID);
    } else if (message.type === 'AI_DIAGNOSIS_DATA' && message.data) {
      diagnoses = message.data.diagnoses;
      console.log('[AI Overlays] Received AI_DIAGNOSIS_DATA:', diagnoses.length, 'diagnoses');
      // Extract study UID from diagnoses
      if (diagnoses.length > 0) {
        studyUID = diagnoses[0].study_uid;
      }
    } else if (message.type === 'EXTENSION_DATA' && message.extensionId === 'ai-overlays') {
      const payload = message.payload as unknown as { diagnoses: DiagnosisData[]; studyInstanceUID?: string };
      diagnoses = payload.diagnoses;
      studyUID = payload.studyInstanceUID;
      console.log('[AI Overlays] Received EXTENSION_DATA:', diagnoses.length, 'diagnoses');
    } else if (message.type === 'DIAGNOSES' && message.diagnoses) {
      diagnoses = message.diagnoses;
      console.log('[AI Overlays] Received DIAGNOSES:', diagnoses.length, 'diagnoses');
      // Extract study UID from diagnoses
      if (diagnoses.length > 0) {
        studyUID = diagnoses[0].study_uid;
      }
    } else {
      // Not a diagnosis message we care about
      return;
    }

    // Store the diagnoses in the diagnosis store
    if (diagnoses && diagnoses.length > 0 && studyUID) {
      console.log('[AI Overlays] Storing', diagnoses.length, 'diagnoses for study:', studyUID);
      diagnosisStore.setDiagnoses(studyUID, diagnoses);
    } else {
      console.log('[AI Overlays] No valid diagnoses or study UID to process');
    }
  };

  window.addEventListener('message', handleMessage);
  isListenerRegistered = true;
  console.log('[AI Overlays] Message listener registered successfully');

  // Send initial handshake
  setTimeout(sendHandshake, 500);

  // Also send handshake when viewport changes (in case dashboard loads later)
  const services = servicesManager.services as {
    viewportGridService?: {
      subscribe: (eventName: string, callback: () => void) => { unsubscribe: () => void };
      EVENTS: { ACTIVE_VIEWPORT_ID_CHANGED: string };
    };
  };

  if (services.viewportGridService) {
    services.viewportGridService.subscribe(
      services.viewportGridService.EVENTS.ACTIVE_VIEWPORT_ID_CHANGED,
      sendHandshake
    );
  }
}
