import { defineUnlistedScript } from 'wxt/utils/define-unlisted-script'
import { APP_VERSION } from '../version/version.js'
import { initMojito } from '../injected-scripts/mojito/main'

export default defineUnlistedScript(() => initMojito(APP_VERSION))
