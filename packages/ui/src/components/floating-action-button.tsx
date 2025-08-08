'use client';

import { Z_INDEX_LAYERS } from '@repo/constants';
import { type VariantProps } from 'class-variance-authority';
import React from 'react';

import { cn } from '../lib/utils';

import { Button, buttonVariants } from './ui/button';



export interface FloatingActionButtonProps extends
    Omit<React.ComponentProps<'button'>, 'className'>,
    VariantProps<typeof buttonVariants> {
    /** Показывать ли кнопку */
    show?: boolean;
    /** Позиция кнопки */
    position?: keyof typeof POSITION_CLASSES;
    /** Отступ от края экрана */
    offset?: {
        bottom?: number;
        right?: number;
        left?: number;
    };
    /** Дополнительные CSS классы */
    className?: string;
    /** Анимация появления/исчезновения */
    animate?: boolean;
    /** Анимация привлечения внимания (пульсация) */
    pulse?: boolean;
    /** Тип анимации пульсации */
    pulseType?: 'slow' | 'normal' | 'fast' | 'attention';
}

// Константы для позиций (вынесены для снижения сложности)
const POSITION_KEYS = {
    BOTTOM_RIGHT: 'bottom-right',
    BOTTOM_LEFT: 'bottom-left',
    BOTTOM_CENTER: 'bottom-center',
} as const;

const POSITION_CLASSES = {
    [POSITION_KEYS.BOTTOM_RIGHT]: 'bottom-6 right-6',
    [POSITION_KEYS.BOTTOM_LEFT]: 'bottom-6 left-6',
    [POSITION_KEYS.BOTTOM_CENTER]: 'bottom-6 left-1/2 -translate-x-1/2',
} as const;

// Константы для типов анимации пульсации (уникальные имена)
const PULSE_ANIMATION_CLASSES = {
    slow: 'animate-heartbeat-slow',
    normal: 'animate-heartbeat-normal',
    fast: 'animate-heartbeat-fast',
    attention: 'animate-heartbeat-attention',
} as const;

// Функция для создания стилей отступов
function createOffsetStyles(
    position: keyof typeof POSITION_CLASSES,
    offset: { bottom?: number; right?: number; left?: number }
) {
    return {
        bottom: offset.bottom ? `${offset.bottom}px` : undefined,
        right: position === POSITION_KEYS.BOTTOM_RIGHT && offset.right ? `${offset.right}px` : undefined,
        left: position === POSITION_KEYS.BOTTOM_LEFT && offset.left ? `${offset.left}px` : undefined,
    };
}

// Интерфейс для параметров создания классов контейнера
interface ContainerClassParams {
    position: keyof typeof POSITION_CLASSES;
    animate: boolean;
    show: boolean;
    pulse: boolean;
    pulseType: keyof typeof PULSE_ANIMATION_CLASSES;
    className?: string;
}

// Функция для создания классов контейнера
function createContainerClasses(params: ContainerClassParams) {
    const { position, animate, show, pulse, pulseType, className } = params;
    // Безопасное получение класса позиции
    const positionClass = position === POSITION_KEYS.BOTTOM_RIGHT
        ? POSITION_CLASSES[POSITION_KEYS.BOTTOM_RIGHT]
        : position === POSITION_KEYS.BOTTOM_LEFT
            ? POSITION_CLASSES[POSITION_KEYS.BOTTOM_LEFT]
            : POSITION_CLASSES[POSITION_KEYS.BOTTOM_CENTER];

    // Получение класса анимации пульсации
    // eslint-disable-next-line security/detect-object-injection
    const pulseClass = PULSE_ANIMATION_CLASSES[pulseType];



    return cn(
        'fixed', // z-index устанавливается через style для использования константы
        positionClass,
        animate && 'transition-all ease-in-out',
        show
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-2 pointer-events-none',
        // Анимация привлечения внимания (временно без motion-reduce для тестирования)
        pulse && show && pulseClass,
        className
    );
}

/**
 * Floating Action Button - плавающая кнопка действия
 * Используется для важных действий, которые должны быть всегда доступны
 */
export function FloatingActionButton({
    show = true,
    position = POSITION_KEYS.BOTTOM_RIGHT,
    offset = { bottom: 24, right: 24 },
    className,
    animate = true,
    pulse = false,
    pulseType = 'attention',
    children,
    variant,
    size,
    ...buttonProps
}: FloatingActionButtonProps) {
    const offsetStyles = createOffsetStyles(position, offset);
    const containerClasses = createContainerClasses({
        position,
        animate,
        show,
        pulse,
        pulseType,
        className,
    });

    return (
        <div
            className={containerClasses}
            style={{
                ...offsetStyles,
                zIndex: Z_INDEX_LAYERS.FLOATING
            }}

        >
            <Button
                variant={variant}
                size={size || 'lg'}
                className={cn(
                    'shadow-lg hover:shadow-xl',
                    animate && 'transition-all duration-200 hover:scale-105 active:scale-95'
                )}
                {...buttonProps}
            >
                {children}
            </Button>
        </div>
    );
}