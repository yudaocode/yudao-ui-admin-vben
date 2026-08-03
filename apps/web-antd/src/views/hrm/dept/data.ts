import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmEmployeeApi } from '#/api/hrm/employee';
import type { SystemDeptApi } from '#/api/system/dept';

import { handleTree } from '@vben/utils';

import { getEmployeeDeptStatistics } from '#/api/hrm/employee';
import { getSimpleDeptList } from '#/api/system/dept';

/** 员工人数统计 */
export interface EmployeeStatistics {
  activeCount: number;
  fullTimeCount: number;
  nonFullTimeCount: number;
}

/** 组织树行 */
export interface HrmDeptRow extends SystemDeptApi.Dept {
  directStatistics: EmployeeStatistics;
  totalStatistics: EmployeeStatistics;
}

const EMPTY_STATISTICS: EmployeeStatistics = {
  activeCount: 0,
  fullTimeCount: 0,
  nonFullTimeCount: 0,
};

/** 列表搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '部门名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入部门名称',
      },
    },
  ];
}

/** 列表列 */
export function useGridColumns(): VxeTableGridOptions<HrmDeptRow>['columns'] {
  return [
    {
      field: 'name',
      title: '部门名称',
      minWidth: 280,
      align: 'left',
      treeNode: true,
      slots: { default: 'name' },
    },
    {
      field: 'activeCount',
      title: '在职员工',
      minWidth: 180,
      align: 'center',
      titlePrefix: {
        content: '直属在职人数（包含下级部门在职人数）',
      },
      formatter: ({ row }) =>
        formatStatistics(
          row.directStatistics,
          row.totalStatistics,
          'activeCount',
        ),
    },
    {
      field: 'fullTimeCount',
      title: '全职员工',
      minWidth: 180,
      align: 'center',
      titlePrefix: {
        content: '直属全职人数（包含下级部门全职人数）',
      },
      formatter: ({ row }) =>
        formatStatistics(
          row.directStatistics,
          row.totalStatistics,
          'fullTimeCount',
        ),
    },
    {
      field: 'nonFullTimeCount',
      title: '非全职人数',
      minWidth: 180,
      align: 'center',
      titlePrefix: {
        content: '直属非全职人数（包含下级部门非全职人数）',
      },
      formatter: ({ row }) =>
        formatStatistics(
          row.directStatistics,
          row.totalStatistics,
          'nonFullTimeCount',
        ),
    },
  ];
}

/** 查询组织树列表 */
export async function getHrmDeptList(formValues?: {
  name?: string;
}): Promise<HrmDeptRow[]> {
  const [deptList, statisticsList] = await Promise.all([
    getSimpleDeptList(),
    getEmployeeDeptStatistics(),
  ]);
  const list = buildDeptList(deptList, statisticsList);
  return filterDeptList(list, formValues?.name);
}

/** 构建含直属与下级统计的扁平部门列表 */
function buildDeptList(
  deptList: SystemDeptApi.Dept[],
  statisticsList: HrmEmployeeApi.DeptStatistics[],
): HrmDeptRow[] {
  const withDirect = deptList.map((dept) => {
    const found = statisticsList.find((item) => item.deptId === dept.id);
    const directStatistics: EmployeeStatistics = found
      ? {
          activeCount: found.activeCount,
          fullTimeCount: found.fullTimeCount,
          nonFullTimeCount: found.nonFullTimeCount,
        }
      : { ...EMPTY_STATISTICS };
    return {
      ...dept,
      directStatistics,
      totalStatistics: { ...directStatistics },
    } as HrmDeptRow;
  });

  const tree = handleTree(withDirect) as HrmDeptRow[];
  const totalMap = new Map<number, EmployeeStatistics>();

  function computeTotal(node: HrmDeptRow): EmployeeStatistics {
    const children = (node.children || []) as HrmDeptRow[];
    const total: EmployeeStatistics = { ...node.directStatistics };
    for (const child of children) {
      const childTotal = computeTotal(child);
      total.activeCount += childTotal.activeCount;
      total.fullTimeCount += childTotal.fullTimeCount;
      total.nonFullTimeCount += childTotal.nonFullTimeCount;
    }
    totalMap.set(node.id!, total);
    return total;
  }

  tree.forEach((node) => computeTotal(node));

  return withDirect.map((dept) => ({
    ...dept,
    children: undefined,
    totalStatistics: totalMap.get(dept.id!) || dept.directStatistics,
  }));
}

/** 按名称过滤部门，并保留命中节点的上级路径 */
function filterDeptList(deptList: HrmDeptRow[], name?: string): HrmDeptRow[] {
  const keyword = name?.trim();
  if (!keyword) {
    return deptList;
  }

  const byId = new Map(deptList.map((dept) => [dept.id!, dept]));
  const matchedIds = new Set<number>();

  deptList.forEach((dept) => {
    if (!dept.name?.includes(keyword)) {
      return;
    }
    let current: HrmDeptRow | undefined = dept;
    while (current) {
      matchedIds.add(current.id!);
      current = current.parentId ? byId.get(current.parentId) : undefined;
    }
  });

  return deptList.filter((dept) => matchedIds.has(dept.id!));
}

/** 格式化直属人数和包含下级的人数 */
function formatStatistics(
  directStatistics: EmployeeStatistics = EMPTY_STATISTICS,
  totalStatistics: EmployeeStatistics = EMPTY_STATISTICS,
  field: keyof EmployeeStatistics,
) {
  return `${directStatistics[field]}（${totalStatistics[field]}）`;
}
