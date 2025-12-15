<!-- eslint-disable no-unused-vars -->
<script lang="ts" setup>
import { computed, inject, nextTick, onMounted, ref, toRaw, watch } from 'vue';

import { cloneDeep } from '@vben/utils';

import { ElForm, ElFormItem, ElOption, ElSelect } from 'element-plus';

import { getFormSimpleList } from '#/api/bpm/form';

defineOptions({ name: 'ElementForm' });

const props = defineProps({
  id: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    default: '',
  },
});
const prefix = inject('prefix');

const formKey = ref<number | string | undefined>(undefined);
const businessKey = ref('');
const optionModelTitle = ref('');
const fieldList = ref<any[]>([]);
const formFieldForm = ref<any>({});
const fieldType = ref({
  long: '长整型',
  string: '字符串',
  boolean: '布尔类',
  date: '日期类',
  enum: '枚举类',
  custom: '自定义类型',
});
const formFieldIndex = ref(-1); // 编辑中的字段， -1 为新增
const formFieldOptionIndex = ref(-1); // 编辑中的字段配置项， -1 为新增
const fieldModelVisible = ref(false);
const fieldOptionModelVisible = ref(false);
const fieldOptionForm = ref<any>({}); // 当前激活的字段配置项数据
const fieldOptionType = ref(''); // 当前激活的字段配置项弹窗 类型
const fieldEnumList = ref<any[]>([]); // 枚举值列表
const fieldConstraintsList = ref<any[]>([]); // 约束条件列表
const fieldPropertiesList = ref<any[]>([]); // 绑定属性列表
const bpmnELement = ref();
const elExtensionElements = ref();
const formData = ref();
const otherExtensions = ref();

const bpmnInstances = () => (window as any)?.bpmnInstances;
const resetFormList = () => {
  bpmnELement.value = bpmnInstances().bpmnElement;
  formKey.value = bpmnELement.value.businessObject.formKey;
  // if (formKey.value?.length > 0) {
  //   formKey.value = parseInt(formKey.value)
  // }
  // 获取元素扩展属性 或者 创建扩展属性
  elExtensionElements.value =
    bpmnELement.value.businessObject.get('extensionElements') ||
    bpmnInstances().moddle.create('bpmn:ExtensionElements', { values: [] });
  // 获取元素表单配置 或者 创建新的表单配置
  formData.value =
    elExtensionElements.value.values.find(
      (ex: any) => ex.$type === `${prefix}:FormData`,
    ) || bpmnInstances().moddle.create(`${prefix}:FormData`, { fields: [] });

  // 业务标识 businessKey， 绑定在 formData 中
  businessKey.value = formData.value.businessKey;

  // 保留剩余扩展元素，便于后面更新该元素对应属性
  otherExtensions.value = elExtensionElements.value.values.filter(
    (ex: any) => ex.$type !== `${prefix}:FormData`,
  );

  // 复制原始值，填充表格
  fieldList.value = cloneDeep(formData.value.fields || []);

  // 更新元素扩展属性，避免后续报错
  updateElementExtensions();
};
const updateElementFormKey = () => {
  bpmnInstances().modeling.updateProperties(toRaw(bpmnELement.value), {
    formKey: formKey.value,
  });
};
const _updateElementBusinessKey = () => {
  bpmnInstances().modeling.updateModdleProperties(
    toRaw(bpmnELement.value),
    formData.value,
    {
      businessKey: businessKey.value,
    },
  );
};
// 根据类型调整字段type
const _changeFieldTypeType = (type: any) => {
  formFieldForm.value.type = type === 'custom' ? '' : type;
};

// 打开字段详情侧边栏
const _openFieldForm = (field: any, index: any) => {
  formFieldIndex.value = index;
  if (index === -1) {
    formFieldForm.value = {};
    // 初始化枚举值列表
    fieldEnumList.value = [];
    // 初始化约束条件列表
    fieldConstraintsList.value = [];
    // 初始化自定义属性列表
    fieldPropertiesList.value = [];
  } else {
    const FieldObject = formData.value.fields[index];
    formFieldForm.value = cloneDeep(field);
    // 设置自定义类型
    // this.$set(this.formFieldForm, "typeType", !this.fieldType[field.type] ? "custom" : field.type);
    formFieldForm.value.typeType = fieldType.value[
      field.type as keyof typeof fieldType.value
    ]
      ? field.type
      : 'custom';
    // 初始化枚举值列表
    field.type === 'enum' &&
      (fieldEnumList.value = cloneDeep(FieldObject?.values || []));
    // 初始化约束条件列表
    fieldConstraintsList.value = cloneDeep(
      FieldObject?.validation?.constraints || [],
    );
    // 初始化自定义属性列表
    fieldPropertiesList.value = cloneDeep(
      FieldObject?.properties?.values || [],
    );
  }
  fieldModelVisible.value = true;
};
// 打开字段 某个 配置项 弹窗
const _openFieldOptionForm = (option: any, index: any, type: any) => {
  fieldOptionModelVisible.value = true;
  fieldOptionType.value = type;
  formFieldOptionIndex.value = index;
  if (type === 'property') {
    fieldOptionForm.value = option ? cloneDeep(option) : {};
    return (optionModelTitle.value = '属性配置');
  }
  if (type === 'enum') {
    fieldOptionForm.value = option ? cloneDeep(option) : {};
    return (optionModelTitle.value = '枚举值配置');
  }
  fieldOptionForm.value = option ? cloneDeep(option) : {};
  return (optionModelTitle.value = '约束条件配置');
};

// 保存字段 某个 配置项
const _saveFieldOption = () => {
  if (formFieldOptionIndex.value === -1) {
    if (fieldOptionType.value === 'property') {
      fieldPropertiesList.value.push(fieldOptionForm.value);
    }
    if (fieldOptionType.value === 'constraint') {
      fieldConstraintsList.value.push(fieldOptionForm.value);
    }
    if (fieldOptionType.value === 'enum') {
      fieldEnumList.value.push(fieldOptionForm.value);
    }
  } else {
    fieldOptionType.value === 'property' &&
      fieldPropertiesList.value.splice(
        formFieldOptionIndex.value,
        1,
        fieldOptionForm.value,
      );
    fieldOptionType.value === 'constraint' &&
      fieldConstraintsList.value.splice(
        formFieldOptionIndex.value,
        1,
        fieldOptionForm.value,
      );
    fieldOptionType.value === 'enum' &&
      fieldEnumList.value.splice(
        formFieldOptionIndex.value,
        1,
        fieldOptionForm.value,
      );
  }
  fieldOptionModelVisible.value = false;
  fieldOptionForm.value = {};
};
// 保存字段配置
const _saveField = () => {
  const { id, type, label, defaultValue, datePattern } = formFieldForm.value;
  const Field = bpmnInstances().moddle.create(`${prefix}:FormField`, {
    id,
    type,
    label,
  });
  defaultValue && (Field.defaultValue = defaultValue);
  datePattern && (Field.datePattern = datePattern);
  // 构建属性
  if (fieldPropertiesList.value && fieldPropertiesList.value.length > 0) {
    const fieldPropertyList = fieldPropertiesList.value.map((fp: any) => {
      return bpmnInstances().moddle.create(`${prefix}:Property`, {
        id: fp.id,
        value: fp.value,
      });
    });
    Field.properties = bpmnInstances().moddle.create(`${prefix}:Properties`, {
      values: fieldPropertyList,
    });
  }
  // 构建校验规则
  if (fieldConstraintsList.value && fieldConstraintsList.value.length > 0) {
    const fieldConstraintList = fieldConstraintsList.value.map((fc: any) => {
      return bpmnInstances().moddle.create(`${prefix}:Constraint`, {
        name: fc.name,
        config: fc.config,
      });
    });
    Field.validation = bpmnInstances().moddle.create(`${prefix}:Validation`, {
      constraints: fieldConstraintList,
    });
  }
  // 构建枚举值
  if (fieldEnumList.value && fieldEnumList.value.length > 0) {
    Field.values = fieldEnumList.value.map((fe: any) => {
      return bpmnInstances().moddle.create(`${prefix}:Value`, {
        name: fe.name,
        id: fe.id,
      });
    });
  }
  // 更新数组 与 表单配置实例
  if (formFieldIndex.value === -1) {
    fieldList.value.push(formFieldForm.value);
    formData.value.fields.push(Field);
  } else {
    fieldList.value.splice(formFieldIndex.value, 1, formFieldForm.value);
    formData.value.fields.splice(formFieldIndex.value, 1, Field);
  }
  updateElementExtensions();
  fieldModelVisible.value = false;
};

// 移除某个 字段的 配置项
const _removeFieldOptionItem = (_option: any, index: any, type: any) => {
  // console.log(option, 'option')
  if (type === 'property') {
    fieldPropertiesList.value.splice(index, 1);
    return;
  }
  if (type === 'enum') {
    fieldEnumList.value.splice(index, 1);
    return;
  }
  fieldConstraintsList.value.splice(index, 1);
};
// 移除 字段
const _removeField = (field: any, index: any) => {
  console.warn(field, 'field');
  fieldList.value.splice(index, 1);
  formData.value.fields.splice(index, 1);
  updateElementExtensions();
};

const updateElementExtensions = () => {
  // 更新回扩展元素
  const newElExtensionElements = bpmnInstances().moddle.create(
    `bpmn:ExtensionElements`,
    {
      values: [...otherExtensions.value, formData.value],
    },
  );
  // 更新到元素上
  bpmnInstances().modeling.updateProperties(toRaw(bpmnELement.value), {
    extensionElements: newElExtensionElements,
  });
};

const formList = ref<any[]>([]); // 流程表单的下拉框的数据
const formOptions = computed(() => {
  return formList.value.map((form: any) => ({
    value: form.id,
    label: form.name,
  }));
});

onMounted(async () => {
  formList.value = await getFormSimpleList();
  formKey.value = formKey.value
    ? Number.parseInt(formKey.value as string)
    : undefined;
});

watch(
  () => props.id,
  (val: any) => {
    val &&
      val.length > 0 &&
      nextTick(() => {
        resetFormList();
      });
  },
  { immediate: true },
);
</script>

<template>
  <div class="panel-tab__content">
    <ElForm label-width="80px">
      <ElFormItem label="流程表单">
        <ElSelect v-model="formKey" clearable @change="updateElementFormKey">
          <ElOption
            v-for="item in formOptions"
            :key="item.value"
            :value="item.value"
            :label="item.label"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="业务标识">
        <ElSelect
          v-model="businessKey"
          @change="_updateElementBusinessKey"
          clearable
        >
          <ElOption
            v-for="i in fieldList"
            :key="i.id"
            :value="i.id"
            :label="i.label"
          />
          <ElOption value="" label="无" />
        </ElSelect>
      </ElFormItem>
    </ElForm>
  </div>
</template>
