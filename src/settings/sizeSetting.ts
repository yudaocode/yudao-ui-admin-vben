import type { DropMenu } from '../components/Dropdown'
import type { AppSizeType, SizeSetting } from '@/types/config'

// 'small' | 'middle' | 'large'
export const APPSIZE: { [key: string]: AppSizeType } = {
  SMALL: 'small',
  MIDDLE: 'middle',
  LARGE: 'large',
}

export const sizeSetting: SizeSetting = {
  // 是否显示尺寸选择器
  showPicker: true,
  // 当前尺寸
  size: APPSIZE.MIDDLE,
  // 默认尺寸
  fallback: APPSIZE.MIDDLE,
  // 允许的尺寸
  availableSizes: [APPSIZE.SMALL, APPSIZE.MIDDLE, APPSIZE.LARGE],
}

// 尺寸列表
export const sizeList: DropMenu[] = [
  {
    text: '默认',
    event: APPSIZE.MIDDLE,
  },
  {
    text: '小型',
    event: APPSIZE.SMALL,
  },
  {
    text: '大型',
    event: APPSIZE.LARGE,
  },
]
