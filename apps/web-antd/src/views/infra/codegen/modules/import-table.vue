<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { InfraCodegenApi } from '#/api/infra/codegen';
import type { InfraDataSourceConfigApi } from '#/api/infra/data-source-config';

import { useVbenModal } from '@vben/common-ui';
import { message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { createCodegenList, getSchemaTableList } from '#/api/infra/codegen';
import { getDataSourceConfigList } from '#/api/infra/data-source-config';
import { reactive, ref, unref } from 'vue';

import { $t } from '@vben/locales';

import { useImportTableFormSchema } from '#/views/infra/codegen/data';

/** 定义组件事件 */
const emit = defineEmits<{
  (e: 'success'): void;
}>();

const dataSourceConfigList = ref<InfraDataSourceConfigApi.InfraDataSourceConfig[]>([]);
const formData = reactive<InfraCodegenApi.CodegenCreateListReq>({
  dataSourceConfigId: undefined,
  tableNames: [], // 已选择的表列表
});
/** 表格实例 */
const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useImportTableFormSchema([]),
  },
  gridOptions: {
    columns: [
      { type: 'checkbox', width: 40 },
      { field: 'name', title: '表名称', minWidth: 200 },
      { field: 'comment', title: '表描述', minWidth: 200 },
    ],
    height: '600px',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          if (formValues.dataSourceConfigId === undefined) {
            if (unref(dataSourceConfigList).length > 0) {
              formValues.dataSourceConfigId = unref(dataSourceConfigList)[0]?.id;
            } else {
              return [];
            }
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
    checkboxChange: ({ records }: { records: InfraCodegenApi.DatabaseTable[] }) => {
      formData.tableNames = records.map((item) => item.name);
    },
  },
});

/** 模态框实例 */
const [Modal, modalApi] = useVbenModal({
  title: '导入表',
  class: 'w-2/3',
  async onConfirm() {
    modalApi.lock();
    // 1. 获取表单值
    if (formData?.dataSourceConfigId === undefined) {
      message.error('请选择数据源');
      return;
    }
    // 2. 校验是否选择了表
    if (formData.tableNames.length === 0) {
      message.error('请选择需要导入的表');
      return;
    }
    // 3. 提交请求
    const hideLoading = message.loading({
      content: '导入中...',
      duration: 0,
      key: 'import_loading',
    });
    try {
      await createCodegenList(formData);
      // 关闭并提示
      await modalApi.close();
      emit('success');
      message.success({
        content: $t('ui.actionMessage.operationSuccess'),
        key: 'action_process_msg',
      });
    } finally {
      hideLoading();
      modalApi.lock(false);
    }
  },
});

/** 获取数据源配置列表 */
async function initDataSourceConfig() {
  try {
    dataSourceConfigList.value = await getDataSourceConfigList();
    gridApi.setState({
      formOptions: {
        schema: useImportTableFormSchema(dataSourceConfigList.value),
      },
    });
  } catch (error) {
    console.error('获取数据源配置失败', error);
  }
}

/** 初始化 */
initDataSourceConfig();
</script>

<template>
  <Modal>
    <Grid />
  </Modal>
</template>
