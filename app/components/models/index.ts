import { ModalEnum } from "~/services/models/enums/billing/ModalsEnum";
import AssignUserModal from "./AssignUserModal.vue";

export * from "./AssignUserModal.vue";

export const modalsEnum = {
    [ModalEnum.ASSIGN_MODAL] : AssignUserModal
}