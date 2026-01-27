import { deleteFile, revalidateClientPath, updateAsset } from "@/lib/actions";
import { AssetStatus, AssetType, IAsset } from "@/lib/definitions";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
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
import { useGlobalStore } from "@/hooks/useGlobalStore";
import { parse } from "date-fns";
import { ASSET_STATUSES, ASSET_TYPES } from "@/constants/assets";
import { formatDateUTC, isFileDifferent, mapApiErrors } from "@/lib/utils";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import FileInput from "../FileInput";
import { uploadFile } from "@/lib/data";

interface Iform {
  name: string;
  code: string;
  photoFile?: File;
  manualFile?: File;
  photoUrl?: string;
  manualUrl?: string;
  category: string;
  assetType: AssetType;
  model: string;
  brand: string;
  serialNumber: string;
  year: number;
  color: string;
  engineNumber: string;
  chassisNumber: string;
  quantity: number;
  locationDetail?: string;
  responsible: string;
  acquisitionDate: string;
  installationDate?: string;
  decommissionDate?: string;
  providerId: string;
  value: number;
  usefulLife: number;
  status: AssetStatus;
  notes: string;
  locationId: string;
}

const EditAsset = ({ asset }: { asset: IAsset }) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const {
    state: { providers, locations },
  } = useGlobalStore();

  const {
    handleSubmit,
    register,
    formState: { errors },
    control,
  } = useForm<Iform>({
    defaultValues: {
      name: asset.name,
      code: asset.code,
      photoUrl: asset.photoUrl,
      manualUrl: asset.manualUrl,
      category: asset.category,
      assetType: asset.assetType,
      model: asset.model,
      brand: asset.brand,
      serialNumber: asset.serialNumber,
      year: asset.year,
      color: asset.color,
      engineNumber: asset.engineNumber,
      chassisNumber: asset.chassisNumber,
      quantity: asset.quantity,
      locationDetail: asset.locationDetail,
      responsible: asset.responsible,
      acquisitionDate: formatDateUTC(asset.acquisitionDate, "yyyy-MM-dd"),
      installationDate: formatDateUTC(asset.installationDate, "yyyy-MM-dd"),
      decommissionDate: formatDateUTC(asset.decommissionDate, "yyyy-MM-dd"),
      providerId: asset.providerId,
      value: asset.value,
      usefulLife: asset.usefulLife,
      status: asset.status,
      notes: asset.notes,
      locationId: asset.locationId,
    },
    mode: "onTouched",
    reValidateMode: "onChange",
  });
  const onSubmit: SubmitHandler<Iform> = async (formData) => {
    const createMsg = toast.loading("Cargando...");
    try {
      const isPhotoDiff = await isFileDifferent(
        formData.photoFile,
        asset.photoUrl
      );
      if (isPhotoDiff) {
        formData.photoUrl = await uploadFile(formData.photoFile);
        await deleteFile(asset.photoUrl);
      }
      const isManualDiff = await isFileDifferent(
        formData.manualFile,
        asset.manualUrl
      );
      if (isManualDiff) {
        formData.manualUrl = await uploadFile(formData.manualFile);
        await deleteFile(asset.manualUrl);
      }
      delete formData.photoFile;
      delete formData.manualFile;
      const response = await updateAsset(asset.id, {
        ...formData,
        acquisitionDate: formData.acquisitionDate
          ? parse(formData.acquisitionDate, "yyyy-MM-dd", new Date())
          : undefined,
        installationDate: formData.installationDate
          ? parse(formData.installationDate, "yyyy-MM-dd", new Date())
          : undefined,
        decommissionDate: formData.decommissionDate
          ? parse(formData.decommissionDate, "yyyy-MM-dd", new Date())
          : undefined,
      });
      if (!response?.id) throw response;
      revalidateClientPath("/dashboard/assets");
      toast.success("Activo editado");
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
        size="5xl"
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
                  Editar Activo
                </ModalHeader>
                <ModalBody>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="Nombre"
                      isRequired
                      placeholder="Nombre"
                      {...register("name", { required: true })}
                      errorMessage={errors.name?.message}
                      isInvalid={!!errors.name?.message}
                    />
                    <Input
                      label="Código"
                      placeholder="10000"
                      isRequired
                      {...register("code", { required: true, maxLength: 10 })}
                      errorMessage={errors.code?.message}
                      isInvalid={!!errors.code?.message}
                    />
                    <Input
                      label="Modelo"
                      isRequired
                      placeholder="Modelo"
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
                      label="Número de Serie"
                      isRequired
                      placeholder="Número de Serie"
                      {...register("serialNumber", { required: true })}
                      errorMessage={errors.serialNumber?.message}
                      isInvalid={!!errors.serialNumber?.message}
                    />
                    <Input
                      label="Año"
                      isRequired
                      placeholder="Año"
                      type="number"
                      {...register("year", { required: true })}
                      errorMessage={errors.year?.message}
                      isInvalid={!!errors.year?.message}
                    />
                    <Input
                      label="Color"
                      placeholder="Color"
                      {...register("color")}
                      errorMessage={errors.color?.message}
                      isInvalid={!!errors.color?.message}
                    />
                    <Input
                      label="Número de Motor"
                      placeholder="Número de Motor"
                      {...register("engineNumber")}
                      errorMessage={errors.engineNumber?.message}
                      isInvalid={!!errors.engineNumber?.message}
                    />
                    <Input
                      label="Número de Chasis"
                      placeholder="Número de Chasis"
                      {...register("chassisNumber")}
                      errorMessage={errors.chassisNumber?.message}
                      isInvalid={!!errors.chassisNumber?.message}
                    />
                    <Input
                      label="Cantidad"
                      isRequired
                      placeholder="Cantidad"
                      type="number"
                      {...register("quantity", { required: true })}
                      errorMessage={errors.quantity?.message}
                      isInvalid={!!errors.quantity?.message}
                    />
                    <Input
                      label="Responsable"
                      placeholder="Responsable"
                      {...register("responsible")}
                      errorMessage={errors.responsible?.message}
                      isInvalid={!!errors.responsible?.message}
                    />
                    <Input
                      label="Fecha de Adquisición"
                      placeholder="Fecha de Adquisición"
                      type="date"
                      {...register("acquisitionDate")}
                      errorMessage={errors.acquisitionDate?.message}
                      isInvalid={!!errors.acquisitionDate?.message}
                    />
                    <Input
                      label="Fecha de Instalación"
                      placeholder="Fecha de Instalación"
                      type="date"
                      {...register("installationDate")}
                      errorMessage={errors.installationDate?.message}
                      isInvalid={!!errors.installationDate?.message}
                    />
                    <Input
                      label="Fecha de Baja"
                      placeholder="Fecha de Baja"
                      type="date"
                      {...register("decommissionDate")}
                      errorMessage={errors.decommissionDate?.message}
                      isInvalid={!!errors.decommissionDate?.message}
                    />
                    <Input
                      label="Valor"
                      isRequired
                      placeholder="Valor"
                      type="number"
                      {...register("value", { required: true })}
                      errorMessage={errors.value?.message}
                      isInvalid={!!errors.value?.message}
                    />
                    <Input
                      label="Vida Útil"
                      isRequired
                      placeholder="Vida Útil"
                      type="number"
                      {...register("usefulLife", { required: true })}
                      errorMessage={errors.usefulLife?.message}
                      isInvalid={!!errors.usefulLife?.message}
                    />
                    <Input
                      label="Detalles de Ubicación"
                      placeholder="Detalles de Ubicación"
                      {...register("locationDetail")}
                      errorMessage={errors.locationDetail?.message}
                      isInvalid={!!errors.locationDetail?.message}
                    />

                    <Input
                      label="Categoría"
                      placeholder="Categoría"
                      {...register("category")}
                      errorMessage={errors.category?.message}
                      isInvalid={!!errors.category?.message}
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
                    <Controller
                      name="locationId"
                      control={control}
                      rules={{ required: true }}
                      render={({ field }) => (
                        <Autocomplete
                          label="Ubicación"
                          placeholder=" "
                          isRequired
                          selectedKey={field.value}
                          defaultItems={locations}
                          onSelectionChange={field.onChange}
                          errorMessage={errors.locationId?.message}
                          isInvalid={!!errors.locationId?.message}
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
                      {...register("assetType")}
                      label="Tipo de Activo"
                      isRequired
                      placeholder=" "
                      errorMessage={errors.assetType?.message}
                      isInvalid={!!errors.assetType?.message}
                    >
                      {ASSET_TYPES.map((type) => (
                        <SelectItem key={type.value}>{type.label}</SelectItem>
                      ))}
                    </Select>
                    <Select
                      {...register("status")}
                      label="Estado"
                      isRequired
                      placeholder=" "
                      errorMessage={errors.status?.message}
                      isInvalid={!!errors.status?.message}
                    >
                      {ASSET_STATUSES.map((status) => (
                        <SelectItem key={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </Select>
                    <Input
                      label="Notas"
                      placeholder="Notas"
                      {...register("notes")}
                    />
                    <div />
                    <Controller
                      name="manualFile"
                      control={control}
                      render={({ field }) => (
                        <FileInput
                          key={asset.id}
                          value={field.value}
                          onChange={field.onChange}
                          label="Manual del activo"
                          url={asset.manualUrl}
                        />
                      )}
                    />
                    <Controller
                      name="photoFile"
                      control={control}
                      render={({ field }) => (
                        <FileInput
                          key={asset.id}
                          value={field.value}
                          onChange={field.onChange}
                          label="Foto del activo"
                          url={asset.photoUrl}
                        />
                      )}
                    />
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button color="default" variant="light" onPress={onClose}>
                    Cancelar
                  </Button>
                  <Button color="primary" type="submit">
                    Editar Activo
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

export default EditAsset;
