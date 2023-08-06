import collapseContainer from './src/collapse/CollapseContainer.vue'
import scrollContainer from './src/ScrollContainer.vue'
import lazyContainer from './src/LazyContainer.vue'
import { withInstall } from '@/utils'

export const CollapseContainer = withInstall(collapseContainer)
export const ScrollContainer = withInstall(scrollContainer)
export const LazyContainer = withInstall(lazyContainer)

export * from './src/typing'
