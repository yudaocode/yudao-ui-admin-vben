export interface ComparisonCardProps {
  /** 图标名称 */
  icon: string;
  /** 图标颜色类名 */
  iconColor?: string;
  /** 加载状态 */
  loading?: boolean;
  /** 标题 */
  title: string;
  /** 今日新增数量 */
  todayCount: number;
  /** 数值 */
  value: number;
}

