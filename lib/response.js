// API Response Utility - Consistent response format

export function successResponse(data, statusCode = 200) {
    return new Response(JSON.stringify({
        success: true,
        data,
        timestamp: new Date().toISOString()
    }), {
        status: statusCode,
        headers: { 'Content-Type': 'application/json' },
    });
}

export function errorResponse(error, statusCode = 500, details = []) {
    return new Response(JSON.stringify({
        success: false,
        error: error,
        details: details,
        timestamp: new Date().toISOString()
    }), {
        status: statusCode,
        headers: { 'Content-Type': 'application/json' },
    });
}

export function validationErrorResponse(errors = []) {
    return errorResponse('Validation failed', 400, errors);
}

export function notFoundResponse(message = 'Resource not found') {
    return errorResponse(message, 404, []);
}

export function conflictResponse(message = 'Resource conflict', details = []) {
    return errorResponse(message, 409, details);
}
