import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { useAccessStore } from '@vben/stores';

/** 数据库存储的模板名称前缀，与后端 UReport2DatabaseReportProvider.PREFIX 一致 */
const FILE_PREFIX = 'db:';

/**
 * 构建 UReport2 页面地址
 *
 * 1. token、tenantId：UReport2 会透传给页面内的后续请求。使用 refreshToken，而不使用 accessToken 的原因：iframe 内无法方便的刷新访问令牌
 * 2. _u：模板文件。存储前缀不编码，模板名称按入口编码不同的次数；新建时不传递，打开空白模板
 *    - designer 设计器：编码两次。设计器页面读取地址栏中未解码的 _u，加载模板时再经表单提交编码一次，随后 Servlet 解码一次、ReportUtils 解码两次
 *    - preview 预览页：编码三次。Servlet 解码一次后，BaseServletAction.decode 再解码两次；预览页内的分页、打印、导出请求，直接复用地址栏中的 _u
 */
export function buildUReportUrl(path: 'designer' | 'preview', name?: string) {
  const accessStore = useAccessStore();
  const params = new URLSearchParams({
    token: accessStore.refreshToken || '',
  });
  if (accessStore.tenantId) {
    params.set('tenantId', String(accessStore.tenantId));
  }
  let url = `${import.meta.env.VITE_BASE_URL}/ureport/${path}?${params.toString()}`;
  if (name) {
    let fileName = encodeURIComponent(encodeURIComponent(name));
    if (path === 'preview') {
      fileName = encodeURIComponent(fileName); // 预览页多编码一次，原因见上方说明
    }
    url += `&_u=${FILE_PREFIX}${fileName}`;
  }
  return url;
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '报表名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入报表名称',
        allowClear: true,
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'name',
      title: '报表名称',
      minWidth: 200,
    },
    {
      field: 'createTime',
      title: '创建时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'updateTime',
      title: '更新时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 220,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
