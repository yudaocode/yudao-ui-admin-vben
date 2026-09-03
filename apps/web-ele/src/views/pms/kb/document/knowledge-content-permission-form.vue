<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsKnowledgeContentPermissionApi } from '#/api/pms/kb/content/permission';
import type { PmsKnowledgeLibraryMemberApi } from '#/api/pms/kb/library/member';
import type { SystemDeptApi } from '#/api/system/dept';

import { computed, nextTick, onMounted, reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { handleTree } from '@vben/utils';

import {
  ElAlert,
  ElButton,
  ElMessage,
  ElOption,
  ElSelect,
  ElTag,
  ElTreeSelect,
} from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getKnowledgeContentPermission,
  updateKnowledgeContentPermission,
} from '#/api/pms/kb/content/permission';
import { getKnowledgeLibrary } from '#/api/pms/kb/library';
import { getKnowledgeLibraryMemberList } from '#/api/pms/kb/library/member';
import { getDeptList } from '#/api/system/dept';
import {
  PmsKnowledgeContentIdentityType,
  PmsKnowledgeContentLevel,
} from '#/views/pms/kb/utils/constants';
import { UserSelect } from '#/views/system/user/components';

import { useGridColumns, usePermissionFormSchema } from './data';

defineOptions({ name: 'PmsKnowledgeContentPermissionForm' });

// TODO @AI：已有 permission schema，剩余手写成员表格尽量走 VXE edit-render。v-loading 换成 lock。下面「定义 success 事件」注释删掉。
const emit = defineEmits(['success']);

interface EditableMember
  extends PmsKnowledgeContentPermissionApi.KnowledgeContentPermissionMember {
  identityType: PmsKnowledgeContentIdentityType;
  ownerStatus?: boolean;
}

// 定义 success 事件，用于操作成功后的回调

const formLoading = ref(false); // 表单加载中
const creatorUserId = ref(0); // 权限拥有者用户编号
const libraryOpenStatus = ref(true); // 知识库是否公开
const libraryMembers = ref<
  PmsKnowledgeLibraryMemberApi.KnowledgeLibraryMember[]
>([]); // 私有知识库可选成员
const deptTreeData = ref<SystemDeptApi.Dept[]>([]); // 部门树
const formData =
  reactive<PmsKnowledgeContentPermissionApi.KnowledgeContentPermission>({
    id: 0,
    libraryId: 0,
    openStatus: true,
    openLevel: PmsKnowledgeContentLevel.PREVIEW as number,
    creatorUserId: 0,
    currentUserLevel: 0,
    members:
      [] as PmsKnowledgeContentPermissionApi.KnowledgeContentPermissionMember[],
  }); // 表单数据
const memberList = ref<EditableMember[]>([]); // 协作者列表
// 可选用户成员
const availableUserMembers = computed(() =>
  libraryMembers.value.filter(
    (
      member,
    ): member is PmsKnowledgeLibraryMemberApi.KnowledgeLibraryMember & {
      userId: number;
    } => member.userId !== undefined && member.userId !== creatorUserId.value,
  ),
);
// 可选部门成员
const availableDeptMembers = computed(() =>
  libraryMembers.value.filter(
    (
      member,
    ): member is PmsKnowledgeLibraryMemberApi.KnowledgeLibraryMember & {
      deptId: number;
    } => member.deptId !== undefined,
  ),
);

/** 添加成员 */
function addMember() {
  memberList.value.push({
    identityType: PmsKnowledgeContentIdentityType.USER,
    level: PmsKnowledgeContentLevel.PREVIEW,
  });
  gridApi.query();
}

/** 移除成员 */
function removeMember(index: number) {
  memberList.value.splice(index, 1);
  gridApi.query();
}

/** 处理成员身份变化 */
function handleIdentityTypeChange(member: EditableMember) {
  member.userId = undefined;
  member.deptId = undefined;
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useGridColumns(),
    pagerConfig: { enabled: false },
    proxyConfig: {
      ajax: {
        query: async () => ({
          list: memberList.value,
          total: memberList.value.length,
        }),
      },
    },
    rowConfig: { isHover: true },
    toolbarConfig: { enabled: false },
  } as VxeTableGridOptions<EditableMember>,
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 100,
  },
  layout: 'horizontal',
  schema: usePermissionFormSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  class: 'w-[820px]',
  async onConfirm() {
    // 1. 校验表单
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    // 2.1 校验协作者已选择用户或部门
    const editableMembers = memberList.value.filter(
      (member) => !member.ownerStatus,
    );
    if (
      editableMembers.some(
        (member) =>
          (member.identityType === PmsKnowledgeContentIdentityType.USER &&
            !member.userId) ||
          (member.identityType === PmsKnowledgeContentIdentityType.DEPT &&
            !member.deptId),
      )
    ) {
      ElMessage.warning('请选择协作成员或部门');
      return;
    }
    // 2.2 校验用户和部门不能重复
    const userIds = editableMembers
      .filter(
        (member) =>
          member.identityType === PmsKnowledgeContentIdentityType.USER,
      )
      .map((member) => member.userId);
    const deptIds = editableMembers
      .filter(
        (member) =>
          member.identityType === PmsKnowledgeContentIdentityType.DEPT,
      )
      .map((member) => member.deptId);
    if (
      new Set(userIds).size !== userIds.length ||
      new Set(deptIds).size !== deptIds.length
    ) {
      ElMessage.warning('协作成员或部门不能重复');
      return;
    }
    // 3. 提交权限更新请求
    modalApi.lock();
    try {
      const values = await formApi.getValues();
      await updateKnowledgeContentPermission({
        ...formData,
        openStatus: values.openStatus,
        openLevel: values.openLevel,
        members: editableMembers.map((member) => ({
          id: member.id,
          userId:
            member.identityType === PmsKnowledgeContentIdentityType.USER
              ? member.userId
              : undefined,
          deptId:
            member.identityType === PmsKnowledgeContentIdentityType.DEPT
              ? member.deptId
              : undefined,
          level: member.level,
        })),
      });
      ElMessage.success('协作权限更新成功');
      // 4. 关闭弹窗并通知父组件刷新
      await modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    const data = modalApi.getData() as { id: number };
    formLoading.value = true;
    try {
      // 1. 查询内容权限
      const permission = await getKnowledgeContentPermission(data.id);
      // 2. 并行加载知识库和成员上下文
      const [library, fetchedLibraryMembers] = await Promise.all([
        getKnowledgeLibrary(permission.libraryId),
        getKnowledgeLibraryMemberList(permission.libraryId),
      ]);
      // 3. 初始化权限表单和协作者列表
      Object.assign(formData, permission);
      formApi.setValues({
        openStatus: permission.openStatus,
        openLevel: permission.openLevel,
      });
      creatorUserId.value = permission.creatorUserId;
      libraryOpenStatus.value = library.openStatus;
      libraryMembers.value = fetchedLibraryMembers;
      memberList.value = permission.members.map((member) => ({
        ...member,
        identityType: member.userId
          ? PmsKnowledgeContentIdentityType.USER
          : PmsKnowledgeContentIdentityType.DEPT,
        ownerStatus: member.userId === permission.creatorUserId,
      }));
      // 4. 刷新协作者表格
      await nextTick();
      gridApi.query();
    } finally {
      formLoading.value = false;
    }
  },
});

/** 打开弹窗 */
defineExpose({
  open: (id: number) => {
    modalApi.setData({ id }).open();
  },
});

onMounted(async () => {
  deptTreeData.value = handleTree(await getDeptList());
});
</script>

<template>
  <Modal title="内容协作权限">
    <div v-loading="formLoading">
      <ElAlert :closable="false" class="!mb-4" type="info">
        子文件夹和子文档默认继承同一套权限；知识库创建人和管理员始终拥有管理权限。
      </ElAlert>

      <Form />

      <div class="mb-2 flex items-center justify-between">
        <span class="font-semibold">协作者</span>
        <ElButton @click="addMember">添加协作者</ElButton>
      </div>
      <Grid>
        <template #identityType="{ row }">
          <ElTag v-if="row.ownerStatus" type="success">拥有者</ElTag>
          <ElSelect
            v-else
            v-model="row.identityType"
            @change="handleIdentityTypeChange(row as EditableMember)"
          >
            <ElOption
              label="成员"
              :value="PmsKnowledgeContentIdentityType.USER"
            />
            <ElOption
              label="部门"
              :value="PmsKnowledgeContentIdentityType.DEPT"
            />
          </ElSelect>
        </template>
        <template #member="{ row }">
          <span v-if="row.ownerStatus">{{ row.userName }}</span>
          <UserSelect
            v-else-if="
              row.identityType === PmsKnowledgeContentIdentityType.USER &&
              libraryOpenStatus
            "
            v-model="row.userId"
            :multiple="false"
            placeholder="请选择成员"
          />
          <ElSelect
            v-else-if="
              row.identityType === PmsKnowledgeContentIdentityType.USER
            "
            v-model="row.userId"
            class="!w-full"
            filterable
            placeholder="请选择知识库成员"
          >
            <ElOption
              v-for="member in availableUserMembers"
              :key="member.userId"
              :label="member.nickname || `用户 ${member.userId}`"
              :value="member.userId"
            />
          </ElSelect>
          <ElTreeSelect
            v-else-if="libraryOpenStatus"
            v-model="row.deptId"
            :data="deptTreeData"
            :props="{ label: 'name', value: 'id', children: 'children' } as any"
            class="!w-full"
            check-strictly
            placeholder="请选择部门"
          />
          <ElSelect
            v-else
            v-model="row.deptId"
            class="!w-full"
            filterable
            placeholder="请选择知识库部门"
          >
            <ElOption
              v-for="member in availableDeptMembers"
              :key="member.deptId"
              :label="member.deptName || `部门 ${member.deptId}`"
              :value="member.deptId"
            />
          </ElSelect>
        </template>
        <template #level="{ row }">
          <ElTag v-if="row.ownerStatus" type="success">管理员</ElTag>
          <ElSelect v-else v-model="row.level">
            <ElOption
              v-for="option in getDictOptions(
                DICT_TYPE.PMS_KNOWLEDGE_CONTENT_LEVEL,
                'number',
              )"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </template>
        <template #action="{ row, rowIndex }">
          <ElButton
            v-if="!row.ownerStatus"
            link
            type="danger"
            @click="removeMember(rowIndex)"
          >
            移除
          </ElButton>
        </template>
      </Grid>
    </div>
  </Modal>
</template>
