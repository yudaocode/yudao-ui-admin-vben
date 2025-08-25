<script lang="ts" setup>
import type { Demo03StudentApi } from '#/api/infra/demo/demo03/erp';

import { h, nextTick, onMounted, reactive, ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { Plus, Trash2 } from '@vben/icons';
import { cloneDeep, formatDateTime, isEmpty } from '@vben/utils';

import {
  Button,
  Form,
  Input,
  message,
  Pagination,
  RangePicker,
} from 'ant-design-vue';

import { VxeColumn, VxeTable } from '#/adapter/vxe-table';
import {
  deleteDemo03Grade,
  deleteDemo03GradeList,
  getDemo03GradePage,
} from '#/api/infra/demo/demo03/erp';
import { ContentWrap } from '#/components/content-wrap';
import { TableToolbar } from '#/components/table-toolbar';
import { useTableToolbar } from '#/hooks';
import { $t } from '#/locales';
import { getRangePickerDefaultProps } from '#/utils';

import Demo03GradeForm from './demo03-grade-form.vue';

const props = defineProps<{
  studentId?: number; // 学生编号（主表的关联字段）
}>();

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Demo03GradeForm,
  destroyOnClose: true,
});

/** 创建学生班级 */
function onCreate() {
  if (!props.studentId) {
    message.warning('请先选择一个学生!');
    return;
  }
  formModalApi.setData({ studentId: props.studentId }).open();
}

/** 编辑学生班级 */
function onEdit(row: Demo03StudentApi.Demo03Grade) {
  formModalApi.setData(row).open();
}

/** 删除学生班级 */
async function onDelete(row: Demo03StudentApi.Demo03Grade) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.id]),
    duration: 0,
    key: 'action_process_msg',
  });
  try {
    await deleteDemo03Grade(row.id as number);
    message.success({
      content: $t('ui.actionMessage.deleteSuccess', [row.id]),
      key: 'action_process_msg',
    });
    await getList();
  } finally {
    hideLoading();
  }
}

/** 批量删除学生班级 */
async function onDeleteBatch() {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting'),
    duration: 0,
    key: 'action_process_msg',
  });
  try {
    await deleteDemo03GradeList(checkedIds.value);
    checkedIds.value = [];
    message.success($t('ui.actionMessage.deleteSuccess'));
    await getList();
  } finally {
    hideLoading();
  }
}

const checkedIds = ref<number[]>([]);
function handleRowCheckboxChange({
  records,
}: {
  records: Demo03StudentApi.Demo03Grade[];
}) {
  checkedIds.value = records.map((item) => item.id);
}

const loading = ref(true); // 列表的加载中
const list = ref<Demo03StudentApi.Demo03Grade[]>([]); // 列表的数据
const total = ref(0); // 列表的总页数
const queryFormRef = ref(); // 搜索的表单
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  studentId: undefined,
  name: undefined,
  teacher: undefined,
  createTime: undefined,
});

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1;
  getList();
};

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields();
  handleQuery();
};
/** 查询列表 */
const getList = async () => {
  loading.value = true;
  try {
    if (!props.studentId) {
      return [];
    }
    const params = cloneDeep(queryParams) as any;
    if (params.createTime && Array.isArray(params.createTime)) {
      params.createTime = (params.createTime as string[]).join(',');
    }
    params.studentId = props.studentId;
    const data = await getDemo03GradePage(params);
    list.value = data.list;
    total.value = data.total;
  } finally {
    loading.value = false;
  }
};

/** 监听主表的关联字段的变化，加载对应的子表数据 */
watch(
  () => props.studentId,
  async (val) => {
    if (!val) {
      return;
    }
    await nextTick();
    await getList();
  },
  { immediate: true },
);

/** 初始化 */
const { hiddenSearchBar, tableToolbarRef, tableRef } = useTableToolbar();
onMounted(() => {
  getList();
});
</script>

<template>
  <FormModal @success="getList" />
  <div class="h-[600px]">
    <ContentWrap v-if="!hiddenSearchBar">
      <!-- 搜索工作栏 -->
      <Form :model="queryParams" ref="queryFormRef" layout="inline">
        <Form.Item label="学生编号" name="studentId">
          <Input
            v-model:value="queryParams.studentId"
            placeholder="请输入学生编号"
            allow-clear
            @press-enter="handleQuery"
            class="w-full"
          />
        </Form.Item>
        <Form.Item label="名字" name="name">
          <Input
            v-model:value="queryParams.name"
            placeholder="请输入名字"
            allow-clear
            @press-enter="handleQuery"
            class="w-full"
          />
        </Form.Item>
        <Form.Item label="班主任" name="teacher">
          <Input
            v-model:value="queryParams.teacher"
            placeholder="请输入班主任"
            allow-clear
            @press-enter="handleQuery"
            class="w-full"
          />
        </Form.Item>
        <Form.Item label="创建时间" name="createTime">
          <RangePicker
            v-model:value="queryParams.createTime"
            v-bind="getRangePickerDefaultProps()"
            class="w-full"
          />
        </Form.Item>
        <Form.Item>
          <Button class="ml-2" @click="resetQuery"> 重置 </Button>
          <Button class="ml-2" @click="handleQuery" type="primary">
            搜索
          </Button>
        </Form.Item>
      </Form>
    </ContentWrap>

    <!-- 列表 -->
    <ContentWrap title="学生">
      <template #extra>
        <TableToolbar
          ref="tableToolbarRef"
          v-model:hidden-search="hiddenSearchBar"
        >
          <Button
            class="ml-2"
            :icon="h(Plus)"
            type="primary"
            @click="onCreate"
            v-access:code="['infra:demo03-student:create']"
          >
            {{ $t('ui.actionTitle.create', ['学生']) }}
          </Button>
          <Button
            :icon="h(Trash2)"
            type="primary"
            danger
            class="ml-2"
            :disabled="isEmpty(checkedIds)"
            @click="onDeleteBatch"
            v-access:code="['infra:demo03-student:delete']"
          >
            批量删除
          </Button>
        </TableToolbar>
      </template>
      <VxeTable
        ref="tableRef"
        :data="list"
        show-overflow
        :loading="loading"
        @checkbox-all="handleRowCheckboxChange"
        @checkbox-change="handleRowCheckboxChange"
      >
        <VxeColumn type="checkbox" width="40" />
        <VxeColumn field="id" title="编号" align="center" />
        <VxeColumn field="studentId" title="学生编号" align="center" />
        <VxeColumn field="name" title="名字" align="center" />
        <VxeColumn field="teacher" title="班主任" align="center" />
        <VxeColumn field="createTime" title="创建时间" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </VxeColumn>
        <VxeColumn field="operation" title="操作" align="center">
          <template #default="{ row }">
            <Button
              size="small"
              type="link"
              @click="onEdit(row as any)"
              v-access:code="['infra:demo03-student:update']"
            >
              {{ $t('ui.actionTitle.edit') }}
            </Button>
            <Button
              size="small"
              type="link"
              danger
              class="ml-2"
              @click="onDelete(row as any)"
              v-access:code="['infra:demo03-student:delete']"
            >
              {{ $t('ui.actionTitle.delete') }}
            </Button>
          </template>
        </VxeColumn>
      </VxeTable>
      <!-- 分页 -->
      <div class="mt-2 flex justify-end">
        <Pagination
          :total="total"
          v-model:current="queryParams.pageNo"
          v-model:page-size="queryParams.pageSize"
          show-size-changer
          @change="getList"
        />
      </div>
    </ContentWrap>
  </div>
</template>
