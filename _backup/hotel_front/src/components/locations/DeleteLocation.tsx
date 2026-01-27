"use client";
import { deleteLocation, revalidateClientPath } from "@/lib/actions";
import { ILocation } from "@/lib/definitions";
import { Button } from "@heroui/button";
import { Modal, ModalContent, ModalHeader, useDisclosure } from "@heroui/modal";
import React from "react";
import toast from "react-hot-toast";

const DeleteLocation = ({ location }: { location: ILocation }) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const handleClickDelete = async () => {
    const createMsg = toast.loading("Cargando...");
    try {
      const response = await deleteLocation(location.id);
      if (!response?.id) {
        throw new Error();
      }
      onOpenChange();
      revalidateClientPath("/dashboard/locations");
      toast.success("La ubicación se eliminó correctamente");
    } catch (error) {
      toast.error("Error al eliminar la ubicación");
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
                Estas apunto de eliminar la ubicación {location.name}
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

export default DeleteLocation;
