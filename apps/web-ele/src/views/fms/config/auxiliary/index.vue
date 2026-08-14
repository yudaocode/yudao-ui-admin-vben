<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { FmsAuxiliaryItemApi } from '#/api/fms/config/auxiliary/item';
import type { FmsAuxiliaryTypeApi } from '#/api/fms/config/auxiliary/type';

import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { useAccess } from '@vben/access';
import { DocAlert, confirm, Page, useVbenModal } from '@vben/common-ui';
import { CommonStatusEnum } from '@vben/constants';
import { downloadFileFromBlobPart, isEmpty } from '@vben/utils';

import { ElCard, ElEmpty, ElMessage, ElSwitch, ElTag } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteAuxiliaryItemList,
  exportAuxiliaryItem,
  getAuxiliaryItemPage,
  updateAuxiliaryItemStatus,
} from '#/api/fms/config/auxiliary/item';
import {
  deleteAuxiliaryType,
  getAuxiliaryTypeList,
} from '#/api/fms/config/auxiliary/type';
import { $t } from '#/locales';
import { useFmsStore } from '#/views/fms/store/fms';
import { FMS_AUXILIARY_TYPE } from '#/views/fms/utils/constants';

import { useGridColumns, useGridFormSchema } from './data';
import ImportForm from './modules/import-form.vue';
import ItemForm from './modules/item-form.vue';
import TypeForm from './modules/type-form.vue';

defineOptions({ name: 'FmsAuxiliary' });

const route = useRoute();
const { hasAccessByCodes } = useAccess();
const fmsStore = useFmsStore();

const typeLoading = ref(false); // 类别列表的加载中
const typeList = ref<FmsAuxiliaryTypeApi.AuxiliaryType[]>([]); // 辅助核算类别列表
const currentAuxiliaryType = ref<FmsAuxiliaryTypeApi.AuxiliaryType>(); // 当前辅助核算类别
const checkedIds = ref<number[]>([]); // 选中的项目编号数组
const exportLoading = ref(false); // 导出的加载中
const gridMounted = ref(false); // 表格是否已挂载，避免挂载前触发查询

const accountSetId = computed(() => fmsStore.getAccountSetId); // 当前账套编号
const isInventory = computed(
  () => currentAuxiliaryType.value?.type === FMS_AUXILIARY_TYPE.INVENTORY,
); // 是否存货类别
// 只读账套或无删除权限时，隐藏多选列
const showCheckbox = computed(
  () =>
    fmsStore.isAccountSetWritable &&
    hasAccessByCodes(['fms:config:auxiliary:delete']),
);
// 只读账套或无写权限时，隐藏操作列
const showActions = computed(
  () =>
    fmsStore.isAccountSetWritable &&
    (hasAccessByCodes(['fms:config:auxiliary:update']) ||
      hasAccessByCodes(['fms:config:auxiliary:delete'])),
);

const [TypeFormModal, typeFormModalApi] = useVbenModal({
  connectedComponent: TypeForm,
  destroyOnClose: true,
});
const [ItemFormModal, itemFormModalApi] = useVbenModal({
  connectedComponent: ItemForm,
  destroyOnClose: true,
});
const [ImportFormModal, importFormModalApi] = useVbenModal({
  connectedComponent: ImportForm,
  destroyOnClose: true,
});

/** 刷新项目表格 */
function handleRefresh() {
  checkedIds.value = [];
  if (gridMounted.value) {
    gridApi.query();
  }
}

/** 刷新表格列：规格/单位、多选列、操作列随类别与权限动态显隐 */
function refreshColumns() {
  gridApi.setGridOptions({
    columns: useGridColumns({
      isInventory: isInventory.value,
      showActions: showActions.value,
      showCheckbox: showCheckbox.value,
    }),
  });
}

/** 切换辅助核算类别 */
function handleTypeChange(row?: FmsAuxiliaryTypeApi.AuxiliaryType) {
  currentAuxiliaryType.value = row;
  refreshColumns();
  handleRefresh();
}

/** 查询辅助核算类别列表 */
async function getTypeList() {
  if (!accountSetId.value) {
    typeList.value = [];
    handleTypeChange(undefined);
    return;
  }
  typeLoading.value = true;
  try {
    typeList.value = await getAuxiliaryTypeList(accountSetId.value);
    // 优先保持当前类别，其次定位路由参数指定的类别，最后选中第一条
    const routeAuxiliaryTypeId = Number(route.query.auxiliaryTypeId);
    const nextType =
      typeList.value.find(
        (item) => item.id === currentAuxiliaryType.value?.id,
      ) ||
      typeList.value.find((item) => item.id === routeAuxiliaryTypeId) ||
      typeList.value[0];
    handleTypeChange(nextType);
  } finally {
    typeLoading.value = false;
  }
}

/** 打开类别表单 */
function openTypeForm(row?: FmsAuxiliaryTypeApi.AuxiliaryType) {
  typeFormModalApi.setData(row ?? null).open();
}

/** 删除辅助核算类别 */
async function handleDeleteType(row: FmsAuxiliaryTypeApi.AuxiliaryType) {
  if (!accountSetId.value) return;
  try {
    await deleteAuxiliaryType(accountSetId.value, row.id!);
    ElMessage.success($t('ui.actionMessage.deleteSuccess'));
    await getTypeList();
  } catch {}
}

/** 新增项目 */
function handleCreateItem() {
  if (!currentAuxiliaryType.value) return;
  itemFormModalApi
    .setData({ auxiliaryType: currentAuxiliaryType.value })
    .open();
}

/** 编辑项目 */
function handleEdit(row: FmsAuxiliaryItemApi.AuxiliaryItem) {
  if (!currentAuxiliaryType.value) return;
  itemFormModalApi
    .setData({ auxiliaryType: currentAuxiliaryType.value, row })
    .open();
}

/** 修改辅助核算项目状态 */
async function handleStatusChange(
  checked: boolean | number | string,
  row: FmsAuxiliaryItemApi.AuxiliaryItem,
) {
  const newStatus = checked
    ? CommonStatusEnum.ENABLE
    : CommonStatusEnum.DISABLE;
  const text = newStatus === CommonStatusEnum.ENABLE ? '启用' : '停用';
  try {
    await confirm(`确认要“${text}”“${row.name}”辅助核算项目吗？`);
  } catch {
    return;
  }
  await updateAuxiliaryItemStatus(row.accountSetId!, row.id!, newStatus);
  ElMessage.success($t('ui.actionMessage.operationSuccess'));
  handleRefresh();
}

/** 删除项目 */
async function handleDelete(row: FmsAuxiliaryItemApi.AuxiliaryItem) {
  try {
    await deleteAuxiliaryItemList(row.accountSetId!, [row.id!]);
    ElMessage.success($t('ui.actionMessage.deleteSuccess'));
    handleRefresh();
  } catch {}
}

/** 批量删除项目 */
async function handleDeleteBatch() {
  if (!accountSetId.value || checkedIds.value.length === 0) return;
  try {
    await confirm(
      `确认删除选中的 ${checkedIds.value.length} 个辅助核算项目吗？`,
    );
    await deleteAuxiliaryItemList(accountSetId.value, checkedIds.value);
    checkedIds.value = [];
    ElMessage.success($t('ui.actionMessage.deleteSuccess'));
    handleRefresh();
  } catch {}
}

/** 打开导入弹窗 */
function handleImport() {
  if (!accountSetId.value || !currentAuxiliaryType.value) return;
  importFormModalApi
    .setData({
      accountSetId: accountSetId.value,
      auxiliaryType: currentAuxiliaryType.value,
    })
    .open();
}

/** 导出项目 */
async function handleExport() {
  if (!accountSetId.value || !currentAuxiliaryType.value?.id) return;
  try {
    await confirm('是否确认导出辅助核算项目数据？');
  } catch {
    return;
  }
  exportLoading.value = true;
  try {
    const formValues = await gridApi.formApi.getValues();
    const data = await exportAuxiliaryItem({
      pageNo: 1,
      pageSize: 10,
      accountSetId: accountSetId.value,
      auxiliaryTypeId: currentAuxiliaryType.value.id,
      ...formValues,
    });
    downloadFileFromBlobPart({
      fileName: `${currentAuxiliaryType.value.name}.xlsx`,
      source: data,
    });
  } finally {
    exportLoading.value = false;
  }
}

/** 选中项目 */
function handleRowCheckboxChange({
  records,
}: {
  records: FmsAuxiliaryItemApi.AuxiliaryItem[];
}) {
  checkedIds.value = records.map((item) => item.id!);
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns({
      isInventory: false,
      showActions: true,
      showCheckbox: true,
    }),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          if (!accountSetId.value || !currentAuxiliaryType.value?.id) {
            return { list: [], total: 0 };
          }
          return await getAuxiliaryItemPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            accountSetId: accountSetId.value,
            auxiliaryTypeId: currentAuxiliaryType.value.id,
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
  } as VxeTableGridOptions<FmsAuxiliaryItemApi.AuxiliaryItem>,
  gridEvents: {
    checkboxAll: handleRowCheckboxChange,
    checkboxChange: handleRowCheckboxChange,
  },
});

/** 初始化并监听账套切换 */
watch(
  accountSetId,
  async () => {
    // 先清空旧账套的类别，避免使用新账套编号查询旧类别
    typeList.value = [];
    currentAuxiliaryType.value = undefined;
    await getTypeList();
  },
  { immediate: true },
);

/** 账套写权限变化时，刷新多选列和操作列 */
watch([showCheckbox, showActions], refreshColumns);

onMounted(() => {
  gridMounted.value = true;
  refreshColumns();
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
    <TypeFormModal @success="getTypeList" />
    <ItemFormModal @success="handleRefresh" />
    <ImportFormModal @success="handleRefresh" />

    <div class="flex h-full w-full">
      <!-- 核算类别 -->
      <ElCard
        :body-style="{ height: '100%', overflow: 'auto' }"
        class="mr-4 h-full w-[260px] shrink-0"
      >
        <div class="mb-4 flex items-center justify-between">
          <span class="text-base font-bold">核算类别</span>
          <TableAction
            :actions="[
              {
                label: '新增',
                type: 'primary',
                icon: ACTION_ICON.ADD,
                auth: ['fms:config:auxiliary:create'],
                ifShow: fmsStore.isAccountSetWritable,
                onClick: openTypeForm.bind(null, undefined),
              },
            ]"
          />
        </div>
        <div v-loading="typeLoading">
          <div
            v-for="item in typeList"
            :key="item.id"
            :class="item.id === currentAuxiliaryType?.id ? 'bg-gray-100' : ''"
            class="mb-1 flex cursor-pointer items-center justify-between rounded px-2 py-1.5 hover:bg-gray-100"
            @click="handleTypeChange(item)"
          >
            <div class="flex min-w-0 items-center">
              <span class="truncate">{{ item.name }}</span>
              <ElTag v-if="!item.systemPreset" class="ml-1.5" size="small">
                自定义
              </ElTag>
            </div>
            <div
              v-if="!item.systemPreset && fmsStore.isAccountSetWritable"
              class="ml-1 flex shrink-0"
              @click.stop
            >
              <TableAction
                :actions="[
                  {
                    icon: ACTION_ICON.EDIT,
                    type: 'primary',
                    link: true,
                    tooltip: '编辑',
                    auth: ['fms:config:auxiliary:update'],
                    onClick: () => openTypeForm(item),
                  },
                  {
                    icon: ACTION_ICON.DELETE,
                    type: 'danger',
                    link: true,
                    tooltip: '删除',
                    auth: ['fms:config:auxiliary:delete'],
                    popConfirm: {
                      title: `确认删除辅助核算类别“${item.name}”吗？`,
                      confirm: () => handleDeleteType(item),
                    },
                  },
                ]"
              />
            </div>
          </div>
          <ElEmpty
            v-if="!typeLoading && typeList.length === 0"
            :image-size="60"
          />
        </div>
      </ElCard>

      <!-- 核算项目 -->
      <div class="min-w-0 flex-1">
        <Grid table-title="核算项目">
          <template #toolbar-tools>
            <TableAction
              :actions="[
                {
                  label: '新增项目',
                  type: 'primary',
                  icon: ACTION_ICON.ADD,
                  auth: ['fms:config:auxiliary:create'],
                  disabled: !currentAuxiliaryType,
                  ifShow: fmsStore.isAccountSetWritable,
                  onClick: handleCreateItem,
                },
                {
                  label: '导入',
                  type: 'primary',
                  icon: ACTION_ICON.UPLOAD,
                  auth: ['fms:config:auxiliary:import'],
                  disabled: !currentAuxiliaryType,
                  ifShow: fmsStore.isAccountSetWritable,
                  onClick: handleImport,
                },
                {
                  label: '导出',
                  type: 'primary',
                  icon: ACTION_ICON.DOWNLOAD,
                  auth: ['fms:config:auxiliary:export'],
                  disabled: !currentAuxiliaryType,
                  loading: exportLoading,
                  onClick: handleExport,
                },
                {
                  label: '批量删除',
                  type: 'danger',
                  icon: ACTION_ICON.DELETE,
                  auth: ['fms:config:auxiliary:delete'],
                  disabled: isEmpty(checkedIds),
                  ifShow: fmsStore.isAccountSetWritable,
                  onClick: handleDeleteBatch,
                },
              ]"
            />
          </template>
          <template #status="{ row }">
            <ElSwitch
              :model-value="row.status === CommonStatusEnum.ENABLE"
              :disabled="
                !fmsStore.isAccountSetWritable ||
                !hasAccessByCodes(['fms:config:auxiliary:update'])
              "
              @change="(checked) => handleStatusChange(checked, row)"
            />
          </template>
          <template #actions="{ row }">
            <TableAction
              :actions="[
                {
                  label: $t('common.edit'),
                  type: 'primary',
                  link: true,
                  icon: ACTION_ICON.EDIT,
                  auth: ['fms:config:auxiliary:update'],
                  onClick: handleEdit.bind(null, row),
                },
                {
                  label: $t('common.delete'),
                  type: 'danger',
                  link: true,
                  icon: ACTION_ICON.DELETE,
                  auth: ['fms:config:auxiliary:delete'],
                  popConfirm: {
                    title: `确认删除辅助核算项目“${row.code} ${row.name}”吗？`,
                    confirm: handleDelete.bind(null, row),
                  },
                },
              ]"
            />
          </template>
        </Grid>
      </div>
    </div>
  </Page>
</template>
