<template>
  <span :class="`${prefixCls}- flex items-center `">
    <Icon v-if="getIcon" :icon="getIcon" :size="18" :class="`${prefixCls}-wrapper__icon mr-2`" />
    {{ getI18nName }}
  </span>
</template>
<script lang="ts" setup name="MenuItemContent">
import { computed } from 'vue'
import Icon from '@/components/Icon'
import { useI18n } from '@/hooks/web/useI18n'
import { useDesign } from '@/hooks/web/useDesign'
import { contentProps } from '../props'
const { t } = useI18n()
const props = defineProps(contentProps)

const { prefixCls } = useDesign('basic-menu-item-content')
const getI18nName = computed(() => t(props.item?.name))
const getIcon = computed(() => props.item?.icon)
</script>
