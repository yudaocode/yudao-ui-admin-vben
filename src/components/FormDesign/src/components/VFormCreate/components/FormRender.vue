<script lang="ts">
import type { PropType } from 'vue'
import { defineComponent } from 'vue'
import { Col, Row } from 'ant-design-vue'
import type { IFormConfig, IVFormComponent } from '../../../typings/v-form-component'
import VFormItem from '../../VFormItem/index.vue'

export default defineComponent({
  name: 'FormRender',
  components: {
    VFormItem,
    Row,
    Col,
  },
  props: {
    formData: {
      type: Object,
      default: () => ({}),
    },
    schema: {
      type: Object as PropType<IVFormComponent>,
      default: () => ({}),
    },
    formConfig: {
      type: Object as PropType<IFormConfig>,
      default: () => [] as IFormConfig[],
    },
    setFormModel: {
      type: Function as PropType<(key: string, value: any) => void>,
      default: null,
    },
  },
  emits: ['change', 'submit', 'reset'],
  setup(_props) {},
})
</script>

<template>
  <template v-if="['Grid'].includes(schema.component)">
    <Row class="grid-row">
      <Col v-for="(colItem, index) in schema.columns" :key="index" class="grid-col" :span="colItem.span">
        <FormRender
          v-for="(item, k) in colItem.children"
          :key="k"
          :schema="item"
          :form-data="formData"
          :form-config="formConfig"
          :set-form-model="setFormModel"
        />
      </Col>
    </Row>
  </template>
  <VFormItem
    v-else
    :form-config="formConfig"
    :schema="schema"
    :form-data="formData"
    :set-form-model="setFormModel"
    @change="$emit('change', { schema, value: $event })"
    @submit="$emit('submit', schema)"
    @reset="$emit('reset')"
  >
    <template v-if="schema.componentProps && schema.componentProps.slotName" #[schema.componentProps!.slotName]>
      <slot :name="schema.componentProps!.slotName" />
    </template>
  </VFormItem>
</template>

<style>
.v-form-render-item {
  overflow: hidden;
}
</style>
