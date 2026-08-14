<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { FmsSubjectApi } from '#/api/fms/config/subject';

import { computed, nextTick, onMounted, ref, watch } from 'vue';

import { useAccess } from '@vben/access';
import { confirm, DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { downloadFileFromBlobPart } from '@vben/utils';

import { Button, Dropdown, Menu, message, Select, Switch } from 'antdv-next';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteSubjectList,
  exportSubject,
  getSubjectList,
  updateSubjectStatus,
} from '#/api/fms/config/subject';
import { DictTag } from '#/components/dict-tag';
import { useFmsStore } from '#/views/fms/store/fms';
import {
  FMS_SUBJECT_STATUS,
  FMS_SUBJECT_TYPE,
} from '#/views/fms/utils/constants';

import { useGridColumns } from './data';
import Form from './modules/form.vue';
import ImportForm from './modules/import-form.vue';

defineOptions({ name: 'FmsSubject' });

const subjectTypeOptions = getDictOptions(DICT_TYPE.FMS_SUBJECT_TYPE, 'number');

const { hasAccessByCodes } = useAccess();
const fmsStore = useFmsStore(); // FMS 状态

const accountSetId = computed(() => fmsStore.getAccountSetId); // 当前账套编号
const subjectType = ref<number>(FMS_SUBJECT_TYPE.ASSET); // 当前科目类型
const subjectList = ref<FmsSubjectApi.Subject[]>([]); // 科目平铺列表
const checkedIds = ref<number[]>([]); // 选中的科目编号
const batchLoading = ref(false); // 批量操作的加载中
const exportLoading = ref(false); // 导出的加载中

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});
const [ImportModal, importModalApi] = useVbenModal({
  connectedComponent: ImportForm,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 新增科目 */
function handleCreate() {
  formModalApi
    .setData({ type: 'create', subjectType: subjectType.value })
    .open();
}

/** 编辑科目 */
function handleEdit(row: FmsSubjectApi.Subject) {
  const parent = subjectList.value.find((item) => item.id === row.parentId);
  formModalApi
    .setData({ type: 'update', subjectType: subjectType.value, row, parent })
    .open();
}

/** 新建下级科目 */
function handleAppend(row: FmsSubjectApi.Subject) {
  // 附带当前下级科目，用于建议下级科目编码
  const parent = {
    ...row,
    children: subjectList.value.filter((item) => item.parentId === row.id),
  };
  formModalApi
    .setData({ type: 'create', subjectType: subjectType.value, parent })
    .open();
}

/** 科目导入 */
function handleImport() {
  if (!accountSetId.value) return;
  importModalApi.setData({ accountSetId: accountSetId.value }).open();
}

/** 修改科目状态 */
async function handleStatusChange(
  checked: boolean,
  row: FmsSubjectApi.Subject,
) {
  if (!accountSetId.value) return;
  const status = checked
    ? FMS_SUBJECT_STATUS.ENABLED
    : FMS_SUBJECT_STATUS.DISABLED;
  const text = checked ? '启用' : '禁用';
  try {
    await confirm(`确认要${text}“${row.code} ${row.name}”科目吗？`);
  } catch {
    return;
  }
  await updateSubjectStatus({
    accountSetId: accountSetId.value,
    ids: [row.id!],
    status,
  });
  handleRefresh();
}

/** 删除科目 */
async function handleDelete(row: FmsSubjectApi.Subject) {
  if (!accountSetId.value) return;
  try {
    await confirm(`确认删除科目“${row.code} ${row.name}”吗？`);
    await deleteSubjectList(accountSetId.value, [row.id!]);
    message.success('删除成功');
    handleRefresh();
  } catch {}
}

/** 批量修改科目状态 */
async function handleBatchStatus(status: number) {
  if (!accountSetId.value || checkedIds.value.length === 0) return;
  const text = status === FMS_SUBJECT_STATUS.ENABLED ? '启用' : '禁用';
  try {
    await confirm(`确认要${text}选中的 ${checkedIds.value.length} 个科目吗？`);
    batchLoading.value = true;
    await updateSubjectStatus({
      accountSetId: accountSetId.value,
      ids: checkedIds.value,
      status,
    });
    message.success('更新成功');
    handleRefresh();
  } catch {
  } finally {
    batchLoading.value = false;
  }
}

/** 批量删除科目 */
async function handleBatchDelete() {
  if (!accountSetId.value || checkedIds.value.length === 0) return;
  try {
    await confirm(`确认删除选中的 ${checkedIds.value.length} 个科目吗？`);
    batchLoading.value = true;
    await deleteSubjectList(accountSetId.value, checkedIds.value);
    message.success('删除成功');
    handleRefresh();
  } catch {
  } finally {
    batchLoading.value = false;
  }
}

/** 导出科目 */
async function handleExport() {
  if (!accountSetId.value || exportLoading.value) return;
  try {
    await confirm('是否确认导出科目数据？');
  } catch {
    return;
  }
  exportLoading.value = true;
  try {
    const data = await exportSubject(accountSetId.value, subjectType.value);
    downloadFileFromBlobPart({ fileName: '科目设置.xlsx', source: data });
  } finally {
    exportLoading.value = false;
  }
}

/** 批量操作菜单 */
function getBatchDropDownActions() {
  const actions: Array<{
    danger?: boolean;
    label: string;
    onClick?: () => void;
  }> = [];
  if (hasAccessByCodes(['fms:config:subject:update'])) {
    actions.push(
      {
        label: '批量启用',
        onClick: () => handleBatchStatus(FMS_SUBJECT_STATUS.ENABLED),
      },
      {
        label: '批量禁用',
        onClick: () => handleBatchStatus(FMS_SUBJECT_STATUS.DISABLED),
      },
    );
  }
  if (hasAccessByCodes(['fms:config:subject:delete'])) {
    actions.push({
      label: '批量删除',
      danger: true,
      onClick: handleBatchDelete,
    });
  }
  return actions;
}

/** 是否展示批量操作 */
const hasBatchPermission = computed(
  () =>
    hasAccessByCodes(['fms:config:subject:update']) ||
    hasAccessByCodes(['fms:config:subject:delete']),
);

/** 记录表格选中项 */
function handleRowCheckboxChange({
  records,
}: {
  records: FmsSubjectApi.Subject[];
}) {
  checkedIds.value = records.map((item) => item.id!);
}

/** 只读账套隐藏选择列 */
async function applyCheckboxVisible(writable: boolean) {
  await nextTick();
  const grid = gridApi.grid;
  if (!grid?.getColumns) return;
  const column = grid
    .getColumns()
    .find((item) => (item as { type?: string }).type === 'checkbox');
  if (!column) return;
  if (writable) {
    await grid.showColumn(column);
  } else {
    await grid.hideColumn(column);
    checkedIds.value = [];
  }
}

onMounted(() => applyCheckboxVisible(fmsStore.isAccountSetWritable));
watch(() => fmsStore.isAccountSetWritable, applyCheckboxVisible);
watch(accountSetId, () => handleRefresh());
watch(subjectType, () => handleRefresh());

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    pagerConfig: {
      enabled: false,
    },
    proxyConfig: {
      ajax: {
        query: async () => {
          if (!accountSetId.value) {
            subjectList.value = [];
            return [];
          }
          const list = await getSubjectList(
            accountSetId.value,
            subjectType.value,
          );
          subjectList.value = list;
          checkedIds.value = [];
          return list;
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
    },
    treeConfig: {
      parentField: 'parentId',
      rowField: 'id',
      transform: true,
      expandAll: true,
      reserve: true,
    },
  } as VxeTableGridOptions<FmsSubjectApi.Subject>,
  gridEvents: {
    checkboxAll: handleRowCheckboxChange,
    checkboxChange: handleRowCheckboxChange,
  },
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【设置】币别、科目、辅助核算、初始余额"
        url="https://doc.iocoder.cn/fms/config/accounting/"
      />
    </template>
    <FormModal @success="handleRefresh" />
    <ImportModal @success="handleRefresh" />

    <Grid table-title="科目列表">
      <template #toolbar-actions>
        <Select
          v-model:value="subjectType"
          :options="subjectTypeOptions"
          class="w-[240px]"
        />
      </template>
      <template #toolbar-tools>
        <div class="flex shrink-0 flex-nowrap items-center gap-2">
          <TableAction
            :actions="[
              {
                label: '新增',
                type: 'primary',
                icon: ACTION_ICON.ADD,
                auth: ['fms:config:subject:create'],
                ifShow: () => fmsStore.isAccountSetWritable,
                onClick: handleCreate,
              },
              {
                label: '导入',
                type: 'primary',
                icon: ACTION_ICON.UPLOAD,
                auth: ['fms:config:subject:import'],
                ifShow: () => fmsStore.isAccountSetWritable,
                onClick: handleImport,
              },
              {
                label: '导出',
                type: 'primary',
                icon: ACTION_ICON.DOWNLOAD,
                auth: ['fms:config:subject:export'],
                loading: exportLoading,
                onClick: handleExport,
              },
            ]"
          />
          <Dropdown
            v-if="fmsStore.isAccountSetWritable && hasBatchPermission"
            :disabled="checkedIds.length === 0"
          >
            <Button :disabled="checkedIds.length === 0" :loading="batchLoading">
              批量操作
              <span class="icon-[ep--arrow-down] ml-1"></span>
            </Button>
            <template #popupRender>
              <Menu>
                <Menu.Item
                  v-for="action in getBatchDropDownActions()"
                  :key="action.label"
                  :danger="action.danger"
                  @click="action.onClick?.()"
                >
                  {{ action.label }}
                </Menu.Item>
              </Menu>
            </template>
          </Dropdown>
        </div>
      </template>
      <template #category="{ row }">
        <DictTag
          :type="DICT_TYPE.FMS_SUBJECT_CATEGORY"
          :value="`${row.type}-${row.category}`"
        />
      </template>
      <template #status="{ row }">
        <Switch
          :checked="row.status === FMS_SUBJECT_STATUS.ENABLED"
          :disabled="
            !fmsStore.isAccountSetWritable ||
            !hasAccessByCodes(['fms:config:subject:update'])
          "
          @change="(checked) => handleStatusChange(Boolean(checked), row)"
        />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '编辑',
              type: 'link',
              auth: ['fms:config:subject:update'],
              ifShow: () => fmsStore.isAccountSetWritable,
              onClick: handleEdit.bind(null, row),
            },
            {
              label: '新建下级',
              type: 'link',
              auth: ['fms:config:subject:create'],
              ifShow: () => fmsStore.isAccountSetWritable,
              onClick: handleAppend.bind(null, row),
            },
            {
              label: '删除',
              type: 'link',
              danger: true,
              auth: ['fms:config:subject:delete'],
              ifShow: () => fmsStore.isAccountSetWritable,
              onClick: handleDelete.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
