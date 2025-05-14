<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { BpmFormApi } from '#/api/bpm/form';

import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';
import { $t } from '@vben/locales';

import { Button, message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteForm, getFormDetail, getFormPage } from '#/api/bpm/form';
import { DocAlert } from '#/components/doc-alert';
import { router } from '#/router';
import { setConfAndFields2 } from '#/utils';

import { useGridColumns, useGridFormSchema } from './data';

defineOptions({ name: 'BpmForm' });

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getFormPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
    },
    toolbarConfig: {
      refresh: { code: 'query' },
      search: true,
    },
    cellConfig: {
      height: 64,
    },
  } as VxeTableGridOptions<BpmFormApi.FormVO>,
});

/** 表格操作按钮的回调函数 */
function onActionClick({ code, row }: OnActionClickParams<BpmFormApi.FormVO>) {
  switch (code) {
    case 'copy': {
      onCopy(row);
      break;
    }
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'detail': {
      onDetail(row);
      break;
    }
    case 'edit': {
      onEdit(row);
      break;
    }
  }
}
/** 复制 */
function onCopy(row: BpmFormApi.FormVO) {
  router.push({
    name: 'BpmFormEditor',
    query: {
      copyId: row.id,
      type: 'copy',
    },
  });
}

/** 删除 */
async function onDelete(row: BpmFormApi.FormVO) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.id]),
    duration: 0,
    key: 'action_process_msg',
  });
  try {
    await deleteForm(row.id as number);
    message.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    onRefresh();
  } finally {
    hideLoading();
  }
}

/** 详情 */
const formConfig = ref<any>({});
async function onDetail(row: BpmFormApi.FormVO) {
  formConfig.value = await getFormDetail(row.id as number);

  setConfAndFields2(
    formConfig.value,
    formConfig.value.conf,
    formConfig.value.fields,
  );
  detailModalApi.open();
}

/** 编辑 */
function onEdit(row: BpmFormApi.FormVO) {
  console.warn(row);
  router.push({
    name: 'BpmFormEditor',
    query: {
      id: row.id,
      type: 'edit',
    },
  });
}

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

/** 新增 */
function onCreate() {
  router.push({
    name: 'BpmFormEditor',
    query: {
      type: 'create',
    },
  });
}

/** 详情弹窗 */
const [DetailModal, detailModalApi] = useVbenModal({
  destroyOnClose: true,
  footer: false,
});

/** 检测路由参数 */
const route = useRoute();
watch(
  () => route.query.refresh,
  (val) => {
    if (val === '1') {
      onRefresh();
    }
  },
  { immediate: true },
);
</script>

<template>
  <Page auto-content-height>
    <DocAlert
      title="审批接入（流程表单）"
      url="https://doc.iocoder.cn/bpm/use-bpm-form/"
    />
    <FormModal @success="onRefresh" />
    <Grid table-title="流程表单">
      <template #toolbar-tools>
        <Button type="primary" @click="onCreate">
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', ['流程表单']) }}
        </Button>
      </template>

      <!-- 摘要 -->
      <template #slot-summary="{ row }">
        <div
          class="flex flex-col py-2"
          v-if="
            row.processInstance.summary &&
            row.processInstance.summary.length > 0
          "
        >
          <div
            v-for="(item, index) in row.processInstance.summary"
            :key="index"
          >
            <span class="text-gray-500">
              {{ item.key }} : {{ item.value }}
            </span>
          </div>
        </div>
        <div v-else>-</div>
      </template>
    </Grid>

    <DetailModal
      title="流程表单详情"
      class="w-[800px]"
      :body-style="{
        maxHeight: '100px',
      }"
    >
      <div class="mx-4">
        <form-create :option="formConfig.option" :rule="formConfig.rule" />
      </div>
    </DetailModal>
  </Page>
</template>
