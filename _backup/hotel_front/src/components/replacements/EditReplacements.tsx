"use client";
import { REPLACEMENTS_TYPES } from "@/constants/replacements";
import { useGlobalStore } from "@/hooks/useGlobalStore";
import { revalidateClientPath, updateReplacement } from "@/lib/actions";
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
import { DatePicker } from "@heroui/date-picker";
import { Select, SelectItem } from "@heroui/select";
import React from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { DateValue } from "@heroui/calendar";
import { IReplacement, SparePartType } from "@/lib/definitions";
import {
  fromDate,
  getLocalTimeZone,
  toCalendarDate,
} from "@internationalized/date";
import { mapApiErrors } from "@/lib/utils";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";

interface Iform {
  name: string;
  assetId: string;
  sparePartType: SparePartType;
  model: string;
  brand: string;
  year?: number;
  photoUrl?: string;
  availableQuantity: number;
  minimumStock: number;
  estimatedUsefulLife: number;
  lastPurchaseDate: DateValue;
  installationDate?: DateValue;
  expirationDate?: DateValue;
  storageLocation: string;
  exactPhysicalLocation: string;
  providerId: string;
  unitCost: number;
  compatibilityModels: string;
}

export const EditReplacement = ({
  replacement,
}: {
  replacement: IReplacement;
}) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const {
    state: { assets, providers },
  } = useGlobalStore();

  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<Iform>({
    defaultValues: {
      name: replacement.name,
      assetId: replacement.assetId,
      sparePartType: replacement.sparePartType,
      model: replacement.model,
      brand: replacement.brand,
      year: replacement.year,
      photoUrl: replacement.photoUrl,
      availableQuantity: replacement.availableQuantity,
      minimumStock: replacement.minimumStock,
      estimatedUsefulLife: replacement.estimatedUsefulLife,
      lastPurchaseDate: replacement.lastPurchaseDate
        ? toCalendarDate(
            fromDate(new Date(replacement.lastPurchaseDate), "UTC")
          )
        : undefined,
      installationDate: replacement.installationDate
        ? toCalendarDate(
            fromDate(new Date(replacement.installationDate), "UTC")
          )
        : undefined,
      expirationDate: replacement.expirationDate
        ? toCalendarDate(fromDate(new Date(replacement.expirationDate), "UTC"))
        : undefined,
      storageLocation: replacement.storageLocation,
      exactPhysicalLocation: replacement.exactPhysicalLocation,
      providerId: replacement.providerId,
      unitCost: replacement.unitCost,
      compatibilityModels: replacement.compatibilityModels,
    },
    mode: "onTouched",
    reValidateMode: "onChange",
  });

  const onSubmit: SubmitHandler<Iform> = async (formData) => {
    const createMsg = toast.loading("Cargando...");
    try {
      const response = await updateReplacement(replacement.id, {
        ...formData,
        sparePartType: formData?.sparePartType,
        lastPurchaseDate: formData.lastPurchaseDate.toDate(getLocalTimeZone()),
        installationDate: formData.installationDate?.toDate(getLocalTimeZone()),
        expirationDate: formData.expirationDate?.toDate(getLocalTimeZone()),
      });
      if (!response?.id) throw response;
      revalidateClientPath("/dashboard/replacements");
      toast.success("Repuesto actualizado");
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
                    <Controller
                      name="assetId"
                      control={control}
                      rules={{ required: true }}
                      render={({ field }) => (
                        <Autocomplete
                          label="Equipo al que pertenece"
                          placeholder=" "
                          isRequired
                          selectedKey={field.value}
                          defaultItems={assets}
                          onSelectionChange={field.onChange}
                          errorMessage={errors.assetId?.message}
                          isInvalid={!!errors.assetId?.message}
                        >
                          {(item) => (
                            <AutocompleteItem key={item.id}>
                              {item.name}
                            </AutocompleteItem>
                          )}
                        </Autocomplete>
                      )}
                    />
                    <Select
                      {...register("sparePartType")}
                      label="Tipo de repuesto"
                      isRequired
                      placeholder=" "
                      errorMessage={errors.sparePartType?.message}
                      isInvalid={!!errors.sparePartType?.message}
                    >
                      {REPLACEMENTS_TYPES.map((sparePartType) => (
                        <SelectItem key={sparePartType.value}>
                          {sparePartType.label}
                        </SelectItem>
                      ))}
                    </Select>
                    <Input
                      label="Modelo"
                      placeholder="Modelo"
                      isRequired
                      {...register("model", { required: true })}
                      errorMessage={errors.model?.message}
                      isInvalid={!!errors.model?.message}
                    />
                    <Input
                      label="Marca"
                      isRequired
                      placeholder="Marca"
                      {...register("brand", { required: true })}
                      errorMessage={errors.brand?.message}
                      isInvalid={!!errors.brand?.message}
                    />
                    <Input
                      label="Año"
                      placeholder="Año"
                      {...register("year", { valueAsNumber: true })}
                      type="number"
                      errorMessage={errors.year?.message}
                      isInvalid={!!errors.year?.message}
                    />
                    <Input
                      label="Cantidad disponible"
                      isRequired
                      placeholder="Cantidad disponible"
                      {...register("availableQuantity", {
                        valueAsNumber: true,
                        required: true,
                      })}
                      type="number"
                      errorMessage={errors.availableQuantity?.message}
                      isInvalid={!!errors.availableQuantity?.message}
                    />
                    <Input
                      label="Stock mínimo"
                      isRequired
                      placeholder="Stock mínimo"
                      {...register("minimumStock", {
                        valueAsNumber: true,
                        required: true,
                      })}
                      type="number"
                      errorMessage={errors.minimumStock?.message}
                      isInvalid={!!errors.minimumStock?.message}
                    />
                    <Input
                      label="Vida útil estimada"
                      isRequired
                      placeholder="Vida útil estimada"
                      {...register("estimatedUsefulLife", {
                        valueAsNumber: true,
                        required: true,
                      })}
                      endContent={
                        <span className="text-gray-500 text-sm">meses</span>
                      }
                      type="number"
                      errorMessage={errors.estimatedUsefulLife?.message}
                      isInvalid={!!errors.estimatedUsefulLife?.message}
                    />
                    <Controller
                      name="lastPurchaseDate"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          {...field}
                          label="Fecha de última compra"
                          errorMessage={errors.lastPurchaseDate?.message}
                          isInvalid={!!errors.lastPurchaseDate?.message}
                        />
                      )}
                    />
                    <Controller
                      name="installationDate"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          {...field}
                          label="Fecha de instalación"
                          errorMessage={errors.installationDate?.message}
                          isInvalid={!!errors.installationDate?.message}
                        />
                      )}
                    />
                    <Controller
                      name="expirationDate"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          {...field}
                          label="Fecha de vencimiento"
                          errorMessage={errors.expirationDate?.message}
                          isInvalid={!!errors.expirationDate?.message}
                        />
                      )}
                    />
                    <Input
                      label="Ubicación de almacenamiento"
                      isRequired
                      placeholder="Ubicación de almacenamiento"
                      {...register("storageLocation", {
                        required: true,
                      })}
                      type="text"
                      errorMessage={errors.storageLocation?.message}
                      isInvalid={!!errors.storageLocation?.message}
                    />
                    <Input
                      label="Ubicación exacta"
                      isRequired
                      placeholder="Ubicación exacta"
                      {...register("exactPhysicalLocation", {
                        required: true,
                      })}
                      type="text"
                      errorMessage={errors.exactPhysicalLocation?.message}
                      isInvalid={!!errors.exactPhysicalLocation?.message}
                    />
                    <Controller
                      name="providerId"
                      control={control}
                      rules={{ required: true }}
                      render={({ field }) => (
                        <Autocomplete
                          label="Proveedor"
                          placeholder=" "
                          isRequired
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
                    <Input
                      label="Costo unitario"
                      isRequired
                      placeholder="Costo unitario"
                      {...register("unitCost", {
                        valueAsNumber: true,
                        required: true,
                      })}
                      type="number"
                      endContent={
                        <span className="text-gray-500 text-sm">$</span>
                      }
                      errorMessage={errors.unitCost?.message}
                      isInvalid={!!errors.unitCost?.message}
                    />
                    <Input
                      label="Modelos compatibles"
                      isRequired
                      placeholder="Modelos compatibles"
                      {...register("compatibilityModels", {
                        required: true,
                      })}
                      type="text"
                      errorMessage={errors.compatibilityModels?.message}
                      isInvalid={!!errors.compatibilityModels?.message}
                    />
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button color="default" variant="light" onPress={onClose}>
                    Cancelar
                  </Button>
                  <Button color="primary" type="submit">
                    Editar repuesto
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
