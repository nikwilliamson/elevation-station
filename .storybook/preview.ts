import type { Preview } from '@storybook/react-vite';
import React from 'react';
import '../src/tokens/tokens.css';
import '../src/App.css';
import '../src/components/title/title.css';
import { ColorFormatContext } from '../src/shared/ColorFormatContext';

const preview: Preview = {
  decorators: [
    (Story) => React.createElement(
      ColorFormatContext.Provider,
      { value: 'oklch' },
      React.createElement(Story),
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'todo',
    },
  },
};

export default preview;
