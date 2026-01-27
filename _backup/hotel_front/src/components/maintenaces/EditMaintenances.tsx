import { revalidateClientPath, updateMaintenance } from "@/lib/actions";
import {
  Frequency,
  IMaintenance,
  MaintenanceStatus,
  MaintenanceType,
  Priority,
} from "@/lib/definitions";
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
import { formatDateUTC, mapApiErrors } from "@/lib/utils";
import {
  MAINTENANCE_FREQUENCY,
  MAINTENANCE_PRIORITY,
  MAINTENANCE_STATUS,
  MAINTENANCE_TYPE,
} from "@/constants/maintenance";
import TechnicianAutocomplete from "../TechnicianAutocomplete";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";

interface Iform {
  assetId: string;
  maintenanceCode: string;
  maintenanceType: MaintenanceType;
  description: string;
  scheduledDate: string;
  frequency: Frequency;
  priority: Priority;
  responsible: string;
  status: MaintenanceStatus;
  estimatedCost: number;
  alertDaysBefore: number;
  providerId: string;
  technicianId: string;
}

const EditMaintenance = ({ maintenance }: { maintenance: IMaintenance }) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const {
    state: { assets, providers, technicians },
  } = useGlobalStore();

  const {
    handleSubmit,
    register,
    formState: { errors },
    control,
  } = useForm<Iform>({
    defaultValues: {
      assetId: maintenance.assetId,
      maintenanceCode: maintenance.maintenanceCode,
      maintenanceType: maintenance.maintenanceType,
      description: maintenance.description,
      scheduledDate: formatDateUTC(maintenance.scheduledDate, "yyyy-MM-dd"),
      frequency: maintenance.frequency,
      priority: maintenance.priority,
      responsible: maintenance.responsible,
      status: maintenance.status,
      estimatedCost: maintenance.estimatedCost,
      alertDaysBefore: maintenance.alertDaysBefore,
      providerId: maintenance.providerId,
      technicianId: maintenance.technicianId,
    },
    mode: "onTouched",
    reValidateMode: "onChange",
  });
  const onSubmit: SubmitHandler<Iform> = async (formData) => {
    const createMsg = toast.loading("Cargando...");
    try {
      const response = await updateMaintenance(maintenance.id, {
        ...formData,
        scheduledDate: formData.scheduledDate
          ? parse(formData.scheduledDate, "yyyy-MM-dd", new Date())
          : undefined,
      });
      if (!response?.id) throw response;
      revalidateClientPath("/dashboard/maintenances");
      toast.success("Mantenimiento editado");
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
                  Editar Mantenimiento
                </ModalHeader>
                <ModalBody>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="Descripción"
                      placeholder="Descripción"
                      {...register("description", { required: true })}
                      errorMessage={errors.description?.message}
                      isInvalid={!!errors.description?.message}
                    />
                    <Input
                      label="Días de alerta"
                      type="number"
                      placeholder="Días de alerta"
                      {...register("alertDaysBefore", { required: true })}
                      errorMessage={errors.alertDaysBefore?.message}
                      isInvalid={!!errors.alertDaysBefore?.message}
                    />
                    <Controller
                      name="assetId"
                      control={control}
                      rules={{ required: true }}
                      render={({ field }) => (
                        <Autocomplete
                          label="Equipo"
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
                      control={control}
                      name="technicianId"
                      render={({ field: { onChange, value } }) => (
                        <TechnicianAutocomplete
                          technicians={technicians}
                          value={value}
                          onChange={onChange}
                        />
                      )}
                    />
                    <Input
                      label="Responsable"
                      placeholder="Responsable"
                      {...register("responsible", { required: true })}
                      errorMessage={errors.responsible?.message}
                      isInvalid={!!errors.responsible?.message}
                    />
                    <Input
                      label="Código de mantenimiento"
                      placeholder="Código de mantenimiento"
                      {...register("maintenanceCode", { required: true })}
                      errorMessage={errors.maintenanceCode?.message}
                      isInvalid={!!errors.maintenanceCode?.message}
                    />
                    <Select
                      {...register("maintenanceType")}
                      label="Tipo de mantenimiento"
                      isRequired
                      placeholder=" "
                      errorMessage={errors.maintenanceType?.message}
                      isInvalid={!!errors.maintenanceType?.message}
                    >
                      {MAINTENANCE_TYPE.map((maintenanceType) => (
                        <SelectItem key={maintenanceType.value}>
                          {maintenanceType.label}
                        </SelectItem>
                      ))}
                    </Select>
                    <Input
                      label="Fecha programada"
                      placeholder="Fecha programada"
                      type="date"
                      {...register("scheduledDate", { required: true })}
                      errorMessage={errors.scheduledDate?.message}
                      isInvalid={!!errors.scheduledDate?.message}
                    />
                    <Select
                      {...register("frequency")}
                      label="Frecuencia"
                      isRequired
                      placeholder=" "
                      errorMessage={errors.frequency?.message}
                      isInvalid={!!errors.frequency?.message}
                    >
                      {MAINTENANCE_FREQUENCY.map((frequency) => (
                        <SelectItem key={frequency.value}>
                          {frequency.label}
                        </SelectItem>
                      ))}
                    </Select>
                    <Select
                      {...register("priority")}
                      label="Prioridad"
                      isRequired
                      placeholder=" "
                      errorMessage={errors.priority?.message}
                      isInvalid={!!errors.priority?.message}
                    >
                      {MAINTENANCE_PRIORITY.map((priority) => (
                        <SelectItem key={priority.value}>
                          {priority.label}
                        </SelectItem>
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
                      {MAINTENANCE_STATUS.map((status) => (
                        <SelectItem key={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </Select>

                    <Input
                      label="Costo estimado"
                      placeholder="Costo estimado"
                      type="number"
                      {...register("estimatedCost", { required: true })}
                      errorMessage={errors.estimatedCost?.message}
                      isInvalid={!!errors.estimatedCost?.message}
                    />
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button color="default" variant="light" onPress={onClose}>
                    Cancelar
                  </Button>
                  <Button color="primary" type="submit">
                    Editar Mantenimiento
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

export default EditMaintenance;
