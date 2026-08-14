<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import type { FmsClosingTemplateApi } from '#/api/fms/closing/template';
import type { FmsSubjectApi } from '#/api/fms/config/subject';

import { computed, ref } from 'vue';

import { useAccess } from '@vben/access';
import { confirm, useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';

import { Button, Dropdown, Menu, message, Table, Tabs } from 'ant-design-vue';

import {
  deleteClosingTemplate,
  getClosingTemplateList,
} from '#/api/fms/closing/template';
import { useFmsStore } from '#/views/fms/store/fms';
import { FMS_CLOSING_TEMPLATE_CATEGORY } from '#/views/fms/utils/constants';

import TemplateForm from '../modules/template-form.vue';

defineOptions({ name: 'FmsClosingTemplateSelect' });

const emit = defineEmits<{
  select: [template?: FmsClosingTemplateApi.ClosingTemplate];
}>();

const categoryOptions = getDictOptions(
  DICT_TYPE.FMS_CLOSING_TEMPLATE_CATEGORY,
  'number',
);

/** 弹窗数据 */
interface TemplateSelectData {
  accountSetId: number; // 账套编号
  subjects: FmsSubjectApi.Subject[]; // 末级科目列表
}

const { hasAccessByCodes } = useAccess();
const fmsStore = useFmsStore(); // FMS 状态

const loading = ref(false); // 列表的加载中
const category = ref<number>(FMS_CLOSING_TEMPLATE_CATEGORY.DAILY_EXPENSE); // 当前模板分类
const templates = ref<FmsClosingTemplateApi.ClosingTemplate[]>([]); // 结账模板列表

// 模板分类页签
const categoryTabs = categoryOptions.map((item) => ({
  key: item.value,
  label: item.label,
}));

// 当前分类的模板列表
const filteredTemplates = computed(() =>
  templates.value.filter((item) => item.category === category.value),
);

// 结账模板列
const templateColumns: TableColumnsType = [
  { title: '模板名称', dataIndex: 'name', minWidth: 260 },
  { title: '分录数', dataIndex: 'entries', align: 'center', width: 90 },
  { title: '操作', key: 'action', align: 'center', width: 210 },
];

const [TemplateFormModal, templateFormModalApi] = useVbenModal({
  connectedComponent: TemplateForm,
  destroyOnClose: true,
});

const [Modal, modalApi] = useVbenModal({
  showCancelButton: false,
  showConfirmButton: false,
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      templates.value = [];
      return;
    }
    category.value = FMS_CLOSING_TEMPLATE_CATEGORY.DAILY_EXPENSE;
    await getList();
  },
});

/** 查询结账模板列表 */
async function getList() {
  const data = modalApi.getData<TemplateSelectData>();
  if (!data?.accountSetId) return;
  loading.value = true;
  try {
    templates.value = await getClosingTemplateList(data.accountSetId);
  } finally {
    loading.value = false;
  }
}

/** 使用结账模板 */
function selectTemplate(template: FmsClosingTemplateApi.ClosingTemplate) {
  emit('select', template);
  modalApi.close();
}

/** 处理新增操作 */
function handleCreate({ key }: { key: number | string }) {
  const data = modalApi.getData<TemplateSelectData>();
  if (!data) return;
  if (key === 'template') {
    templateFormModalApi
      .setData({
        accountSetId: data.accountSetId,
        subjects: data.subjects,
        category: category.value,
      })
      .open();
    return;
  }
  // 新增空白方案
  emit('select');
  modalApi.close();
}

/** 编辑结账模板 */
function handleEdit(template: FmsClosingTemplateApi.ClosingTemplate) {
  const data = modalApi.getData<TemplateSelectData>();
  if (!data) return;
  templateFormModalApi
    .setData({
      accountSetId: data.accountSetId,
      subjects: data.subjects,
      template,
    })
    .open();
}

/** 删除结账模板 */
async function handleDelete(template: FmsClosingTemplateApi.ClosingTemplate) {
  const data = modalApi.getData<TemplateSelectData>();
  if (!template.id || !data) return;
  try {
    await confirm(`确认删除结账模板“${template.name}”吗？`);
    await deleteClosingTemplate(data.accountSetId, template.id);
    message.success('删除成功');
    await getList();
  } catch {
    // 取消删除
  }
}
</script>

<template>
  <Modal title="选择结转模板" class="w-[760px]">
    <div class="mb-4 flex items-center gap-5">
      <Tabs
        v-model:active-key="category"
        :items="categoryTabs"
        class="closing-template-tabs min-w-0 flex-1"
      />
      <Dropdown
        v-if="
          fmsStore.isAccountSetWritable &&
          hasAccessByCodes(['fms:closing:update'])
        "
      >
        <Button ghost type="primary">
          <IconifyIcon class="mr-1" icon="lucide:plus" />新增
          <IconifyIcon class="ml-1" icon="lucide:chevron-down" />
        </Button>
        <template #overlay>
          <Menu @click="handleCreate">
            <Menu.Item key="template">新增模板</Menu.Item>
            <Menu.Item key="scheme">新增方案</Menu.Item>
          </Menu>
        </template>
      </Dropdown>
    </div>

    <!-- 结账模板列表 -->
    <Table
      bordered
      :columns="templateColumns"
      :custom-row="
        (record) => ({
          onDblclick: () =>
            selectTemplate(record as FmsClosingTemplateApi.ClosingTemplate),
        })
      "
      :data-source="filteredTemplates"
      :loading="loading"
      :pagination="false"
      row-key="id"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'entries'">
          {{ record.subjects.length }}
        </template>
        <template v-else-if="column.key === 'action'">
          <Button
            type="link"
            @click="
              selectTemplate(record as FmsClosingTemplateApi.ClosingTemplate)
            "
          >
            使用
          </Button>
          <template v-if="fmsStore.isAccountSetWritable">
            <Button
              v-if="hasAccessByCodes(['fms:closing:update'])"
              type="link"
              @click="
                handleEdit(record as FmsClosingTemplateApi.ClosingTemplate)
              "
            >
              编辑
            </Button>
            <Button
              v-if="hasAccessByCodes(['fms:closing:update'])"
              danger
              type="link"
              @click="
                handleDelete(record as FmsClosingTemplateApi.ClosingTemplate)
              "
            >
              删除
            </Button>
          </template>
        </template>
      </template>
    </Table>
    <div class="mt-3 text-xs text-muted-foreground">
      双击模板可直接进入结账方案表单
    </div>

    <!-- 添加或修改结账模板 -->
    <TemplateFormModal @success="getList" />
  </Modal>
</template>

<style scoped>
.closing-template-tabs :deep(.ant-tabs-nav) {
  margin-bottom: 0;
}
</style>
