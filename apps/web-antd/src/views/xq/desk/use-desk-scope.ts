import type { AppRouteRecordRaw } from '@vben/types';

import type { XqWorkbenchPlatform } from '#/api/xq/listing';

import { computed } from 'vue';
import { useRoute } from 'vue-router';

function hasPerm(perms: string[], code: string) {
  const set = new Set(perms || []);
  return set.has('*:*:*') || set.has(code);
}

function leaf(
  id: number,
  parentId: number,
  name: string,
  path: string,
  component: string,
  componentName: string,
  icon: string,
  sort: number,
  extra?: { alwaysShow?: boolean; keepAlive?: boolean; visible?: boolean },
): AppRouteRecordRaw {
  return {
    id,
    parentId,
    name,
    path,
    component,
    componentName,
    icon,
    visible: extra?.visible ?? true,
    keepAlive: extra?.keepAlive ?? true,
    alwaysShow: extra?.alwaysShow ?? false,
    sort,
  } as unknown as AppRouteRecordRaw;
}

/** 平台工作台挂到 产品 > 工作台，取代原任务列表 */
const WORKBENCH_MENU_ID = 12_810;

/** 美工：工作台根级「编辑图片」，跨平台看已分配（待执行 + 已出图） */
export function buildArtistEditImageMenu(
  permissions: string[],
): AppRouteRecordRaw | null {
  if (
    !hasPerm(permissions, 'xq:work-order:my-image') &&
    !hasPerm(permissions, 'xq:work-order:list') &&
    !hasPerm(permissions, 'xq:work-order:query') &&
    !hasPerm(permissions, '*:*:*')
  ) {
    return null;
  }
  return leaf(
    880_999_010,
    WORKBENCH_MENU_ID,
    '编辑图片',
    'xq-edit-image',
    'xq/product/image-pool/index',
    'XqEditImagePool',
    'lucide:images',
    50,
  );
}

export function buildXqDeskMenus(
  platforms: XqWorkbenchPlatform[],
  permissions: string[],
): AppRouteRecordRaw[] {
  const menus: AppRouteRecordRaw[] = [];
  (platforms || []).forEach((p, idx) => {
    if ((p.shops || []).length === 0) return;
    const pid = String(p.id);
    const code = String(p.code || pid)
      .toLowerCase()
      .replaceAll(/[^a-z0-9_-]+/g, '-');
    const baseId = 880_000_000 + Number(pid || idx);
    const children: AppRouteRecordRaw[] = [];
    const canOrder =
      hasPerm(permissions, 'xq:work-order:list') ||
      hasPerm(permissions, 'xq:work-order:query');

    if (canOrder) {
      // 任务列表直接进产品列表，不再套「产品」子层；编辑/详情隐藏路由同级挂靠
      children.push(
        leaf(
          baseId + 11,
          baseId,
          '任务列表',
          'list',
          `xq/product/task-list/index?platformId=${pid}`,
          `XqDeskTaskList${pid}`,
          'lucide:list',
          1,
        ),
        leaf(
          baseId + 1,
          baseId,
          '编辑产品',
          'copy',
          `xq/product/copy-pool/index?platformId=${pid}`,
          `XqDeskCopy${pid}`,
          'lucide:file-text',
          2,
          { visible: false },
        ),
        leaf(
          baseId + 12,
          baseId,
          '产品详情',
          'detail',
          `xq/product/work-detail/index?platformId=${pid}`,
          `XqDeskTaskDetail${pid}`,
          'lucide:package',
          3,
          { visible: false, keepAlive: false },
        ),
      );
    }
    if (canOrder) {
      children.push(
        leaf(
          baseId + 2,
          baseId,
          '图片',
          'image',
          `xq/product/image-pool/index?platformId=${pid}`,
          `XqDeskImage${pid}`,
          'lucide:images',
          3,
        ),
      );
    }
    const configChildren: AppRouteRecordRaw[] = [];
    if (hasPerm(permissions, 'xq:copy-rule:query')) {
      configChildren.push(
        leaf(
          baseId + 3,
          baseId + 6,
          '文案管理',
          'copy-rule',
          `xq/product/copy-rule/index?platformId=${pid}`,
          `XqDeskCopyRule${pid}`,
          'lucide:settings-2',
          1,
        ),
      );
    }
    if (hasPerm(permissions, 'xq:image-rule:query')) {
      configChildren.push(
        leaf(
          baseId + 4,
          baseId + 6,
          '图片管理',
          'image-rule',
          `xq/product/image-rule/index?platformId=${pid}`,
          `XqDeskImageRule${pid}`,
          'lucide:image',
          2,
        ),
      );
    }
    if (hasPerm(permissions, 'xq:template-config:query')) {
      configChildren.push(
        leaf(
          baseId + 5,
          baseId + 6,
          '模板配置',
          'template-config',
          `xq/product/template-config/index?platformId=${pid}`,
          `XqDeskTemplate${pid}`,
          'lucide:layout-template',
          3,
        ),
      );
    }
    const canSpecial =
      hasPerm(permissions, 'xq:template-config:query') ||
      hasPerm(permissions, 'xq:work-order:list') ||
      hasPerm(permissions, 'xq:work-order:query');
    if (canSpecial) {
      configChildren.push(
        leaf(
          baseId + 7,
          baseId + 6,
          '特殊配置',
          'special-config',
          `xq/product/special-config/index?platformId=${pid}`,
          `XqDeskSpecial${pid}`,
          'lucide:sliders-horizontal',
          4,
        ),
      );
    }
    if (configChildren.length > 0) {
      children.push({
        id: baseId + 6,
        parentId: baseId,
        name: '配置',
        path: 'config',
        component: '',
        componentName: `XqDeskConfig${pid}`,
        icon: 'lucide:settings',
        visible: true,
        keepAlive: true,
        alwaysShow: true,
        sort: 4,
        children: configChildren,
      } as unknown as AppRouteRecordRaw);
    }
    if (children.length === 0) return;
    menus.push({
      id: baseId,
      parentId: WORKBENCH_MENU_ID,
      name: p.name || p.code || '平台',
      path: `xq-desk-${code}`,
      component: '',
      componentName: `XqDesk${code}`,
      icon: 'lucide:store',
      visible: true,
      keepAlive: true,
      alwaysShow: true,
      sort: 1 + idx,
      children,
    } as unknown as AppRouteRecordRaw);
  });
  return menus;
}

const HIDE_WORKBENCH = new Set([
  '上架',
  '任务列表',
  '图片',
  '我的图片',
  '我的文案',
  '编辑图片', // 由 buildArtistEditImageMenu 统一注入，避免与库内旧菜单重复
]);
const HIDE_WORKBENCH_CONFIG = new Set([
  '图片管理',
  '文案管理',
  '模板配置',
  '特殊配置',
]);

/** 已有平台工作台时，产品>工作台去掉原任务列表/图片，挂入各平台 */
export function pruneWorkbenchMenus(menus: AppRouteRecordRaw[]) {
  for (const menu of menus || []) {
    const kids = (menu as any).children as AppRouteRecordRaw[] | undefined;
    if ((menu as any).name === '工作台' && kids?.length) {
      const next = kids.filter(
        (c) => !HIDE_WORKBENCH.has(String((c as any).name || '')),
      );
      for (const child of next) {
        if ((child as any).name !== '配置') continue;
        const cfgKids = ((child as any).children || []) as AppRouteRecordRaw[];
        (child as any).children = cfgKids.filter(
          (c) => !HIDE_WORKBENCH_CONFIG.has(String((c as any).name || '')),
        );
      }
      (menu as any).children = next.filter((c) => {
        if ((c as any).name !== '配置') return true;
        return (((c as any).children || []) as AppRouteRecordRaw[]).length > 0;
      });
    }
    if (kids?.length) pruneWorkbenchMenus(kids);
  }
  return menus;
}

export function attachDesksToWorkbench(
  menus: AppRouteRecordRaw[],
  desks: AppRouteRecordRaw[],
  permissions: string[] = [],
) {
  pruneWorkbenchMenus(menus);
  const artistImage = buildArtistEditImageMenu(permissions);
  const inject = [...desks, ...(artistImage ? [artistImage] : [])];
  const walk = (list: AppRouteRecordRaw[]): boolean => {
    for (const menu of list || []) {
      if (String((menu as any).name || '') === '工作台') {
        const rest = ((menu as any).children || []) as AppRouteRecordRaw[];
        // 去掉旧「我的图片/编辑图片」避免重复
        const cleaned = rest.filter(
          (c) =>
            !['我的图片', '编辑图片'].includes(String((c as any).name || '')),
        );
        (menu as any).children = [...inject, ...cleaned];
        return true;
      }
      const kids = (menu as any).children as AppRouteRecordRaw[] | undefined;
      if (kids?.length && walk(kids)) return true;
    }
    return false;
  };
  if (!walk(menus) && inject.length > 0) {
    menus.push(...inject);
  }
  return menus;
}

export function useDeskPlatformId() {
  const route = useRoute();
  return computed(() => {
    const metaQuery = (route.meta as any)?.query as
      | Record<string, string>
      | undefined;
    return String(metaQuery?.platformId || route.query.platformId || '');
  });
}
