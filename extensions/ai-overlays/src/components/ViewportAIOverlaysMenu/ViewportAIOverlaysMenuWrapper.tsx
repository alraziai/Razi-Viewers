import React, { ReactNode } from 'react';
import ViewportAIOverlaysMenu from './ViewportAIOverlaysMenu';

export function ViewportAIOverlaysMenuWrapper(
  props: withAppTypes<{
    viewportId: string;
    location: string;
    isOpen?: boolean;
    onOpen?: () => void;
    onClose?: () => void;
    iconSize?: number;
    disabled?: boolean;
  }>
): ReactNode {
  return <ViewportAIOverlaysMenu {...props} />;
}
