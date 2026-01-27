"use client";
import { revalidateClientPath, updateLocation } from "@/lib/actions";
import { ILocation } from "@/lib/definitions";
import { mapApiErrors } from "@/lib/utils";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/modal";
import React from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";

interface Iform {
  name: string;
  description: string;
}

export const EditLocation = ({ location }: { location: ILocation }) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { handleSubmit, register } = useForm<Iform>({
    defaultValues: {
      name: location.name,
      description: location.description,
    },
    mode: "onTouched",
    reValidateMode: "onChange",
  });
  const onSubmit: SubmitHandler<Iform> = async (formData) => {
    const createMsg = toast.loading("Loading...");
    try {
      const data = await updateLocation(location.id, formData);
      if (!data?.id) throw data;
      revalidateClientPath("/dashboard/locations");
      toast.success("Ubicación creada");
      onOpenChange();
    } catch (error) {
      const errors = mapApiErrors(error);
      if (errors.length > 0) {
        errors?.forEach((err) => toast.error(err));
      } else {
        toast.error("Ocurrió un error inesperado");
      }
    } finally {
      toast.dismiss(createMsg);
    }
  };
  return (
    <>
      <Button color="default" variant="light" isIconOnly onPress={onOpen}>
        <span className="icon-[tdesign--edit-2-filled] w-4 h-4" />
      </Button>
      <Modal
        size="4xl"
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        scrollBehavior="outside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-3"
              >
                <ModalHeader className="flex flex-col gap-1 text-2xl">
                  Editar ubicación
                </ModalHeader>
                <ModalBody>
                  <div className="flex flex-col gap-3">
                    <Input
                      label="Nombre"
                      placeholder="Nombre"
                      {...register("name")}
                    />
                    <Input
                      label="Descripción"
                      placeholder="Descripción"
                      {...register("description")}
                    />
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button color="default" variant="light" onPress={onClose}>
                    Cancelar
                  </Button>
                  <Button color="primary" type="submit">
                    Editar ubicación
                  </Button>
                </ModalFooter>
              </form>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};
