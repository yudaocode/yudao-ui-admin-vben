import type { Component } from 'vue';

interface AnalysisOverviewItem {
  icon: Component | string;
  title: string;
  totalTitle?: string;
  totalValue?: number;
  value: number;
  tooltip?: string;
  // 环比增长相关字段
  showGrowthRate?: boolean; // 是否显示环比增长率，默认为false
}

interface WorkbenchProjectItem {
  color?: string;
  content: string;
  date: string;
  group: string;
  icon: Component | string;
  title: string;
  url?: string;
}

interface WorkbenchTrendItem {
  avatar: string;
  content: string;
  date: string;
  title: string;
}

interface WorkbenchTodoItem {
  completed: boolean;
  content: string;
  date: string;
  title: string;
}

interface WorkbenchQuickNavItem {
  color?: string;
  icon: Component | string;
  title: string;
  url?: string;
}

interface WorkbenchQuickDataShowItem {
  name: string;
  value: number;
  prefix: string;
  decimals: number;
  routerName: string;
}

export type {
  AnalysisOverviewItem,
  WorkbenchProjectItem,
  WorkbenchQuickDataShowItem,
  WorkbenchQuickNavItem,
  WorkbenchTodoItem,
  WorkbenchTrendItem,
};
