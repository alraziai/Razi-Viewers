/**
 * Diagnosis Store - Central store for diagnosis data received from dashboard
 *
 * This replaces the dummy data generation with real diagnosis data from the API
 */

export type DiagnosisData = {
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

type LayerDef = {
  id: string;
  label: string;
  file: string;
  defaultOpacity?: number;
  color?: string;
  displaySetId?: string;
  studyUID?: string;
  diagnosisId?: number;
  imageType?: string;
};

class DiagnosisStore {
  private diagnoses: Map<string, DiagnosisData[]> = new Map(); // studyUID -> diagnoses
  private layers: Map<string, LayerDef[]> = new Map(); // studyUID -> layers
  private listeners: Set<() => void> = new Set();

  /**
   * Store diagnoses for a study
   */
  setDiagnoses(studyUID: string, diagnoses: DiagnosisData[]) {
    console.log('[Diagnosis Store] Storing diagnoses for study:', studyUID, diagnoses.length);
    this.diagnoses.set(studyUID, diagnoses);

    // Generate layers from diagnoses
    const layers = this.generateLayersFromDiagnoses(studyUID, diagnoses);
    this.layers.set(studyUID, layers);

    // Notify listeners
    this.notifyListeners();
  }

  /**
   * Get diagnoses for a study
   */
  getDiagnoses(studyUID: string): DiagnosisData[] {
    return this.diagnoses.get(studyUID) || [];
  }

  /**
   * Get layers for a study
   */
  getLayers(studyUID: string): LayerDef[] {
    return this.layers.get(studyUID) || [];
  }

  /**
   * Check if we have diagnoses for a study
   */
  hasDiagnoses(studyUID: string): boolean {
    return this.diagnoses.has(studyUID) && this.diagnoses.get(studyUID)!.length > 0;
  }

  /**
   * Subscribe to changes
   */
  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Clear all data
   */
  clear() {
    this.diagnoses.clear();
    this.layers.clear();
    this.notifyListeners();
  }

  /**
   * Clear data for a specific study
   */
  clearStudy(studyUID: string) {
    this.diagnoses.delete(studyUID);
    this.layers.delete(studyUID);
    this.notifyListeners();
  }

  /**
   * Generate layer definitions from diagnosis data
   */
  private generateLayersFromDiagnoses(studyUID: string, diagnoses: DiagnosisData[]): LayerDef[] {
    const layers: LayerDef[] = [];

    for (const diagnosis of diagnoses) {
      if (!diagnosis.diagnosis_images || diagnosis.diagnosis_images.length === 0) {
        continue;
      }

      // Use series_uid or dicom_instance_uid as display set identifier
      const displaySetId = diagnosis.series_uid || diagnosis.dicom_instance_uid;

      for (const diagImage of diagnosis.diagnosis_images) {
        const layerId = `diagnosis-${diagnosis.id}-${diagImage.type}-${diagImage.id}`;

        // Determine the overlay image URL
        const overlayImageUrl = this.getOverlayImageUrl(diagImage.image_path);

        // Determine color based on image type
        const color = this.getOverlayColor(diagImage.type);

        // Create friendly label
        const statusLabel = diagnosis.status ? `[${diagnosis.status}]` : '';
        const typeLabel = this.getImageTypeLabel(diagImage.type);

        layers.push({
          id: layerId,
          label: `${typeLabel} ${statusLabel}`.trim(),
          file: overlayImageUrl,
          defaultOpacity: this.getDefaultOpacity(diagImage.type),
          color,
          displaySetId,
          studyUID,
          diagnosisId: diagnosis.id,
          imageType: diagImage.type,
        });
      }
    }

    console.log('[Diagnosis Store] Generated', layers.length, 'layers from diagnoses');
    return layers;
  }

  /**
   * Get the full URL for an overlay image
   */
  private getOverlayImageUrl(imagePath: string): string {
    // If it's already a full URL, return as-is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    // If it starts with /, it's absolute from the API root
    if (imagePath.startsWith('/')) {
      const apiBase =
        window.location.hostname === 'localhost' ? 'http://localhost:3001' : window.location.origin;
      return `${apiBase}${imagePath}`;
    }

    // Otherwise, treat as relative to API
    const apiBase =
      window.location.hostname === 'localhost'
        ? 'http://localhost:3001/api'
        : `${window.location.origin}/api`;
    return `${apiBase}/${imagePath}`;
  }

  /**
   * Get color for overlay based on image type
   */
  private getOverlayColor(type: string): string {
    const colorMap: Record<string, string> = {
      //       source_img: '#00ff00',          // Green for source
      //       contour_img: '#ff0000',         // Red for contours
      //       all_labels_img: '#ffff00',      // Yellow for labels
      //       alignment_lines_img: '#00ffff', // Cyan for alignment
      //       Intervertebral_space_img: '#ff00ff', // Magenta for intervertebral
    };
    return colorMap[type] || 'transparent';
  }

  /**
   * Get default opacity based on image type
   */
  private getDefaultOpacity(type: string): number {
    const opacityMap: Record<string, number> = {
      source_img: 0.3,
      contour_img: 0.6,
      all_labels_img: 0.5,
      alignment_lines_img: 0.4,
      Intervertebral_space_img: 0.5,
    };
    return opacityMap[type] || 0.5;
  }

  /**
   * Get friendly label for image type
   */
  private getImageTypeLabel(type: string): string {
    const labelMap: Record<string, string> = {
      source_img: 'Source',
      contour_img: 'Contour',
      all_labels_img: 'Labels',
      alignment_lines_img: 'Alignment',
      Intervertebral_space_img: 'Intervertebral',
    };
    return labelMap[type] || type;
  }

  /**
   * Notify all listeners of changes
   */
  private notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('[Diagnosis Store] Error in listener:', error);
      }
    });
  }
}

// Singleton instance
export const diagnosisStore = new DiagnosisStore();
