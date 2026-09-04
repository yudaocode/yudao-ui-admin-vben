<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { onMounted, ref } from 'vue';

import { ElMessage, ElSwitch } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getEmployeeCreateFieldConfigList,
  saveEmployeeCreateFieldConfig,
} from '#/api/hrm/employee/config';
import { HrmEmployeeEntryStatus } from '#/views/hrm/utils/constants';

import { useCreateFieldGridColumns } from '../data';

defineOptions({ name: 'HrmEmployeeCreateFieldConfig' });

const list = ref<any[]>([]);

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    border: true,
    columns: useCreateFieldGridColumns(),
    data: [],
    minHeight: 240,
    pagerConfig: { enabled: false },
    rowConfig: { keyField: 'name', isHover: true },
    toolbarConfig: { enabled: false },
  } as VxeTableGridOptions<any>,
});

async function getList() {
  gridApi.setLoading(true);
  try {
    const [activeFields, pendingEntryFields] = await Promise.all([
      getEmployeeCreateFieldConfigList(HrmEmployeeEntryStatus.ACTIVE),
      getEmployeeCreateFieldConfigList(HrmEmployeeEntryStatus.PENDING_ENTRY),
    ]);
    const pendingMap = new Map(
      pendingEntryFields.map((field) => [field.name, field]),
    );
    list.value = activeFields.map((field) => {
      const pending = pendingMap.get(field.name)!;
      return {
        ...field,
        activeVisible: field.visible,
        activeVisibleLocked: field.visibleLocked,
        pendingEntryVisible: pending.visible,
        pendingEntryVisibleLocked: pending.visibleLocked,
      };
    });
    await gridApi.grid.reloadData(list.value);
  } finally {
    gridApi.setLoading(false);
  }
}

function getVisibleFields(field: 'activeVisible' | 'pendingEntryVisible') {
  return list.value.map((item) => ({ name: item.name, visible: item[field] }));
}

async function submitForm() {
  // 串行保存，避免并行写配置触发后端偶发「系统异常」
  await saveEmployeeCreateFieldConfig({
    entryStatus: HrmEmployeeEntryStatus.ACTIVE,
    fields: getVisibleFields('activeVisible'),
  });
  await saveEmployeeCreateFieldConfig({
    entryStatus: HrmEmployeeEntryStatus.PENDING_ENTRY,
    fields: getVisibleFields('pendingEntryVisible'),
  });
  ElMessage.success('保存成功');
  await getList();
}

onMounted(getList);
defineExpose({ submitForm });
</script>

<template>
  <Grid class="w-full">
    <template #activeVisible="{ row }">
      <ElSwitch
        v-model="row.activeVisible"
        :disabled="row.activeVisibleLocked"
      />
    </template>
    <template #pendingEntryVisible="{ row }">
      <ElSwitch
        v-model="row.pendingEntryVisible"
        :disabled="row.pendingEntryVisibleLocked"
      />
    </template>
  </Grid>
</template>
