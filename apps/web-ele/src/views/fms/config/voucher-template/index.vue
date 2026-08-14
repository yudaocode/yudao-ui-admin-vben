<script lang="ts" setup>
import type { FmsVoucherTemplateApi } from '#/api/fms/config/voucher-template';
import type { FmsVoucherTemplateCategoryApi } from '#/api/fms/config/voucher-template-category';

import { computed, ref, watch } from 'vue';

import { useAccess } from '@vben/access';
import { DocAlert, confirm, Page, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  ElButton,
  ElCard,
  ElMessage,
  ElTable,
  ElTableColumn,
  ElTag,
  ElTooltip,
} from 'element-plus';

import {
  deleteVoucherTemplate,
  getVoucherTemplateList,
} from '#/api/fms/config/voucher-template';
import {
  deleteVoucherTemplateCategory,
  getVoucherTemplateCategoryList,
} from '#/api/fms/config/voucher-template-category';
import { $t } from '#/locales';
import { useFmsStore } from '#/views/fms/store/fms';

import CategoryForm from './modules/category-form.vue';

defineOptions({ name: 'FmsVoucherTemplate' });

const { hasAccessByCodes } = useAccess();
const fmsStore = useFmsStore(); // FMS Store

const [CategoryFormModal, categoryFormModalApi] = useVbenModal({
  connectedComponent: CategoryForm,
  destroyOnClose: true,
});

const loading = ref(true); // 列表的加载中
const templates = ref<FmsVoucherTemplateApi.VoucherTemplate[]>([]); // 凭证模板列表
const categories = ref<FmsVoucherTemplateCategoryApi.VoucherTemplateCategory[]>(
  [],
); // 凭证模板分类列表
const currentCategory =
  ref<FmsVoucherTemplateCategoryApi.VoucherTemplateCategory>(); // 当前凭证模板分类

const accountSetId = computed(() => fmsStore.getAccountSetId); // 当前账套编号
const currentTemplates = computed(() =>
  templates.value.filter((item) => item.categoryId === currentCategory.value?.id),
); // 当前分类的凭证模板列表

/** 查询列表 */
async function getList() {
  if (!accountSetId.value) {
    templates.value = [];
    categories.value = [];
    currentCategory.value = undefined;
    loading.value = false;
    return;
  }
  loading.value = true;
  try {
    [templates.value, categories.value] = await Promise.all([
      getVoucherTemplateList(accountSetId.value),
      getVoucherTemplateCategoryList(accountSetId.value),
    ]);
    currentCategory.value =
      categories.value.find((item) => item.id === currentCategory.value?.id) ||
      categories.value[0];
  } finally {
    loading.value = false;
  }
}

/** 统计分类下的模板数 */
function getCategoryTemplateCount(categoryId?: number) {
  return templates.value.filter((item) => item.categoryId === categoryId).length;
}

/** 新增模板分类 */
function handleCreateCategory() {
  if (!accountSetId.value) {
    return;
  }
  categoryFormModalApi.setData({ accountSetId: accountSetId.value }).open();
}

/** 编辑模板分类 */
function handleEditCategory(
  row: FmsVoucherTemplateCategoryApi.VoucherTemplateCategory,
) {
  if (!accountSetId.value) {
    return;
  }
  categoryFormModalApi
    .setData({ accountSetId: accountSetId.value, row })
    .open();
}

/** 删除模板分类 */
async function handleDeleteCategory(
  row: FmsVoucherTemplateCategoryApi.VoucherTemplateCategory,
) {
  if (!accountSetId.value) {
    return;
  }
  try {
    await confirm(`确认删除凭证模板分类“${row.name}”吗？`);
    await deleteVoucherTemplateCategory(accountSetId.value, row.id!);
    ElMessage.success($t('ui.actionMessage.deleteSuccess'));
    await getList();
  } catch {
    // 取消删除
  }
}

/** 删除凭证模板 */
async function handleDeleteTemplate(
  row: FmsVoucherTemplateApi.VoucherTemplate,
) {
  if (!accountSetId.value) {
    return;
  }
  try {
    await confirm(`确认删除凭证模板“${row.name}”吗？`);
    await deleteVoucherTemplate(accountSetId.value, row.id!);
    ElMessage.success($t('ui.actionMessage.deleteSuccess'));
    await getList();
  } catch {
    // 取消删除
  }
}

/** 初始化并监听账套切换 */
watch(accountSetId, getList, { immediate: true });
</script>

<template>
  <Page>
    <template #doc>
      <DocAlert
        title="【设置】凭证字、常用摘要、凭证模板"
        url="https://doc.iocoder.cn/fms/config/voucher/"
      />
    </template>
    <CategoryFormModal @success="getList" />

    <div class="grid grid-cols-[320px_minmax(0,1fr)] gap-4">
      <!-- 凭证模板分类 -->
      <ElCard>
        <div class="mb-4 flex items-center justify-between">
          <span class="text-[16px] font-bold">凭证模板分类</span>
          <ElButton
            v-if="
              fmsStore.isAccountSetWritable &&
              hasAccessByCodes(['fms:config:voucher-template-category:create'])
            "
            plain
            type="primary"
            @click="handleCreateCategory"
          >
            <IconifyIcon class="mr-1" icon="lucide:plus" /> 新增
          </ElButton>
        </div>
        <div v-loading="loading">
          <div
            v-for="item in categories"
            :key="item.id"
            class="flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5"
            :class="
              item.id === currentCategory?.id
                ? 'bg-primary/10 text-primary'
                : 'hover:bg-accent'
            "
            @click="currentCategory = item"
          >
            <div class="flex min-w-0 items-center">
              <span class="truncate">{{ item.name }}</span>
              <ElTag class="ml-1.5" size="small">
                {{ getCategoryTemplateCount(item.id) }}
              </ElTag>
            </div>
            <div v-if="fmsStore.isAccountSetWritable" class="ml-1 flex shrink-0">
              <ElTooltip
                v-if="
                  hasAccessByCodes([
                    'fms:config:voucher-template-category:update',
                  ])
                "
                content="编辑"
                placement="top"
              >
                <ElButton
                  link
                  size="small"
                  type="primary"
                  @click.stop="handleEditCategory(item)"
                >
                  <IconifyIcon icon="lucide:pencil" />
                </ElButton>
              </ElTooltip>
              <ElTooltip
                v-if="
                  hasAccessByCodes([
                    'fms:config:voucher-template-category:delete',
                  ])
                "
                content="删除"
                placement="top"
              >
                <ElButton
                  link
                  size="small"
                  type="danger"
                  @click.stop="handleDeleteCategory(item)"
                >
                  <IconifyIcon icon="lucide:trash-2" />
                </ElButton>
              </ElTooltip>
            </div>
          </div>
        </div>
      </ElCard>

      <!-- 凭证模板 -->
      <ElCard class="min-w-0">
        <div class="mb-4 text-[16px] font-bold">凭证模板</div>
        <ElTable
          v-loading="loading"
          :data="currentTemplates"
          :empty-text="currentCategory ? '暂无凭证模板' : '请选择凭证模板分类'"
          stripe
        >
          <ElTableColumn
            label="模板名称"
            min-width="260"
            prop="name"
            show-overflow-tooltip
          />
          <ElTableColumn align="center" label="分录数" width="100">
            <template #default="{ row }">{{ row.entries.length }}</template>
          </ElTableColumn>
          <ElTableColumn align="center" label="操作" width="120">
            <template #default="{ row }">
              <ElButton
                v-if="
                  fmsStore.isAccountSetWritable &&
                  hasAccessByCodes(['fms:config:voucher-template:delete'])
                "
                link
                type="danger"
                @click="handleDeleteTemplate(row as FmsVoucherTemplateApi.VoucherTemplate)"
              >
                删除
              </ElButton>
            </template>
          </ElTableColumn>
        </ElTable>
      </ElCard>
    </div>
  </Page>
</template>
