<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OaContactApi } from '#/api/oa/contact';
import type { OaContactCategoryApi } from '#/api/oa/contact/category';
import type { ActionItem } from '#/components/table-action';

import { computed, onMounted, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import { Avatar, Button, Card, Divider, Menu, message, Tag } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteContact,
  deleteReceivedContact,
  getMyContactPage,
  getReceivedContactPage,
  getSharedContactPage,
} from '#/api/oa/contact';
import { getContactCategoryList } from '#/api/oa/contact/category';
import { $t } from '#/locales';
import { OA_CONTACT_SCENE_TYPE } from '#/views/oa/utils/constants';

import { useGridColumns, useGridFormSchema } from './data';
import CategoryList from './modules/category-list.vue';
import Detail from './modules/detail.vue';
import Form from './modules/form.vue';
import HandleForm from './modules/handle-form.vue';
import ShareForm from './modules/share-form.vue';

defineOptions({ name: 'OaContact' });

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: Detail,
  destroyOnClose: true,
});

const [ShareFormModal, shareFormModalApi] = useVbenModal({
  connectedComponent: ShareForm,
  destroyOnClose: true,
});

const [HandleFormModal, handleFormModalApi] = useVbenModal({
  connectedComponent: HandleForm,
  destroyOnClose: true,
});

const [CategoryListModal, categoryListModalApi] = useVbenModal({
  connectedComponent: CategoryList,
  destroyOnClose: true,
});

const currentUserId = useUserStore().userInfo?.id; // 当前用户编号
const activeScene = ref<number>(OA_CONTACT_SCENE_TYPE.MINE); // 当前列表场景，不作为查询参数传递
const activeCategory = ref('all'); // 左侧当前选中的分类
const queryCategoryId = ref<number>(); // 查询的分类编号
const categoryList = ref<OaContactCategoryApi.ContactCategory[]>([]); // 联系人分类列表

/** 联系人类型菜单 */
const sceneMenuItems = [
  { key: String(OA_CONTACT_SCENE_TYPE.MINE), label: '我的联系人' },
  { key: String(OA_CONTACT_SCENE_TYPE.SENT), label: '我共享的' },
  { key: String(OA_CONTACT_SCENE_TYPE.RECEIVED), label: '共享与我' },
];

/** 联系人分类菜单 */
const categoryMenuItems = computed(() => [
  { key: 'all', label: '全部联系人' },
  ...categoryList.value.map((item) => ({
    key: `category-${item.id}`,
    label: item.name,
  })),
]);

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 查询联系人分类列表 */
async function getCategoryList() {
  categoryList.value = await getContactCategoryList();
}

/** 联系人分类变更操作 */
async function handleCategoryChange() {
  await getCategoryList();
  // 分类编号保持稳定；已删除的分类回到全部联系人
  if (activeCategory.value.startsWith('category-')) {
    const category = categoryList.value.find(
      (item) => `category-${item.id}` === activeCategory.value,
    );
    if (!category) {
      activeCategory.value = 'all';
    }
    queryCategoryId.value = category?.id;
  }
  handleRefresh();
}

/** 切换联系人分类 */
function handleCategorySelect({ key }: { key: number | string }) {
  activeCategory.value = String(key);
  queryCategoryId.value = categoryList.value.find(
    (item) => `category-${item.id}` === activeCategory.value,
  )?.id;
  handleRefresh();
}

/** 切换联系人类型 */
function handleSceneSelect({ key }: { key: number | string }) {
  activeScene.value = Number(key);
  // 处理状态仅在“共享与我”场景生效
  gridApi.formApi.setValues({
    scene: activeScene.value,
    handleStatus: undefined,
  });
  // 列配置随场景切换；直接写 gridOptions，避免静态 columns 属性在重渲染时覆盖 reloadColumn 的结果
  gridApi.setState({
    gridOptions: { columns: useGridColumns(activeScene.value) },
  });
  handleRefresh();
}

/** 判断是否为联系人创建人 */
function isContactOwner(contact: OaContactApi.Contact) {
  return contact.ownerUserId === currentUserId;
}

/** 新增联系人 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 修改联系人 */
function handleEdit(row: OaContactApi.Contact) {
  formModalApi.setData(row).open();
}

/** 查看联系人详情 */
function handleDetail(row: OaContactApi.Contact) {
  detailModalApi.setData({ id: row.id }).open();
}

/** 共享联系人 */
function handleShare(row: OaContactApi.Contact) {
  shareFormModalApi.setData({ id: row.id }).open();
}

/** 移动/处理共享联系人 */
function handleMove(row: OaContactApi.Contact) {
  handleFormModalApi.setData(row).open();
}

/** 共享处理成功 */
async function handleShareHandled() {
  await getCategoryList();
  handleRefresh();
}

/** 删除联系人 */
async function handleDelete(row: OaContactApi.Contact) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    duration: 0,
  });
  try {
    // 移除本人持有的联系人；最后一人移除时由后端删除正文
    if (
      activeScene.value === OA_CONTACT_SCENE_TYPE.MINE &&
      isContactOwner(row)
    ) {
      await deleteContact(row.id!);
    } else {
      await deleteReceivedContact(row.id!);
    }
    message.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    handleRefresh();
  } finally {
    hideLoading();
  }
}

/** 行操作 */
function getRowActions(row: OaContactApi.Contact): ActionItem[] {
  const actions: ActionItem[] = [
    {
      label: '共享',
      type: 'link',
      onClick: handleShare.bind(null, row),
    },
  ];
  if (activeScene.value === OA_CONTACT_SCENE_TYPE.MINE) {
    if (isContactOwner(row)) {
      actions.push(
        {
          label: $t('common.edit'),
          type: 'link',
          icon: ACTION_ICON.EDIT,
          auth: ['oa:contact:update'],
          onClick: handleEdit.bind(null, row),
        },
        {
          label: $t('common.delete'),
          type: 'link',
          danger: true,
          icon: ACTION_ICON.DELETE,
          auth: ['oa:contact:delete'],
          popConfirm: {
            title:
              '确认移除本人持有的联系人？其他持有人不受影响，最后一人移除时才删除正文。',
            confirm: handleDelete.bind(null, row),
          },
        },
      );
    } else {
      actions.push(
        {
          label: '移动',
          type: 'link',
          onClick: handleMove.bind(null, row),
        },
        {
          label: $t('common.delete'),
          type: 'link',
          danger: true,
          icon: ACTION_ICON.DELETE,
          popConfirm: {
            title:
              '确认移除本人持有的联系人？其他持有人不受影响，最后一人移除时才删除正文。',
            confirm: handleDelete.bind(null, row),
          },
        },
      );
    }
  } else if (activeScene.value === OA_CONTACT_SCENE_TYPE.RECEIVED) {
    actions.push(
      {
        label: '处理',
        type: 'link',
        ifShow: !row.handleStatus,
        onClick: handleMove.bind(null, row),
      },
      {
        label: $t('common.delete'),
        type: 'link',
        danger: true,
        icon: ACTION_ICON.DELETE,
        popConfirm: {
          title:
            '确认移除本人持有的联系人？其他持有人不受影响，最后一人移除时才删除正文。',
          confirm: handleDelete.bind(null, row),
        },
      },
    );
  }
  return actions;
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(OA_CONTACT_SCENE_TYPE.MINE),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          const getPage =
            activeScene.value === OA_CONTACT_SCENE_TYPE.MINE
              ? getMyContactPage
              : activeScene.value === OA_CONTACT_SCENE_TYPE.RECEIVED
                ? getReceivedContactPage
                : getSharedContactPage;
          return await getPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
            scene: undefined,
            categoryId: queryCategoryId.value,
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
  } as VxeTableGridOptions<OaContactApi.Contact>,
});

/** 初始化 */
onMounted(() => {
  getCategoryList();
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="handleCategoryChange" />
    <DetailModal />
    <ShareFormModal @success="handleRefresh" />
    <HandleFormModal @success="handleShareHandled" />
    <CategoryListModal @success="handleCategoryChange" />

    <div class="flex h-full w-full gap-4">
      <!-- 左侧联系人分类及类型 -->
      <Card class="h-full w-1/6 shrink-0 overflow-y-auto">
        <!-- 分类 -->
        <div
          class="mb-3 flex items-center justify-between border-b pb-3 font-semibold"
        >
          <span>分类</span>
          <Button
            type="link"
            size="small"
            class="!px-0"
            @click="categoryListModalApi.open()"
          >
            管理分类
          </Button>
        </div>
        <Menu
          class="!border-e-0"
          :items="categoryMenuItems"
          :selected-keys="[activeCategory]"
          @click="handleCategorySelect"
        />
        <!-- 类型导航，与分类组合筛选 -->
        <Divider class="!my-4" />
        <div class="mb-3 font-semibold">类型</div>
        <Menu
          class="!border-e-0"
          :items="sceneMenuItems"
          :selected-keys="[String(activeScene)]"
          @click="handleSceneSelect"
        />
      </Card>
      <!-- 右侧联系人列表 -->
      <div class="min-w-0 flex-1">
        <Grid table-title="联系人列表">
          <template #toolbar-tools>
            <TableAction
              :actions="[
                {
                  label: $t('ui.actionTitle.create', ['联系人']),
                  type: 'primary',
                  icon: ACTION_ICON.ADD,
                  auth: ['oa:contact:create'],
                  ifShow: activeScene === OA_CONTACT_SCENE_TYPE.MINE,
                  onClick: handleCreate,
                },
              ]"
            />
          </template>
          <template #name="{ row }">
            <span class="cursor-pointer text-primary" @click="handleDetail(row)">
              {{ row.name }}
            </span>
          </template>
          <template #avatar="{ row }">
            <Avatar :src="row.avatar" :size="32" />
          </template>
          <template #categoryName="{ row }">
            {{ row.sharedCategoryName || '未分类' }}
          </template>
          <template #shareHandleStatus="{ row }">
            <Tag :color="row.share?.handleStatus ? 'success' : 'warning'">
              {{ row.share?.handleStatus ? '已处理' : '待处理' }}
            </Tag>
          </template>
          <template #handleStatus="{ row }">
            <Tag :color="row.handleStatus ? 'success' : 'warning'">
              {{ row.handleStatus ? '已处理' : '待处理' }}
            </Tag>
          </template>
          <template #actions="{ row }">
            <TableAction :actions="getRowActions(row)" />
          </template>
        </Grid>
      </div>
    </div>
  </Page>
</template>
