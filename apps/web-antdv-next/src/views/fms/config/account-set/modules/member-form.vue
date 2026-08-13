<script lang="ts" setup>
import type { FmsAccountSetApi } from '#/api/fms/config/account-set';
import type { FmsAccountUserApi } from '#/api/fms/config/account-user';

import { ref } from 'vue';

import { useVbenForm, useVbenModal } from '@vben/common-ui';
import { CommonStatusEnum, DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { Alert, Button, message, Select, Table, Tag } from 'antdv-next';

import {
  getAccountUserList,
  updateAccountUserList,
} from '#/api/fms/config/account-user';
import { getUserList } from '#/api/system/user';
import { DictTag } from '#/components/dict-tag';

import { useAddMemberFormSchema } from '../data';

defineOptions({ name: 'FmsAccountSetMemberForm' });

const emit = defineEmits<{ success: [] }>();

const accountSet = ref<FmsAccountSetApi.AccountSet>(); // 当前账套
const memberList = ref<FmsAccountUserApi.AccountUser[]>([]); // 账套成员列表
const levelOptions = getDictOptions(
  DICT_TYPE.FMS_ACCOUNT_USER_LEVEL,
  'number',
).map(({ label, value }) => ({ label, value: Number(value) })); // 权限级别选项

/** 移出账套成员 */
function removeMember(index: number) {
  memberList.value.splice(index, 1);
}

/** 打开添加成员弹窗 */
function handleAdd() {
  addModalApi.open();
}

const [AddForm, addFormApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 88,
  },
  layout: 'horizontal',
  schema: useAddMemberFormSchema(),
  showDefaultActions: false,
});

const [AddModal, addModalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await addFormApi.validate();
    if (!valid) {
      return;
    }
    const values = await addFormApi.getValues();
    if (!values.userIds || values.userIds.length === 0) {
      message.warning('请选择需要添加的用户');
      return;
    }
    addModalApi.lock();
    try {
      // 查询用户详情，跳过已在账套中的用户
      const users = await getUserList(values.userIds);
      const memberUserIds = new Set(
        memberList.value.map((member) => member.userId),
      );
      const newUsers = users.filter((user) => !memberUserIds.has(user.id!));
      if (newUsers.length < users.length) {
        message.warning('已跳过已在账套中的用户');
      }
      newUsers.forEach((user) => {
        memberList.value.push({
          userId: user.id!,
          nickname: user.nickname,
          deptName: user.deptName,
          status: CommonStatusEnum.ENABLE,
          defaultStatus: false,
          founder: false,
          level: values.level,
        });
      });
      await addModalApi.close();
    } finally {
      addModalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    await addFormApi.resetForm();
  },
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    if (!accountSet.value?.id) {
      return;
    }
    modalApi.lock();
    try {
      await updateAccountUserList({
        accountSetId: accountSet.value.id,
        members: memberList.value.map((member) => ({
          userId: member.userId,
          level: member.level,
        })),
      });
      message.success('账套授权已保存');
      await modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      accountSet.value = undefined;
      memberList.value = [];
      return;
    }
    accountSet.value = modalApi.getData<FmsAccountSetApi.AccountSet>();
    if (!accountSet.value?.id) {
      return;
    }
    modalApi.lock();
    try {
      memberList.value = await getAccountUserList(accountSet.value.id);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal title="账套授权" class="w-[820px]">
    <Alert
      type="info"
      show-icon
      :closable="false"
      message="查看者可以查看账套数据，会计可以维护账套数据，主管可以管理账套及成员"
    />
    <div class="my-3 flex items-center justify-between">
      <div>
        <span class="text-muted-foreground text-sm">账套名称：</span>
        <span class="font-semibold">{{ accountSet?.companyName }}</span>
      </div>
      <Button type="primary" @click="handleAdd">添加成员</Button>
    </div>
    <Table
      :columns="[
        { title: '序号', key: 'index', width: 70, align: 'center' },
        { title: '姓名', key: 'nickname', minWidth: 140 },
        { title: '部门', key: 'deptName', minWidth: 140 },
        { title: '手机号码', key: 'mobile', width: 140 },
        { title: '状态', key: 'status', width: 90, align: 'center' },
        { title: '权限级别', key: 'level', width: 130, align: 'center' },
        { title: '操作', key: 'action', width: 90, align: 'center' },
      ]"
      :data-source="memberList"
      :pagination="false"
      row-key="userId"
      bordered
      :scroll="{ y: 420 }"
      size="small"
    >
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.key === 'index'">
          {{ index + 1 }}
        </template>
        <template v-else-if="column.key === 'nickname'">
          {{ record.nickname || `用户 #${record.userId}` }}
          <Tag v-if="record.founder" color="success" class="ml-1">创建人</Tag>
        </template>
        <template v-else-if="column.key === 'deptName'">
          {{ record.deptName || '-' }}
        </template>
        <template v-else-if="column.key === 'mobile'">
          {{ record.mobile || '-' }}
        </template>
        <template v-else-if="column.key === 'status'">
          <DictTag :type="DICT_TYPE.COMMON_STATUS" :value="record.status" />
        </template>
        <template v-else-if="column.key === 'level'">
          <DictTag
            v-if="record.founder"
            :type="DICT_TYPE.FMS_ACCOUNT_USER_LEVEL"
            :value="record.level"
          />
          <Select
            v-else
            v-model:value="record.level"
            :options="levelOptions"
            class="w-[100px]"
          />
        </template>
        <template v-else-if="column.key === 'action'">
          <Button
            type="link"
            danger
            :disabled="record.founder"
            @click="removeMember(index)"
          >
            移出
          </Button>
        </template>
      </template>
    </Table>
  </Modal>

  <!-- 弹窗：添加账套成员 -->
  <AddModal title="添加成员" class="w-[560px]">
    <AddForm class="mx-4" />
  </AddModal>
</template>
