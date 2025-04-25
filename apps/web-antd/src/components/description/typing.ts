import type { DescriptionsProps } from 'ant-design-vue';
import type { CSSProperties, VNode } from 'vue';

export interface DescriptionItemSchema {
  label: string | VNode; // 内容的描述
  field?: string; // 对应 data 中的字段名
  content?: ((data: any) => string | VNode) | string | VNode; // 自定义需要展示的内容，比如说 dict-tag
  span?: number; // 包含列的数量
  labelStyle?: CSSProperties; // 自定义标签样式
  contentStyle?: CSSProperties; // 自定义内容样式
  hidden?: ((data: any) => boolean) | boolean; // 是否显示
}

export interface DescriptionsOptions {
  data?: Record<string, any>; // 数据
  schema?: DescriptionItemSchema[]; // 描述项配置
  componentProps?: DescriptionsProps; // antd Descriptions 组件参数
}
