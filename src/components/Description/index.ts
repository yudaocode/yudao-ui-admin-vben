import description from './src/Description.vue'
import { withInstall } from '@/utils'

export * from './src/typing'
export { useDescription } from './src/useDescription'
export const Description = withInstall(description)
