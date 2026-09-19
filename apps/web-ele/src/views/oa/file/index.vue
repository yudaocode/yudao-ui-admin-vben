<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OaFileNodeApi } from '#/api/oa/file/node';

import { computed, ref } from 'vue';

import { useAccess } from '@vben/access';
import { Page, useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';
import { useUserStore } from '@vben/stores';
import { downloadFileFromBlob } from '@vben/utils';

import {
  ElBreadcrumb,
  ElBreadcrumbItem,
  ElButton,
  ElDivider,
  ElLink,
  ElLoading,
  ElMessage,
} from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { createFileFavorite, deleteFileFavorite } from '#/api/oa/file/favorite';
import {
  deleteFileNode,
  getFileNode,
  getFileNodePage,
  recycleFileNode,
  restoreFileNode,
} from '#/api/oa/file/node';
import {
  OA_FILE_CATEGORY,
  OA_FILE_NODE_TYPE,
  OA_FILE_PARENT_ID_ROOT,
  OA_FILE_PERMISSION_LEVEL,
  OA_FILE_SCOPE,
  OA_FILE_SCOPE_OPTIONS,
} from '#/views/oa/utils/constants';

import { useGridColumns, useGridFormSchema } from './data';
import NodeForm from './modules/node-form.vue';
import PermissionList from './modules/permission-list.vue';
import Preview from './modules/preview.vue';
import Storage from './modules/storage.vue';
import Upload from './modules/upload.vue';

defineOptions({ name: 'OaFile' });

// 分类图标只负责展示，分类名称与取值由字典维护。
const fileCategoryIcons: Record<number, string> = {
  [OA_FILE_CATEGORY.ALL]: 'ep:files',
  [OA_FILE_CATEGORY.IMAGE]: 'ep:picture',
  [OA_FILE_CATEGORY.DOCUMENT]: 'ep:document',
  [OA_FILE_CATEGORY.VIDEO]: 'ep:video-camera',
  [OA_FILE_CATEGORY.AUDIO]: 'ep:headset',
  [OA_FILE_CATEGORY.ARCHIVE]: 'ep:box',
  [OA_FILE_CATEGORY.OTHER]: 'ep:more-filled',
};

const { hasAccessByCodes } = useAccess(); // 权限校验
const userStore = useUserStore(); // 当前用户
const storageRef = ref<InstanceType<typeof Storage>>(); // 云盘概览 Ref
const scope = ref<string>(OA_FILE_SCOPE.MY); // 当前文件范围
const currentParentId = ref<number>(OA_FILE_PARENT_ID_ROOT); // 当前目录
const currentLevel = ref<number>(OA_FILE_PERMISSION_LEVEL.MANAGE); // 当前目录权限
const latestFormValues = ref<Record<string, any>>({}); // 最近一次查询的搜索条件
const paths = ref([
  {
    id: OA_FILE_PARENT_ID_ROOT as number,
    name: '我的文件',
    level: OA_FILE_PERMISSION_LEVEL.MANAGE as number,
  },
]); // 面包屑

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          latestFormValues.value = formValues || {};
          // 搜索或根目录收藏查询跨目录展示，否则只查询当前目录
          const parentId =
            formValues.name ||
            formValues.category ||
            formValues.createTime?.length ||
            (scope.value === OA_FILE_SCOPE.FAVORITE &&
              currentParentId.value === OA_FILE_PARENT_ID_ROOT)
              ? undefined
              : currentParentId.value;
          return await getFileNodePage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
            scope: scope.value,
            parentId,
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
  } as VxeTableGridOptions<OaFileNodeApi.FileNode>,
});

const [NodeFormModal, nodeFormModalApi] = useVbenModal({
  connectedComponent: NodeForm,
  destroyOnClose: true,
});

const [PreviewModal, previewModalApi] = useVbenModal({
  connectedComponent: Preview,
  destroyOnClose: true,
});

const [PermissionListModal, permissionListModalApi] = useVbenModal({
  connectedComponent: PermissionList,
  destroyOnClose: true,
});

// 文件分类选项
const categoryOptions = computed(() =>
  getDictOptions(DICT_TYPE.OA_FILE_CATEGORY, 'number'),
);
// 是否可新建文件夹、上传文件
const canCreate = computed(
  () =>
    scope.value !== OA_FILE_SCOPE.RECYCLE &&
    !latestFormValues.value.category &&
    (currentParentId.value !== OA_FILE_PARENT_ID_ROOT
      ? currentLevel.value >= OA_FILE_PERMISSION_LEVEL.EDIT
      : scope.value === OA_FILE_SCOPE.MY),
);

/** 打开新建文件夹、重命名、移动、复制表单 */
function openForm(formType: string, row?: OaFileNodeApi.FileNode) {
  nodeFormModalApi
    .setData({
      formType,
      parentId: row?.parentId ?? currentParentId.value,
      row,
    })
    .open();
}

/** 打开共享设置 */
function openPermissionForm(id: number) {
  permissionListModalApi.setData({ id }).open();
}

/** 操作成功后刷新列表与概览 */
async function handleSuccess() {
  await Promise.all([gridApi.query(), storageRef.value?.getStorage()]);
}

/** 切换文件范围 */
async function handleScope(value: string) {
  scope.value = value;
  currentParentId.value = OA_FILE_PARENT_ID_ROOT;
  currentLevel.value =
    value === OA_FILE_SCOPE.MY
      ? OA_FILE_PERMISSION_LEVEL.MANAGE
      : OA_FILE_PERMISSION_LEVEL.READ;
  paths.value = [
    {
      id: OA_FILE_PARENT_ID_ROOT,
      name: OA_FILE_SCOPE_OPTIONS.find((item) => item.value === value)!.label,
      level: currentLevel.value,
    },
  ];
  // 重置搜索条件后回到第一页，按新范围查询
  await gridApi.formApi.reset();
  await gridApi.formApi.submit();
}

/** 切换分类 */
async function handleCategory(value: number) {
  await gridApi.formApi.setFieldValue('category', value || undefined);
  await gridApi.formApi.submit();
}

/** 打开文件或目录 */
async function handleOpen(row: OaFileNodeApi.FileNode) {
  if (row.type === OA_FILE_NODE_TYPE.FILE) {
    // 预览沿用下载权限，打开前拦截，避免弹窗一闪
    if ((row.level || 0) < OA_FILE_PERMISSION_LEVEL.DOWNLOAD) {
      ElMessage.warning('当前仅具有查看文件信息的权限');
      return;
    }
    previewModalApi.setData(row).open();
    return;
  }
  currentParentId.value = row.id!;
  currentLevel.value = row.level || OA_FILE_PERMISSION_LEVEL.READ;
  paths.value.push({
    id: row.id!,
    name: row.name,
    level: currentLevel.value,
  });
  // 进入目录后回到第一页查询
  await gridApi.formApi.reset();
  await gridApi.formApi.submit();
}

/** 返回上级目录 */
async function handlePath(index: number) {
  // 还原目标目录的路径及权限
  paths.value = paths.value.slice(0, index + 1);
  currentParentId.value = paths.value[index]!.id;
  currentLevel.value = paths.value[index]!.level;
  // 返回上级目录后回到第一页查询
  await gridApi.formApi.reset();
  await gridApi.formApi.submit();
}

/** 判断本人节点 */
function isOwner(row: OaFileNodeApi.FileNode) {
  return row.creator === String(userStore.userInfo?.id);
}

/** 获得授权地址后按云盘当前名称下载文件 */
async function handleDownload(row: OaFileNodeApi.FileNode) {
  if ((row.level || 0) < OA_FILE_PERMISSION_LEVEL.DOWNLOAD) {
    ElMessage.warning('当前仅具有查看文件信息的权限');
    return;
  }
  const data = await getFileNode(row.id!);
  if (!data.url) {
    ElMessage.warning('当前文件不可下载');
    return;
  }
  try {
    const response = await fetch(data.url);
    if (!response.ok) {
      ElMessage.error('文件下载失败，请重试');
      return;
    }
    downloadFileFromBlob({ fileName: data.name, source: await response.blob() });
  } catch {
    ElMessage.error('文件下载失败，请重试');
  }
}

/** 收藏或取消收藏 */
async function handleFavorite(row: OaFileNodeApi.FileNode) {
  if (row.favorite) {
    await deleteFileFavorite(row.id!);
  } else {
    await createFileFavorite(row.id!);
  }
  await handleSuccess();
}

/** 移入回收站 */
async function handleRecycle(row: OaFileNodeApi.FileNode) {
  await recycleFileNode(row.id!);
  ElMessage.success('已移入回收站');
  await handleSuccess();
}

/** 恢复节点 */
async function handleRestore(row: OaFileNodeApi.FileNode) {
  await restoreFileNode(row.id!);
  ElMessage.success('恢复成功');
  await handleSuccess();
}

/** 彻底删除业务记录 */
async function handleDelete(row: OaFileNodeApi.FileNode) {
  const loadingInstance = ElLoading.service({
    text: `正在删除 ${row.name} ...`,
  });
  try {
    await deleteFileNode(row.id!);
    ElMessage.success('删除成功');
    await handleSuccess();
  } finally {
    loadingInstance.close();
  }
}

/** 获得文件图标 */
function getFileIcon(name: string) {
  const extension =
    name.split(/[?#]/)[0]!.split('.').pop()?.toLowerCase() || '';
  return ['bmp', 'gif', 'jpeg', 'jpg', 'png', 'svg', 'webp'].includes(extension)
    ? 'ep:picture'
    : 'ep:document';
}
</script>

<template>
  <Page auto-content-height>
    <div class="flex h-full flex-col gap-4">
      <!-- 云盘概览，独立于列表筛选 -->
      <Storage ref="storageRef" />

      <div class="flex min-h-0 flex-1 gap-4">
        <!-- 左侧文件导航与分类 -->
        <div
          class="w-[210px] shrink-0 overflow-y-auto rounded-lg bg-background p-4"
        >
          <div class="mb-3 font-bold leading-5">企业云盘</div>
          <div class="flex flex-col gap-1">
            <ElButton
              v-for="item in OA_FILE_SCOPE_OPTIONS"
              :key="item.value"
              :text="scope !== item.value"
              :type="scope === item.value ? 'primary' : 'default'"
              class="!ml-0 !flex !h-9 w-full !items-center !justify-start !gap-0 !px-3 [&>span]:!ml-0"
              @click="handleScope(item.value)"
            >
              <IconifyIcon :icon="item.icon" class="mr-2 size-4 shrink-0" />{{ item.label }}
            </ElButton>
          </div>
          <ElDivider class="!my-3" />
          <div class="mb-2 text-[13px] leading-5 text-muted-foreground">文件分类</div>
          <div class="flex flex-col gap-1">
            <ElButton
              v-for="item in categoryOptions"
              :key="item.value"
              :text="(latestFormValues.category || OA_FILE_CATEGORY.ALL) !== item.value"
              :type="
                (latestFormValues.category || OA_FILE_CATEGORY.ALL) ===
                item.value
                  ? 'primary'
                  : 'default'
              "
              class="!ml-0 !flex !h-9 w-full !items-center !justify-start !gap-0 !px-3 [&>span]:!ml-0"
              @click="handleCategory(item.value)"
            >
              <IconifyIcon
                :icon="fileCategoryIcons[item.value]!"
                class="mr-2 size-4 shrink-0"
              />{{ item.label }}
            </ElButton>
          </div>
        </div>

        <!-- 文件列表与目录面包屑 -->
        <Grid class="min-w-0 flex-1">
          <template #toolbar-actions>
            <ElBreadcrumb separator="/">
              <ElBreadcrumbItem v-for="(item, index) in paths" :key="item.id">
                <ElLink underline="never" @click="handlePath(index)">
                  {{ item.name }}
                </ElLink>
              </ElBreadcrumbItem>
            </ElBreadcrumb>
          </template>
          <template #toolbar-tools>
            <TableAction
              :actions="[
                {
                  label: '新建文件夹',
                  type: 'primary',
                  icon: ACTION_ICON.ADD,
                  auth: ['oa:file:create'],
                  ifShow: canCreate,
                  onClick: () => openForm('create'),
                },
              ]"
            />
            <Upload
              v-if="canCreate && hasAccessByCodes(['oa:file:create'])"
              :parent-id="currentParentId"
              class="ml-3"
              @success="handleSuccess"
            />
          </template>
          <template #name="{ row }">
            <div class="flex items-center gap-2">
              <IconifyIcon
                :icon="
                  row.type === OA_FILE_NODE_TYPE.FOLDER
                    ? 'ep:folder'
                    : getFileIcon(row.name)
                "
              />
              <span v-if="scope === OA_FILE_SCOPE.RECYCLE">{{ row.name }}</span>
              <span
                v-else
                class="cursor-pointer text-primary"
                @click="handleOpen(row)"
              >
                {{ row.name }}
              </span>
            </div>
          </template>
          <template #actions="{ row }">
            <TableAction
              v-if="scope === OA_FILE_SCOPE.RECYCLE"
              :actions="[
                {
                  label: '恢复',
                  type: 'primary',
                  link: true,
                  auth: ['oa:file:delete'],
                  onClick: handleRestore.bind(null, row),
                },
                {
                  label: '彻底删除',
                  type: 'danger',
                  link: true,
                  auth: ['oa:file:delete'],
                  popConfirm: {
                    title: `彻底删除“${row.name}”及其全部子文件后将无法恢复，是否继续？`,
                    confirm: handleDelete.bind(null, row),
                  },
                },
              ]"
            />
            <TableAction
              v-else
              :actions="[
                {
                  label: '下载',
                  type: 'primary',
                  link: true,
                  ifShow:
                    row.type === OA_FILE_NODE_TYPE.FILE &&
                    (row.level || 0) >= OA_FILE_PERMISSION_LEVEL.DOWNLOAD,
                  onClick: handleDownload.bind(null, row),
                },
                {
                  label: '共享',
                  type: 'primary',
                  link: true,
                  ifShow: (row.level || 0) >= OA_FILE_PERMISSION_LEVEL.MANAGE,
                  auth: ['oa:file:share'],
                  onClick: () => openPermissionForm(row.id!),
                },
              ]"
              :drop-down-actions="[
                {
                  label: row.favorite ? '取消收藏' : '收藏',
                  onClick: handleFavorite.bind(null, row),
                },
                {
                  label: '重命名',
                  ifShow: (row.level || 0) >= OA_FILE_PERMISSION_LEVEL.EDIT,
                  auth: ['oa:file:update'],
                  onClick: () => openForm('rename', row),
                },
                {
                  label: '复制',
                  ifShow:
                    (row.level || 0) >= OA_FILE_PERMISSION_LEVEL.DOWNLOAD,
                  auth: ['oa:file:create'],
                  onClick: () => openForm('copy', row),
                },
                {
                  label: '移动',
                  ifShow: isOwner(row),
                  auth: ['oa:file:update'],
                  onClick: () => openForm('move', row),
                },
                {
                  label: '删除',
                  type: 'danger',
                  ifShow: isOwner(row),
                  auth: ['oa:file:delete'],
                  popConfirm: {
                    title: `是否将“${row.name}”移入回收站？`,
                    confirm: handleRecycle.bind(null, row),
                  },
                },
              ]"
            />
          </template>
        </Grid>
      </div>

      <!-- 文件预览、新增、重命名、移动、复制及共享弹窗 -->
      <PreviewModal />
      <NodeFormModal @success="handleSuccess" />
      <PermissionListModal @success="handleSuccess" />
    </div>
  </Page>
</template>
