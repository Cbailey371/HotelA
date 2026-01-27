"use client";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import InputPassword from "./InpuPassword";

type LoginFormData = {
  email: string;
  password: string;
};

const Login = () => {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    const createMsg = toast.loading("Iniciando sesión");
    try {
      const res = await signIn("credentials", {
        email: data?.email?.trim(),
        password: data.password,
        redirect: false,
      });
      if (!!res?.ok && !!!res?.error) {
        router.push("/dashboard");
      } else {
        toast.error("Credenciales inválidas");
      }
    } catch (error) {
      console.log(error);
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
              Inicia sesión en tu cuenta
            </h1>
            <form
              className="space-y-4 md:space-y-6"
              onSubmit={handleSubmit(onSubmit)}
            >
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
                  Contraseña
                </label>
                <InputPassword
                  type="password"
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
              <div className="flex items-center justify-between">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="remember"
                      aria-describedby="remember"
                      type="checkbox"
                      className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-primary-300"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label className="text-gray-500">Recuerdame</label>
                  </div>
                </div>
                <a
                  href="#"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Olvidaste tu contraseña?
                </a>
              </div>
              <Button type="submit" color="primary" fullWidth>
                Iniciar sesión
              </Button>
              <p className="text-sm font-light text-gray-500">
                ¿No tienes una cuenta?{" "}
                <Link
                  href="/register"
                  className="font-medium text-primary hover:underline"
                >
                  Regístrate
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Login;
