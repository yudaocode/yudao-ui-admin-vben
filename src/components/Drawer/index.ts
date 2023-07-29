import basicDrawer from './src/BasicDrawer.vue'
import { withInstall } from '@/utils'

export const BasicDrawer = withInstall(basicDrawer)
export * from './src/typing'
export { useDrawer, useDrawerInner } from './src/useDrawer'
