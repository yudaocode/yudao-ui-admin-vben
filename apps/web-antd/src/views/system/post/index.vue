<script lang="ts" setup>
// TODO @芋艿：优化注释；
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { Page } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getPostPage, type PostVO } from '#/api/system/post';

const formOptions: VbenFormProps = {
  // 默认展开
  collapsed: false,
  schema: [
    {
      component: 'Input',
      fieldName: 'name',
      label: '岗位名称',
    },
    {
      component: 'Input',
      fieldName: 'code',
      label: '岗位编码',
    },
    // TODO: dict
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          {
            label: 'Color1',
            value: '1',
          },
          {
            label: 'Color2',
            value: '2',
          },
        ],
        placeholder: '请选择',
      },
      fieldName: 'status',
      label: '状态',
    },
  ],
  // 控制表单是否显示折叠按钮
  showCollapseButton: true,
  // 按下回车时是否提交表单
  submitOnEnter: false,
};

const gridOptions: VxeGridProps<PostVO> = {
  checkboxConfig: {
    highlight: true,
    labelField: 'name',
  },
  columns: [
    { title: '序号', type: 'seq', width: 50 },
    { field: 'id', title: '岗位编号' },
    { field: 'name', title: '岗位名称' },
    { field: 'code', title: '岗位编码' },
    { field: 'sort', title: '岗位顺序' },
    { field: 'remark', title: '岗位备注' },
    { field: 'status', title: '状态' },
    { field: 'createTime', formatter: 'formatDateTime', title: '创建时间' },
    {
      cellRender: { name: 'CellLink', props: { text: '编辑' } },
      field: 'action',
      fixed: 'right',
      title: '操作',
      width: 120,
    },
  ],
  height: 'auto',
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        message.success(`Query params: ${JSON.stringify(formValues)}`);
        return await getPostPage({
          page: page.currentPage,
          pageSize: page.pageSize,
          ...formValues,
        });
      },
    },
  },
};

const [Grid] = useVbenVxeGrid({ formOptions, gridOptions });
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #action>
        <!-- TODO: 操作 -->
        <Button type="link">编辑</Button>
        <Button type="link">删除</Button>
      </template>
    </Grid>
  </Page>
</template>
