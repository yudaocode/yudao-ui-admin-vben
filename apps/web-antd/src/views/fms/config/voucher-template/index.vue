<script lang="ts" setup>
import type { FmsVoucherTemplateApi } from '#/api/fms/config/voucher-template';
import type { FmsVoucherTemplateCategoryApi } from '#/api/fms/config/voucher-template-category';

import { computed, ref, watch } from 'vue';

import { useAccess } from '@vben/access';
import { DocAlert, confirm, Page, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Button, Card, message, Spin, Table, Tag, Tooltip } from 'ant-design-vue';

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

/** 凭证模板表格列 */
const templateColumns = [
  { title: '模板名称', dataIndex: 'name', ellipsis: true },
  { title: '分录数', dataIndex: 'entries', align: 'center' as const, width: 100 },
  { title: '操作', key: 'action', align: 'center' as const, width: 120 },
];

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
    message.success($t('ui.actionMessage.deleteSuccess'));
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
    message.success($t('ui.actionMessage.deleteSuccess'));
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
      <Card>
        <div class="mb-4 flex items-center justify-between">
          <span class="text-[16px] font-bold">凭证模板分类</span>
          <Button
            v-if="
              fmsStore.isAccountSetWritable &&
              hasAccessByCodes(['fms:config:voucher-template-category:create'])
            "
            ghost
            type="primary"
            @click="handleCreateCategory"
          >
            <IconifyIcon class="mr-1" icon="lucide:plus" /> 新增
          </Button>
        </div>
        <Spin :spinning="loading">
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
              <Tag class="ml-1.5">{{ getCategoryTemplateCount(item.id) }}</Tag>
            </div>
            <div v-if="fmsStore.isAccountSetWritable" class="ml-1 flex shrink-0">
              <Tooltip
                v-if="
                  hasAccessByCodes([
                    'fms:config:voucher-template-category:update',
                  ])
                "
                title="编辑"
              >
                <Button
                  size="small"
                  type="link"
                  @click.stop="handleEditCategory(item)"
                >
                  <IconifyIcon icon="lucide:pencil" />
                </Button>
              </Tooltip>
              <Tooltip
                v-if="
                  hasAccessByCodes([
                    'fms:config:voucher-template-category:delete',
                  ])
                "
                title="删除"
              >
                <Button
                  danger
                  size="small"
                  type="link"
                  @click.stop="handleDeleteCategory(item)"
                >
                  <IconifyIcon icon="lucide:trash-2" />
                </Button>
              </Tooltip>
            </div>
          </div>
        </Spin>
      </Card>

      <!-- 凭证模板 -->
      <Card class="min-w-0">
        <div class="mb-4 text-[16px] font-bold">凭证模板</div>
        <Table
          :columns="templateColumns"
          :data-source="currentTemplates"
          :loading="loading"
          :locale="{
            emptyText: currentCategory ? '暂无凭证模板' : '请选择凭证模板分类',
          }"
          :pagination="false"
          row-key="id"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'entries'">
              {{ record.entries.length }}
            </template>
            <template v-else-if="column.key === 'action'">
              <Button
                v-if="
                  fmsStore.isAccountSetWritable &&
                  hasAccessByCodes(['fms:config:voucher-template:delete'])
                "
                danger
                type="link"
                @click="handleDeleteTemplate(record as FmsVoucherTemplateApi.VoucherTemplate)"
              >
                删除
              </Button>
            </template>
          </template>
        </Table>
      </Card>
    </div>
  </Page>
</template>
