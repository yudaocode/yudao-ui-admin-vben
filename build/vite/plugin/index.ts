import type { PluginOption } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import progress from 'vite-plugin-progress'
import purgeIcons from 'vite-plugin-purge-icons'
import VitePluginCertificate from 'vite-plugin-mkcert'
import UnoCSS from 'unocss/vite'
import { presetTypography, presetUno } from 'unocss'
import { configPwaConfig } from './pwa'
import { configHtmlPlugin } from './html'
import { configCompressPlugin } from './compress'
import { configVisualizerConfig } from './visualizer'
import { configSvgIconsPlugin } from './svgSprite'

export function createVitePlugins(viteEnv: ViteEnv, isBuild: boolean) {
  const { VITE_BUILD_COMPRESS, VITE_BUILD_COMPRESS_DELETE_ORIGIN_FILE } = viteEnv

  const vitePlugins: PluginOption[] = [
    // have to
    vue(),
    // have to
    vueJsx(),
    // UnoCSS
    UnoCSS({
      presets: [presetUno(), presetTypography()],
    }),
    // 打包进度条
    progress(),
    VitePluginCertificate({
      source: 'coding',
    }),
  ]

  // vite-vue-plugin-html
  vitePlugins.push(configHtmlPlugin(viteEnv, isBuild))

  // vite-plugin-svg-icons
  vitePlugins.push(configSvgIconsPlugin(isBuild))

  // vite-plugin-purge-icons
  vitePlugins.push(purgeIcons())

  // rollup-plugin-visualizer
  vitePlugins.push(configVisualizerConfig())

  // The following plugins only work in the production environment
  if (isBuild) {
    // rollup-plugin-gzip
    vitePlugins.push(configCompressPlugin(VITE_BUILD_COMPRESS, VITE_BUILD_COMPRESS_DELETE_ORIGIN_FILE))

    // vite-plugin-pwa
    vitePlugins.push(configPwaConfig(viteEnv))
  }

  return vitePlugins
}
