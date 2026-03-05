import { ModalEnum } from "~/services/models/enums/billing/ModalsEnum";
import AssignUserModal from "./AssignUserModal.vue";
import TariffModal from "./tariffModal.vue";
import AddContract from "./AddContract.vue";
import EditContract from "./EditContract.vue";
import AddConnection from "./AddConnection.vue";
import EditConnection from "./editConnection.vue";
import InvoiceModal from "./InvoiceModal.vue";

export * from "./AssignUserModal.vue";

export const modalsEnum = {
    [ModalEnum.ASSIGN_MODAL] : AssignUserModal,
    [ModalEnum.TARIFF_MODAL] : TariffModal,
    [ModalEnum.ADD_CONTRACT] : AddContract,
    [ModalEnum.EDIT_CONTRACT] : EditContract,
    [ModalEnum.ADD_CONNECTION] : AddConnection,
    [ModalEnum.EDIT_CONNECTION] : EditConnection,
    [ModalEnum.INVOCIE_MODAL] : InvoiceModal
}