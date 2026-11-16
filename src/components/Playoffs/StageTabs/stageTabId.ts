import type { PlayoffStage } from '../../../types/domain'

/**
 * El id del tab de una ronda. Lo usan el tab y el panel (`aria-labelledby`), así
 * que vive aparte: un archivo de componente que exporta otra cosa rompe el Fast
 * Refresh.
 */
export const getStageTabId = (panelId: string, stage: PlayoffStage) => `${panelId}-tab-${stage}`
