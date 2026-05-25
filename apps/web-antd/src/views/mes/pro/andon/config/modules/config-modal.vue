<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesProAndonConfigApi } from '#/api/mes/pro/andon/config';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteAndonConfig,
  getAndonConfigList,
} from '#/api/mes/pro/andon/config';
import { $t } from '#/locales';

import { useConfigGridColumns } from '../../record/data';
import ConfigForm from './config-form.vue';

const list = ref<MesProAndonConfigApi.AndonConfig[]>([]);

const [ConfigFormModal, configFormModalApi] = useVbenModal({
  connectedComponent: ConfigForm,
  destroyOnClose: true,
});

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    autoResize: true,
    border: true,
    columns: useConfigGridColumns(),
    data: list.value,
    minHeight: 320,
    pagerConfig: { enabled: false },
    rowConfig: { isHover: true, keyField: 'id' },
    showOverflow: true,
    toolbarConfig: { enabled: false },
  } as VxeTableGridOptions<MesProAndonConfigApi.AndonConfig>,
});

/** 加载安灯配置列表 */
async function getList() {
  gridApi.setLoading(true);
  try {
    list.value = (await getAndonConfigList()) || [];
    gridApi.setGridOptions({ data: list.value });
  } finally {
    gridApi.setLoading(false);
  }
}

/** 新增配置 */
function handleCreate() {
  configFormModalApi.setData({}).open();
}

/** 编辑配置 */
function handleEdit(row: MesProAndonConfigApi.AndonConfig) {
  configFormModalApi.setData({ id: row.id }).open();
}

/** 删除配置 */
async function handleDelete(row: MesProAndonConfigApi.AndonConfig) {
  await deleteAndonConfig(row.id!);
  message.success($t('ui.actionMessage.deleteSuccess', ['安灯配置']));
  await getList();
}

const [Modal, modalApi] = useVbenModal({
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    await getList();
  },
});

defineExpose({ open: () => modalApi.open() });
</script>

<template>
  <Modal :show-cancel-button="false" :show-confirm-button="false" class="w-3/5" title="安灯设置">
    <ConfigFormModal @success="getList" />
    <div class="mb-3 flex items-center justify-start">
      <TableAction
        :actions="[
          {
            label: $t('ui.actionTitle.create', ['安灯配置']),
            type: 'primary',
            auth: ['mes:pro-andon-config:create'],
            onClick: handleCreate,
          },
        ]"
      />
    </div>
    <Grid class="w-full" table-title="安灯配置">
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.edit'),
              type: 'link',
              auth: ['mes:pro-andon-config:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              auth: ['mes:pro-andon-config:delete'],
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', ['安灯配置']),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Modal>
</template>
