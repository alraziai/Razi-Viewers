import React, { ReactElement, useState } from 'react';
import { AllInOneMenu } from '@ohif/ui-next';
import { VolumeRenderingQuality } from './VolumeRenderingQuality';
import { VolumeShift } from './VolumeShift';
import { VolumeLighting } from './VolumeLighting';
import { VolumeShade } from './VolumeShade';
import { useViewportRendering } from '../../hooks/useViewportRendering';

export function VolumeRenderingOptions({ viewportId }: { viewportId?: string } = {}): ReactElement {
  const { volumeRenderingQualityRange } = useViewportRendering(viewportId);
  const [hasShade, setShade] = useState(false);
  return (
    <AllInOneMenu.ItemPanel>
      <VolumeRenderingQuality
        viewportId={viewportId}
        volumeRenderingQualityRange={volumeRenderingQualityRange}
      />
      <VolumeShift viewportId={viewportId} />
      <div className="mt-2 flex h-8 !h-[20px] w-full flex-shrink-0 items-center justify-start px-2 text-base">
        <div className="text-sm text-white/60">Lighting</div>
      </div>
      <div className="mt-1 mb-1 h-px w-full bg-[#48FFF6]/15"></div>
      <div className="flex h-8 w-full flex-shrink-0 items-center rounded px-2 text-base transition-colors hover:bg-[#083A4A]">
        <VolumeShade
          viewportId={viewportId}
          onClickShade={setShade}
        />
      </div>
      <VolumeLighting
        viewportId={viewportId}
        hasShade={hasShade}
      />
    </AllInOneMenu.ItemPanel>
  );
}
