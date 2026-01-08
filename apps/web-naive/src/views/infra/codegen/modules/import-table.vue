<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { InfraCodegenApi } from '#/api/infra/codegen';

import { reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { createCodegenList, getSchemaTableList } from '#/api/infra/codegen';
import { $t } from '#/locales';
import {
  useImportTableColumns,
  useImportTableFormSchema,
} from '#/views/infra/codegen/data';

/** 定义组件事件 */
const emit = defineEmits<{
  (e: 'success'): void;
}>();

const formData = reactive<InfraCodegenApi.CodegenCreateListReqVO>({
  dataSourceConfigId: 0,
  tableNames: [], // 已选择的表列表
});

// 表格引用，用于直接读取表格选中状态
const gridRef = ref<any>(null);

/** 表格实例 */
const [Grid] = useVbenVxeGrid({
  formOptions: {
    schema: useImportTableFormSchema(),
    submitOnChange: true,
  },
  gridOptions: {
    columns: useImportTableColumns(),
    height: 600,
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          if (formValues.dataSourceConfigId === undefined) {
            return [];
          }
          formData.dataSourceConfigId = formValues.dataSourceConfigId;
          return await getSchemaTableList({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'name',
      isHover: true,
    },
    toolbarConfig: {
      enabled: false,
    },
    checkboxConfig: {
      highlight: true,
      range: true,
    },
    pagerConfig: {
      enabled: false,
    },
  } as VxeTableGridOptions<InfraCodegenApi.DatabaseTable>,
  gridEvents: {
    checkboxChange: ({
      records,
    }: {
      records: InfraCodegenApi.DatabaseTable[];
    }) => {
      // 更新选中的表名列表
      formData.tableNames = Array.isArray(records)
        ? records.map((item) => item.name).filter(Boolean)
        : [];
    },
    checkboxAll: ({
      records,
    }: {
      records: InfraCodegenApi.DatabaseTable[];
    }) => {
      // 全选时更新选中的表名列表
      formData.tableNames = Array.isArray(records)
        ? records.map((item) => item.name).filter(Boolean)
        : [];
    },
  },
});

/** 模态框实例 */
const [Modal, modalApi] = useVbenModal({
  title: '导入表',
  class: 'w-1/2',
  async onConfirm() {
    // 1.1 校验数据源
    if (formData?.dataSourceConfigId === undefined) {
      message.error('请选择数据源');
      return;
    }

    // 1.2 从表格实例读取选中的记录（关键：处理全选等场景）
    if (gridRef.value) {
      try {
        const $grid = gridRef.value;
        // 调用表格的 getCheckboxRecords 方法获取所有选中的记录
        const checkboxRecords = $grid.getCheckboxRecords?.() || [];

        if (checkboxRecords.length > 0) {
          // 提取表名并去重
          formData.tableNames = checkboxRecords
            .map((item: any) => item.name)
            .filter(Boolean);
        }
      } catch (error) {
        console.error('读取表格选中记录时出错:', error);
      }
    }

    // 1.3 校验是否选择了表
    if (!formData.tableNames || formData.tableNames.length === 0) {
      message.error('请选择需要导入的表');
      return;
    }

    // 通过校验后再锁定 modal（避免校验失败时 modal 被锁定）
    modalApi.lock();

    // 2. 提交请求
    const hideLoading = message.loading('导入中...', {
      duration: 0,
    });
    try {
      await createCodegenList(formData);
      // 关闭并提示
      await modalApi.close();
      emit('success');
      message.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      hideLoading.destroy();
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal>
    <Grid ref="gridRef" />
  </Modal>
</template>
