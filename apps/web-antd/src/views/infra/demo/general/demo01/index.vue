<script lang="ts" setup>
import type { Demo01ContactApi } from '#/api/infra/demo/demo01';

import { ContentWrap } from '#/components/content-wrap';
import { DictTag } from '#/components/dict-tag';
import Demo01ContactForm from './modules/form.vue';
import { Page, useVbenModal } from '@vben/common-ui';
import { Download, Plus, RefreshCw, Search } from '@vben/icons';
import { Button, Form, Input, message, Pagination, RangePicker, Select } from 'ant-design-vue';
import { VxeColumn, VxeTable } from 'vxe-table';

import { deleteDemo01Contact, exportDemo01Contact, getDemo01ContactPage } from '#/api/infra/demo/demo01';
import { $t } from '#/locales';
import { getRangePickerDefaultProps } from '#/utils/date';
import { DICT_TYPE, getDictOptions } from '#/utils/dict';
import { downloadByData } from '#/utils/download';
import { h, onMounted, reactive, ref } from 'vue';
import {cloneDeep, formatDateTime} from '@vben/utils';

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
    const params = cloneDeep(queryParams) as any
    if (params.createTime && Array.isArray(params.createTime)) {
      params.createTime = (params.createTime as string[]).join(',')
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
function onCreate() {
  formModalApi.setData({}).open();
}

/** 编辑示例联系人 */
function onEdit(row: Demo01ContactApi.Demo01Contact) {
  formModalApi.setData(row).open();
}

/** 删除示例联系人 */
async function onDelete(row: Demo01ContactApi.Demo01Contact) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.id]),
    duration: 0,
    key: 'action_process_msg',
  });
  try {
    await deleteDemo01Contact(row.id as number);
    message.success({
      content: $t('ui.actionMessage.deleteSuccess', [row.id]),
      key: 'action_process_msg',
    });
    await getList();
  } catch {
    hideLoading();
  }
}

/** 导出表格 */
async function onExport() {
  try {
    exportLoading.value = true;
    const data = await exportDemo01Contact(queryParams);
    downloadByData(data, '示例联系人.xls');
  } finally {
    exportLoading.value = false;
  }
}

/** 初始化 */
onMounted(() => {
  getList();
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="getList" />

    <ContentWrap>
      <!-- 搜索工作栏 -->
      <Form class="-mb-15px" :model="queryParams" ref="queryFormRef" layout="inline">
        <Form.Item label="名字" name="name">
          <Input
            v-model:value="queryParams.name"
            placeholder="请输入名字"
            allow-clear
            @press-enter="handleQuery"
            class="!w-240px"
          />
        </Form.Item>
        <Form.Item label="性别" name="sex">
          <Select v-model:value="queryParams.sex" placeholder="请选择性别" allow-clear class="!w-240px">
            <Select.Option
              v-for="dict in getDictOptions(DICT_TYPE.SYSTEM_USER_SEX, 'number')"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </Select>
        </Form.Item>
        <Form.Item label="创建时间" name="createTime">
          <RangePicker v-model:value="queryParams.createTime" v-bind="getRangePickerDefaultProps()" class="!w-220px" />
        </Form.Item>
        <Form.Item>
          <Button class="ml-2" @click="handleQuery" :icon="h(Search)">搜索</Button>
          <Button class="ml-2" @click="resetQuery" :icon="h(RefreshCw)">重置</Button>
          <Button
            class="ml-2"
            :icon="h(Plus)"
            type="primary"
            @click="onCreate"
            v-access:code="['infra:demo01-contact:create']"
          >
            {{ $t('ui.actionTitle.create', ['示例联系人']) }}
          </Button>
          <Button
            :icon="h(Download)"
            type="primary"
            class="ml-2"
            :loading="exportLoading"
            @click="onExport"
            v-access:code="['infra:demo01-contact:export']"
          >
            {{ $t('ui.actionTitle.export') }}
          </Button>
        </Form.Item>
      </Form>
    </ContentWrap>

    <!-- 列表 -->
    <ContentWrap>
      <VxeTable :data="list" show-overflow :loading="loading">
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
            <Button
              size="small"
              type="link"
              @click="onEdit(row as any)"
              v-access:code="['infra:demo01-contact:update']"
            >
              {{ $t('ui.actionTitle.edit') }}
            </Button>
            <Button
              size="small"
              type="link"
              class="ml-2"
              @click="onDelete(row as any)"
              v-access:code="['infra:demo01-contact:delete']"
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
  </Page>
</template>
