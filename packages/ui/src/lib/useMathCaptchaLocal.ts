"use client";

import { useState, useCallback, useMemo, useEffect } from 'react';

/**
 * LOCAL COPY of math CAPTCHA logic for UI package
 * This is a temporary solution to avoid dependency on @repo/hooks
 * REFACTOR PLAN: This will be replaced with data via props when forms are updated
 * to maintain proper UI package isolation according to CODE_STYLE_GUIDE.md
 */

export interface MathChallenge {
    question: string;
    answer: number;
    id: string;
}

export interface MathCaptchaConfig {
    minNumber: number;
    maxNumber: number;
    operations: Array<'add' | 'subtract' | 'multiply'>;
}

const MULTIPLY_MAX_NUMBER = 10;
const ID_BASE = 36;
const ID_SUBSTRING_START = 2;
const ID_SUBSTRING_LENGTH = 9;

const DEFAULT_CONFIG: MathCaptchaConfig = {
    minNumber: 1,
    maxNumber: 20,
    operations: ['add', 'subtract', 'multiply'],
};

function generateMathChallenge(config: MathCaptchaConfig = DEFAULT_CONFIG): MathChallenge {
    const { minNumber, maxNumber, operations } = config;

    const num1 = Math.floor(Math.random() * (maxNumber - minNumber + 1)) + minNumber;
    const num2 = Math.floor(Math.random() * (maxNumber - minNumber + 1)) + minNumber;

    const operation = operations[Math.floor(Math.random() * operations.length)];

    let question: string;
    let answer: number;

    switch (operation) {
        case 'add': {
            question = `${num1} + ${num2}`;
            answer = num1 + num2;
            break;
        }
        case 'subtract': {
            const larger = Math.max(num1, num2);
            const smaller = Math.min(num1, num2);
            question = `${larger} - ${smaller}`;
            answer = larger - smaller;
            break;
        }
        case 'multiply': {
            const smallNum1 = Math.floor(Math.random() * MULTIPLY_MAX_NUMBER) + 1;
            const smallNum2 = Math.floor(Math.random() * MULTIPLY_MAX_NUMBER) + 1;
            question = `${smallNum1} × ${smallNum2}`;
            answer = smallNum1 * smallNum2;
            break;
        }
        default: {
            question = `${num1} + ${num2}`;
            answer = num1 + num2;
        }
    }

    return {
        question,
        answer,
        id: `captcha-${Date.now()}-${Math.random().toString(ID_BASE).substr(ID_SUBSTRING_START, ID_SUBSTRING_LENGTH)}`,
    };
}

export function useMathCaptchaLocal(config: MathCaptchaConfig = DEFAULT_CONFIG) {
    const [challenge, setChallenge] = useState<MathChallenge>(() =>
        generateMathChallenge(config)
    );
    const [userAnswer, setUserAnswer] = useState<string>('');
    const [isVerified, setIsVerified] = useState<boolean>(false);
    const [hasBlurred, setHasBlurred] = useState<boolean>(false);

    const refreshChallenge = useCallback(() => {
        setChallenge(generateMathChallenge(config));
        setUserAnswer('');
        setIsVerified(false);
        setHasBlurred(false);
    }, [config]);

    const isValid = useMemo(() => {
        const numericAnswer = parseInt(userAnswer.trim(), 10);
        return !isNaN(numericAnswer) && numericAnswer === challenge.answer;
    }, [userAnswer, challenge.answer]);

    const hasError = useMemo(() => {
        return hasBlurred && userAnswer.trim() !== '' && !isValid;
    }, [hasBlurred, userAnswer, isValid]);

    useEffect(() => {
        if (isValid && userAnswer.trim() !== '') {
            setIsVerified(true);
        } else {
            setIsVerified(false);
        }
    }, [isValid, userAnswer]);

    const onBlur = useCallback(() => {
        setHasBlurred(true);
    }, []);

    return {
        challenge,
        userAnswer,
        isValid,
        isVerified,
        hasError,
        setUserAnswer,
        onBlur,
        refreshChallenge,
    };
}

export const CAPTCHA_CONFIGS_LOCAL: Record<string, MathCaptchaConfig> = {
    easy: {
        minNumber: 1,
        maxNumber: 10,
        operations: ['add', 'subtract'],
    },
    medium: {
        minNumber: 1,
        maxNumber: 20,
        operations: ['add', 'subtract', 'multiply'],
    },
    hard: {
        minNumber: 5,
        maxNumber: 50,
        operations: ['add', 'subtract', 'multiply'],
    },
};