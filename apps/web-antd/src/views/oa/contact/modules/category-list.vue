<script lang="ts" setup>
import type { OaContactCategoryApi } from '#/api/oa/contact/category';
import type { ActionItem } from '#/components/table-action';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Button, message, Table } from 'ant-design-vue';

import { ACTION_ICON, TableAction } from '#/adapter/vxe-table';
import {
  deleteContactCategory,
  getContactCategoryList,
} from '#/api/oa/contact/category';
import { $t } from '#/locales';

import CategoryForm from './category-form.vue';

const emit = defineEmits(['success']);

const [CategoryFormModal, categoryFormModalApi] = useVbenModal({
  connectedComponent: CategoryForm,
  destroyOnClose: true,
});

const loading = ref(false); // 列表加载中
const list = ref<OaContactCategoryApi.ContactCategory[]>([]); // 分类列表

const columns = [
  { title: '分类名称', dataIndex: 'name', ellipsis: true },
  { title: '排序', dataIndex: 'sort', width: 100 },
  { title: '操作', key: 'actions', align: 'center' as const, width: 140 },
];

/** 查询分类列表 */
async function getList() {
  loading.value = true;
  try {
    list.value = await getContactCategoryList();
  } finally {
    loading.value = false;
  }
}

/** 新增/修改分类 */
function handleEdit(row?: OaContactCategoryApi.ContactCategory) {
  categoryFormModalApi.setData(row || null).open();
}

/** 分类保存成功 */
async function handleSuccess() {
  await getList();
  emit('success');
}

/** 删除分类 */
async function handleDelete(row: OaContactCategoryApi.ContactCategory) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    duration: 0,
  });
  try {
    await deleteContactCategory(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    // 刷新分类列表并通知父组件
    await getList();
    emit('success');
  } finally {
    hideLoading();
  }
}

/** 行操作 */
function getRowActions(
  row: OaContactCategoryApi.ContactCategory,
): ActionItem[] {
  return [
    {
      label: $t('common.edit'),
      type: 'link',
      icon: ACTION_ICON.EDIT,
      onClick: handleEdit.bind(null, row),
    },
    {
      label: $t('common.delete'),
      type: 'link',
      danger: true,
      icon: ACTION_ICON.DELETE,
      popConfirm: {
        title: '删除分类后，原分类下的联系人将变为未分类，是否继续？',
        confirm: handleDelete.bind(null, row),
      },
    },
  ];
}

const [Modal] = useVbenModal({
  onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    getList();
  },
});
</script>

<template>
  <Modal
    title="管理联系人分类"
    class="w-[640px]"
    :show-confirm-button="false"
    cancel-text="关 闭"
  >
    <div class="mx-4">
      <div class="mb-3 flex justify-end">
        <Button type="primary" @click="handleEdit()">
          {{ $t('ui.actionTitle.create', ['分类']) }}
        </Button>
      </div>
      <Table
        bordered
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        row-key="id"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'actions'">
            <TableAction
              :actions="
                getRowActions(record as OaContactCategoryApi.ContactCategory)
              "
            />
          </template>
        </template>
      </Table>
    </div>
    <CategoryFormModal @success="handleSuccess" />
  </Modal>
</template>
