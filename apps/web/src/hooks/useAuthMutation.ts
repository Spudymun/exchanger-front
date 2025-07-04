'use client';

import { HTTP_STATUS } from '@repo/constants';
import toast from 'react-hot-toast';

import { trpc } from '../../lib/trpc';

// Хук для входа в систему
function useLoginMutation() {
  const utils = trpc.useUtils();

  return trpc.auth.login.useMutation({
    onSuccess: () => {
      toast.success('Вход выполнен успешно');
      utils.auth.getSession.invalidate();
    },
    onError: error => {
      if (error.data?.httpStatus === HTTP_STATUS.TOO_MANY_REQUESTS) {
        toast.error('Слишком много попыток входа. Попробуйте позже');
      } else if (error.data?.httpStatus === HTTP_STATUS.UNAUTHORIZED) {
        toast.error('Неверный email или пароль');
      } else {
        toast.error('Ошибка входа в систему');
      }
    },
  });
}

// Хук для регистрации
function useRegisterMutation() {
  return trpc.auth.register.useMutation({
    onSuccess: () => {
      toast.success('Регистрация успешна. Проверьте email для подтверждения');
    },
    onError: error => {
      if (error.data?.httpStatus === HTTP_STATUS.TOO_MANY_REQUESTS) {
        toast.error('Слишком много попыток регистрации. Попробуйте позже');
      } else if (error.data?.httpStatus === HTTP_STATUS.CONFLICT) {
        toast.error('Пользователь с таким email уже существует');
      } else {
        toast.error('Ошибка регистрации');
      }
    },
  });
}

// Хук для выхода из системы
function useLogoutMutation() {
  const utils = trpc.useUtils();

  return trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success('Выход выполнен');
      utils.auth.getSession.invalidate();
    },
    onError: () => {
      toast.error('Ошибка при выходе');
    },
  });
}

// Основной хук для всех аутентификационных операций
export function useAuthMutation(): {
  login: ReturnType<typeof trpc.auth.login.useMutation>;
  register: ReturnType<typeof trpc.auth.register.useMutation>;
  logout: ReturnType<typeof trpc.auth.logout.useMutation>;
  requestPasswordReset: ReturnType<typeof trpc.auth.requestPasswordReset.useMutation>;
  resetPassword: ReturnType<typeof trpc.auth.resetPassword.useMutation>;
  verifyEmail: ReturnType<typeof trpc.auth.verifyEmail.useMutation>;
} {
  const login = useLoginMutation();
  const register = useRegisterMutation();
  const logout = useLogoutMutation();

  const requestPasswordReset = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: () => toast.success('Инструкции отправлены на email'),
    onError: error => {
      if (error.data?.httpStatus === HTTP_STATUS.NOT_FOUND) {
        toast.error('Пользователь с таким email не найден');
      } else {
        toast.error('Ошибка при сбросе пароля');
      }
    },
  });

  const resetPassword = trpc.auth.resetPassword.useMutation({
    onSuccess: () => toast.success('Пароль успешно изменен'),
    onError: error => {
      if (error.data?.httpStatus === HTTP_STATUS.BAD_REQUEST) {
        toast.error('Неверный или истекший код сброса');
      } else {
        toast.error('Ошибка при смене пароля');
      }
    },
  });

  const verifyEmail = trpc.auth.verifyEmail.useMutation({
    onSuccess: () => toast.success('Email успешно подтвержден'),
    onError: error => {
      if (error.data?.httpStatus === HTTP_STATUS.BAD_REQUEST) {
        toast.error('Неверный или истекший код подтверждения');
      } else {
        toast.error('Ошибка подтверждения email');
      }
    },
  });

  return { login, register, logout, requestPasswordReset, resetPassword, verifyEmail };
}
