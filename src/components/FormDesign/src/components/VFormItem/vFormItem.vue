<!--
 * @Description:
   `<FormItem`
    :tableAction="tableAction"
    :formActionType="formActionType"
    :schema="schema2"
    :formProps="getProps"
    :allDefaultValues="defaultValueRef"
    :formModel="formModel"
    :setFormModel="setFormModel"
  >
-->

<script lang="ts" setup>
import { computed, unref } from 'vue'
import type { IFormConfig, IVFormComponent } from '../../typings/v-form-component'
import type { FormProps, FormSchema } from '@/components/Form'

import FormItem from '@/components/Form/src/components/FormItem.vue'

const props = defineProps({
  formData: {
    type: Object,
    default: () => ({}),
  },
  schema: {
    type: Object as PropType<IVFormComponent>,
    required: true,
  },
  formConfig: {
    type: Object as PropType<IFormConfig>,
    required: true,
  },
})

const schema = computed(() => {
  const schema: FormSchema = {
    ...unref(props.schema),
  } as FormSchema

  return schema
})

// Get the basic configuration of the form
const getProps = computed((): FormProps => {
  return { ...unref(props.formConfig) } as FormProps
})
</script>

<template>
  <FormItem :schema="schema" :form-props="getProps">
    <template v-for="item in Object.keys($slots)" #[item]="data">
      <slot :name="item" v-bind="data || {}" />
    </template>
  </FormItem>
</template>
