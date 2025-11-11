# Overlay Images Directory

This directory contains AI-generated overlay images (heatmaps, masks, etc.) organized by StudyInstanceUID.

## Structure

```
overlays/
  <StudyInstanceUID>/
    heatmap.png
    mask.png
```

## Example

For StudyInstanceUID: `1.2.276.0.7230010.3.0.3.5.1.14200028.159224185`

Place files at:
- `overlays/1.2.276.0.7230010.3.0.3.5.1.14200028.159224185/heatmap.png`
- `overlays/1.2.276.0.7230010.3.0.3.5.1.14200028.159224185/mask.png`

## Image Requirements

- Images must be PNG format with transparency support
- Images should match the dimensions of the base DICOM image
- Images will be overlaid pixel-perfectly on the base image
