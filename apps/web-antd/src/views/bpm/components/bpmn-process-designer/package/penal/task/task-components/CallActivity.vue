<script lang="ts" setup>
import { inject, nextTick, onMounted, ref, toRaw, watch } from 'vue';

import { confirm, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  Button,
  Divider,
  Form,
  FormItem,
  Input,
  Select,
  SelectOption,
  Switch,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getModelList } from '#/api/bpm/model';

interface FormData {
  processInstanceName: string;
  calledElement: string;
  inheritVariables: boolean;
  businessKey: string;
  inheritBusinessKey: boolean;
  calledElementType: string;
}

defineOptions({ name: 'CallActivity' });
const props = defineProps({
  id: { type: String, default: '' },
  type: { type: String, default: '' },
});
const prefix = inject('prefix');

const formData = ref<FormData>({
  processInstanceName: '',
  calledElement: '',
  inheritVariables: false,
  businessKey: '',
  inheritBusinessKey: false,
  calledElementType: 'key',
});
const inVariableList = ref<any[]>([]);
const outVariableList = ref<any[]>([]);
const variableType = ref<string>(); // 参数类型
const editingVariableIndex = ref<number>(-1); // 编辑参数下标
const varialbeFormRef = ref();
const varialbeFormData = ref<{
  source: string;
  target: string;
}>({
  source: '',
  target: '',
});

const bpmnInstances = () => (window as any)?.bpmnInstances;
const bpmnElement = ref<any>();
const otherExtensionList = ref<any[]>([]);
const childProcessOptions = ref<{ key: string; name: string }[]>([]);

const initCallActivity = () => {
  bpmnElement.value = bpmnInstances().bpmnElement;

  // 初始化所有配置项
  Object.keys(formData.value).forEach((key: string) => {
    // @ts-ignore
    formData.value[key] =
      bpmnElement.value.businessObject[key] ??
      formData.value[key as keyof FormData];
  });

  otherExtensionList.value = []; // 其他扩展配置
  inVariableList.value.length = 0;
  outVariableList.value.length = 0;
  // 初始化输入参数
  bpmnElement.value.businessObject?.extensionElements?.values?.forEach(
    (ex: any) => {
      if (ex.$type === `${prefix}:In`) {
        inVariableList.value.push(ex);
      } else if (ex.$type === `${prefix}:Out`) {
        outVariableList.value.push(ex);
      } else {
        otherExtensionList.value.push(ex);
      }
    },
  );
};

const updateCallActivityAttr = (attr: keyof FormData) => {
  bpmnInstances().modeling.updateProperties(toRaw(bpmnElement.value), {
    [attr]: formData.value[attr],
  });
};

const [VariableModal, variableModalApi] = useVbenModal({
  title: '参数配置',
  onConfirm: () => {
    saveVariable();
  },
});

const openVariableForm = (type: string, data: any, index: number) => {
  editingVariableIndex.value = index;
  variableType.value = type;
  varialbeFormData.value = index === -1 ? {} : { ...data };
  variableModalApi.open();
};

const removeVariable = async (type: string, index: number) => {
  try {
    await confirm({
      title: '提示',
      content: '是否确认删除？',
    });
    if (type === 'in') {
      inVariableList.value.splice(index, 1);
    }
    if (type === 'out') {
      outVariableList.value.splice(index, 1);
    }
    updateElementExtensions();
  } catch (error: any) {
    console.error(`[removeVariable error ]: ${error.message || error}`);
  }
};

const saveVariable = async () => {
  try {
    await varialbeFormRef.value?.validate();
  } catch {
    // 验证失败直接返回
    return;
  }

  if (editingVariableIndex.value === -1) {
    if (variableType.value === 'in') {
      inVariableList.value.push(
        bpmnInstances().moddle.create(`${prefix}:In`, {
          ...varialbeFormData.value,
        }),
      );
    }
    if (variableType.value === 'out') {
      outVariableList.value.push(
        bpmnInstances().moddle.create(`${prefix}:Out`, {
          ...varialbeFormData.value,
        }),
      );
    }
    updateElementExtensions();
  } else {
    if (variableType.value === 'in') {
      inVariableList.value[editingVariableIndex.value].source =
        varialbeFormData.value.source;
      inVariableList.value[editingVariableIndex.value].target =
        varialbeFormData.value.target;
    }
    if (variableType.value === 'out') {
      outVariableList.value[editingVariableIndex.value].source =
        varialbeFormData.value.source;
      outVariableList.value[editingVariableIndex.value].target =
        varialbeFormData.value.target;
    }
  }
  variableModalApi.close();
};

const updateElementExtensions = () => {
  const extensions = bpmnInstances().moddle.create('bpmn:ExtensionElements', {
    values: [
      ...inVariableList.value,
      ...outVariableList.value,
      ...otherExtensionList.value,
    ],
  });
  bpmnInstances().modeling.updateProperties(toRaw(bpmnElement.value), {
    extensionElements: extensions,
  });
};

watch(
  () => props.id,
  (val) => {
    val &&
      val.length > 0 &&
      nextTick(() => {
        initCallActivity();
      });
  },
  { immediate: true },
);

const gridOptions = {
  columns: [
    { title: '源', field: 'source', minWidth: 100 },
    { title: '目标', field: 'target', minWidth: 100 },
    {
      title: '操作',
      width: 130,
      slots: { default: 'action' },
      fixed: 'right' as const,
    },
  ],
  border: true,
  showOverflow: true,
  height: 'auto',
  toolbarConfig: { enabled: false },
  pagerConfig: { enabled: false },
};

const [InVariableGrid, inVariableGridApi] = useVbenVxeGrid({
  gridOptions,
});

const [OutVariableGrid, outVariableGridApi] = useVbenVxeGrid({
  gridOptions,
});

// 使用浅层监听，避免无限循环
watch(
  () => [...inVariableList.value],
  (val) => {
    inVariableGridApi.setGridOptions({ data: val });
  },
);

watch(
  () => [...outVariableList.value],
  (val) => {
    outVariableGridApi.setGridOptions({ data: val });
  },
);

/** 选择子流程, 更新 bpmn callActivity calledElement 和 processInstanceName 属性 */
const handleChildProcessChange = (key: any) => {
  if (!key) return;
  const selected = childProcessOptions.value.find((item) => item.key === key);
  if (selected) {
    formData.value.calledElement = selected.key;
    formData.value.processInstanceName = selected.name;
    updateCallActivityAttr('calledElement');
    updateCallActivityAttr('processInstanceName');
  }
};

onMounted(async () => {
  try {
    // 获取流程模型列表
    const list = await getModelList(undefined);
    childProcessOptions.value = list.map((item) => ({
      key: item.key,
      name: item.name,
    }));
  } catch (error) {
    console.error('获取子流程列表失败', error);
  }
});
</script>

<template>
  <div class="-mx-2">
    <Form :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
      <FormItem label="被调用子流程">
        <Select
          v-model:value="formData.calledElement"
          placeholder="请选择子流程"
          allow-clear
          @change="handleChildProcessChange"
        >
          <SelectOption
            v-for="item in childProcessOptions"
            :key="item.key"
            :value="item.key"
            :label="item.name"
          >
            {{ item.name }}
          </SelectOption>
        </Select>
      </FormItem>

      <FormItem label="继承变量">
        <Switch
          v-model:checked="formData.inheritVariables"
          @change="updateCallActivityAttr('inheritVariables')"
        />
      </FormItem>

      <FormItem label="继承业务键">
        <Switch
          v-model:checked="formData.inheritBusinessKey"
          @change="updateCallActivityAttr('inheritBusinessKey')"
        />
      </FormItem>

      <FormItem v-if="!formData.inheritBusinessKey" label="业务键表达式">
        <Input
          v-model:value="formData.businessKey"
          allow-clear
          placeholder="请输入业务键表达式"
          @change="updateCallActivityAttr('businessKey')"
        />
      </FormItem>

      <div
        class="mb-1 mt-2 flex items-center justify-between border-t border-gray-200 pt-2"
      >
        <span class="flex items-center text-sm font-medium"> 输入参数 </span>
        <Button
          class="flex items-center"
          size="small"
          type="link"
          @click="openVariableForm('in', null, -1)"
        >
          <template #icon>
            <IconifyIcon icon="ep:plus" />
          </template>
          添加参数
        </Button>
      </div>
      <InVariableGrid class="-mx-2 mb-4">
        <template #action="{ row, rowIndex }">
          <Button
            size="small"
            type="link"
            @click="openVariableForm('in', row, rowIndex)"
          >
            编辑
          </Button>
          <Divider type="vertical" />
          <Button
            size="small"
            type="link"
            danger
            @click="removeVariable('in', rowIndex)"
          >
            移除
          </Button>
        </template>
      </InVariableGrid>

      <div
        class="mb-1 mt-2 flex items-center justify-between border-t border-gray-200 pt-2"
      >
        <span class="flex items-center text-sm font-medium"> 输出参数 </span>
        <Button
          class="flex items-center"
          size="small"
          type="link"
          @click="openVariableForm('out', null, -1)"
        >
          <template #icon>
            <IconifyIcon icon="lucide:plus" class="size-4" />
          </template>
          添加参数
        </Button>
      </div>
      <OutVariableGrid class="-mx-2">
        <template #action="{ row, rowIndex }">
          <Button
            size="small"
            type="link"
            @click="openVariableForm('out', row, rowIndex)"
          >
            编辑
          </Button>
          <Divider type="vertical" />
          <Button
            size="small"
            type="link"
            danger
            @click="removeVariable('out', rowIndex)"
          >
            移除
          </Button>
        </template>
      </OutVariableGrid>
    </Form>

    <VariableModal>
      <Form
        :model="varialbeFormData"
        ref="varialbeFormRef"
        :label-col="{ span: 4 }"
        :wrapper-col="{ span: 18 }"
      >
        <FormItem
          label="源"
          name="source"
          :rules="[
            {
              required: true,
              message: '源不能为空',
              trigger: ['blur', 'change'],
            },
          ]"
        >
          <Input v-model:value="varialbeFormData.source" allow-clear />
        </FormItem>
        <FormItem
          label="目标"
          name="target"
          :rules="[
            {
              required: true,
              message: '目标不能为空',
              trigger: ['blur', 'change'],
            },
          ]"
        >
          <Input v-model:value="varialbeFormData.target" allow-clear />
        </FormItem>
      </Form>
    </VariableModal>
  </div>
</template>
