import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useState } from 'react';
import { EngineControls } from './EngineControls';
import type { EngineParams } from '../../shared/defaults';

const meta = {
  title: 'Composed/EngineControls',
  component: EngineControls,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof EngineControls>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    engine: {
      lightX: 0.24,
      lightY: 0.64,
      intensity: 0.64,
      hardness: 0.80,
      layerCount: 7,
    },
    onEngineChange: fn(),
  },
  render: () => {
    const [engine, setEngine] = useState<EngineParams>({
      lightX: 0.24,
      lightY: 0.64,
      intensity: 0.64,
      hardness: 0.80,
      layerCount: 7,
    });
    return (
      <EngineControls
        engine={engine}
        onEngineChange={(key, value) => setEngine((prev) => ({ ...prev, [key]: value }))}
      />
    );
  },
};
