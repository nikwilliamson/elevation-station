import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef } from 'react';
import { ResizeHandle } from './ResizeHandle';

const meta = {
  title: 'Components/ResizeHandle',
  component: ResizeHandle,
} satisfies Meta<typeof ResizeHandle>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const ref = useRef<HTMLDivElement>(null);
    return (
      <div
        ref={ref}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          height: 300,
          border: '1px solid var(--es-color-border, #ccc)',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: 16, background: 'var(--es-color-surface, #fff)', color: 'var(--es-color-text-primary, #333)' }}>Left panel</div>
        <ResizeHandle containerRef={ref} />
        <div style={{ padding: 16, background: 'var(--es-color-surface-alt, #f5f5f5)', color: 'var(--es-color-text-primary, #333)' }}>Right panel</div>
      </div>
    );
  },
};
