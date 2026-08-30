import type { AdPlacement } from '../game/rewards'

export type { AdPlacement }
export type AdResult = 'rewarded' | 'dismissed' | 'failed'

export interface AdProvider {
  isAvailable(placement: AdPlacement): boolean
  showRewarded(placement: AdPlacement): Promise<AdResult>
}
