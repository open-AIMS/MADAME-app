import {HttpErrorResponse} from "@angular/common/http";

// Example HTTP 400 Zod error
/*
[
  {
    "type": "Body",
    "errors": {
      "issues": [
        {
          "validation": "email",
          "code": "invalid_string",
          "message": "Invalid email",
          "path": [
            "email"
          ]
        }
      ],
      "name": "ZodError"
    }
  }
]
*/

/**
 * Get user-friendly error message from API error.
 * @param error
 */
export function extractErrorMessage(error: any): string {
  if (error instanceof HttpErrorResponse && error.error) {
    const subError = error.error;
    if (typeof subError.message === 'string') {
      return subError.message;
    } else if (Array.isArray(subError)) {
      // possible ZodError
      try {
        return subError[0].errors.issues[0].message;
      } catch (e) {
        // pass
        console.warn("Unable to get error message", error);
      }
    }
  }

  return "Unknown error";
}