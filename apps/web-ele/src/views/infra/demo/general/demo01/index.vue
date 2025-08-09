<script lang="ts" setup>
import type { Demo01ContactApi } from '#/api/infra/demo/demo01';

import { h, onMounted, reactive, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { Download, Plus, Trash2 } from '@vben/icons';
import {
  cloneDeep,
  downloadFileFromBlobPart,
  formatDateTime,
  isEmpty,
} from '@vben/utils';

import {
  ElButton,
  ElDatePicker,
  ElForm,
  ElFormItem,
  ElInput,
  ElLoading,
  ElMessage,
  ElOption,
  ElPagination,
  ElSelect,
} from 'element-plus';

import { VxeColumn, VxeTable } from '#/adapter/vxe-table';
import {
  deleteDemo01Contact,
  deleteDemo01ContactList,
  exportDemo01Contact,
  getDemo01ContactPage,
} from '#/api/infra/demo/demo01';
import { ContentWrap } from '#/components/content-wrap';
import { DictTag } from '#/components/dict-tag';
import { TableToolbar } from '#/components/table-toolbar';
import { useTableToolbar } from '#/hooks';
import { $t } from '#/locales';
import { DICT_TYPE, getDictOptions } from '#/utils';

import Demo01ContactForm from './modules/form.vue';

const loading = ref(true); // 列表的加载中
const list = ref<Demo01ContactApi.Demo01Contact[]>([]); // 列表的数据

const total = ref(0); // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  name: undefined,
  sex: undefined,
  createTime: undefined,
});
const queryFormRef = ref(); // 搜索的表单
const exportLoading = ref(false); // 导出的加载中

/** 查询列表 */
const getList = async () => {
  loading.value = true;
  try {
    const params = cloneDeep(queryParams) as any;
    if (params.createTime && Array.isArray(params.createTime)) {
      params.createTime = (params.createTime as string[]).join(',');
    }
    const data = await getDemo01ContactPage(params);
    list.value = data.list;
    total.value = data.total;
  } finally {
    loading.value = false;
  }
};

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

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Demo01ContactForm,
  destroyOnClose: true,
});

/** 创建示例联系人 */
function handleCreate() {
  formModalApi.setData({}).open();
}

/** 编辑示例联系人 */
function handleEdit(row: Demo01ContactApi.Demo01Contact) {
  formModalApi.setData(row).open();
}

/** 删除示例联系人 */
async function handleDelete(row: Demo01ContactApi.Demo01Contact) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.id]),
    background: 'rgba(0, 0, 0, 0.7)',
  });
  try {
    await deleteDemo01Contact(row.id as number);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.id]));
    await getList();
  } finally {
    loadingInstance.close();
  }
}

/** 批量删除示例联系人 */
async function handleDeleteBatch() {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting'),
    background: 'rgba(0, 0, 0, 0.7)',
  });
  try {
    await deleteDemo01ContactList(checkedIds.value);
    checkedIds.value = [];
    ElMessage.success($t('ui.actionMessage.deleteSuccess'));
    await getList();
  } finally {
    loadingInstance.close();
  }
}

const checkedIds = ref<number[]>([]);
function handleRowCheckboxChange({
  records,
}: {
  records: Demo01ContactApi.Demo01Contact[];
}) {
  checkedIds.value = records.map((item) => item.id);
}

/** 导出表格 */
async function onExport() {
  try {
    exportLoading.value = true;
    const data = await exportDemo01Contact(queryParams);
    downloadFileFromBlobPart({ fileName: '示例联系人.xls', source: data });
  } finally {
    exportLoading.value = false;
  }
}

/** 初始化 */
const { hiddenSearchBar, tableToolbarRef, tableRef } = useTableToolbar();
onMounted(() => {
  getList();
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="getList" />

    <ContentWrap v-if="!hiddenSearchBar">
      <!-- 搜索工作栏 -->
      <ElForm :model="queryParams" ref="queryFormRef" inline>
        <ElFormItem label="名字">
          <ElInput
            v-model="queryParams.name"
            placeholder="请输入名字"
            clearable
            @keyup.enter="handleQuery"
            class="!w-[240px]"
          />
        </ElFormItem>
        <ElFormItem label="性别">
          <ElSelect
            v-model="queryParams.sex"
            placeholder="请选择性别"
            clearable
            class="!w-[240px]"
          >
            <ElOption
              v-for="dict in getDictOptions(
                DICT_TYPE.SYSTEM_USER_SEX,
                'number',
              )"
              :key="dict.value"
              :value="dict.value"
              :label="dict.label"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="创建时间">
          <ElDatePicker
            v-model="queryParams.createTime"
            type="daterange"
            value-format="YYYY-MM-DD"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            class="!w-[240px]"
          />
        </ElFormItem>
        <ElFormItem>
          <ElButton class="ml-2" @click="resetQuery"> 重置 </ElButton>
          <ElButton class="ml-2" @click="handleQuery" type="primary">
            搜索
          </ElButton>
        </ElFormItem>
      </ElForm>
    </ContentWrap>

    <!-- 列表 -->
    <ContentWrap title="示例联系人">
      <template #extra>
        <TableToolbar
          ref="tableToolbarRef"
          v-model:hidden-search="hiddenSearchBar"
        >
          <ElButton
            class="ml-2"
            :icon="h(Plus)"
            type="primary"
            @click="handleCreate"
            v-access:code="['infra:demo01-contact:create']"
          >
            {{ $t('ui.actionTitle.create', ['示例联系人']) }}
          </ElButton>
          <ElButton
            :icon="h(Download)"
            type="primary"
            class="ml-2"
            :loading="exportLoading"
            @click="onExport"
            v-access:code="['infra:demo01-contact:export']"
          >
            {{ $t('ui.actionTitle.export') }}
          </ElButton>
          <ElButton
            :icon="h(Trash2)"
            type="danger"
            class="ml-2"
            :disabled="isEmpty(checkedIds)"
            @click="handleDeleteBatch"
            v-access:code="['infra:demo01-contact:delete']"
          >
            批量删除
          </ElButton>
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
        <VxeColumn field="name" title="名字" align="center" />
        <VxeColumn field="sex" title="性别" align="center">
          <template #default="{ row }">
            <DictTag :type="DICT_TYPE.SYSTEM_USER_SEX" :value="row.sex" />
          </template>
        </VxeColumn>
        <VxeColumn field="birthday" title="出生年" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.birthday) }}
          </template>
        </VxeColumn>
        <VxeColumn field="description" title="简介" align="center" />
        <VxeColumn field="avatar" title="头像" align="center" />
        <VxeColumn field="createTime" title="创建时间" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </VxeColumn>
        <VxeColumn field="operation" title="操作" align="center">
          <template #default="{ row }">
            <ElButton
              size="small"
              type="primary"
              link
              @click="handleEdit(row as any)"
              v-access:code="['infra:demo01-contact:update']"
            >
              {{ $t('ui.actionTitle.edit') }}
            </ElButton>
            <ElButton
              size="small"
              type="danger"
              link
              class="ml-2"
              @click="handleDelete(row as any)"
              v-access:code="['infra:demo01-contact:delete']"
            >
              {{ $t('ui.actionTitle.delete') }}
            </ElButton>
          </template>
        </VxeColumn>
      </VxeTable>
      <!-- 分页 -->
      <div class="mt-2 flex justify-end">
        <ElPagination
          :total="total"
          v-model:current-page="queryParams.pageNo"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="getList"
          @current-change="getList"
        />
      </div>
    </ContentWrap>
  </Page>
</template>
