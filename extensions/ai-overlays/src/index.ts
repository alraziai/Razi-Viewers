import { Types } from '@ohif/core';
import { registerOverlayLoader } from './registerOverlayLoader';
import OverlayPanel from './panels/OverlayPanel';
import id from './id';

const aiOverlaysExtension: Types.Extensions.Extension = {
  id,
  preRegistration() {
    registerOverlayLoader();
  },
  getPanelModule({ commandsManager, servicesManager, extensionManager }) {
    return [
      {
        name: 'ai-overlays-panel',
        iconName: 'GroupLayers',
        iconLabel: 'AI Layers',
        label: 'AI Layers',
        component: OverlayPanel,
        defaultContext: ['VIEWER'],
      },
    ];
  },
};

export default aiOverlaysExtension;
