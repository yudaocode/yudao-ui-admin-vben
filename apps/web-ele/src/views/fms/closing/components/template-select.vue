<script lang="ts" setup>
import type { FmsClosingTemplateApi } from '#/api/fms/closing/template';
import type { FmsSubjectApi } from '#/api/fms/config/subject';

import { computed, ref } from 'vue';

import { useAccess } from '@vben/access';
import { confirm, useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';

import {
  ElButton,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElMessage,
  ElTable,
  ElTableColumn,
  ElTabPane,
  ElTabs,
} from 'element-plus';

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

// 模板分类选项

// 当前分类的模板列表
const filteredTemplates = computed(() =>
  templates.value.filter((item) => item.category === category.value),
);

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
function handleCreate(command: 'scheme' | 'template') {
  const data = modalApi.getData<TemplateSelectData>();
  if (!data) return;
  if (command === 'template') {
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
    ElMessage.success('删除成功');
    await getList();
  } catch {
    // 取消删除
  }
}
</script>

<template>
  <Modal title="选择结转模板" class="w-[760px]">
    <div class="mb-4 flex items-center gap-5">
      <ElTabs
        v-model="category"
        class="min-w-0 flex-1 [&_.el-tabs__content]:hidden [&_.el-tabs__header]:!m-0"
      >
        <ElTabPane
          v-for="item in categoryOptions"
          :key="item.value"
          :label="item.label"
          :name="item.value"
        />
      </ElTabs>
      <ElDropdown
        v-if="
          fmsStore.isAccountSetWritable &&
          hasAccessByCodes(['fms:closing:update'])
        "
        trigger="click"
        @command="handleCreate"
      >
        <ElButton plain type="primary">
          <IconifyIcon class="mr-1" icon="lucide:plus" />新增
          <IconifyIcon class="ml-1" icon="lucide:chevron-down" />
        </ElButton>
        <template #dropdown>
          <ElDropdownMenu>
            <ElDropdownItem command="template">新增模板</ElDropdownItem>
            <ElDropdownItem command="scheme">新增方案</ElDropdownItem>
          </ElDropdownMenu>
        </template>
      </ElDropdown>
    </div>

    <!-- 结账模板列表 -->
    <ElTable
      v-loading="loading"
      :data="filteredTemplates"
      border
      highlight-current-row
      stripe
      @row-dblclick="
        (row) => selectTemplate(row as FmsClosingTemplateApi.ClosingTemplate)
      "
    >
      <ElTableColumn label="模板名称" min-width="260" prop="name" />
      <ElTableColumn align="center" label="分录数" width="90">
        <template #default="{ row }">{{ row.subjects.length }}</template>
      </ElTableColumn>
      <ElTableColumn align="center" label="操作" width="210">
        <template #default="{ row }">
          <ElButton
            link
            type="primary"
            @click="
              selectTemplate(row as FmsClosingTemplateApi.ClosingTemplate)
            "
          >
            使用
          </ElButton>
          <template v-if="fmsStore.isAccountSetWritable">
            <ElButton
              v-if="hasAccessByCodes(['fms:closing:update'])"
              link
              type="primary"
              @click="handleEdit(row as FmsClosingTemplateApi.ClosingTemplate)"
            >
              编辑
            </ElButton>
            <ElButton
              v-if="hasAccessByCodes(['fms:closing:update'])"
              link
              type="danger"
              @click="
                handleDelete(row as FmsClosingTemplateApi.ClosingTemplate)
              "
            >
              删除
            </ElButton>
          </template>
        </template>
      </ElTableColumn>
    </ElTable>
    <div class="mt-3 text-xs text-muted-foreground">
      双击模板可直接进入结账方案表单
    </div>

    <!-- 添加或修改结账模板 -->
    <TemplateFormModal @success="getList" />
  </Modal>
</template>
