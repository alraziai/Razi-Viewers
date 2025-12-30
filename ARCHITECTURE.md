# OHIF Viewer Architecture: Data Flow from Entry to Basic Viewer

## Overview

The OHIF Viewer is a medical imaging viewer built as a monorepo with a modular, extensible architecture. This document explains how images and data flow through the system from the entry point until they reach the basic viewer.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Entry Point                              │
│                    platform/app/src/index.js                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Application Initialization                  │
│                    platform/app/src/App.tsx                     │
│                    platform/app/src/appInit.js                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Route & Mode Selection                      │
│              platform/app/src/routes/Mode/Mode.tsx              │
│              modes/basic/src/index.tsx (Basic Mode)              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Data Source Layer                           │
│         extensions/default/src/DicomWebDataSource/             │
│              (DICOMweb, Local, JSON, etc.)                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   DICOM Metadata Store                            │
│    platform/core/src/services/DicomMetadataStore/              │
│              (Centralized metadata storage)                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Display Set Service                           │
│    platform/core/src/services/DisplaySetService/               │
│         (Converts instances → DisplaySets via SOP Handlers)      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Hanging Protocol Service                       │
│   platform/core/src/services/HangingProtocolService/            │
│          (Determines viewport layout and assignments)           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Viewport Grid Service                         │
│   platform/core/src/services/ViewportGridService/              │
│              (Manages viewport layout and state)                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Viewport Components                         │
│  extensions/cornerstone/src/Viewport/OHIFCornerstoneViewport.tsx │
│              (Renders images using Cornerstone3D)                │
└─────────────────────────────────────────────────────────────────┘
```

## Detailed Data Flow

### 1. Application Entry Point (`platform/app/src/index.js`)

**Purpose**: Bootstrap the React application

**Flow**:
1. Loads dynamic configuration from `window.config`
2. Imports modes and extensions from `pluginImports.js` (generated at build time)
3. Renders the `App` component with configuration

**Key Files**:
- `platform/app/src/index.js` - Entry point
- `platform/app/src/pluginImports.js` - Auto-generated imports of modes/extensions

### 2. Application Initialization (`platform/app/src/appInit.js`)

**Purpose**: Initialize core services and managers

**Flow**:
1. Creates `CommandsManager` - handles commands/actions
2. Creates `ServicesManager` - manages all services
3. Creates `ExtensionManager` - manages extensions
4. Registers core services:
   - `DisplaySetService` - converts instances to display sets
   - `HangingProtocolService` - manages viewport layouts
   - `ViewportGridService` - manages viewport grid
   - `MeasurementService`, `ToolbarService`, etc.
5. Loads and registers extensions
6. Loads and registers modes (including basic mode)

**Key Services Created**:
```javascript
servicesManager.registerServices([
  DisplaySetService.REGISTRATION,
  HangingProtocolService.REGISTRATION,
  ViewportGridService.REGISTRATION,
  // ... more services
]);
```

### 3. Route Initialization (`platform/app/src/routes/Mode/Mode.tsx`)

**Purpose**: Handle route navigation and initialize mode-specific logic

**Flow**:
1. Parses URL parameters (studyInstanceUIDs, filters, etc.)
2. Initializes the data source based on route configuration
3. Calls `mode.onModeInit()` if defined
4. Calls `defaultRouteInit()` to load study data
5. Sets up layout template from mode configuration

**Key Process**:
```javascript
// Extract studyInstanceUIDs from URL
const studyInstanceUIDs = dataSource.getStudyInstanceUIDs({ params, query });

// Initialize route with study data
await defaultRouteInit({
  servicesManager,
  studyInstanceUIDs,
  dataSource,
  filters,
  appConfig
}, hangingProtocolId, stageIndex);
```

### 4. Basic Mode Configuration (`modes/basic/src/index.tsx`)

**Purpose**: Define the basic viewer mode configuration

**Key Configuration**:
- **SOP Class Handlers**: Define how different DICOM SOP classes are processed
  - Stack handler for standard images
  - Video handler for DICOM video
  - Microscopy handler for whole slide imaging
  - PDF handler for DICOM PDF
  - SR handler for structured reports
  - SEG handler for segmentations
  - RT handler for RT structures

- **Viewport Types**: Define which viewports can display which display sets
- **Layout Template**: Defines the default layout (left panels, right panels, viewports)
- **Toolbar Configuration**: Defines available tools

**Example Configuration**:
```javascript
export const basicLayout = {
  id: ohif.layout,
  props: {
    leftPanels: [ohif.thumbnailList],
    rightPanels: [cornerstone.segmentation, cornerstone.measurements],
    viewports: [
      {
        namespace: cornerstone.viewport,
        displaySetsToDisplay: [ohif.sopClassHandler, dicomvideo.sopClassHandler]
      }
    ]
  }
};
```

### 5. Data Source Layer (`extensions/default/src/DicomWebDataSource/`)

**Purpose**: Fetch DICOM data from various sources (DICOMweb, local files, etc.)

**Flow**:
1. **Query Studies**: `dataSource.query.studies()` - Search for studies
2. **Retrieve Series Metadata**: `dataSource.retrieve.series.metadata()` - Get series-level metadata
3. **Retrieve Instances**: For each series, retrieves instance metadata
4. **Store Metadata**: Adds metadata to `DicomMetadataStore`

**Key Process** (`defaultRouteInit.ts`):
```javascript
// Retrieve series metadata for all studies
const allRetrieves = studyInstanceUIDs.map(StudyInstanceUID =>
  dataSource.retrieve.series.metadata({
    StudyInstanceUID,
    filters,
    returnPromises: true
  })
);
```

**Data Source Types**:
- **DICOMweb**: Standard DICOMweb REST API (QIDO-RS, WADO-RS)
- **DICOM Local**: Local file system access
- **DICOM JSON**: Pre-processed JSON metadata
- **DICOM Proxy**: Proxy server for DICOMweb

### 6. DICOM Metadata Store (`platform/core/src/services/DicomMetadataStore/`)

**Purpose**: Centralized storage for all DICOM metadata

**Structure**:
```
DicomMetadataStore
├── Studies[]
│   ├── StudyInstanceUID
│   ├── Series[]
│   │   ├── SeriesInstanceUID
│   │   ├── Instances[]
│   │   │   ├── SOPInstanceUID
│   │   │   ├── ImageId (for rendering)
│   │   │   └── DICOM tags (metadata)
```

**Key Operations**:
- `addInstances(instances)` - Adds instance metadata, fires `INSTANCES_ADDED` event
- `addSeriesMetadata(seriesMetadata)` - Adds series summary, fires `SERIES_ADDED` event
- `getStudy(StudyInstanceUID)` - Retrieves study metadata
- `getSeries(StudyInstanceUID, SeriesInstanceUID)` - Retrieves series metadata

**Event Subscription** (`defaultRouteInit.ts`):
```javascript
DicomMetadataStore.subscribe(
  DicomMetadataStore.EVENTS.INSTANCES_ADDED,
  function ({ StudyInstanceUID, SeriesInstanceUID }) {
    const seriesMetadata = DicomMetadataStore.getSeries(StudyInstanceUID, SeriesInstanceUID);
    // Convert instances to display sets
    displaySetService.makeDisplaySets(seriesMetadata.instances);
  }
);
```

### 7. Display Set Service (`platform/core/src/services/DisplaySetService/`)

**Purpose**: Convert DICOM instances into displayable sets

**Flow**:
1. Receives instances from `DicomMetadataStore` via `INSTANCES_ADDED` event
2. Determines appropriate SOP Class Handler based on instance SOP Class UID
3. Calls handler's `getDisplaySetsFromSeries()` method
4. Creates `DisplaySet` objects containing:
   - `displaySetInstanceUID` - Unique identifier
   - `instances[]` - Array of instance metadata
   - `imageIds[]` - Array of image IDs for rendering
   - `viewportType` - Type of viewport needed (stack, volume, etc.)
   - `Modality`, `SeriesDescription`, etc.

**SOP Class Handler Selection**:
```javascript
// SOP Class Handlers are registered in order of priority
// First handler that matches the SOP Class UID processes the instances
for (let i = 0; i < SOPClassHandlerIds.length && instances.length; i++) {
  const handler = extensionManager.getModuleEntry(SOPClassHandlerIds[i]);
  const displaySets = handler.getDisplaySetsFromSeries(instances);
  // Remove processed instances and continue
}
```

**Example Handler** (`extensions/default/src/getSopClassHandlerModule.js`):
```javascript
function getDisplaySetsFromSeries(instances) {
  const displaySets = [];

  // Split multi-frame instances into separate display sets
  // Split single-image modalities (MG, CR) into separate display sets
  // Group remaining stackable instances into one display set

  return displaySets;
}
```

**Display Set Properties**:
- `displaySetInstanceUID` - Unique identifier
- `instances[]` - Instance metadata array
- `imageIds[]` - URLs/identifiers for image loading
- `viewportType` - 'stack', 'volume', 'dicom-microscopy', etc.
- `isReconstructable` - Can be reconstructed into 3D volume
- `Modality`, `SeriesDescription`, `SeriesNumber` - DICOM metadata

### 8. Hanging Protocol Service (`platform/core/src/services/HangingProtocolService/`)

**Purpose**: Determine viewport layout and assign display sets to viewports

**Flow**:
1. Receives display sets from `DisplaySetService`
2. Matches display sets against hanging protocol rules
3. Determines viewport layout (1x1, 2x2, custom grid)
4. Assigns display sets to specific viewports
5. Configures viewport options (orientation, display area, etc.)

**Process** (`defaultRouteInit.ts`):
```javascript
function applyHangingProtocol() {
  const displaySets = displaySetService.getActiveDisplaySets();
  const studies = getStudies(studyInstanceUIDs, displaySets);
  const activeStudy = studies[0];

  // Run hanging protocol matching
  hangingProtocolService.run(
    { studies, activeStudy, displaySets },
    hangingProtocolId,
    { stageIndex }
  );
}
```

**Hanging Protocol Output**:
- Viewport grid configuration (rows, columns)
- Display set assignments per viewport
- Viewport options (orientation, display area, background)
- Display set options (window/level, colormap, etc.)

### 9. Viewport Grid Service (`platform/core/src/services/ViewportGridService/`)

**Purpose**: Manage viewport grid state and layout

**Flow**:
1. Receives layout configuration from Hanging Protocol Service
2. Creates viewport panes based on grid configuration
3. Assigns display sets to viewport panes
4. Manages active viewport state
5. Handles viewport resizing and layout changes

**Viewport Grid Structure**:
```javascript
{
  numRows: 2,
  numCols: 2,
  viewports: Map<viewportId, {
    displaySetInstanceUIDs: string[],
    viewportOptions: {...},
    displaySetOptions: [...],
    x, y, width, height
  }>
}
```

### 10. Viewport Component (`platform/app/src/components/ViewportGrid.tsx`)

**Purpose**: Render the viewport grid and individual viewport components

**Flow**:
1. Gets viewport configuration from `ViewportGridService`
2. For each viewport pane:
   - Retrieves display sets from `DisplaySetService`
   - Determines appropriate viewport component based on display set type
   - Renders the viewport component with display sets

**Viewport Component Selection**:
```javascript
function _getViewportComponent(displaySets, viewportComponents) {
  // Determine viewport type from display sets
  // Find matching viewport component from registered extensions
  // Return component (e.g., OHIFCornerstoneViewport, DicomMicroscopyViewport)
}
```

### 11. Cornerstone Viewport (`extensions/cornerstone/src/Viewport/OHIFCornerstoneViewport.tsx`)

**Purpose**: Render DICOM images using Cornerstone3D

**Flow**:
1. Receives display sets as props
2. Enables viewport in `CornerstoneViewportService`
3. Sets up viewport element and rendering engine
4. Loads images from `imageIds[]` in display sets
5. Renders images using Cornerstone3D stack or volume viewport

**Key Process**:
```javascript
// Enable viewport
cornerstoneViewportService.enableViewport(viewportId, elementRef.current);

// Set viewport data (called by hanging protocol or user interaction)
cornerstoneViewportService.setViewportData(
  viewportId,
  viewportData, // StackViewportData or VolumeViewportData
  viewportOptions,
  displaySetOptions
);
```

**Image Loading**:
- Images are loaded lazily as needed
- Uses `@cornerstonejs/dicom-image-loader` for DICOM decoding
- Supports WADO-URI, WADO-RS, and local file loading
- Handles various transfer syntaxes (JPEG, JPEG2000, RLE, etc.)

## Complete Data Flow Example

### Scenario: Loading a CT Study

1. **User navigates to**: `/viewer?StudyInstanceUIDs=1.2.3.4.5`

2. **Route Initialization** (`Mode.tsx`):
   - Extracts `StudyInstanceUIDs` from URL
   - Initializes DICOMweb data source
   - Calls `defaultRouteInit()`

3. **Data Retrieval** (`defaultRouteInit.ts`):
   ```javascript
   dataSource.retrieve.series.metadata({
     StudyInstanceUID: '1.2.3.4.5',
     filters: {}
   })
   ```

4. **Metadata Storage** (`DicomWebDataSource`):
   - Fetches series metadata via QIDO-RS
   - For each series, fetches instance metadata
   - Calls `DicomMetadataStore.addInstances(instances)`
   - Fires `INSTANCES_ADDED` event

5. **Display Set Creation** (`DisplaySetService`):
   - Listens to `INSTANCES_ADDED` event
   - Gets instances from `DicomMetadataStore`
   - Matches SOP Class UID to handler (stack handler for CT)
   - Creates `DisplaySet` with:
     - All CT instances
     - Image IDs: `['wadors:http://.../studies/.../series/.../instances/...']`
     - Viewport type: 'stack'

6. **Hanging Protocol** (`HangingProtocolService`):
   - Receives display sets
   - Matches against protocol rules
   - Determines layout: 1x1 grid
   - Assigns CT display set to viewport 1

7. **Viewport Rendering** (`OHIFCornerstoneViewport`):
   - Receives display set with image IDs
   - Enables Cornerstone3D viewport
   - Loads first image from `imageIds[0]`
   - Renders image using stack viewport
   - User can scroll through stack

## Key Concepts

### Display Set
A logical grouping of DICOM instances that should be displayed together. A series may produce one or more display sets (e.g., mammography may split into separate LCC, RCC display sets).

### SOP Class Handler
A module that processes specific DICOM SOP classes and creates display sets. Handlers are registered in priority order, with more specific handlers first.

### Viewport Type
Defines how a display set should be rendered:
- `stack` - 2D stack scrolling
- `volume` - 3D volume rendering
- `dicom-microscopy` - Whole slide imaging
- `dicom-pdf` - PDF viewer
- `dicom-video` - Video player

### Hanging Protocol
Rules that determine viewport layout and display set assignments based on study characteristics (modality, body part, etc.).

## Extension Points

The architecture is highly extensible:

1. **Data Sources**: Add new data sources by implementing the data source interface
2. **SOP Class Handlers**: Add handlers for new DICOM types
3. **Viewport Types**: Add new viewport components for different rendering needs
4. **Modes**: Create new modes with custom workflows
5. **Tools**: Add measurement and annotation tools
6. **Panels**: Add custom side panels

## Summary

The data flow follows this pattern:
1. **Entry** → Application initialization
2. **Route** → Mode selection and route initialization
3. **Data Source** → Fetch DICOM metadata
4. **Metadata Store** → Centralized storage
5. **Display Set Service** → Convert instances to display sets
6. **Hanging Protocol** → Determine layout
7. **Viewport Grid** → Manage viewports
8. **Viewport Component** → Render images

Each layer is decoupled and communicates through services and events, making the system highly modular and extensible.
