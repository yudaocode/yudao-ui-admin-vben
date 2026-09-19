<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OaFilePermissionApi } from '#/api/oa/file/permission';
import type { SystemDeptApi } from '#/api/system/dept';
import type { SystemUserApi } from '#/api/system/user';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Button, message } from 'antdv-next';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteFilePermission,
  getFilePermissionList,
} from '#/api/oa/file/permission';
import { getSimpleDeptList } from '#/api/system/dept';
import { getSimpleUserList } from '#/api/system/user';
import { OA_FILE_SUBJECT_TYPE } from '#/views/oa/utils/constants';

import { usePermissionGridColumns } from '../data';
import PermissionForm from './permission-form.vue';

defineOptions({ name: 'OaFilePermissionList' });

const emit = defineEmits(['success']); // 定义 success 事件，用于操作成功后的回调

const nodeId = ref(0); // 文件节点编号
const userList = ref<SystemUserApi.User[]>([]); // 用户列表
const deptList = ref<SystemDeptApi.Dept[]>([]); // 部门列表

const [PermissionFormModal, permissionFormModalApi] = useVbenModal({
  connectedComponent: PermissionForm,
  destroyOnClose: true,
});

/** 获得共享对象名称 */
function getSubjectName(row: OaFilePermissionApi.FilePermission) {
  const name =
    row.subjectType === OA_FILE_SUBJECT_TYPE.USER
      ? userList.value.find((item) => item.id === row.subjectId)?.nickname
      : deptList.value.find((item) => item.id === row.subjectId)?.name;
  return name || '';
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: usePermissionGridColumns(getSubjectName),
    pagerConfig: { enabled: false },
    proxyConfig: {
      autoLoad: false,
      ajax: {
        query: async () => {
          const data = await getFilePermissionList(nodeId.value);
          return { list: data, total: data.length };
        },
      },
    },
    rowConfig: { isHover: true },
    toolbarConfig: { enabled: false },
  } as VxeTableGridOptions<OaFilePermissionApi.FilePermission>,
});

/** 打开新增、修改表单 */
function openForm(formType: string, row?: OaFilePermissionApi.FilePermission) {
  permissionFormModalApi
    .setData({ formType, nodeId: nodeId.value, row })
    .open();
}

/** 共享变更后刷新列表 */
async function handleSuccess() {
  await gridApi.query();
  emit('success');
}

/** 取消共享 */
async function handleDelete(id: number) {
  await deleteFilePermission(id);
  message.success('取消成功');
  await handleSuccess();
}

const [Modal, modalApi] = useVbenModal({
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    const data = modalApi.getData() as { id: number };
    nodeId.value = data.id;
    modalApi.lock();
    try {
      // 并行加载共享列表与共享对象上下文
      const [users, depts] = await Promise.all([
        getSimpleUserList(),
        getSimpleDeptList(),
      ]);
      userList.value = users;
      deptList.value = depts;
      await gridApi.query();
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal
    title="共享设置"
    class="w-[850px]"
    :show-confirm-button="false"
    cancel-text="关 闭"
  >
    <div>
      <!-- 列表操作 -->
      <Button type="primary" class="mb-4" @click="openForm('create')">
        <IconifyIcon icon="ep:plus" /> 新增
      </Button>
      <!-- 共享权限列表 -->
      <Grid>
        <template #actions="{ row }">
          <TableAction
            :actions="[
              {
                label: '修改',
                type: 'link',
                icon: ACTION_ICON.EDIT,
                onClick: () => openForm('update', row),
              },
              {
                label: '取消共享',
                type: 'link',
                danger: true,
                icon: ACTION_ICON.DELETE,
                popConfirm: {
                  title: '是否取消该共享权限？',
                  confirm: () => handleDelete(row.id!),
                },
              },
            ]"
          />
        </template>
      </Grid>
    </div>

    <!-- 新增、修改共享权限 -->
    <PermissionFormModal @success="handleSuccess" />
  </Modal>
</template>
