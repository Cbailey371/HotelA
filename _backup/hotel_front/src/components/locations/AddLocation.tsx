"use client";
import { createLocation, revalidateClientPath } from "@/lib/actions";
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

export const AddLocation = () => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const {
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm<Iform>({
    mode: "onTouched",
    reValidateMode: "onChange",
  });
  const onSubmit: SubmitHandler<Iform> = async (formData) => {
    const createMsg = toast.loading("Cargando...");
    try {
      const response = await createLocation(formData);
      if (!response?.id) throw response;
      revalidateClientPath("/dashboard/locations");
      toast.success("Ubicación creada");
      onOpenChange();
      reset();
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
      <Button color="primary" className="w-full md:w-auto" onPress={onOpen}>
        + Agregar ubicación
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
                  Agregar ubicación
                </ModalHeader>
                <ModalBody>
                  <div className="flex flex-col gap-3">
                    <Input
                      label="Nombre"
                      placeholder="Nombre"
                      {...register("name", { required: true })}
                      errorMessage={errors.name?.message}
                      isInvalid={!!errors.name?.message}
                    />
                    <Input
                      label="Descripción"
                      placeholder="Descripción"
                      {...register("description", { required: true })}
                      errorMessage={errors.description?.message}
                      isInvalid={!!errors.description?.message}
                    />
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button color="default" variant="light" onPress={onClose}>
                    Cancelar
                  </Button>
                  <Button color="primary" type="submit">
                    Agregar ubicación
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
