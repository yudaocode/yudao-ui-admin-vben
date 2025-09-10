<script lang="ts" setup>
import { defineOptions, defineProps, ref, watch } from 'vue';

import { CustomConfigMap } from './data';

defineOptions({ name: 'ElementCustomConfig' });

const props = defineProps({
  id: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    default: '',
  },
  businessObject: {
    type: Object as () => BusinessObject,
    default: () => ({}),
  },
});

interface BusinessObject {
  eventDefinitions?: Array<{ $type: string }>;
  [key: string]: any;
}

// const bpmnInstances = () => (window as any)?.bpmnInstances;
const customConfigComponent = ref<any>(null);

watch(
  () => props.businessObject,
  () => {
    if (props.type && props.businessObject) {
      let val = props.type;
      if (props.businessObject.eventDefinitions) {
        val +=
          props.businessObject.eventDefinitions[0]?.$type.split(':')[1] || '';
      }
      customConfigComponent.value = (CustomConfigMap as any)[val]?.component;
    }
  },
  { immediate: true },
);
</script>

<template>
  <div class="panel-tab__content">
    <component :is="customConfigComponent" v-bind="$props" />
  </div>
</template>

<style lang="scss" scoped></style>
