import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { EngineControls } from './EngineControls';
import type { EngineParams } from '../../shared/defaults';

const meta = {
  title: 'Composed/EngineControls',
  component: EngineControls,
} satisfies Meta<typeof EngineControls>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
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
