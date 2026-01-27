import { Input, InputProps } from "@heroui/input";
import React, { useEffect, useRef, useState } from "react";

const InputPassword = (props: InputProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const toggleVisibility = () => setIsVisible(!isVisible);

  const eyeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (eyeButtonRef.current) {
      eyeButtonRef.current.tabIndex = -1;
    }
  }, []);

  return (
    <Input
      {...props}
      type={isVisible ? "text" : "password"}
      endContent={
        <button
          ref={eyeButtonRef}
          className="opacity-60 hover:opacity-90 transition-all p-1"
          type="button"
          onClick={toggleVisibility}
          aria-label="toggle password visibility"
        >
          {isVisible ? (
            <span className="icon-[ri--eye-line]" />
          ) : (
            <span className="icon-[majesticons--eye-off-line]" />
          )}
        </button>
      }
    />
  );
};

export default InputPassword;
