"use client";
import { useGlobalStore } from "@/hooks/useGlobalStore";
import { revalidateClientPath, updateTechnician } from "@/lib/actions";
import { ITechnician } from "@/lib/definitions";
import { mapApiErrors } from "@/lib/utils";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
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
import { Select, SelectItem } from "@heroui/select";
import React from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";

interface Iform {
  name: string;
  email: string;
  phone: string;
  providerId: string | null;
}

const EditTechnician = ({ technician }: { technician: ITechnician }) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const {
    state: { providers },
  } = useGlobalStore();
  const {
    handleSubmit,
    register,
    formState: { errors },
    control,
  } = useForm<Iform>({
    defaultValues: {
      name: technician.name,
      email: technician.email,
      phone: technician.phone,
      providerId: technician.providerId,
    },
    mode: "onTouched",
    reValidateMode: "onChange",
  });

  const onSubmit: SubmitHandler<Iform> = async (formData) => {
    const createMsg = toast.loading("Cargando...");
    console.log(formData);
    try {
      const response = await updateTechnician(technician.id, {
        ...formData,
        providerId: formData.providerId || null,
      });
      if (!response?.id) throw response;
      revalidateClientPath("/dashboard/technicians");
      toast.success("Técnico actualizado");
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
                  Editar repuesto
                </ModalHeader>
                <ModalBody>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      label="Nombre"
                      placeholder="Nombre"
                      isRequired
                      className="col-span-1 md:col-span-2"
                      {...register("name", { required: true })}
                      errorMessage={errors.name?.message}
                      isInvalid={!!errors.name?.message}
                    />

                    <Input
                      label="Email"
                      placeholder="Email"
                      isRequired
                      {...register("email", { required: true })}
                      errorMessage={errors.email?.message}
                      isInvalid={!!errors.email?.message}
                    />

                    <Input
                      label="Teléfono"
                      placeholder="Teléfono"
                      isRequired
                      {...register("phone", { required: true })}
                      errorMessage={errors.phone?.message}
                      isInvalid={!!errors.phone?.message}
                    />

                    <Controller
                      name="providerId"
                      control={control}
                      render={({ field }) => (
                        <Autocomplete
                          label="Proveedor"
                          placeholder=" "
                          selectedKey={field.value}
                          defaultItems={providers}
                          onSelectionChange={field.onChange}
                          errorMessage={errors.providerId?.message}
                          isInvalid={!!errors.providerId?.message}
                        >
                          {(item) => (
                            <AutocompleteItem key={item.id}>
                              {item.name}
                            </AutocompleteItem>
                          )}
                        </Autocomplete>
                      )}
                    />
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button color="default" variant="light" onPress={onClose}>
                    Cancelar
                  </Button>
                  <Button color="primary" type="submit">
                    Editar técnico
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

export default EditTechnician;
