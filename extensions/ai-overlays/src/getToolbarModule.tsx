import { ViewportAIOverlaysMenuWrapper } from './components/ViewportAIOverlaysMenu/ViewportAIOverlaysMenuWrapper';

export default function getToolbarModule({ servicesManager }: withAppTypes) {
  const { cornerstoneViewportService } = servicesManager.services;

  return [
    {
      name: 'ohif.aiOverlaysMenu',
      defaultComponent: ViewportAIOverlaysMenuWrapper,
    },
    {
      name: 'evaluate.aiOverlaysMenu',
      evaluate: ({ viewportId }) => {
        const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);

        if (!viewport) {
          return {
            disabled: true,
          };
        }

        // Show AI overlays menu for all viewports that have images
        const currentImageId = viewport.getCurrentImageId?.();
        if (!currentImageId) {
          return {
            disabled: true,
          };
        }

        return {
          disabled: false,
        };
      },
    },
  ];
}
