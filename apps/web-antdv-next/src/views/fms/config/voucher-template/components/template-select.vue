<script lang="ts" setup>
import type { FmsVoucherTemplateApi } from '#/api/fms/config/voucher-template';
import type { FmsVoucherTemplateCategoryApi } from '#/api/fms/config/voucher-template-category';

import { computed, ref } from 'vue';

import { useAccess } from '@vben/access';
import { confirm } from '@vben/common-ui';

import { Button, message, Modal, Select, Table } from 'antdv-next';

import {
  deleteVoucherTemplate,
  getVoucherTemplateSimpleList,
} from '#/api/fms/config/voucher-template';
import { getVoucherTemplateCategorySimpleList } from '#/api/fms/config/voucher-template-category';
import { $t } from '#/locales';
import { useFmsStore } from '#/views/fms/store/fms';

defineOptions({ name: 'FmsVoucherTemplateSelect' });

const emit = defineEmits<{
  select: [template: FmsVoucherTemplateApi.VoucherTemplate];
}>();

const { hasAccessByCodes } = useAccess();
const fmsStore = useFmsStore(); // FMS Store

const dialogVisible = ref(false); // 弹窗的是否展示
const loading = ref(false); // 列表的加载中
const accountSetId = ref<number>(); // 当前账套编号
const categoryId = ref<number>(); // 模板分类编号
const categories = ref<FmsVoucherTemplateCategoryApi.VoucherTemplateCategory[]>(
  [],
); // 模板分类列表
/** 模板分类下拉选项 */
const categoryOptions = computed(() =>
  categories.value.map((item) => ({ label: item.name, value: item.id! })),
);
const list = ref<FmsVoucherTemplateApi.VoucherTemplate[]>([]); // 凭证模板列表
const filteredList = computed(() =>
  categoryId.value
    ? list.value.filter((item) => item.categoryId === categoryId.value)
    : list.value,
); // 按分类过滤后的凭证模板列表

/** 凭证模板表格列 */
const templateColumns = [
  { title: '分类', dataIndex: 'categoryName', ellipsis: true },
  { title: '模板名称', dataIndex: 'name', ellipsis: true },
  { title: '分录数', dataIndex: 'entries', align: 'center' as const, width: 90 },
  { title: '操作', key: 'action', align: 'center' as const, width: 130 },
];

/** 打开弹窗 */
async function open(id: number) {
  accountSetId.value = id;
  categoryId.value = undefined;
  dialogVisible.value = true;
  await getList();
}

/** 查询凭证模板和分类 */
async function getList() {
  if (!accountSetId.value) return;
  loading.value = true;
  try {
    [categories.value, list.value] = await Promise.all([
      getVoucherTemplateCategorySimpleList(accountSetId.value),
      getVoucherTemplateSimpleList(accountSetId.value),
    ]);
  } finally {
    loading.value = false;
  }
}

/** 套用凭证模板 */
function selectTemplate(row: FmsVoucherTemplateApi.VoucherTemplate) {
  emit('select', row);
  dialogVisible.value = false;
}

/** 删除凭证模板 */
async function deleteTemplate(row: FmsVoucherTemplateApi.VoucherTemplate) {
  if (!accountSetId.value) return;
  try {
    await confirm(`确认删除凭证模板“${row.name}”吗？`);
    await deleteVoucherTemplate(accountSetId.value, row.id!);
    message.success($t('ui.actionMessage.deleteSuccess'));
    await getList();
  } catch {
    // 取消删除
  }
}

defineExpose({ open });
</script>

<template>
  <Modal
    v-model:open="dialogVisible"
    :footer="null"
    title="凭证模板库"
    width="680px"
    destroy-on-close
  >
    <div class="mb-3 flex items-center gap-2">
      <span class="shrink-0">模板分类</span>
      <Select
        v-model:value="categoryId"
        allow-clear
        class="!w-[200px]"
        :options="categoryOptions"
        placeholder="全部分类"
      />
    </div>
    <Table
      bordered
      :columns="templateColumns"
      :custom-row="
        (record: FmsVoucherTemplateApi.VoucherTemplate) => ({
          onDblclick: () => selectTemplate(record),
        })
      "
      :data-source="filteredList"
      :loading="loading"
      :pagination="false"
      row-key="id"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'entries'">
          {{ record.entries.length }}
        </template>
        <template v-else-if="column.key === 'action'">
          <Button type="link" @click="selectTemplate(record as FmsVoucherTemplateApi.VoucherTemplate)">套用</Button>
          <Button
            v-if="
              fmsStore.isAccountSetWritable &&
              hasAccessByCodes(['fms:config:voucher-template:delete'])
            "
            danger
            type="link"
            @click="deleteTemplate(record as FmsVoucherTemplateApi.VoucherTemplate)"
          >
            删除
          </Button>
        </template>
      </template>
    </Table>
    <div class="mt-2.5 text-xs text-gray-400">
      双击模板可直接套用到当前凭证
    </div>
  </Modal>
</template>
