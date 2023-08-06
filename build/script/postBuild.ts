// #!/usr/bin/env node

import colors from 'picocolors'

import pkg from '../../package.json'
import { runBuildConfig } from './buildConf'

export function runBuild() {
  try {
    const argvList = process.argv.splice(2)

    // Generate configuration file
    if (!argvList.includes('disabled-config'))
      runBuildConfig()

    console.log(`✨ ${colors.cyan(`[${pkg.name}]`)}` + ' - build successfully!')
  }
  catch (error: any) {
    console.log(colors.red(`vite build error:\n${error}`))
    process.exit(1)
  }
}
runBuild()
