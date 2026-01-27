import React from "react";
import { PhoneInput, PhoneInputProps } from "react-international-phone";
import "react-international-phone/style.css";

const CustomPhoneInput = (
  props: PhoneInputProps & {
    isInvalid?: boolean;
    isDisabled?: boolean;
    errorMessage?: string;
    label?: string;
  }
) => {
  const { isInvalid, isDisabled, errorMessage, label, ...rest } = props;

  const inputClassName = [
    "!h-5",
    "!bg-inherit",
    "!rounded-xl",
    "!border-none",
    "!text-inherit",
    "!text-sm",
    isDisabled && "opacity-50 pointer-events-none",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={`relative z-30 rounded-xl p-2 px-3 ${
        isInvalid
          ? "!text-red-500 !bg-danger-50 hover:!bg-danger-100"
          : "!text-gray-500 bg-gray-100 hover:!bg-gray-200"
      }`}
    >
      {label && (
        <label className="block mb-1 text-xs font-medium ">{label}</label>
      )}
      <PhoneInput
        inputClassName={inputClassName}
        countrySelectorStyleProps={{
          buttonClassName: inputClassName,
        }}
        className="gap-4"
        disabled={isDisabled}
        // readOnly={props.isDisabled}
        {...rest}
      />
      {isInvalid && errorMessage && (
        <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
      )}
    </div>
  );
};

export default CustomPhoneInput;
