# OHIF Viewer: Simplified Data Flow Diagram

## Quick Reference: How Images Reach the Viewer

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. USER NAVIGATES TO VIEWER                                            │
│    URL: /viewer?StudyInstanceUIDs=1.2.3.4.5                           │
│    File: platform/app/src/routes/Mode/Mode.tsx                         │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 2. ROUTE INITIALIZATION                                                 │
│    - Extracts StudyInstanceUIDs from URL                               │
│    - Initializes DataSource (DICOMweb/Local/etc.)                       │
│    - Calls defaultRouteInit()                                          │
│    File: platform/app/src/routes/Mode/defaultRouteInit.ts              │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 3. DATA SOURCE FETCHES METADATA                                         │
│    dataSource.retrieve.series.metadata({                                 │
│      StudyInstanceUID: '1.2.3.4.5'                                      │
│    })                                                                    │
│    - Makes HTTP requests (QIDO-RS, WADO-RS)                            │
│    - Retrieves Series → Instances metadata                              │
│    File: extensions/default/src/DicomWebDataSource/index.ts            │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 4. METADATA STORED IN CENTRAL STORE                                     │
│    DicomMetadataStore.addInstances(instances)                           │
│    - Fires INSTANCES_ADDED event                                        │
│    Structure:                                                           │
│      Study                                                               │
│        └── Series                                                        │
│              └── Instances[] (with imageIds)                            │
│    File: platform/core/src/services/DicomMetadataStore/                │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 5. DISPLAY SET SERVICE CONVERTS INSTANCES → DISPLAY SETS               │
│    Listens to: INSTANCES_ADDED event                                    │
│    Process:                                                              │
│      1. Get instances from DicomMetadataStore                           │
│      2. Match SOP Class UID to Handler                                 │
│      3. Handler creates DisplaySet(s)                                   │
│    DisplaySet contains:                                                 │
│      - displaySetInstanceUID                                            │
│      - instances[]                                                      │
│      - imageIds[] ← URLs for loading images                             │
│      - viewportType ('stack', 'volume', etc.)                           │
│    File: platform/core/src/services/DisplaySetService/                 │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 6. HANGING PROTOCOL DETERMINES LAYOUT                                   │
│    hangingProtocolService.run({ studies, displaySets })                │
│    - Matches display sets to protocol rules                             │
│    - Determines viewport grid (1x1, 2x2, etc.)                          │
│    - Assigns display sets to viewports                                  │
│    File: platform/core/src/services/HangingProtocolService/            │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 7. VIEWPORT GRID SERVICE MANAGES VIEWPORTS                              │
│    viewportGridService.setLayout({                                      │
│      numRows: 1, numCols: 1,                                            │
│      viewports: [{                                                      │
│        viewportId: 'viewport-1',                                       │
│        displaySetInstanceUIDs: ['ds-123']                              │
│      }]                                                                  │
│    })                                                                    │
│    File: platform/core/src/services/ViewportGridService/               │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 8. VIEWPORT COMPONENT RENDERS                                           │
│    <OHIFCornerstoneViewport                                             │
│      displaySets={[displaySet]}                                        │
│      viewportId="viewport-1"                                            │
│    />                                                                    │
│    - Gets display sets from DisplaySetService                           │
│    - Enables Cornerstone3D viewport                                     │
│    - Loads images from imageIds[]                                       │
│    File: extensions/cornerstone/src/Viewport/OHIFCornerstoneViewport.tsx│
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 9. CORNERSTONE3D RENDERS IMAGES                                         │
│    - Fetches DICOM images via imageId URLs                              │
│    - Decodes DICOM (JPEG, JPEG2000, etc.)                              │
│    - Renders in canvas element                                          │
│    - User can scroll, zoom, pan, measure                                 │
│    Library: @cornerstonejs/core, @cornerstonejs/dicom-image-loader     │
└─────────────────────────────────────────────────────────────────────────┘
```

## Key Data Structures

### Instance Metadata
```javascript
{
  SOPInstanceUID: '1.2.3.4.5.6',
  StudyInstanceUID: '1.2.3.4.5',
  SeriesInstanceUID: '1.2.3.4.5.7',
  imageId: 'wadors:http://server/studies/.../instances/...',
  Modality: 'CT',
  Rows: 512,
  Columns: 512,
  // ... other DICOM tags
}
```

### Display Set
```javascript
{
  displaySetInstanceUID: 'ds-123',
  instances: [InstanceMetadata, ...],
  imageIds: ['wadors:...', 'wadors:...'],
  viewportType: 'stack',
  Modality: 'CT',
  SeriesDescription: 'CHEST',
  isReconstructable: false,
  numImages: 100
}
```

### Viewport Configuration
```javascript
{
  viewportId: 'viewport-1',
  displaySetInstanceUIDs: ['ds-123'],
  viewportOptions: {
    viewportType: 'stack',
    orientation: 'axial',
    background: [0, 0, 0]
  },
  displaySetOptions: [{
    windowLevel: { window: 400, level: 50 }
  }]
}
```

## Event Flow

```
DicomMetadataStore
  └── INSTANCES_ADDED event
      └── DisplaySetService.makeDisplaySets()
          └── Creates DisplaySet(s)
              └── DISPLAY_SETS_ADDED event
                  └── HangingProtocolService.run()
                      └── VIEWPORT_GRID_CHANGED event
                          └── ViewportGrid component re-renders
                              └── OHIFCornerstoneViewport renders
                                  └── Cornerstone3D loads images
```

## File Locations Summary

| Component | File Path |
|-----------|-----------|
| Entry Point | `platform/app/src/index.js` |
| App Init | `platform/app/src/appInit.js` |
| Route Handler | `platform/app/src/routes/Mode/Mode.tsx` |
| Route Init | `platform/app/src/routes/Mode/defaultRouteInit.ts` |
| Data Source | `extensions/default/src/DicomWebDataSource/index.ts` |
| Metadata Store | `platform/core/src/services/DicomMetadataStore/` |
| Display Set Service | `platform/core/src/services/DisplaySetService/` |
| Hanging Protocol | `platform/core/src/services/HangingProtocolService/` |
| Viewport Grid | `platform/core/src/services/ViewportGridService/` |
| Viewport Component | `platform/app/src/components/ViewportGrid.tsx` |
| Cornerstone Viewport | `extensions/cornerstone/src/Viewport/OHIFCornerstoneViewport.tsx` |
| Basic Mode | `modes/basic/src/index.tsx` |
| SOP Class Handler | `extensions/default/src/getSopClassHandlerModule.js` |

## Common Questions

**Q: Where are images actually loaded?**
A: Images are loaded by `@cornerstonejs/dicom-image-loader` when Cornerstone3D requests them via the `imageId` URLs. The loader handles DICOM decoding and pixel data extraction.

**Q: How does a series become a display set?**
A: When instances are added to `DicomMetadataStore`, the `DisplaySetService` listens to the `INSTANCES_ADDED` event, matches the SOP Class UID to a handler, and the handler's `getDisplaySetsFromSeries()` method creates one or more display sets.

**Q: How are viewports assigned display sets?**
A: The `HangingProtocolService` matches display sets against protocol rules and assigns them to viewports. The mode can also define default assignments in its layout template.

**Q: Can I add custom data sources?**
A: Yes! Implement the data source interface (see `platform/core/src/DataSources/IWebApiDataSource.js`) and register it in the app config.

**Q: How do I add support for a new DICOM type?**
A: Create a SOP Class Handler module that implements `getDisplaySetsFromSeries()` and register it in your mode's `sopClassHandlers` array.
