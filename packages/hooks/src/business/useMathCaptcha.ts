import { useState, useCallback, useMemo, useEffect } from 'react';

/**
 * Mathematical CAPTCHA challenge interface
 */
export interface MathChallenge {
  question: string;
  answer: number;
  id: string;
}

/**
 * useMathCaptcha hook return interface
 */
export interface UseMathCaptchaReturn {
  challenge: MathChallenge;
  userAnswer: string;
  isValid: boolean;
  isVerified: boolean;
  hasError: boolean;
  setUserAnswer: (answer: string) => void;
  onBlur: () => void;
  refreshChallenge: () => void;
  verify: () => boolean;
  reset: () => void;
}

/**
 * Configuration for math CAPTCHA generation
 */
export interface MathCaptchaConfig {
  minNumber: number;
  maxNumber: number;
  operations: Array<'add' | 'subtract' | 'multiply'>;
}

// Constants for magic numbers
const MULTIPLY_MAX_NUMBER = 10;
const ID_BASE = 36;
const ID_SUBSTRING_START = 2;
const ID_SUBSTRING_LENGTH = 9;

const DEFAULT_CONFIG: MathCaptchaConfig = {
  minNumber: 1,
  maxNumber: 20,
  operations: ['add', 'subtract', 'multiply'],
};

/**
 * Generates a random mathematical challenge
 */
function generateMathChallenge(config: MathCaptchaConfig = DEFAULT_CONFIG): MathChallenge {
  const { minNumber, maxNumber, operations } = config;
  
  // Generate random numbers within range
  const num1 = Math.floor(Math.random() * (maxNumber - minNumber + 1)) + minNumber;
  const num2 = Math.floor(Math.random() * (maxNumber - minNumber + 1)) + minNumber;
  
  // Select random operation
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
      // Ensure positive result
      const larger = Math.max(num1, num2);
      const smaller = Math.min(num1, num2);
      question = `${larger} - ${smaller}`;
      answer = larger - smaller;
      break;
    }
    case 'multiply': {
      // Use smaller numbers for multiplication to keep answers reasonable
      const smallNum1 = Math.floor(Math.random() * MULTIPLY_MAX_NUMBER) + 1;
      const smallNum2 = Math.floor(Math.random() * MULTIPLY_MAX_NUMBER) + 1;
      question = `${smallNum1} × ${smallNum2}`;
      answer = smallNum1 * smallNum2;
      break;
    }
    default: {
      // Fallback to addition
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

/**
 * Hook для управления состоянием ответа пользователя
 */
function useUserAnswer() {
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [hasBlurred, setHasBlurred] = useState<boolean>(false);
  
  // Reset verification status when answer changes
  const setUserAnswerWithReset = useCallback((answer: string) => {
    setUserAnswer(answer);
    // НЕ сбрасываем isVerified здесь - это будет делать основной useEffect
    // Сбрасываем состояние blur только если поле очищается
    if (answer === '') {
      setHasBlurred(false);
      setIsVerified(false); // Только при очистке поля
    }
  }, []);

  const onBlur = useCallback(() => {
    setHasBlurred(true);
  }, []);
  
  return {
    userAnswer,
    isVerified,
    hasBlurred,
    setUserAnswer: setUserAnswerWithReset,
    setIsVerified,
    onBlur,
  };
}

/**
 * Hook для управления вызовами (challenge)
 */
function useChallenge(config: MathCaptchaConfig) {
  const [challenge, setChallenge] = useState<MathChallenge>(() => 
    generateMathChallenge(config)
  );
  
  const refreshChallenge = useCallback(() => {
    setChallenge(generateMathChallenge(config));
  }, [config]);
  
  return { challenge, refreshChallenge };
}

/**
 * Custom hook for mathematical CAPTCHA functionality
 * 
 * Provides bot protection through simple mathematical questions
 * that are easy for humans but challenging for basic bots.
 * 
 * @param config - Optional configuration for CAPTCHA generation
 * @returns Object with CAPTCHA state and control methods
 * 
 * @example
 * ```tsx
 * function LoginForm() {
 *   const captcha = useMathCaptcha();
 *   
 *   return (
 *     <form onSubmit={(e) => {
 *       e.preventDefault();
 *       if (!captcha.verify()) {
 *         alert('Please solve the math problem correctly');
 *         return;
 *       }
 *       // Proceed with form submission
 *     }}>
 *       <div>
 *         <label>Solve: {captcha.challenge.question} = ?</label>
 *         <input
 *           type="number"
 *           value={captcha.userAnswer}
 *           onChange={(e) => captcha.setUserAnswer(e.target.value)}
 *           placeholder="Your answer"
 *         />
 *         {captcha.isValid && <span>✓ Correct!</span>}
 *         <button type="button" onClick={captcha.refreshChallenge}>
 *           New Question
 *         </button>
 *       </div>
 *       <button type="submit" disabled={!captcha.isVerified}>
 *         Submit
 *       </button>
 *     </form>
 *   );
 * }
 * ```
 */
export function useMathCaptcha(config: MathCaptchaConfig = DEFAULT_CONFIG): UseMathCaptchaReturn {
  const { challenge, refreshChallenge } = useChallenge(config);
  const { userAnswer, isVerified, hasBlurred, setUserAnswer, setIsVerified, onBlur } = useUserAnswer();
  
  // Check if current answer is valid (correct number)
  const isValid = useMemo(() => {
    const numericAnswer = parseInt(userAnswer.trim(), 10);
    return !isNaN(numericAnswer) && numericAnswer === challenge.answer;
  }, [userAnswer, challenge.answer]);

  // Show error if user has blurred and answer is wrong and not empty
  const hasError = useMemo(() => {
    return hasBlurred && userAnswer.trim() !== '' && !isValid;
  }, [hasBlurred, userAnswer, isValid]);
  
  // Управляем isVerified состоянием
  useEffect(() => {
    if (isValid && userAnswer.trim() !== '') {
      setIsVerified(true);
    } else {
      setIsVerified(false);
    }
  }, [isValid, userAnswer, setIsVerified]);
  
  // Verify answer and mark as verified if correct
  const verify = useCallback((): boolean => {
    if (isValid) {
      setIsVerified(true);
      return true;
    }
    return false;
  }, [isValid, setIsVerified]);
  
  // Reset all state
  const reset = useCallback(() => {
    refreshChallenge();
    setIsVerified(false);
  }, [refreshChallenge, setIsVerified]);
  
  return {
    challenge,
    userAnswer,
    isValid,
    isVerified,
    hasError,
    setUserAnswer,
    onBlur,
    refreshChallenge,
    verify,
    reset,
  };
}

/**
 * Predefined configurations for different security levels
 */
export const CAPTCHA_CONFIGS: Record<string, MathCaptchaConfig> = {
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
