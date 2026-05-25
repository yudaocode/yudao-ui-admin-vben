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
import { getSimpleRoleList } from '#/api/system/role';
import { $t } from '#/locales';

import { useConfigGridColumns } from '../../record/data';
import ConfigForm from './config-form.vue';

const list = ref<MesProAndonConfigApi.AndonConfig[]>([]); // 安灯配置列表（已回填处置角色名称）

const [ConfigFormModal, configFormModalApi] = useVbenModal({
  connectedComponent: ConfigForm,
  destroyOnClose: true,
});

// TODO @AI：这个格式，是不是有问题？应该要换行？看看别的模块也是；
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

/** 加载安灯配置列表，并通过角色精简列表回填处置角色名称 */
// TODO @AI：这里需要 getAndonConfigList、getSimpleRoleList 么？通过 data.ts 里处理，是不是更主流？？？
async function getList() {
  gridApi.setLoading(true);
  try {
    const [configList, roleList] = await Promise.all([
      getAndonConfigList(),
      getSimpleRoleList(),
    ]);
    const roleMap = new Map(roleList.map((role) => [role.id!, role.name!]));
    list.value = (configList || []).map((item) => ({
      ...item,
      handlerRoleName: item.handlerRoleId
        ? roleMap.get(item.handlerRoleId)
        : undefined,
    }));
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
