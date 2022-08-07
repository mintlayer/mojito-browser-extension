import '../src/assets/styles/constants.css'
import './index_stories.css'

const customViewports = {
  extension: {
    name: 'extension app',
    styles: {
      width: '800px',
      height: '600px',
    },
  },
}

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  viewport: {
    viewports: customViewports,
  },
}
