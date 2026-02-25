import { ModalEnum } from "~/services/models/enums/billing/ModalsEnum";
import AssignUserModal from "./AssignUserModal.vue";
import TariffModal from "./tariffModal.vue";

export * from "./AssignUserModal.vue";

export const modalsEnum = {
    [ModalEnum.ASSIGN_MODAL] : AssignUserModal,
    [ModalEnum.TARIFF_MODAL] : TariffModal
}