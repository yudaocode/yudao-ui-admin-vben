<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CrmPermissionApi } from '#/api/crm/permission';

import { ref, watch } from 'vue';

import { confirm, useVbenModal } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deletePermissionBatch,
  deleteSelfPermission,
  getPermissionList,
  PermissionLevelEnum,
} from '#/api/crm/permission';
import { $t } from '#/locales';
import { DICT_TYPE } from '#/utils';

import Form from './permission-form.vue';

defineOptions({ name: 'CrmPermissionList' });

const props = defineProps<{
  bizId: number; // 模块数据编号
  bizType: number; // 模块类型
  showAction: boolean; // 是否展示操作按钮
}>();

const emits = defineEmits<{
  (e: 'quitTeam'): void;
}>();

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

// 校验负责人权限和编辑权限
const validateOwnerUser = ref(false);
const validateWrite = ref(false);
const isPool = ref(false);

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

const checkedIds = ref<CrmPermissionApi.Permission[]>([]);
function setCheckedIds({
  records,
}: {
  records: CrmPermissionApi.Permission[];
}) {
  checkedIds.value = records;
}

function handleCreate() {
  formModalApi
    .setData({
      bizType: props.bizType,
      bizId: props.bizId,
    })
    .open();
}

function handleEdit() {
  formModalApi
    .setData({
      bizType: props.bizType,
      bizId: props.bizId,
      id: checkedIds.value[0]?.id,
      level: checkedIds.value[0]?.level,
    })
    .open();
}

function handleDelete() {
  if (checkedIds.value.length === 0) {
    message.error('请先选择团队成员后操作！');
    return;
  }
  return new Promise((resolve, reject) => {
    confirm({
      content: `你要将${checkedIds.value.map((item) => item.nickname).join(',')}移出团队吗？`,
    })
      .then(async () => {
        // 更新用户状态
        const res = await deletePermissionBatch(
          checkedIds.value.map((item) => item.id as number),
        );
        if (res) {
          // 提示并返回成功
          message.success($t('ui.actionMessage.operationSuccess'));
          resolve(true);
        } else {
          reject(new Error('移出失败'));
        }
      })
      .catch(() => {
        reject(new Error('取消操作'));
      });
  });
}

const userStore = useUserStore();

async function handleQuit() {
  const permission = gridApi.grid
    .getData()
    .find(
      (item) =>
        item.id === userStore.userInfo?.userId &&
        item.level === PermissionLevelEnum.OWNER,
    );
  if (permission) {
    message.warning('负责人不能退出团队！');
    return;
  }

  const userPermission = gridApi.grid
    .getData()
    .find((item) => item.id === userStore.userInfo?.userId);
  if (!userPermission) {
    message.warning('你不是团队成员！');
    return;
  }
  await deleteSelfPermission(userPermission.id);
  message.success('退出团队成员成功！');
  emits('quitTeam');
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      {
        type: 'checkbox',
        width: 50,
      },
      {
        field: 'nickname',
        title: '姓名',
      },
      {
        field: 'deptName',
        title: '部门',
      },
      {
        field: 'postNames',
        title: '岗位',
      },
      {
        field: 'level',
        title: '权限级别',
        cellRender: {
          name: 'CellDict',
          props: { type: DICT_TYPE.CRM_PERMISSION_LEVEL },
        },
      },
      {
        field: 'createTime',
        title: '加入时间',
        formatter: 'formatDateTime',
      },
    ],
    height: 'auto',
    pagerConfig: {
      enabled: false,
    },
    proxyConfig: {
      ajax: {
        query: async (_params) => {
          const res = await getPermissionList({
            bizId: props.bizId,
            bizType: props.bizType,
          });
          return res;
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: {
      refresh: { code: 'query' },
      search: true,
    },
  } as VxeTableGridOptions<CrmPermissionApi.Permission>,
  gridEvents: {
    checkboxAll: setCheckedIds,
    checkboxChange: setCheckedIds,
  },
});

defineExpose({
  openForm: handleCreate,
  validateOwnerUser,
  validateWrite,
  isPool,
});
watch(
  () => gridApi.grid.getData(),
  (data) => {
    isPool.value = false;
    if (data.length > 0) {
      isPool.value = gridApi.grid
        .getData()
        .some((item) => item.level === PermissionLevelEnum.OWNER);
      validateOwnerUser.value = false;
      validateWrite.value = false;
      const userId = userStore.userInfo?.userId;
      gridApi.grid
        .getData()
        .filter((item) => item.userId === userId)
        .forEach((item) => {
          if (item.level === PermissionLevelEnum.OWNER) {
            validateOwnerUser.value = true;
            validateWrite.value = true;
          } else if (item.level === PermissionLevelEnum.WRITE) {
            validateWrite.value = true;
          }
        });
    } else {
      isPool.value = true;
    }
  },
  {
    immediate: true,
  },
);
</script>

<template>
  <div>
    <FormModal @success="onRefresh" />
    <Grid>
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('common.create'),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              ifShow: validateOwnerUser,
              onClick: handleCreate,
            },
            {
              label: $t('common.edit'),
              type: 'primary',
              icon: ACTION_ICON.EDIT,
              ifShow: validateOwnerUser,
              onClick: handleEdit,
            },
            {
              label: $t('common.delete'),
              type: 'primary',
              danger: true,
              icon: ACTION_ICON.DELETE,
              ifShow: validateOwnerUser,
              onClick: handleDelete,
            },
            {
              label: '退出团队',
              type: 'primary',
              danger: true,
              ifShow: !validateOwnerUser,
              onClick: handleQuit,
            },
          ]"
        />
      </template>
    </Grid>
  </div>
</template>
