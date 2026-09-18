import { defineUnlistedScript } from 'wxt/utils/define-unlisted-script'
import { initExplorerContentScript } from '../content-scripts/explorer/main'

export default defineUnlistedScript(() => initExplorerContentScript())
