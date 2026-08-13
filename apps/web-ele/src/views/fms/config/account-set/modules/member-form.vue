<script lang="ts" setup>
import type { FmsAccountSetApi } from '#/api/fms/config/account-set';
import type { FmsAccountUserApi } from '#/api/fms/config/account-user';

import { ref } from 'vue';

import { useVbenForm, useVbenModal } from '@vben/common-ui';
import { CommonStatusEnum, DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import {
  ElAlert,
  ElButton,
  ElMessage,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

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
      ElMessage.warning('请选择需要添加的用户');
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
        ElMessage.warning('已跳过已在账套中的用户');
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
      ElMessage.success('账套授权已保存');
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
    <ElAlert
      type="info"
      show-icon
      :closable="false"
      title="查看者可以查看账套数据，会计可以维护账套数据，主管可以管理账套及成员"
    />
    <div class="my-3 flex items-center justify-between">
      <div>
        <span class="text-muted-foreground text-sm">账套名称：</span>
        <span class="font-semibold">{{ accountSet?.companyName }}</span>
      </div>
      <ElButton type="primary" @click="handleAdd">添加成员</ElButton>
    </div>
    <ElTable
      :data="memberList"
      border
      max-height="420"
      row-key="userId"
      size="small"
    >
      <ElTableColumn type="index" label="序号" width="70" align="center" />
      <ElTableColumn label="姓名" min-width="140">
        <template #default="{ row }">
          {{ row.nickname || `用户 #${row.userId}` }}
          <ElTag
            v-if="row.founder"
            type="success"
            effect="plain"
            class="ml-1"
          >
            创建人
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn label="部门" min-width="140" show-overflow-tooltip>
        <template #default="{ row }">{{ row.deptName || '-' }}</template>
      </ElTableColumn>
      <ElTableColumn label="手机号码" width="140">
        <template #default="{ row }">{{ row.mobile || '-' }}</template>
      </ElTableColumn>
      <ElTableColumn label="状态" width="90" align="center">
        <template #default="{ row }">
          <DictTag :type="DICT_TYPE.COMMON_STATUS" :value="row.status" />
        </template>
      </ElTableColumn>
      <ElTableColumn label="权限级别" width="130" align="center">
        <template #default="{ row }">
          <DictTag
            v-if="row.founder"
            :type="DICT_TYPE.FMS_ACCOUNT_USER_LEVEL"
            :value="row.level"
          />
          <ElSelect v-else v-model="row.level" class="!w-[100px]">
            <ElOption
              v-for="item in levelOptions"
              :key="String(item.value)"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </template>
      </ElTableColumn>
      <ElTableColumn label="操作" width="90" align="center" fixed="right">
        <template #default="{ $index, row }">
          <ElButton
            link
            type="danger"
            :disabled="row.founder"
            @click="removeMember($index)"
          >
            移出
          </ElButton>
        </template>
      </ElTableColumn>
    </ElTable>
  </Modal>

  <!-- 弹窗：添加账套成员 -->
  <AddModal title="添加成员" class="w-[560px]">
    <AddForm class="mx-4" />
  </AddModal>
</template>
