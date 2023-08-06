import type { ExtractPropTypes } from 'vue'
import button from './src/BasicButton.vue'
import popConfirmButton from './src/PopConfirmButton.vue'
import type { buttonProps } from './src/props'
import { withInstall } from '@/utils'

export const Button = withInstall(button)
export const PopConfirmButton = withInstall(popConfirmButton)
export declare type ButtonProps = Partial<ExtractPropTypes<typeof buttonProps>>
