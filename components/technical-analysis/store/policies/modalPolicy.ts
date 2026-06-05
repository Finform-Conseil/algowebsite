import type { UiState } from "../../config/state/uiStateTypes";

type ModalState = UiState["modals"];
type ModalKey = keyof ModalState;

export const closeAllModalFlags = (modals: ModalState): void => {
  (Object.keys(modals) as ModalKey[]).forEach((key) => {
    modals[key] = false;
  });
};

export const setModalOpenFlag = (
  modals: ModalState,
  modal: ModalKey,
  isOpen: boolean,
): void => {
  if (isOpen) {
    closeAllModalFlags(modals);
  }

  modals[modal] = isOpen;
};
