"use client";
import { deleteProvider, revalidateClientPath } from "@/lib/actions";
import { IProvider } from "@/lib/definitions";
import { Button } from "@heroui/button";
import { Modal, ModalContent, ModalHeader, useDisclosure } from "@heroui/modal";
import React from "react";
import toast from "react-hot-toast";

const DeleteProvider = ({ provider }: { provider: IProvider }) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const handleClickDelete = async () => {
    const createMsg = toast.loading("Cargando...");
    try {
      const response = await deleteProvider(provider.id);
      if (!response?.id) {
        throw new Error();
      }
      onOpenChange();
      revalidateClientPath("/dashboard/providers");
      toast.success("El proveedor se eliminó correctamente");
    } catch (error) {
      toast.error("Error al eliminar el proveedor");
    } finally {
      toast.dismiss(createMsg);
    }
  };
  return (
    <>
      <Button color="default" variant="light" isIconOnly onPress={onOpen}>
        <span className="icon-[mdi--delete] w-4 h-4 text-danger" />
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col text-center">
                Estas apunto de eliminar el proveedor {provider.name}
                <div className="mt-8 space-x-4">
                  <Button color="danger" variant="light" onPress={onClose}>
                    Cancelar
                  </Button>
                  <Button onClick={handleClickDelete} color="primary">
                    Eliminar
                  </Button>
                </div>
              </ModalHeader>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default DeleteProvider;
