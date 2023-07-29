import { renderQrCode } from './drawCanvas'
import { drawLogo } from './drawLogo'
import type { RenderQrCodeParams } from './typing'

export function toCanvas(options: RenderQrCodeParams) {
  return renderQrCode(options)
    .then(() => {
      return options
    })
    .then(drawLogo) as Promise<string>
}
