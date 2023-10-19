import { resolve } from 'node:path'

import { generate } from '@ant-design/colors'

import { theme } from 'ant-design-vue/lib'
import convertLegacyToken from 'ant-design-vue/lib/theme/convertLegacyToken'
import { primaryColor } from '../config/themeConfig'

const { defaultAlgorithm, defaultSeed } = theme

function generateAntColors(color: string, theme: 'default' | 'dark' = 'default') {
  return generate(color, {
    theme,
  })
}

/**
 * less global variable
 */
export function generateModifyVars() {
  const palettes = generateAntColors(primaryColor)
  const primary = palettes[5]

  const primaryColorObj: Record<string, string> = {}

  for (let index = 0; index < 10; index++)
    primaryColorObj[`primary-${index + 1}`] = palettes[index]

  // const modifyVars = getThemeVariables();
  const mapToken = defaultAlgorithm(defaultSeed)
  const v3Token = convertLegacyToken(mapToken)

  return {
    ...v3Token,
    // reference:  Avoid repeated references
    'hack': `true; @import (reference) "${resolve('src/design/config.less')}";`,
    'primary-color': primary,
    ...primaryColorObj,
    'info-color': primary,
    'processing-color': primary,
    'success-color': '#55D187', //  Success color
    'error-color': '#ED6F6F', //  False color
    'warning-color': '#EFBD47', //   Warning color
    'font-size-base': '14px', //  Main font size
    'border-radius-base': '2px', //  Component/float fillet
    'link-color': primary, //   Link color
    'app-content-background': '#fafafa', //   Link color
  }
}
