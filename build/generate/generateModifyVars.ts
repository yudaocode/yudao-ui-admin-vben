import { resolve } from 'node:path'
import { generateAntColors, primaryColor } from '../config/themeConfig'

/**
 * less global variable
 */
export function generateModifyVars() {
  const palettes = generateAntColors(primaryColor)

  const primaryColorObj: Record<string, string> = {}

  for (let index = 0; index < 10; index++)
    primaryColorObj[`primary-${index + 1}`] = palettes[index]

  return {
    hack: `true; @import (reference) "${resolve('src/design/config.less')}";`,
  }
}
