<script lang="ts" setup>
import type { EditableMember } from './data';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SystemDeptApi } from '#/api/system/dept';

import { nextTick, onMounted, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { handleTree } from '@vben/utils';

import {
  ElAlert,
  ElAvatar,
  ElButton,
  ElMessage,
  ElOption,
  ElSelect,
  ElTag,
  ElTreeSelect,
} from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getKnowledgeLibraryMemberList,
  updateKnowledgeLibraryMemberList,
} from '#/api/pms/kb/library/member';
import { getDeptList } from '#/api/system/dept';
import { PmsKnowledgeLibraryMemberLevel } from '#/views/pms/kb/utils/constants';
import { UserSelect } from '#/views/system/user/components';

import {
  createEditableMember,
  useMemberGridColumns,
  useMemberIdentityTypeOptions,
  useMemberLevelOptions,
} from './data';

defineOptions({ name: 'PmsKnowledgeMemberForm' });

// TODO @AI：行内成员编辑能否用 VXE edit-render，少手写 Select/TreeSelect slot。v-loading 换成 lock。UserSelect 禁用已有成员。
const emit = defineEmits(['success']); // 定义 success 事件，用于操作成功后的回调

const formLoading = ref(false); // 表单加载中：加载成员列表或提交表单
const libraryId = ref(0); // 知识库编号
const memberList = ref<EditableMember[]>([]); // 成员列表
const deptTreeData = ref<SystemDeptApi.Dept[]>([]); // 部门树
const identityTypeOptions = useMemberIdentityTypeOptions(); // 成员类型选项
const levelOptions = useMemberLevelOptions(); // 成员角色选项

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useMemberGridColumns(),
    data: memberList.value,
    rowConfig: {
      isHover: true,
    },
    pagerConfig: {
      enabled: false,
    },
    toolbarConfig: {
      enabled: false,
    },
  } as VxeTableGridOptions<EditableMember>,
});

/** 刷新成员表格数据 */
async function reloadMemberList() {
  await nextTick(); // 特殊：保证 gridApi 已经初始化
  await gridApi.grid?.reloadData(memberList.value);
}

/** 添加成员 */
function addMember() {
  memberList.value.push(createEditableMember());
  reloadMemberList();
}

/** 移除成员 */
function removeMember(row: EditableMember) {
  const index = memberList.value.indexOf(row);
  if (index !== -1) {
    memberList.value.splice(index, 1);
    reloadMemberList();
  }
}

/** 处理成员身份变化 */
function handleIdentityTypeChange(member: EditableMember) {
  member.userId = undefined;
  member.deptId = undefined;
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    // 校验成员或部门是否已选择
    const editableMemberList = memberList.value.filter(
      (member) => member.level !== PmsKnowledgeLibraryMemberLevel.CREATOR,
    );
    if (
      editableMemberList.some(
        (member) =>
          (member.identityType === 'user' && !member.userId) ||
          (member.identityType === 'dept' && !member.deptId),
      )
    ) {
      ElMessage.warning('请选择成员或部门');
      return;
    }
    // 校验成员或部门是否重复
    const userIds = editableMemberList
      .filter((member) => member.identityType === 'user')
      .map((member) => member.userId);
    const deptIds = editableMemberList
      .filter((member) => member.identityType === 'dept')
      .map((member) => member.deptId);
    if (
      new Set(userIds).size !== userIds.length ||
      new Set(deptIds).size !== deptIds.length
    ) {
      ElMessage.warning('成员或部门不能重复');
      return;
    }
    // 提交请求
    modalApi.lock();
    try {
      await updateKnowledgeLibraryMemberList({
        libraryId: libraryId.value,
        members: editableMemberList.map((member) => ({
          userId: member.identityType === 'user' ? member.userId : undefined,
          deptId: member.identityType === 'dept' ? member.deptId : undefined,
          level: member.level,
        })),
      });
      ElMessage.success('成员更新成功');
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
    const data = modalApi.getData() as { id: number };
    libraryId.value = data.id;
    memberList.value = [];
    // 加载知识库成员
    formLoading.value = true;
    try {
      const data = await getKnowledgeLibraryMemberList(libraryId.value);
      memberList.value = data.map((member) => ({
        ...member,
        identityType: member.userId ? 'user' : 'dept',
      }));
      await reloadMemberList();
    } finally {
      formLoading.value = false;
    }
  },
});

onMounted(async () => {
  deptTreeData.value = handleTree(await getDeptList());
});
</script>

<template>
  <Modal title="知识库成员" class="w-[680px]">
    <div v-loading="formLoading">
      <ElAlert class="mb-4" :closable="false" type="info">
        创建人固定保留；管理员可维护知识库信息和成员，普通成员可新增内容，具体操作受内容协作权限控制。
      </ElAlert>
      <!-- 成员列表 -->
      <Grid>
        <template #identityType="{ row }">
          <ElTag
            v-if="row.level === PmsKnowledgeLibraryMemberLevel.CREATOR"
            type="success"
          >
            创建人
          </ElTag>
          <ElSelect
            v-else
            v-model="row.identityType"
            @change="handleIdentityTypeChange(row)"
          >
            <ElOption
              v-for="option in identityTypeOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </template>
        <template #member="{ row }">
          <div
            v-if="row.level === PmsKnowledgeLibraryMemberLevel.CREATOR"
            class="flex items-center gap-2"
          >
            <ElAvatar :size="28" :src="row.avatar">
              {{ (row.nickname || `用户 ${row.userId}`).slice(0, 1) }}
            </ElAvatar>
            <span>{{ row.nickname || `用户 ${row.userId}` }}</span>
          </div>
          <UserSelect
            v-else-if="row.identityType === 'user'"
            v-model="row.userId"
            :multiple="false"
            placeholder="请选择成员"
          />
          <div v-else>
            <ElTreeSelect
              v-model="row.deptId"
              :data="deptTreeData"
              :props="
                { label: 'name', value: 'id', children: 'children' } as any
              "
              class="!w-full"
              placeholder="请选择部门"
              check-strictly
            />
            <div
              v-if="row.deptName"
              class="mt-1 text-xs text-[var(--el-text-color-secondary)]"
            >
              {{ row.parentDeptName ? `${row.parentDeptName} / ` : ''
              }}{{ row.deptName }}
            </div>
          </div>
        </template>
        <template #level="{ row }">
          <ElTag
            v-if="row.level === PmsKnowledgeLibraryMemberLevel.CREATOR"
            type="success"
          >
            创建人
          </ElTag>
          <ElSelect v-else v-model="row.level">
            <ElOption
              v-for="option in levelOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </template>
        <template #action="{ row }">
          <ElButton
            v-if="row.level !== PmsKnowledgeLibraryMemberLevel.CREATOR"
            link
            type="danger"
            @click="removeMember(row)"
          >
            移除
          </ElButton>
        </template>
      </Grid>
      <ElButton class="mt-3" @click="addMember">添加成员</ElButton>
    </div>
  </Modal>
</template>
