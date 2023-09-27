import { LocalStorageService } from '@Storage'
import { AppInfo } from '@Constants'

const NetworkTypeEntity = {
  get: () =>
    LocalStorageService.getItem('networkType') || AppInfo.NETWORK_TYPES.MAINNET,
  set: (value) => LocalStorageService.setItem('networkType', value),
}

export default NetworkTypeEntity
