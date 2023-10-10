<!--
 * @Description: 拖拽节点控件
-->
<script lang="ts" setup>
import type { PropType } from 'vue'
import type { IVFormComponent } from '../../../typings/v-form-component'
import { useFormDesignState } from '../../../hooks/useFormDesignState'
import VFormItem from '../../VFormItem/index.vue'
import FormNodeOperate from './FormNodeOperate.vue'

const props = defineProps(
  {
    schema: {
      type: Object as PropType<IVFormComponent>,
      required: true,
    },
  },

)

const { formConfig, formDesignMethods } = useFormDesignState()
// 获取 formDesignMethods
function handleSelectItem() {
  // 调用 formDesignMethods
  formDesignMethods.handleSetSelectItem(props.schema)
}
</script>

<template>
  <div
    class="drag-move-box" :class="{ active: schema.key === formConfig.currentItem?.key }"
    @click.stop="handleSelectItem"
  >
    <div class="form-item-box">
      <VFormItem :form-config="formConfig" :schema="schema" />
    </div>

    <div class="show-key-box">
      {{ schema.label + (schema.field ? `/${schema.field}` : '') }}
    </div>

    <FormNodeOperate :schema="schema" :current-item="formConfig.currentItem" />
  </div>
</template>
