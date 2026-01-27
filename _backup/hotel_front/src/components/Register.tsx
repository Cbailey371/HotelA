"use client";

import { createUser } from "@/lib/actions";
import { Input } from "@heroui/input";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import InputPassword from "./InpuPassword";
import { Button } from "@heroui/button";
import { mapApiErrors } from "@/lib/utils";

type RegisterFormData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const Register = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    mode: "onTouched",
    reValidateMode: "onChange",
  });
  const router = useRouter();

  const onSubmit = async (data: RegisterFormData) => {
    const createMsg = toast.loading("Registrando...");
    try {
      const res = await createUser({
        name: data.name,
        email: data.email?.trim(),
        password: data.password,
      });
      // console.log(res);
      if (!res?.id) throw res;

      const signInRes = await signIn("credentials", {
        email: data?.email?.trim(),
        password: data.password,
        redirect: false,
      });
      if (!!signInRes?.ok && !!!signInRes?.error) {
        router.push("/dashboard");
      } else {
        toast.error("Error al iniciar sesión");
      }
    } catch (error) {
      const errors = mapApiErrors(error);
      if (errors.length > 0) {
        errors?.forEach((err) => toast.error(err));
      } else {
        toast.error("Error al crear la cuenta");
      }
    } finally {
      toast.dismiss(createMsg);
    }
  };

  return (
    <section className="bg-gray-50">
      <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
        <a
          href="#"
          className="flex items-center mb-6 text-2xl font-semibold text-gray-900"
        >
          Hotel Andros
        </a>
        <div className="w-full bg-white rounded-lg shadow md:mt-0 sm:max-w-md xl:p-0">
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl">
              Crea una cuenta
            </h1>
            <form
              className="space-y-4 md:space-y-6"
              onSubmit={handleSubmit(onSubmit)}
            >
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-900">
                  Nombre
                </label>
                <Input
                  type="text"
                  {...register("name", {
                    required: "El nombre es requerido",
                  })}
                  placeholder="Nombre"
                  errorMessage={errors.name?.message}
                  isInvalid={!!errors.name}
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-900">
                  Email
                </label>
                <Input
                  type="email"
                  {...register("email", {
                    required: "El email es requerido",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Email no válido",
                    },
                  })}
                  placeholder="name@company.com"
                  errorMessage={errors.email?.message}
                  isInvalid={!!errors.email}
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-900">
                  Contraseña
                </label>
                <InputPassword
                  {...register("password", {
                    required: "La contraseña es requerida",
                    minLength: {
                      value: 8,
                      message: "La contraseña debe tener al menos 8 caracteres",
                    },
                    pattern: {
                      value:
                        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                      message:
                        "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial",
                    },
                  })}
                  placeholder="••••••••"
                  errorMessage={errors.password?.message}
                  isInvalid={!!errors.password}
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-900">
                  Confirmar contraseña
                </label>
                <InputPassword
                  {...register("confirmPassword", {
                    required: "La contraseña es requerida",
                    validate: {
                      matchesPreviousPassword: (value) =>
                        value === watch("password") ||
                        "Las contraseñas no coinciden",
                    },
                  })}
                  errorMessage={errors.confirmPassword?.message}
                  isInvalid={!!errors.confirmPassword}
                  placeholder="••••••••"
                />
              </div>
              <Button type="submit" color="primary" fullWidth>
                Crear cuenta
              </Button>
              <p className="text-sm font-light text-gray-500">
                ¿Ya tienes una cuenta?{" "}
                <Link
                  href="/login"
                  className="font-medium text-primary hover:underline"
                >
                  Inicia sesión
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Register;
