<script lang="ts" setup>
import type { PropType } from 'vue'
import { computed } from 'vue'
import { Col, Form } from 'ant-design-vue'
import type { ColEx } from '../types'
import { useFormContext } from '../hooks/useFormContext'
import type { ButtonProps } from '@/components/Button'
import { Button } from '@/components/Button'
import { BasicArrow } from '@/components/Basic'
import { useI18n } from '@/hooks/web/useI18n'
import { propTypes } from '@/utils/propTypes'

type ButtonOptions = Partial<ButtonProps> & { text: string }

defineOptions({ name: 'BasicFormAction' })

const props = defineProps({
  showActionButtonGroup: propTypes.bool.def(true),
  showResetButton: propTypes.bool.def(true),
  showSubmitButton: propTypes.bool.def(true),
  showAdvancedButton: propTypes.bool.def(true),
  resetButtonOptions: {
    type: Object as PropType<ButtonOptions>,
    default: () => ({}),
  },
  submitButtonOptions: {
    type: Object as PropType<ButtonOptions>,
    default: () => ({}),
  },
  actionColOptions: {
    type: Object as PropType<Partial<ColEx>>,
    default: () => ({}),
  },
  actionSpan: propTypes.number.def(6),
  isAdvanced: propTypes.bool,
  hideAdvanceBtn: propTypes.bool,
})

const emit = defineEmits(['toggle-advanced'])

const { resetAction, submitAction } = useFormContext()

const FormItem = Form.Item
const { t } = useI18n()

const actionColOpt = computed(() => {
  const { showAdvancedButton, actionSpan: span, actionColOptions } = props
  const actionSpan = 24 - span
  const advancedSpanObj = showAdvancedButton ? { span: actionSpan < 6 ? 24 : actionSpan } : {}
  const actionColOpt: Partial<ColEx> = {
    style: { textAlign: 'right' },
    span: showAdvancedButton ? 6 : 4,
    ...advancedSpanObj,
    ...actionColOptions,
  }
  return actionColOpt
})

const getResetBtnOptions = computed((): ButtonOptions => {
  return Object.assign(
    {
      text: t('common.resetText'),
    },
    props.resetButtonOptions,
  )
})

const getSubmitBtnOptions = computed(() => {
  return Object.assign(
    {
      text: t('common.queryText'),
    },
    props.submitButtonOptions,
  )
})

function toggleAdvanced() {
  emit('toggle-advanced')
}
</script>

<template>
  <Col v-if="showActionButtonGroup" v-bind="actionColOpt">
    <div style="width: 100%" :style="{ textAlign: actionColOpt.style.textAlign }">
      <FormItem>
        <slot name="resetBefore" />
        <Button
          v-if="showResetButton"
          type="default"
          class="mr-2"
          v-bind="getResetBtnOptions"
          @click="resetAction"
        >
          {{ getResetBtnOptions.text }}
        </Button>
        <slot name="submitBefore" />

        <Button
          v-if="showSubmitButton"
          type="primary"
          class="mr-2"
          v-bind="getSubmitBtnOptions"
          @click="submitAction"
        >
          {{ getSubmitBtnOptions.text }}
        </Button>

        <slot name="advanceBefore" />
        <Button
          v-if="showAdvancedButton && !hideAdvanceBtn"
          type="link"
          size="small"
          @click="toggleAdvanced"
        >
          {{ isAdvanced ? t('component.form.putAway') : t('component.form.unfold') }}
          <BasicArrow class="ml-1" :expand="!isAdvanced" up />
        </Button>
        <slot name="advanceAfter" />
      </FormItem>
    </div>
  </Col>
</template>
