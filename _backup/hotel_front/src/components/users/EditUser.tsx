"use client";
import { revalidateClientPath, updateUser } from "@/lib/actions";
import { IUser } from "@/lib/definitions";
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
  //   password: string;
}

export const EditUser = ({ user }: { user: IUser }) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<Iform>({
    defaultValues: {
      name: user.name,
      email: user.email,
    },
    mode: "onTouched",
    reValidateMode: "onChange",
  });
  const onSubmit: SubmitHandler<Iform> = async (formData) => {
    const createMsg = toast.loading("Loading...");
    try {
      const data = await updateUser(user.id, formData);
      if (!data?.id) {
        throw new Error("Error");
      }
      revalidateClientPath("/dashboard/users");
      toast.success("Usuario actualizado");
      onOpenChange();
    } catch (error) {
      toast.error("Error");
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
                  Editar usuario
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
                    {/* <Input
                      label="Password"
                      placeholder="Password"
                      type="password"
                      {...register("password")}
                    /> */}
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button color="default" variant="light" onPress={onClose}>
                    Cancelar
                  </Button>
                  <Button color="primary" type="submit">
                    Editar usuario
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
