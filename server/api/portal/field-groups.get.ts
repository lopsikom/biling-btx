import { getFieldGroupsByKind } from '~~/server/utils/prisma/FieldGroup'
import type { PortalDataType } from '~~/server/utils/prisma/getPortalByUserBitrix'
import type { FieldGroupsByKind } from '~~/shared/models/APIModels'

// Все мультиселект-группы полей портала, сгруппированные по виду модуля.
export default defineEventHandler(async (event): Promise<FieldGroupsByKind> => {
  const portalCtx = event.context.portal as PortalDataType
  return getFieldGroupsByKind(portalCtx.portal.id)
})
