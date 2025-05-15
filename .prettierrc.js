import { default as eruptionPrettierConfig } from '@eruptionjs/config/prettier'

export default {
  ...eruptionPrettierConfig,
  plugins: [...eruptionPrettierConfig.plugins, 'prettier-plugin-tailwindcss'],
  tailwindStylesheet: '/src/index.css',
}
