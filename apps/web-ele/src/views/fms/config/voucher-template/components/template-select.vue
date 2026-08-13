<script lang="ts" setup>
import type { FmsVoucherTemplateApi } from '#/api/fms/config/voucher-template';
import type { FmsVoucherTemplateCategoryApi } from '#/api/fms/config/voucher-template-category';

import { computed, ref } from 'vue';

import { useAccess } from '@vben/access';
import { confirm } from '@vben/common-ui';

import {
  ElButton,
  ElDialog,
  ElMessage,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
} from 'element-plus';

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
const list = ref<FmsVoucherTemplateApi.VoucherTemplate[]>([]); // 凭证模板列表
const filteredList = computed(() =>
  categoryId.value
    ? list.value.filter((item) => item.categoryId === categoryId.value)
    : list.value,
); // 按分类过滤后的凭证模板列表

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
    ElMessage.success($t('ui.actionMessage.deleteSuccess'));
    await getList();
  } catch {
    // 取消删除
  }
}

defineExpose({ open });
</script>

<template>
  <ElDialog
    v-model="dialogVisible"
    destroy-on-close
    title="凭证模板库"
    width="680px"
  >
    <div class="mb-3 flex items-center gap-2">
      <span class="shrink-0">模板分类</span>
      <ElSelect
        v-model="categoryId"
        class="!w-[200px]"
        clearable
        placeholder="全部分类"
      >
        <ElOption
          v-for="item in categories"
          :key="item.id"
          :label="item.name"
          :value="item.id!"
        />
      </ElSelect>
    </div>
    <ElTable
      v-loading="loading"
      :data="filteredList"
      border
      highlight-current-row
      stripe
      @row-dblclick="(row) => selectTemplate(row as FmsVoucherTemplateApi.VoucherTemplate)"
    >
      <ElTableColumn label="分类" min-width="180" prop="categoryName" />
      <ElTableColumn label="模板名称" min-width="260" prop="name" />
      <ElTableColumn align="center" label="分录数" width="90">
        <template #default="{ row }">{{ row.entries.length }}</template>
      </ElTableColumn>
      <ElTableColumn align="center" label="操作" width="130">
        <template #default="{ row }">
          <ElButton link type="primary" @click="selectTemplate(row as FmsVoucherTemplateApi.VoucherTemplate)">
            套用
          </ElButton>
          <ElButton
            v-if="
              fmsStore.isAccountSetWritable &&
              hasAccessByCodes(['fms:config:voucher-template:delete'])
            "
            link
            type="danger"
            @click="deleteTemplate(row as FmsVoucherTemplateApi.VoucherTemplate)"
          >
            删除
          </ElButton>
        </template>
      </ElTableColumn>
    </ElTable>
    <div class="mt-2.5 text-xs text-gray-400">
      双击模板可直接套用到当前凭证
    </div>
  </ElDialog>
</template>
