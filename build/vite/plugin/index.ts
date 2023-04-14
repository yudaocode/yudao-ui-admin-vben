import { PluginOption } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import windiCSS from 'vite-plugin-windicss'
import progress from 'vite-plugin-progress'
import purgeIcons from 'vite-plugin-purge-icons'
import VitePluginCertificate from 'vite-plugin-mkcert'
import vueSetupExtend from 'unplugin-vue-setup-extend-plus/vite'
import { configPwaConfig } from './pwa'
import { configHtmlPlugin } from './html'
import { configCompressPlugin } from './compress'
import { configStyleImportPlugin } from './styleImport'
import { configVisualizerConfig } from './visualizer'
import { configThemePlugin } from './theme'
import { configSvgIconsPlugin } from './svgSprite'

export async function createVitePlugins(viteEnv: ViteEnv, isBuild: boolean) {
  const { VITE_BUILD_COMPRESS, VITE_BUILD_COMPRESS_DELETE_ORIGIN_FILE } = viteEnv

  const vitePlugins: PluginOption[] = [
    // have to
    vue(),
    // have to
    vueJsx(),
    // 打包进度条
    progress(),
    // support name
    vueSetupExtend({}),
    VitePluginCertificate({
      source: 'coding'
    })
  ]

  // windiCSS
  vitePlugins.push(windiCSS())

  // vite-vue-plugin-html
  vitePlugins.push(configHtmlPlugin(viteEnv, isBuild))

  // vite-plugin-svg-icons
  vitePlugins.push(configSvgIconsPlugin(isBuild))

  // vite-plugin-purge-icons
  vitePlugins.push(purgeIcons())

  // rollup-plugin-visualizer
  vitePlugins.push(configVisualizerConfig())

  // vite-plugin-vben-theme
  vitePlugins.push(configThemePlugin(isBuild))

  // The following plugins only work in the production environment
  if (isBuild) {
    // vite-plugin-style-import
    vitePlugins.push(configStyleImportPlugin(isBuild))
    // rollup-plugin-gzip
    vitePlugins.push(configCompressPlugin(VITE_BUILD_COMPRESS, VITE_BUILD_COMPRESS_DELETE_ORIGIN_FILE))

    // vite-plugin-pwa
    vitePlugins.push(configPwaConfig(viteEnv))
  }

  return vitePlugins
}
