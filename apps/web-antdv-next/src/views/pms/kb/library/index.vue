<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsKnowledgeLibraryApi } from '#/api/pms/kb/library';
import type { PmsKnowledgeGroupApi } from '#/api/pms/kb/library/group';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { confirm, DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { useUserStore } from '@vben/stores';

import {
  Avatar,
  Button,
  Dropdown,
  Image,
  Menu,
  MenuItem,
  message,
  Switch,
  Tabs,
  Tag,
} from 'antdv-next';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createKnowledgeFavorite,
  deleteKnowledgeFavorite,
} from '#/api/pms/kb/interaction/favorite';
import {
  deleteKnowledgeLibrary,
  getKnowledgeLibraryPage,
} from '#/api/pms/kb/library';
import {
  getKnowledgeGroupList,
  moveKnowledgeLibraryToGroup,
} from '#/api/pms/kb/library/group';
import { exitKnowledgeLibrary } from '#/api/pms/kb/library/member';
import {
  PmsKnowledgeGroupType,
  PmsKnowledgeObjectType,
} from '#/views/pms/kb/utils/constants';

import { useGridColumns, useGridFormSchema } from './data';
import KnowledgeGroupForm from './knowledge-group-form.vue';
import KnowledgeGroupManageDialog from './knowledge-group-manage-dialog.vue';
import KnowledgeLibraryForm from './knowledge-library-form.vue';

defineOptions({ name: 'PmsKnowledgeLibrary' });

// TODO @AI：useAccess() 空调用删掉。删除改 TableAction popConfirm，不要 confirm + empty catch。补 toolbarConfig。
useAccess();
const router = useRouter(); // 路由
const currentUserId = useUserStore().userInfo?.id; // 当前登录用户，用于判断创建人级操作
const groupList = ref<PmsKnowledgeGroupApi.KnowledgeGroup[]>([]); // 知识库分组列表
const groupId = ref<number>(); // 当前知识库分组
const moveTargetGroupList = computed(() =>
  groupList.value.filter((group) => group.type !== PmsKnowledgeGroupType.ALL),
); // 可移动到的分组
// antdv-next Tabs 的 activeKey 为字符串，查询参数仍使用数值分组编号
const activeGroupKey = computed({
  get: () => (groupId.value === undefined ? undefined : String(groupId.value)),
  set: (key?: string) => {
    groupId.value = key === undefined ? undefined : Number(key);
  },
});

const [KnowledgeLibraryFormModal, knowledgeLibraryFormModalApi] = useVbenModal({
  destroyOnClose: true,
  connectedComponent: KnowledgeLibraryForm,
});
const [KnowledgeGroupFormModal, knowledgeGroupFormModalApi] = useVbenModal({
  destroyOnClose: true,
  connectedComponent: KnowledgeGroupForm,
});
const [KnowledgeGroupManageDialogModal, knowledgeGroupManageDialogModalApi] =
  useVbenModal({
  destroyOnClose: true,
    connectedComponent: KnowledgeGroupManageDialog,
  });

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
    submitOnEnter: true,
  },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    proxyConfig: {
      autoLoad: false,
      ajax: {
        query: async ({ page }, formValues) => {
          return await getKnowledgeLibraryPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            groupId: groupId.value,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
  } as VxeTableGridOptions<PmsKnowledgeLibraryApi.KnowledgeLibrary>,
});

/** 刷新列表 */
function handleRefresh() {
  gridApi.query();
}

/** 切换分组 */
function handleGroupChange(key: number | string) {
  groupId.value = Number(key);
  handleRefresh();
}

/** 打开知识库表单 */
function openForm(formType: 'create' | 'update', id?: number) {
  knowledgeLibraryFormModalApi.setData({ formType, id }).open();
}

/** 打开知识库详情 */
function openDetail(id: number) {
  router.push(`/pms/kb/library/${id}`);
}

/** 删除按钮操作 */
async function handleDelete(library: PmsKnowledgeLibraryApi.KnowledgeLibrary) {
  try {
    // 删除的二次确认
    await confirm(`确认删除知识库“${library.name}”吗？`);
    // 发起删除
    await deleteKnowledgeLibrary(library.id);
    message.success('删除成功');
    // 刷新列表
    handleRefresh();
  } catch {
  }
}

/** 退出按钮操作 */
async function handleExit(library: PmsKnowledgeLibraryApi.KnowledgeLibrary) {
  try {
    // 退出的二次确认
    await confirm(
      `确认退出知识库“${library.name}”吗？退出后将无法访问私有内容。`,
    );
    // 发起退出
    await exitKnowledgeLibrary(library.id);
    message.success('已退出知识库');
    // 刷新分组和列表
    await getGroupList();
    handleRefresh();
  } catch {
  }
}

/** 修改知识库关注状态 */
async function handleFavoriteStatusChange(
  library: PmsKnowledgeLibraryApi.KnowledgeLibrary,
) {
  try {
    // 修改关注状态的二次确认
    const text = library.favoriteStatus ? '关注' : '取消关注';
    await confirm(`确认${text}知识库“${library.name}”吗？`);
    // 发起修改关注状态
    if (library.favoriteStatus) {
      await createKnowledgeFavorite({
        type: PmsKnowledgeObjectType.LIBRARY,
        entityId: library.id!,
      });
    } else {
      await deleteKnowledgeFavorite(
        PmsKnowledgeObjectType.LIBRARY,
        library.id!,
      );
    }
    // 刷新列表
    handleRefresh();
  } catch {
    library.favoriteStatus = !library.favoriteStatus;
  }
}

/** 查询知识库分组 */
async function getGroupList() {
  groupList.value = await getKnowledgeGroupList();
  if (!groupList.value.some((group) => group.id === groupId.value)) {
    groupId.value = groupList.value[0]?.id;
  }
}

/** 移动知识库到分组 */
async function handleMoveGroup(libraryId: number, targetGroupId: number) {
  await moveKnowledgeLibraryToGroup(libraryId, targetGroupId);
  message.success('移动成功');
  // 刷新分组和列表
  await getGroupList();
  handleRefresh();
}

/** 分组变化后刷新分组与列表 */
async function handleGroupsChanged() {
  await getGroupList();
  handleRefresh();
}

/** 初始化 */
onMounted(async () => {
  // 先查询分组并确定当前分组，再加载列表
  await getGroupList();
  gridApi.query();
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【PMS】知识库管理"
        url="https://doc.iocoder.cn/pms/kb/library/"
      />
    </template>

    <!-- 知识库列表 -->
    <Grid>
      <template #toolbar-actions>
        <!-- 知识库分组 -->
        <Tabs
          v-model:active-key="activeGroupKey"
          class="library-tabs w-full"
          @change="handleGroupChange"
        >
          <Tabs.TabPane
            v-for="group in groupList"
            :key="String(group.id)"
            :tab="`${group.name}（${group.libraryCount ?? 0}）`"
          />
        </Tabs>
      </template>
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: '新建知识库',
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['pms:kb:library:create'],
              onClick: () => openForm('create'),
            },
            {
              label: '新建分组',
              icon: ACTION_ICON.ADD,
              auth: ['pms:kb:library:update'],
              onClick: () =>
                knowledgeGroupFormModalApi
                  .setData({ formType: 'create' })
                  .open(),
            },
            {
              label: '管理分组',
              icon: ACTION_ICON.EDIT,
              auth: ['pms:kb:library:update'],
              onClick: () => knowledgeGroupManageDialogModalApi.open(),
            },
          ]"
        />
      </template>
      <template #name="{ row }">
        <div class="flex items-center gap-3">
          <Image
            v-if="row.coverUrl"
            class="h-11 w-16 rounded object-cover"
            :preview="false"
            :src="row.coverUrl"
          />
          <Avatar v-else shape="square" :size="44">
            <IconifyIcon icon="lucide:notebook" />
          </Avatar>
          <div>
            <Button class="!p-0" type="link" @click="openDetail(row.id)">
              {{ row.name }}
            </Button>
            <div class="text-xs text-muted-foreground">
              {{ row.description || '暂无简介' }}
            </div>
          </div>
        </div>
      </template>
      <template #openStatus="{ row }">
        <Tag :color="row.openStatus ? 'green' : 'default'">
          {{ row.openStatus ? '公开' : '私有' }}
        </Tag>
      </template>
      <template #favoriteStatus="{ row }">
        <Switch
          :checked="row.favoriteStatus"
          @change="
            row.favoriteStatus = !row.favoriteStatus;
            handleFavoriteStatusChange(row);
          "
        />
      </template>
      <template #actions="{ row }">
        <div class="flex items-center justify-center gap-3">
          <Dropdown
            v-if="row.writeStatus"
            v-access:code="['pms:kb:library:update']"
            :trigger="['click']"
          >
            <Button type="link">移动分组</Button>
            <template #popupRender>
              <Menu
                @click="({ key }: any) => handleMoveGroup(row.id, Number(key))"
              >
                <MenuItem v-for="group in moveTargetGroupList" :key="group.id">
                  {{ group.name }}
                </MenuItem>
              </Menu>
            </template>
          </Dropdown>
          <Button
            v-if="row.adminStatus"
            v-access:code="['pms:kb:library:update']"
            type="link"
            @click="openForm('update', row.id)"
          >
            编辑
          </Button>
          <Button
            v-if="row.creatorUserId === currentUserId"
            v-access:code="['pms:kb:library:delete']"
            danger
            type="link"
            @click="handleDelete(row)"
          >
            删除
          </Button>
          <Button
            v-if="row.exitStatus"
            danger
            type="link"
            @click="handleExit(row)"
          >
            退出
          </Button>
        </div>
      </template>
    </Grid>

    <!-- 新建或修改知识库 -->
    <KnowledgeLibraryFormModal @success="handleRefresh" />
    <!-- 新建知识库分组 -->
    <KnowledgeGroupFormModal @success="handleGroupsChanged" />
    <!-- 管理知识库分组 -->
    <KnowledgeGroupManageDialogModal @success="handleGroupsChanged" />
  </Page>
</template>

<style lang="scss" scoped>
.library-tabs {
  :deep(.ant-tabs-nav) {
    margin-bottom: 0;
  }
}
</style>
