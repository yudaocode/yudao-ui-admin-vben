import codeEditor from './src/CodeEditor.vue'
import jsonPreview from './src/json-preview/JsonPreview.vue'
import { withInstall } from '@/utils'

export const CodeEditor = withInstall(codeEditor)
export const JsonPreview = withInstall(jsonPreview)

export * from './src/typing'
