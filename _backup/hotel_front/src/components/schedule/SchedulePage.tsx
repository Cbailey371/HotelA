"use client";
import { Calendar, dateFnsLocalizer, View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import { IMaintenance } from "@/lib/definitions";
import { useCallback, useMemo, useState } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  useDisclosure,
} from "@heroui/modal";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { amountFormatter } from "@/lib/utils";
import {
  MAINTENANCE_DICTIONARY,
  MAINTENANCE_FREQUENCY_DICTIONARY,
  MAINTENANCE_PRIORITY_DICTIONARY,
} from "@/constants/maintenance";

const locales = { "en-US": enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

type Props = { maintenances: IMaintenance[] };

const SchedulePage = ({ maintenances }: Props) => {
  const [selected, setSelected] = useState<IMaintenance | null>(null);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { replace } = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const whereParam = searchParams.get("where");
  let defaultDate = new Date();

  try {
    if (whereParam) {
      const where = JSON.parse(whereParam);
      const fromDateFilter = where.find(
        (w: any) => w.key === "scheduledDate" && w.operator === "gte"
      );
      if (fromDateFilter?.value) {
        const parsedDate = new Date(fromDateFilter.value);
        if (!isNaN(parsedDate.getTime())) {
          parsedDate.setDate(parsedDate.getDate() + 8);
          defaultDate = parsedDate;
        }
      }
    }
  } catch (e) {
    console.error("Error parsing search params for date:", e);
  }

  const onRangeChange = (range: { start: Date; end: Date }) => {
    const params = new URLSearchParams(searchParams);
    const whereParam = JSON.stringify([
      {
        key: "scheduledDate",
        value: range.start.toISOString(),
        operator: "gte",
        valueType: "date",
      },
      {
        key: "scheduledDate",
        value: range.end.toISOString(),
        operator: "lte",
        valueType: "date",
      },
    ]);

    params.set("page", "1");
    params.set("where", whereParam);
    params.set("operator", "AND");
    replace(`${pathname}?${params.toString()}`);
  };

  const handleRangeChange = useCallback(
    (range: Date[] | { start: Date; end: Date }, _view?: View) => {
      if (Array.isArray(range)) {
        const sorted = [...range].sort((a, b) => a.getTime() - b.getTime());
        onRangeChange({ start: sorted[0], end: sorted[sorted.length - 1] });
      } else {
        onRangeChange(range);
      }
    },
    []
  );

  const events = useMemo(
    () =>
      maintenances.map((m) => ({
        id: m.id,
        title: m.description,
        start: new Date(m.scheduledDate),
        end: new Date(m.scheduledDate),
        resource: m,
      })),
    [maintenances]
  );

  return (
    <>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600 }}
        views={["month", "week", "day"]}
        onRangeChange={handleRangeChange}
        onSelectEvent={(e) => {
          setSelected(e.resource as IMaintenance);
          onOpen();
        }}
        defaultDate={defaultDate}
      />

      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          <ModalHeader>{selected?.description}</ModalHeader>
          <ModalBody className="mb-4 text-sm text-gray-700">
            {selected && (
              <div className="space-y-2 text-lg">
                <div className="flex items-center gap-2">
                  <span className="icon-[akar-icons--clipboard] text-blue-600" />
                  <span className="font-medium">Código:</span>{" "}
                  {selected.maintenanceCode}
                </div>
                <div className="flex items-center gap-2">
                  <span className="icon-[bxs--wrench] text-orange-600" />
                  <span className="font-medium">Tipo:</span>{" "}
                  {MAINTENANCE_DICTIONARY[selected.maintenanceType]}
                </div>
                <div className="flex items-center gap-2">
                  <span className="icon-[majesticons--calendar] text-purple-600" />
                  <span className="font-medium">Fecha programada:</span>{" "}
                  {new Date(selected.scheduledDate).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                  <span className="icon-[majesticons--clock] text-teal-600" />
                  <span className="font-medium">Frecuencia:</span>{" "}
                  {MAINTENANCE_FREQUENCY_DICTIONARY[selected.frequency]}
                </div>
                <div className="flex items-center gap-2">
                  <span className="icon-[mdi--shield-alert] text-red-600" />
                  <span className="font-medium">Prioridad:</span>{" "}
                  {MAINTENANCE_PRIORITY_DICTIONARY[selected.priority]}
                </div>
                <div className="flex items-center gap-2">
                  <span className="icon-[fa-solid--user-cog] text-gray-800" />
                  <span className="font-medium">Responsable:</span>{" "}
                  {selected.responsible}
                </div>
                <div className="flex items-center gap-2">
                  <span className="icon-[bx--dollar] text-green-600" />
                  <span className="font-medium">Costo estimado:</span>
                  {amountFormatter(selected.estimatedCost)}
                </div>
                <div className="flex items-center gap-2">
                  <span className="icon-[tabler--map-pin] text-pink-600" />
                  <span className="font-medium">Proveedor:</span>{" "}
                  {selected.provider?.name ?? "N/A"}
                </div>
              </div>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default SchedulePage;
