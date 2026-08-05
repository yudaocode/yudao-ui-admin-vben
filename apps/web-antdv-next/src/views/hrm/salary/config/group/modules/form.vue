<script lang="ts" setup>
import type { Rule } from 'antdv-next';

import type { HrmSalaryGroupApi } from '#/api/hrm/salary/config/group';
import type { SystemDeptApi } from '#/api/system/dept';

import { computed, reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { handleTree } from '@vben/utils';

import {
  Col,
  Form,
  FormItem,
  Input,
  message,
  Row,
  TreeSelect,
} from 'antdv-next';

import {
  createSalaryGroup,
  getSalaryGroup,
  updateSalaryGroup,
} from '#/api/hrm/salary/config/group';
import { getSimpleDeptList } from '#/api/system/dept';
import { $t } from '#/locales';
import HrmEmployeeMultiSelect from '#/views/hrm/employee/components/employee-multi-select.vue';

import TaxRuleSelect from '../../tax-rule/components/tax-rule-select.vue';

defineOptions({ name: 'HrmSalaryGroupForm' });

const emit = defineEmits(['success']);

const formType = ref<'create' | 'update'>('create');
const formLoading = ref(false);
const formRef = ref();
const deptTree = ref<SystemDeptApi.Dept[]>([]);
const formData = ref<HrmSalaryGroupApi.SalaryGroup>(createDefault());

const dialogTitle = computed(() =>
  formType.value === 'create'
    ? $t('ui.actionTitle.create', ['薪资组'])
    : $t('ui.actionTitle.edit', ['薪资组']),
);

const formRules = reactive<Record<string, Rule[]>>({
  name: [{ required: true, message: '薪资组名称不能为空', trigger: 'blur' }],
  taxRuleId: [
    { required: true, message: '计税规则不能为空', trigger: 'change' },
  ],
  employeeIds: [
    {
      validator: async () => {
        if (
          formData.value.deptIds?.length ||
          formData.value.employeeIds?.length
        )
          return;
        throw new Error('适用部门和适用员工不能同时为空');
      },
      trigger: 'change',
    },
  ],
});

function createDefault(): HrmSalaryGroupApi.SalaryGroup {
  return {
    name: '',
    taxRuleId: undefined,
    deptIds: [],
    employeeIds: [],
  };
}

async function loadDeptTree() {
  deptTree.value = handleTree(await getSimpleDeptList());
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    await formRef.value?.validate();
    modalApi.lock();
    try {
      await (formType.value === 'create'
        ? createSalaryGroup(formData.value)
        : updateSalaryGroup(formData.value));
      message.success($t('ui.actionMessage.operationSuccess'));
      await modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = createDefault();
      return;
    }
    const data = modalApi.getData<{ id?: number; type: 'create' | 'update' }>();
    formType.value = data?.type || 'create';
    await loadDeptTree();
    if (data?.id) {
      formLoading.value = true;
      try {
        formData.value = await getSalaryGroup(data.id);
      } finally {
        formLoading.value = false;
      }
    } else {
      formData.value = createDefault();
    }
  },
});
</script>

<template>
  <Modal :title="dialogTitle" class="w-[860px]">
    <Form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      class="mx-4"
      label-width="104px"
    >
      <Row :gutter="20">
        <Col :span="12">
          <FormItem label="薪资组" name="name">
            <Input
              v-model:value="formData.name"
              :maxlength="64"
              placeholder="请输入薪资组名称"
            />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem label="计税规则" name="taxRuleId">
            <TaxRuleSelect v-model="formData.taxRuleId" />
          </FormItem>
        </Col>
      </Row>
      <Row :gutter="20">
        <Col :span="12">
          <FormItem label="计薪标准">
            <span>21.75 天 / 月</span>
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem label="调薪规则">
            <span>按转正、调薪生效日前后的工资混合计算</span>
          </FormItem>
        </Col>
      </Row>
      <Row :gutter="20">
        <Col :span="12">
          <FormItem label="部门范围" name="deptIds">
            <TreeSelect
              v-model:value="formData.deptIds"
              :field-names="{
                label: 'name',
                value: 'id',
                children: 'children',
              }"
              :tree-data="deptTree"
              allow-clear
              class="w-full"
              multiple
              placeholder="请选择部门"
              tree-default-expand-all
              tree-checkable
            />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem label="员工范围" name="employeeIds">
            <HrmEmployeeMultiSelect
              v-model="formData.employeeIds"
              placeholder="请选择员工"
              title="选择薪资组员工"
            />
          </FormItem>
        </Col>
      </Row>
    </Form>
  </Modal>
</template>
