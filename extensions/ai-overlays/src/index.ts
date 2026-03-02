/**
 * Updated index.ts for ai-overlays extension
 *
 * This file should REPLACE:
 * /home/yusuf/Work/alriza/medical-imaging-app/Razi-Viewers/extensions/ai-overlays/src/index.ts
 *
 * Adds message listener initialization for dashboard integration
 */

import { Types } from '@ohif/core';
import { registerOverlayLoader } from './registerOverlayLoader';
import { initializeMessageListener } from './messageListener';
import OverlayPanel from './panels/OverlayPanel';
import getToolbarModule from './getToolbarModule';
import id from './id';

const aiOverlaysExtension: Types.Extensions.Extension = {
  id,
  preRegistration({ servicesManager }) {
    // Register the overlay image loader
    registerOverlayLoader();

    // Initialize message listener for dashboard integration
    console.log('[AI Overlays] Initializing message listener for dashboard integration...');
    initializeMessageListener(servicesManager);
  },
  getPanelModule({ commandsManager, servicesManager, extensionManager }) {
    return [
      {
        name: 'ai-overlays-panel',
        iconName: 'Clipboard',
        iconLabel: 'Summary',
        label: 'Summary',
        component: OverlayPanel,
        defaultContext: ['VIEWER'],
      },
    ];
  },
  getToolbarModule({ servicesManager }) {
    return getToolbarModule({ servicesManager });
  },
};

export default aiOverlaysExtension;
