import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useState } from 'react';
import { ElevationPreview } from './ElevationPreview';
import type { PreviewLayout } from '../../shared/defaults';

const meta = {
  title: 'Composed/ElevationPreview',
  component: ElevationPreview,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof ElevationPreview>;
export default meta;
type Story = StoryObj<typeof meta>;

const ELEVATIONS = [
  { name: 'surface', depth: 0.15, zIndex: 1, type: 'static' as const },
  { name: 'raised', depth: 0.25, zIndex: 2, type: 'static' as const },
  { name: 'elevated', depth: 0.35, zIndex: 3, type: 'static' as const },
];

const SHADOWS = [
  '0px 1px 2px rgba(23,10,50,0.12)',
  '0px 2px 4px rgba(23,10,50,0.12), 0px 4px 8px rgba(23,10,50,0.08)',
  '0px 3px 6px rgba(23,10,50,0.12), 0px 8px 16px rgba(23,10,50,0.08)',
];

export const Default: Story = {
  args: {
    preview: { bgHex: '#f1f1f1', surfaceHex: '#ffffff' },
    elevations: ELEVATIONS,
    shadowStacks: SHADOWS,
    interactiveShadowStacks: {},
    interactiveColorHsls: {},
    shadowColorHsl: 'hsl(260, 60%, 12%)',
    accentColorHsl: 'hsl(234, 70%, 20%)',
    layout: 'grid',
    onLayoutChange: fn(),
    onPreviewChange: fn(),
    onNameChange: fn(),
    onDepthChange: fn(),
    onZIndexChange: fn(),
    onRemoveElevation: fn(),
    onTypeChange: fn(),
    onInteractionStateChange: fn(),
    onInteractionStateEnabledChange: fn(),
    onLayerCountChange: fn(),
  },
  render: () => {
    const [layout, setLayout] = useState<PreviewLayout>('grid');
    return (
      <ElevationPreview
        preview={{ bgHex: '#f1f1f1', surfaceHex: '#ffffff' }}
        elevations={ELEVATIONS}
        shadowStacks={SHADOWS}
        interactiveShadowStacks={{}}
        interactiveColorHsls={{}}
        shadowColorHsl="hsl(260, 60%, 12%)"
        accentColorHsl="hsl(234, 70%, 20%)"
        layout={layout}
        onLayoutChange={setLayout}
        onPreviewChange={fn()}
        onNameChange={fn()}
        onDepthChange={fn()}
        onZIndexChange={fn()}
        onRemoveElevation={fn()}
        onTypeChange={fn()}
        onInteractionStateChange={fn()}
        onInteractionStateEnabledChange={fn()}
        onLayerCountChange={fn()}
      />
    );
  },
};
