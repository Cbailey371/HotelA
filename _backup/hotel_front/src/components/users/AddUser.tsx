"use client";
import { createUser, revalidateClientPath } from "@/lib/actions";
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
  email: string;
  password: string;
}

export const AddUser = () => {
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
      const response = await createUser(formData);
      if (!response?.id) throw response;
      revalidateClientPath("/dashboard/users");
      toast.success("Usuario creado");
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
        + Agregar usuario
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
                  Agregar usuario
                </ModalHeader>
                <ModalBody>
                  <div className="flex flex-col gap-3">
                    <Input
                      label="Nombre"
                      placeholder="Nombre"
                      {...register("name", {
                        required: {
                          value: true,
                          message: "El nombre es requerido",
                        },
                      })}
                      errorMessage={errors.name?.message}
                      isInvalid={!!errors.name}
                    />
                    <Input
                      label="Email"
                      placeholder="Email"
                      type="email"
                      {...register("email", {
                        required: {
                          value: true,
                          message: "El email es requerido",
                        },
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: "El email no es válido",
                        },
                      })}
                      errorMessage={errors.email?.message}
                      isInvalid={!!errors.email}
                    />
                    <Input
                      label="Password"
                      placeholder="Password"
                      type="password"
                      {...register("password", {
                        required: {
                          value: true,
                          message: "La contraseña es requerida",
                        },
                        minLength: {
                          value: 8,
                          message:
                            "La contraseña debe tener entre 8 y 16 caracteres",
                        },
                        maxLength: {
                          value: 16,
                          message:
                            "La contraseña debe tener entre 8 y 16 caracteres",
                        },
                        pattern: {
                          value:
                            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,16}$/,
                          message:
                            "La contraseña debe tener entre 8 y 16 caracteres, una mayúscula, una minúscula, un número y un carácter especial",
                        },
                      })}
                      errorMessage={errors.password?.message}
                      isInvalid={!!errors.password}
                    />
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button color="default" variant="light" onPress={onClose}>
                    Cancelar
                  </Button>
                  <Button color="primary" type="submit">
                    Agregar usuario
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
