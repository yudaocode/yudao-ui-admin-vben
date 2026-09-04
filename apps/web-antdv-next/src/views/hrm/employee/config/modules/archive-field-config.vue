<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmEmployeeConfigApi } from '#/api/hrm/employee/config';

import { onMounted, ref } from 'vue';

import { message, Switch } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getEmployeeArchiveFieldConfigList,
  saveEmployeeArchiveFieldConfig,
} from '#/api/hrm/employee/config';

import { useArchiveFieldGridColumns } from '../data';

defineOptions({ name: 'HrmEmployeeArchiveFieldConfig' });

const list = ref<HrmEmployeeConfigApi.FieldConfig[]>([]);

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    border: true,
    columns: useArchiveFieldGridColumns(),
    data: [],
    minHeight: 240,
    pagerConfig: { enabled: false },
    rowConfig: { keyField: 'name', isHover: true },
    toolbarConfig: { enabled: false },
  } as VxeTableGridOptions<HrmEmployeeConfigApi.FieldConfig>,
});

async function getList() {
  gridApi.setLoading(true);
  try {
    list.value = await getEmployeeArchiveFieldConfigList();
    await gridApi.grid.reloadData(list.value);
  } finally {
    gridApi.setLoading(false);
  }
}

function handleVisibleChange(field: HrmEmployeeConfigApi.FieldConfig) {
  if (!field.visible) field.editable = false;
}

function handleEditableChange(field: HrmEmployeeConfigApi.FieldConfig) {
  if (field.editable) field.visible = true;
}

async function submitForm() {
  await saveEmployeeArchiveFieldConfig({
    fields: list.value.map(({ name, visible, editable }) => ({
      name,
      visible,
      editable,
    })),
  });
  message.success('保存成功');
  await getList();
}

onMounted(getList);
defineExpose({ submitForm });
</script>

<template>
  <Grid class="w-full">
    <template #visible="{ row }">
      <Switch
        v-model:checked="row.visible"
        :disabled="row.visibleLocked"
        @change="handleVisibleChange(row)"
      />
    </template>
    <template #editable="{ row }">
      <Switch
        v-model:checked="row.editable"
        :disabled="!row.visible || row.editableLocked"
        @change="handleEditableChange(row)"
      />
    </template>
  </Grid>
</template>
