<script lang="ts" setup>
import { defineAsyncComponent, reactive, ref } from 'vue';

import { Page, useVbenModal, type VbenFormProps } from '@vben/common-ui';

import { Button } from 'ant-design-vue';

import {
  useVbenVxeGrid,
  type VxeGridListeners,
  type VxeGridProps,
} from '#/adapter/vxe-table';
import { type CodegenApi, getCodegenTablePage } from '#/api/infra/codegen';

import { CodegenDefaultData } from './codegen.data';

// 使用导入表弹窗组件
const [ImportTableModal, importTableModalApi] = useVbenModal({
  connectedComponent: defineAsyncComponent(
    () => import('./components/import-table-modal.vue'),
  ),
});

// checked
const checkedStatus = ref<boolean>(false);

/**
 * 查看详情
 */
const handleView = (_row: CodegenApi.CodegenTableRespVO) => {
  // console.log('查看详情', row);
};

/**
 * 编辑
 */
const handleEdit = (_row: CodegenApi.CodegenTableRespVO) => {
  // console.log('编辑', row);
};

/**
 * 删除
 */
const handleDelete = (_row: CodegenApi.CodegenTableRespVO) => {
  // console.log('删除', row);
};

/**
 * 批量删除
 */
const handleBatchDelete = (_rows: CodegenApi.CodegenTableRespVO[]) => {
  // console.log('批量删除', rows);
};

/**
 * 导入表
 */
const handleImportTable = () => {
  // console.log('导入表', importTableModalApi);
  importTableModalApi.open();
};

/**
 * 同步
 */
const handleSync = (_row: CodegenApi.CodegenTableRespVO) => {
  // console.log('同步', row);
};

/**
 * 批量同步
 */
const handleBatchSync = (_rows: CodegenApi.CodegenTableRespVO[]) => {
  // console.log('批量同步', rows);
};

/**
 * 生成代码
 */
const handleGenerateCode = (_row: CodegenApi.CodegenTableRespVO) => {
  // console.log('生成代码', row);
};

/**
 * 批量生成代码
 */
const handleBatchGenerateCode = (_rows: CodegenApi.CodegenTableRespVO[]) => {
  // console.log('批量生成代码', rows);
};

/**
 * 表格查询表单配置
 */
const formOptions = reactive<any>({
  // 默认展开
  collapsed: false,
  schema: CodegenDefaultData.formSchema,
  // 控制表单是否显示折叠按钮
  showCollapseButton: true,
  submitButtonOptions: {
    content: '查询',
  },
  // 按下回车时是否提交表单
  submitOnEnter: false,
} as VbenFormProps);

/**
 * 表格配置
 */
const gridOptions = reactive<any>({
  columns: CodegenDefaultData.tableColumns,
  toolbarConfig: {
    slots: {
      buttons: 'toolbar_buttons',
    },
  },
  proxyConfig: {
    ajax: {
      query: async ({ page }, params) => {
        const data = await getCodegenTablePage({
          pageNo: page.currentPage,
          pageSize: page.pageSize,
          ...params,
        });
        return data;
      },
    },
  },
} as VxeGridProps);

const gridEvents = reactive<any>({
  checkboxChange: (params) => {
    const { checked } = params;
    checkedStatus.value = checked;
  },
  checkboxAll: (params) => {
    const { checked } = params;
    checkedStatus.value = checked;
  },
} as VxeGridListeners);

// 使用表格组件
const [Grid] = useVbenVxeGrid({
  formOptions,
  gridOptions,
  gridEvents,
});
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar_buttons="{ $grid }">
        <div class="flex items-center gap-2">
          <Button type="primary" @click="handleImportTable">导入表</Button>
          <Button
            :disabled="!checkedStatus"
            type="primary"
            @click="handleBatchSync($grid.getCheckboxRecords())"
          >
            批量同步
          </Button>
          <Button
            :disabled="!checkedStatus"
            type="primary"
            @click="handleBatchGenerateCode($grid.getCheckboxRecords())"
          >
            批量生成
          </Button>
          <Button
            :disabled="!checkedStatus"
            danger
            type="primary"
            @click="handleBatchDelete($grid.getCheckboxRecords())"
          >
            批量删除
          </Button>
        </div>
      </template>
      <template #action="{ row }">
        <div class="flex w-fit items-center justify-around">
          <Button type="link" @click="handleView(row)">查看</Button>
          <Button type="link" @click="handleEdit(row)">编辑</Button>
          <Button type="link" @click="handleSync(row)">同步</Button>
          <Button type="link" @click="handleGenerateCode(row)">
            生成代码
          </Button>
          <Button danger type="link" @click="handleDelete(row)">删除</Button>
        </div>
      </template>
    </Grid>
    <ImportTableModal />
  </Page>
</template>
