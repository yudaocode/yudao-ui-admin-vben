import { getThemeColors, generateColors } from '../../../build/config/themeConfig'

import { replaceStyleVariables } from 'vite-vue-plugin-theme/es/client'
import { mixLighten, mixDarken, tinycolor } from 'vite-vue-plugin-theme/es/colorUtils'

export async function changeTheme(color: string) {
  const colors = generateColors({
    mixDarken,
    mixLighten,
    tinycolor,
    color
  })

  return await replaceStyleVariables({
    colorVariables: [...getThemeColors(color), ...colors]
  })
}
