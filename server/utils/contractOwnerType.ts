import getPortal from './prisma/getPortal'
import { refusal } from '~~/server/utils/errors'

/** ownerType смарт-процесса для productrow-методов: 'T' + hex(entityTypeId), напр. 1058 → 'T422'. */
export function contractOwnerType(entityTypeId: number) {
  return 'T' + entityTypeId.toString(16).toUpperCase()
}

/** ownerType договора по привязке портала (portal binding). */
export async function getContractOwnerTypeByPortal(portal_id: number) {
  const portal = await getPortal({ id: portal_id })
  if (!portal?.contract_entity_type_id) {
    throw refusal('portal.not_configured', 409, { message: 'Не настроена привязка смарт-процесса договора' })
  }
  return contractOwnerType(portal.contract_entity_type_id)
}
