import { useDark, useToggle } from '@vueuse/core'

const isDark = useDark({
  attribute: 'data-theme',
  valueDark: 'dark',
  valueLight: 'light',
})
const toggleDark = useToggle(isDark)

export function updateDarkTheme(mode: string | null = 'light') {
  toggleDark(mode === 'dark')
}
