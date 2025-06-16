<script lang="ts" setup>
import type { Ref } from 'vue';

import { inject, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { Button, Input, Select } from 'ant-design-vue';

import { testWorkflow } from '#/api/ai/workflow';
import Tinyflow from '#/components/tinyflow/tinyflow.vue';

defineProps<{
  provider: any;
}>();

const tinyflowRef = ref();
const workflowData = inject('workflowData') as Ref;
const params4Test = ref<any[]>([]);
const paramsOfStartNode = ref<any>({});
const testResult = ref(null);
const loading = ref(false);
const error = ref(null);

const [Drawer, drawerApi] = useVbenDrawer({
  footer: false,
  closeOnClickModal: false,
  modal: false,
});
/** 展示工作流测试抽屉 */
const testWorkflowModel = () => {
  drawerApi.open();
  const startNode = getStartNode();

  // 获取参数定义
  const parameters = startNode.data?.parameters || [];
  const paramDefinitions = {};

  // 加入参数选项方便用户添加非必须参数
  parameters.forEach((param) => {
    paramDefinitions[param.name] = param;
  });

  function mergeIfRequiredButNotSet(target) {
    const needPushList = [];
    for (const key in paramDefinitions) {
      const param = paramDefinitions[key];

      if (param.required) {
        const item = target.find((item) => item.key === key);

        if (!item) {
          needPushList.push({
            key: param.name,
            value: param.defaultValue || '',
          });
        }
      }
    }
    target.push(...needPushList);
  }
  // 自动装载需必填的参数
  mergeIfRequiredButNotSet(params4Test.value);

  paramsOfStartNode.value = paramDefinitions;
};

/** 运行流程 */
const goRun = async () => {
  try {
    const val = tinyflowRef.value.getData();
    loading.value = true;
    error.value = null;
    testResult.value = null;
    // / 查找start节点
    const startNode = getStartNode();

    // 获取参数定义
    const parameters = startNode.data?.parameters || [];
    const paramDefinitions = {};
    parameters.forEach((param) => {
      paramDefinitions[param.name] = param.dataType;
    });

    // 参数类型转换
    const convertedParams = {};
    for (const { key, value } of params4Test.value) {
      const paramKey = key.trim();
      if (!paramKey) continue;

      let dataType = paramDefinitions[paramKey];
      if (!dataType) {
        dataType = 'String';
      }

      try {
        convertedParams[paramKey] = convertParamValue(value, dataType);
      } catch (error_) {
        throw new Error(`参数 ${paramKey} 转换失败: ${error_.message}`);
      }
    }

    const data = {
      graph: JSON.stringify(val),
      params: convertedParams,
    };

    const response = await testWorkflow(data);
    testResult.value = response;
  } catch (error_) {
    error.value =
      error_.response?.data?.message || '运行失败，请检查参数和网络连接';
  } finally {
    loading.value = false;
  }
};

/** 获取开始节点 */
const getStartNode = () => {
  const val = tinyflowRef.value.getData();
  const startNode = val.nodes.find((node) => node.type === 'startNode');
  if (!startNode) {
    throw new Error('流程缺少开始节点');
  }
  return startNode;
};

/** 添加参数项 */
const addParam = () => {
  params4Test.value.push({ key: '', value: '' });
};

/** 删除参数项 */
const removeParam = (index) => {
  params4Test.value.splice(index, 1);
};

/** 类型转换函数 */
const convertParamValue = (value, dataType) => {
  if (value === '') return null; // 空值处理

  switch (dataType) {
    case 'Number': {
      const num = Number(value);
      if (isNaN(num)) throw new Error('非数字格式');
      return num;
    }
    case 'String': {
      return String(value);
    }
    case 'Boolean': {
      if (value.toLowerCase() === 'true') return true;
      if (value.toLowerCase() === 'false') return false;
      throw new Error('必须为 true/false');
    }
    case 'Array':
    case 'Object': {
      try {
        return JSON.parse(value);
      } catch (error_) {
        throw new Error(`JSON格式错误: ${error_.message}`);
      }
    }
    default: {
      throw new Error(`不支持的类型: ${dataType}`);
    }
  }
};
/** 表单校验 */
const validate = async () => {
  // 获取最新的流程数据
  if (!workflowData.value) {
    throw new Error('请设计流程');
  }
  workflowData.value = tinyflowRef.value.getData();
  return true;
};

defineExpose({ validate });
</script>

<template>
  <div class="relative h-[700px] w-[100%]">
    <Tinyflow
      v-if="workflowData"
      ref="tinyflowRef"
      class-name="custom-class"
      :style="{ width: '100%', height: '100%' }"
      :data="workflowData"
      :provider="provider"
    />
    <div class="absolute right-[30px] top-[30px]">
      <Button
        @click="testWorkflowModel"
        type="primary"
        v-hasPermi="['ai:workflow:test']"
      >
        测试
      </Button>
    </div>

    <Drawer title="工作流测试">
      <fieldset
        class="min-inline-size-auto m-0 rounded-[6px] border border-[#dcdfe6] p-[12px_16px]"
      >
        <legend
          class="ml-[8px] px-[10px] text-[16px] font-semibold text-[#303133]"
        >
          <h3>运行参数配置</h3>
        </legend>
        <div class="p-[8px]">
          <div
            class="mb-[4px] flex items-center justify-around"
            v-for="(param, index) in params4Test"
            :key="index"
          >
            <Select class="w-[200px]" v-model="param.key" placeholder="参数名">
              <Select.Option
                v-for="(value, key) in paramsOfStartNode"
                :key="key"
                :value="key"
                :disabled="!!value?.disabled"
              >
                {{ value?.description || key }}
              </Select.Option>
            </Select>
            <Input
              class="mx-[8px] w-[200px]"
              v-model:value="param.value"
              placeholder="参数值"
            />
            <Button danger plain circle @click="removeParam(index)">
              <template #icon>
                <span class="icon-[ant-design--delete-outlined]"></span>
              </template>
            </Button>
          </div>
          <Button type="primary" plain class="mt-[8px]" @click="addParam">
            添加参数
          </Button>
        </div>
      </fieldset>

      <fieldset
        class="min-inline-size-auto m-0 mt-[8px] rounded-[6px] border border-[#dcdfe6] bg-[#f8f9fa] p-[12px_16px]"
      >
        <legend
          class="ml-[8px] px-[10px] text-[16px] font-semibold text-[#303133]"
        >
          <h3>运行结果</h3>
        </legend>
        <div class="p-[8px]">
          <div v-if="loading" class="text-primary">执行中...</div>
          <div v-else-if="error" class="text-danger">{{ error }}</div>
          <pre
            v-else-if="testResult"
            class="max-h-[300px] overflow-auto whitespace-pre-wrap rounded-[4px] bg-white p-[12px] font-mono text-[14px] leading-[1.5]"
            >{{ JSON.stringify(testResult, null, 2) }}
          </pre>
          <div v-else class="text-[#909399]">点击运行查看结果</div>
        </div>
      </fieldset>

      <Button
        size="large"
        class="mt-[8px] w-[100%] bg-[#67c23a] text-white"
        @click="goRun"
      >
        运行流程
      </Button>
    </Drawer>
  </div>
</template>
