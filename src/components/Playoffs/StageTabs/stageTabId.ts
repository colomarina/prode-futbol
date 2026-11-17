import type { PlayoffStage } from '../../../types/domain'

export const getStageTabId = (panelId: string, stage: PlayoffStage) => `${panelId}-tab-${stage}`
