"use client";
import React, { useEffect, useRef, useState } from "react";

type FileInputProps = {
  value?: File | null;
  onChange: (file: File | null) => void;
  url?: string;
  className?: string;
  label?: string;
  accept?: string;
  isRequired?: boolean;
};

const FileInput: React.FC<FileInputProps> = ({
  value,
  onChange,
  url,
  className,
  label,
  accept,
  isRequired,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // cargar archivo desde URL si existe
  useEffect(() => {
    const loadFileFromUrl = async () => {
      if (!!url) {
        try {
          const res = await fetch(url);
          const blob = await res.blob();
          const name = url.split("/").pop() || "archivo";
          const file = new File([blob], name, { type: blob.type });
          onChange(file);
          if (blob.type.startsWith("image/")) {
            setPreview(URL.createObjectURL(blob));
          } else {
            setPreview(null);
          }
        } catch (error) {
          console.error("Error cargando archivo desde URL:", error);
        }
      }
    };
    loadFileFromUrl();
  }, [url]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] ?? null;
    if (selectedFile) {
      onChange(selectedFile);
      if (selectedFile.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => setPreview(reader.result as string);
        reader.readAsDataURL(selectedFile);
      } else {
        setPreview(null);
      }
    }
  };

  const handleRemove = () => {
    onChange(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDownload = () => {
    if (value) {
      const url = URL.createObjectURL(value);
      const a = document.createElement("a");
      a.href = url;
      a.download = value.name;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const renderPreview = () => {
    if (!value) {
      return (
        <div className="flex items-center justify-center w-full h-full text-gray-400">
          <span className="text-sm">Sin archivo</span>
        </div>
      );
    }

    if (preview) {
      return (
        <img
          src={preview}
          alt="Preview"
          className="w-full h-full object-cover rounded-xl"
        />
      );
    }

    // íconos según tipo de archivo
    let iconText = <span className="icon-[bxs--file] w-16 h-16" />;
    if (value.type.includes("pdf"))
      iconText = <span className="icon-[teenyicons--pdf-solid] w-16 h-16" />;
    if (value.type.includes("word") || value.name.endsWith(".docx"))
      iconText = <span className="icon-[hugeicons--doc-02] w-16 h-16" />;
    if (value.type.includes("excel") || value.name.endsWith(".xlsx"))
      iconText = <span className="icon-[healthicons--excel-logo] w-16 h-16" />;
    if (value.type.startsWith("video/"))
      iconText = (
        <span className="icon-[material-symbols--video-file-outline-rounded] w-16 h-16" />
      );

    return (
      <div className="flex items-center justify-center w-full h-full text-4xl ">
        {iconText}
      </div>
    );
  };

  return (
    <div
      className={`${className} flex flex-col gap-2 p-3 bg-default-100 border rounded-2xl shadow-sm transition`}
    >
      {label && (
        <div className="flex items-center gap-1 h-6">
          <span className="text-sm font-medium text-gray-600">{label}</span>{" "}
          {isRequired && <span className="text-red-500">*</span>}
        </div>
      )}

      {/* Área fija de preview */}
      <div className="relative w-full aspect-square rounded-xl border bg-white overflow-hidden">
        {renderPreview()}
      </div>

      {/* Input siempre igual de alto */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-3
        file:rounded-lg file:border-0 file:text-xs file:font-semibold
        file:bg-primary file:text-white hover:file:bg-primary/80"
      />

      {/* Acciones solo si hay archivo */}
      {value && (
        <div className="flex justify-between mt-1">
          <button
            type="button"
            onClick={handleDownload}
            className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
          >
            Descargar
          </button>
          <button
            type="button"
            onClick={handleRemove}
            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
          >
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
};

export default FileInput;
