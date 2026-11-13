<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AiSkillApi } from '#/api/ai/skill';

import { useRouter } from 'vue-router';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';

import { message, Tag } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteSkill, getSkillPage } from '#/api/ai/skill';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

/** AI 技能列表 */
defineOptions({ name: 'AiSkill' });

const router = useRouter();

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 创建技能 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 编辑技能 */
function handleEdit(row: AiSkillApi.Skill) {
  formModalApi.setData(row).open();
}

/** 打开文件管理 */
function handleFile(row: AiSkillApi.Skill) {
  router.push({ name: 'AiSkillFile', params: { skillId: row.id } });
}

/** 删除的二次确认：被角色引用时，提示受影响的角色 */
function getDeleteConfirmTitle(row: AiSkillApi.Skill) {
  const roleTip = row.roleNames?.length
    ? `被角色【${row.roleNames.join('、')}】引用，`
    : '';
  return `${roleTip}删除技能将同时删除其全部文件，是否确认删除？`;
}

/** 删除技能 */
async function handleDelete(row: AiSkillApi.Skill) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    duration: 0,
  });
  try {
    await deleteSkill(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    handleRefresh();
  } finally {
    hideLoading();
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getSkillPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<AiSkillApi.Skill>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert title="AI 手册" url="https://doc.iocoder.cn/ai/build/" />
    </template>
    <FormModal @success="handleRefresh" />
    <Grid table-title="技能列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['技能']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['ai:skill:create'],
              onClick: handleCreate,
            },
          ]"
        />
      </template>
      <template #roleNames="{ row }">
        <template v-if="row.roleNames?.length">
          <Tag v-for="roleName in row.roleNames" :key="roleName">
            {{ roleName }}
          </Tag>
        </template>
        <span v-else>-</span>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '文件管理',
              type: 'link',
              icon: 'lucide:folder-open',
              auth: ['ai:skill:query'],
              onClick: handleFile.bind(null, row),
            },
            {
              label: $t('common.edit'),
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['ai:skill:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['ai:skill:delete'],
              popConfirm: {
                title: getDeleteConfirmTitle(row),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
