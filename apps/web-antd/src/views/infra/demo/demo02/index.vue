<script lang="ts" setup>
import type { OnActionClickParams, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { Demo02CategoryApi } from '#/api/infra/demo/demo02';

import Form from './modules/form.vue';
import { Page, useVbenModal } from '@vben/common-ui';
import { Download, Plus } from '@vben/icons';
import { Button, message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteDemo02Category, exportDemo02Category, getDemo02CategoryList } from '#/api/infra/demo/demo02';
import { $t } from '#/locales';
import { downloadByData } from '#/utils/download';
import { h, ref } from 'vue';

import { useGridColumns, useGridFormSchema } from './data';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

/** 切换树形展开/收缩状态 */
const isExpanded = ref(true);
function toggleExpand() {
  isExpanded.value = !isExpanded.value;
  gridApi.grid.setAllTreeExpand(isExpanded.value);
}

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

/** 导出表格 */
async function onExport() {
  const data = await exportDemo02Category(await gridApi.formApi.getValues());
  downloadByData(data, '示例分类.xls');
}

/** 创建示例分类 */
function onCreate() {
  formModalApi.setData(null).open();
}

/** 编辑示例分类 */
function onEdit(row: Demo02CategoryApi.Demo02Category) {
  formModalApi.setData(row).open();
}

/** 新增下级示例分类 */
function onAppend(row: Demo02CategoryApi.Demo02Category) {
  formModalApi.setData({ parentId: row.id }).open();
}

/** 删除示例分类 */
async function onDelete(row: Demo02CategoryApi.Demo02Category) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.id]),
    duration: 0,
    key: 'action_process_msg',
  });
  try {
    await deleteDemo02Category(row.id as number);
    message.success({
      content: $t('ui.actionMessage.deleteSuccess', [row.id]),
      key: 'action_process_msg',
    });
    onRefresh();
  } catch {
    hideLoading();
  }
}

/** 表格操作按钮的回调函数 */
function onActionClick({ code, row }: OnActionClickParams<Demo02CategoryApi.Demo02Category>) {
  switch (code) {
    case 'append': {
      onAppend(row);
      break;
    }
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'edit': {
      onEdit(row);
      break;
    }
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(onActionClick),
    height: 'auto',
    treeConfig: {
      parentField: 'parentId',
      rowField: 'id',
      transform: true,
      expandAll: true,
      reserve: true,
    },
    pagerConfig: {
      enabled: false,
    },
    proxyConfig: {
      ajax: {
        query: async (_, formValues) => {
          return await getDemo02CategoryList(formValues);
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: {
      refresh: { code: 'query' },
      search: true,
    },
  } as VxeTableGridOptions<Demo02CategoryApi.Demo02Category>,
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="onRefresh" />

    <Grid table-title="示例分类列表">
      <template #toolbar-tools>
        <Button @click="toggleExpand" class="mr-2">
          {{ isExpanded ? '收缩' : '展开' }}
        </Button>
        <Button :icon="h(Plus)" type="primary" @click="onCreate" v-access:code="['infra:demo02-category:create']">
          {{ $t('ui.actionTitle.create', ['示例分类']) }}
        </Button>
        <Button
          :icon="h(Download)"
          type="primary"
          class="ml-2"
          @click="onExport"
          v-access:code="['infra:demo02-category:export']"
        >
          {{ $t('ui.actionTitle.export') }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
