import type { ButtonProps, TooltipProps } from 'ant-design-vue';

export interface ActionItem extends ButtonProps {
  color?: 'error' | 'success' | 'warning';
  preIcon?: string;
  postIcon?: string;
  label: string;
  auth?: string | string[];
  tooltip?: string | TooltipProps;
  ifShow?: ((...args: any[]) => boolean) | boolean;
}
