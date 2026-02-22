# Overlay Images Directory

This directory contains AI-generated overlay images (heatmaps, masks, etc.) organized by StudyInstanceUID and DisplaySetInstanceUID.

## Structure

```
overlays/
  <StudyInstanceUID>/
    <DisplaySetInstanceUID>/
      heatmap.png
      mask.png
```

## Example

For StudyInstanceUID: `1.2.276.0.7230010.3.0.3.5.1.14200028.159224185`
And DisplaySetInstanceUID: `1.2.276.0.7230010.3.0.3.5.1.14200028.159224185.1`

Place files at:
- `overlays/1.2.276.0.7230010.3.0.3.5.1.14200028.159224185/1.2.276.0.7230010.3.0.3.5.1.14200028.159224185.1/heatmap.png`
- `overlays/1.2.276.0.7230010.3.0.3.5.1.14200028.159224185/1.2.276.0.7230010.3.0.3.5.1.14200028.159224185.1/mask.png`

## Multiple Data Overlays

Each data overlay (SEG, RTSTRUCT, etc.) in each study will have its own AI heatmap and mask:
- Each overlay display set gets a unique identifier (DisplaySetInstanceUID)
- Each overlay display set has two AI layers: heatmap and mask
- Each layer has a unique color generated based on the display set ID and layer type

## Image Requirements

- Images must be PNG format with transparency support
- Images should match the dimensions of the base DICOM image
- Images will be overlaid pixel-perfectly on the base image
