/**
 * Error handling utilities
 * Centralized error handling, retry logic, and user-friendly error messages
 */

import { toast } from '@/hooks/use-toast';

/**
 * Standard error messages for common scenarios
 */
export const ERROR_MESSAGES = {
    NETWORK: {
        title: 'Connection Error',
        description: 'Unable to reach the server. Please check your internet connection.',
    },
    AUTH: {
        title: 'Authentication Error',
        description: 'Your session has expired. Please log in again.',
    },
    SAVE_FAILED: {
        title: 'Save Failed',
        description: 'Your changes could not be saved. Please try again.',
    },
    LOAD_FAILED: {
        title: 'Load Failed',
        description: 'Could not load the board. Please refresh the page.',
    },
    UNKNOWN: {
        title: 'Unexpected Error',
        description: 'Something went wrong. Please try again.',
    },
};

/**
 * Implements exponential backoff for retry attempts
 * @param attemptIndex - Current attempt number (0-indexed)
 * @param baseDelay - Base delay in milliseconds (default: 1000ms)
 * @param maxDelay - Maximum delay in milliseconds (default: 30000ms)
 * @returns Delay in milliseconds before next retry
 */
export function exponentialBackoff(
    attemptIndex: number,
    baseDelay: number = 1000,
    maxDelay: number = 30000
): number {
    return Math.min(baseDelay * Math.pow(2, attemptIndex), maxDelay);
}

/**
 * Determines if an error is retryable (network/server errors)
 * @param error - Error object to check
 * @returns True if error should be retried
 */
export function isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        return (
            message.includes('network') ||
            message.includes('fetch') ||
            message.includes('timeout') ||
            message.includes('500') ||
            message.includes('502') ||
            message.includes('503') ||
            message.includes('504')
        );
    }
    return false;
}

/**
 * Gets a user-friendly error message based on the error type
 * @param error - Error object
 * @returns User-friendly error message object
 */
export function getUserFriendlyError(error: unknown): { title: string; description: string } {
    if (error instanceof Error) {
        const message = error.message.toLowerCase();

        if (message.includes('network') || message.includes('fetch')) {
            return ERROR_MESSAGES.NETWORK;
        }

        if (message.includes('auth') || message.includes('401') || message.includes('403')) {
            return ERROR_MESSAGES.AUTH;
        }

        if (message.includes('save')) {
            return ERROR_MESSAGES.SAVE_FAILED;
        }

        if (message.includes('load')) {
            return ERROR_MESSAGES.LOAD_FAILED;
        }
    }

    return ERROR_MESSAGES.UNKNOWN;
}

/**
 * Shows a user-friendly error toast with optional retry button
 * @param error - Error object
 * @param onRetry - Optional retry callback
 */
export function showErrorToast(error: unknown, onRetry?: () => void) {
    const { title, description } = getUserFriendlyError(error);

    const toastOptions: Parameters<typeof toast>[0] = {
        title,
        description,
        variant: 'destructive',
    };

    // Note: If you need a retry button, pass the onRetry callback
    // and handle it in the calling code with TanStack Query's retry functionality
    toast(toastOptions);

    // The onRetry callback can be used by the caller if needed
    if (onRetry) {
        // Caller can use this for retry logic
        return onRetry;
    }
}

/**
 * Retry configuration for mutations
 */
export const RETRY_CONFIG = {
    /** Maximum number of retry attempts */
    maxRetries: 3,
    /** Base delay for exponential backoff (ms) */
    baseDelay: 1000,
    /** Maximum delay between retries (ms) */
    maxDelay: 30000,
    /** Function to determine if error should be retried */
    shouldRetry: isRetryableError,
    /** Function to calculate retry delay */
    retryDelay: exponentialBackoff,
};
