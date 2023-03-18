/**
 * Configure and register global directives
 */
import type { App } from 'vue'
import { setupPermissionDirective } from './permission'
import { setupLoadingDirective } from './loading'

export function setupGlobDirectives(app: App<Element>) {
  setupPermissionDirective(app)
  setupLoadingDirective(app)
}
