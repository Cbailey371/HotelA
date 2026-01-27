"use client";
import { createProvider, revalidateClientPath } from "@/lib/actions";
import { ProviderType } from "@/lib/definitions";
import { isPhoneValid, mapApiErrors } from "@/lib/utils";
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
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import CustomPhoneInput from "../CustomPhoneInput";
import { Select, SelectItem } from "@heroui/select";
import { PROVIDER_TYPES } from "@/constants/provider";
const CountrySelect = React.lazy(() => import("../CountrySelect"));
const RegionSelect = React.lazy(() => import("../RegionSelect"));

interface Iform {
  name: string;
  taxId: string;
  mainContact: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
  website?: string;
  providerType: ProviderType;
  paymentMethods?: string;
  notes: string;
}

export const AddProvider = () => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const {
    control,
    handleSubmit,
    register,
    watch,
    reset,
    formState: { errors },
  } = useForm<Iform>({
    mode: "onTouched",
    reValidateMode: "onChange",
  });
  const onSubmit: SubmitHandler<Iform> = async (formData) => {
    const createMsg = toast.loading("Cargando...");
    try {
      const response = await createProvider(formData);
      if (!response?.id) throw response;
      revalidateClientPath("/dashboard/providers");
      toast.success("Proveedor creado");
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
        + Agregar proveedor
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
                  Agregar proveedor
                </ModalHeader>
                <ModalBody>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      label="Nombre"
                      placeholder="Nombre"
                      {...register("name", { required: true })}
                      errorMessage={errors.name?.message}
                      isInvalid={!!errors.name?.message}
                    />
                    <Input
                      label="CIF"
                      placeholder="CIF"
                      {...register("taxId", { required: true })}
                      errorMessage={errors.taxId?.message}
                      isInvalid={!!errors.taxId?.message}
                    />
                    <Input
                      label="Contacto principal"
                      placeholder="Contacto principal"
                      {...register("mainContact", { required: true })}
                      errorMessage={errors.mainContact?.message}
                      isInvalid={!!errors.mainContact?.message}
                    />
                    <Controller
                      control={control}
                      name="phone"
                      rules={{ validate: (value) => isPhoneValid(value) }}
                      render={({ field }) => (
                        <CustomPhoneInput
                          label="Telefono"
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          defaultCountry="pa"
                          isInvalid={!!errors.phone}
                        />
                      )}
                    />
                    <Input
                      label="Email"
                      placeholder="Email"
                      type="email"
                      {...register("email", { required: true })}
                      errorMessage={errors.email?.message}
                      isInvalid={!!errors.email?.message}
                    />
                    <Input
                      label="Direccion"
                      placeholder="Direccion"
                      {...register("address", { required: true })}
                      errorMessage={errors.address?.message}
                      isInvalid={!!errors.address?.message}
                    />
                    <Controller
                      name="country"
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange, onBlur } }) => (
                        <CountrySelect
                          value={value}
                          onChange={onChange}
                          label="País"
                          onBlur={onBlur}
                          isInvalid={!!errors.country}
                        />
                      )}
                    />
                    <Controller
                      name="city"
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange, onBlur } }) => (
                        <RegionSelect
                          country={watch("country")}
                          value={value}
                          onChange={onChange}
                          onBlur={onBlur}
                          isInvalid={!!errors.city}
                          label="Ciudad"
                        />
                      )}
                    />
                    <Input
                      label="Website"
                      placeholder="Website"
                      {...register("website")}
                      errorMessage={errors.website?.message}
                      isInvalid={!!errors.website?.message}
                    />
                    <Select
                      {...register("providerType")}
                      label="Tipo de Activo"
                      isRequired
                      placeholder=" "
                      errorMessage={errors.providerType?.message}
                      isInvalid={!!errors.providerType?.message}
                    >
                      {PROVIDER_TYPES.map((type) => (
                        <SelectItem key={type.value}>{type.label}</SelectItem>
                      ))}
                    </Select>
                    <Input
                      label="Metodos de pago"
                      placeholder="Metodos de pago"
                      {...register("paymentMethods")}
                      errorMessage={errors.paymentMethods?.message}
                      isInvalid={!!errors.paymentMethods?.message}
                    />
                    <Input
                      label="Notas"
                      placeholder="Notas"
                      {...register("notes")}
                      errorMessage={errors.notes?.message}
                      isInvalid={!!errors.notes?.message}
                    />
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button color="default" variant="light" onPress={onClose}>
                    Cancelar
                  </Button>
                  <Button color="primary" type="submit">
                    Agregar proveedor
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
