import { defineConfig } from '@vben/vite-config';

export default defineConfig(async () => {
  return {
    // ant-design-vue 的组件样式是运行时 CSS-in-JS 注入（非静态 css 文件），
    // 共享的 loadApplicationPlugins 已为所有应用注册 viteCssLayerPlugin
    // （包 vxe / tippy 等静态第三方样式），但包不住这些运行时样式；
    // 详见 theme.css 层序注释与 adapter/component 中 InputNumber 的说明。
    application: {},
    vite: {
      resolve: {
        // 锁文件中 vue-router 被解析为两份实例时，统一为一份，避免 useRouter() 拿不到路由
        dedupe: ['vue-router'],
      },
      server: {
        allowedHosts: true,
        proxy: {
          '/admin-api': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/admin-api/, ''),
            // mock代理目标地址
            target: 'http://localhost:48080/admin-api',
            ws: true,
          },
        },
      },
    },
  };
});
