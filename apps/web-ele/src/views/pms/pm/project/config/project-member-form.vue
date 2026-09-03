<script lang="ts" setup>
import type { PmsProjectMemberApi } from '#/api/pms/pm/project/member';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElAvatar, ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { updateProjectMemberList } from '#/api/pms/pm/project/member';
import { PmsProjectMemberLevel } from '#/views/pms/pm/utils/constants';

import { useProjectMemberFormSchema } from './data';

defineOptions({ name: 'PmsProjectMemberForm' });

const emit = defineEmits<{ success: [] }>(); // 定义 success 事件，用于操作成功后的回调

const formType = ref<'create' | 'update'>('create'); // 表单类型
const projectId = ref<number>(); // 当前项目编号
const projectName = ref(''); // 当前项目名称
const currentMember = ref<PmsProjectMemberApi.ProjectMember>(); // 当前编辑成员
const existingUserIds = ref<number[]>([]); // 已加入项目的用户编号
const dialogTitle = computed(
  () =>
    `${projectName.value} - ${formType.value === 'create' ? '新增成员' : '修改成员'}`,
); // 弹窗的标题

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 88,
  },
  layout: 'horizontal',
  schema: useProjectMemberFormSchema(() => existingUserIds.value),
  showDefaultActions: false,
});

/** 重置表单 */
function resetForm() {
  projectId.value = undefined;
  currentMember.value = undefined;
  existingUserIds.value = [];
}

const [Modal, modalApi] = useVbenModal({
  class: 'w-[560px]',
  async onConfirm() {
    // 校验表单
    if (!projectId.value) {
      return;
    }
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    // 提交请求；用户选择器不支持禁用已有成员，提交时跳过重复用户
    // TODO @AI：system user 选择器已支持禁用指定用户，这里接 disabledUserIds，不要提交时静默跳过。补 destroyOnClose。
    modalApi.lock();
    try {
      const values = (await formApi.getValues()) as {
        level: number;
        userIds: number[];
      };
      const newUserIds = values.userIds.filter(
        (userId) =>
          formType.value === 'update' ||
          !existingUserIds.value.includes(userId),
      );
      if (newUserIds.length === 0) {
        ElMessage.warning('所选用户均已是项目成员');
        return;
      }
      await updateProjectMemberList(
        projectId.value,
        newUserIds.map((userId) => ({ userId, level: values.level })),
      );
      ElMessage.success(
        formType.value === 'create' ? '成员添加成功' : '成员修改成功',
      );
      await modalApi.close();
      // 发送操作成功的事件
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    const data = modalApi.getData() as {
      formType: 'create' | 'update';
      member?: PmsProjectMemberApi.ProjectMember;
      memberList: PmsProjectMemberApi.ProjectMember[];
      projectId: number;
      projectName: string;
    };
    resetForm();
    formType.value = data.formType;
    projectId.value = data.projectId;
    projectName.value = data.projectName;
    currentMember.value = data.member;
    existingUserIds.value = data.memberList.map((item) => item.userId);
    // 回填表单数据
    await formApi.setValues({
      memberId: data.member?.userId,
      userIds: data.member ? [data.member.userId] : [],
      level: data.member?.level || PmsProjectMemberLevel.WRITE,
    });
  },
});
</script>

<template>
  <Modal :title="dialogTitle">
    <Form class="mx-4">
      <!-- 修改成员时，只读展示当前成员 -->
      <template #member>
        <div class="flex items-center gap-2">
          <ElAvatar :size="30" :src="currentMember?.avatar">
            {{ currentMember?.nickname?.slice(0, 1) }}
          </ElAvatar>
          <span>{{
            currentMember?.nickname || `用户 #${currentMember?.userId}`
          }}</span>
        </div>
      </template>
    </Form>
  </Modal>
</template>
