import type { Rect } from '../../../../magic-cube-editor/util';
import type { DiyComponent } from '../../../util';

export const NAVIGATION_BAR_SHOW_TYPES = ['always', 'scroll'] as const;
export type NavigationBarShowType = (typeof NAVIGATION_BAR_SHOW_TYPES)[number];
export const isNavigationBarShowType = (
  showType: unknown,
): showType is NavigationBarShowType =>
  NAVIGATION_BAR_SHOW_TYPES.includes(showType as NavigationBarShowType);
const NAVIGATION_BAR_SCROLL_SHOW_VALUES = new Set<unknown>([
  0,
  '0',
  false,
  'false',
]);
export const isNavigationBarAlwaysShow = (
  property: Pick<NavigationBarProperty, 'alwaysShow' | 'showType'>,
) => {
  if (isNavigationBarShowType(property.showType)) {
    return property.showType === 'always';
  }
  return !NAVIGATION_BAR_SCROLL_SHOW_VALUES.has(property.alwaysShow);
};

/** 顶部导航栏属性 */
export interface NavigationBarProperty {
  bgType: 'color' | 'img'; // 背景类型
  bgColor: string; // 背景颜色
  bgImg: string; // 图片链接
  styleType: 'inner' | 'normal'; // 样式类型：默认 | 沉浸式
  showType: NavigationBarShowType; // 显示方式：常驻显示 | 滚动显示
  alwaysShow?: boolean | number | string; // 兼容旧版移动端：是否常驻显示
  mpCells: NavigationBarCellProperty[]; // 小程序单元格列表
  otherCells: NavigationBarCellProperty[]; // 其它平台单元格列表
  _local: {
    previewMp: boolean; // 预览顶部导航（小程序）
    previewOther: boolean; // 预览顶部导航（非小程序）
  }; // 本地变量
}

/** 顶部导航栏 - 单元格 属性 */
export interface NavigationBarCellProperty extends Rect {
  type: 'image' | 'search' | 'text'; // 类型：文字 | 图片 | 搜索框
  text: string; // 文字内容
  textColor: string; // 文字颜色
  imgUrl: string; // 图片地址
  url: string; // 图片链接
  backgroundColor: string; // 搜索框：框体颜色
  placeholder: string; // 搜索框：提示文字
  placeholderPosition: string; // 搜索框：提示文字位置
  showScan: boolean; // 搜索框：是否显示扫一扫
  borderRadius: number; // 搜索框：边框圆角半径
}

/** 定义组件 */
export const component = {
  id: 'NavigationBar',
  name: '顶部导航栏',
  icon: 'tabler:layout-navbar',
  property: {
    bgType: 'color',
    bgColor: '#fff',
    bgImg: '',
    styleType: 'normal',
    showType: 'always',
    alwaysShow: true,
    mpCells: [
      {
        type: 'text',
        textColor: '#111111',
      },
    ],
    otherCells: [
      {
        type: 'text',
        textColor: '#111111',
      },
    ],
    _local: {
      previewMp: true,
      previewOther: false,
    },
  },
} as DiyComponent<NavigationBarProperty>;
