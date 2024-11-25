import type { CollapseContainerOptions } from '@/components/Container';
import type { DescriptionsProps } from 'ant-design-vue/es/descriptions';

import type { CSSProperties, VNode } from 'vue';

export interface DescItem {
  labelMinWidth?: number;
  contentMinWidth?: number;
  labelStyle?: CSSProperties;
  field: string;
  label: JSX.Element | string | VNode;
  // Merge column
  span?: number;
  show?: (...arg: any) => boolean;
  // render
  render?: (
    val: any,
    data: Recordable,
  ) => Element | JSX.Element | number | string | undefined | VNode;
  component: string;
  componentProps?: any;
  children?: DescItem[];
}

export interface DescriptionProps extends DescriptionsProps {
  // Whether to include the collapse component
  useCollapse?: boolean;
  /**
   * item configuration
   * @type DescItem
   */
  schema: DescItem[];
  /**
   * 数据
   * @type object
   */
  data: Recordable;
  /**
   * Built-in CollapseContainer component configuration
   * @type CollapseContainerOptions
   */
  collapseOptions?: CollapseContainerOptions;
}

export interface DescInstance {
  setDescProps(descProps: Partial<DescriptionProps>): void;
}

export type Register = (descInstance: DescInstance) => void;

/**
 * @description:
 */
export type UseDescReturnType = [Register, DescInstance];
