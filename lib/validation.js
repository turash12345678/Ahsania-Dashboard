// Input validation utility functions

export function validateSale(data) {
    const errors = [];

    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
        errors.push('Items array is required and must not be empty');
    } else {
        // Validate each item
        data.items.forEach((item, index) => {
            if (!item.id) errors.push(`Item ${index + 1}: Missing item ID`);
            if (!item.type || !['product', 'service'].includes(item.type)) {
                errors.push(`Item ${index + 1}: Invalid type (must be 'product' or 'service')`);
            }
            if (!Number.isInteger(item.quantity) || item.quantity < 1) {
                errors.push(`Item ${index + 1}: Quantity must be a positive integer`);
            }
            if (typeof item.price !== 'number' || item.price < 0) {
                errors.push(`Item ${index + 1}: Price must be a non-negative number`);
            }
        });
    }

    if (!data.payment_method || !['cash', 'bkash', 'nagad'].includes(data.payment_method)) {
        errors.push('Invalid payment method');
    }

    if (typeof data.total_amount !== 'number' || data.total_amount <= 0) {
        errors.push('Total amount must be a positive number');
    }

    // Verify total matches items
    const calculatedTotal = data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (Math.abs(calculatedTotal - data.total_amount) > 0.01) {
        errors.push(`Total amount mismatch: Expected ${calculatedTotal}, got ${data.total_amount}`);
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

export function validateProduct(data) {
    const errors = [];

    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
        errors.push('Product name is required');
    }

    if (typeof data.buy_price !== 'number' || Number.isNaN(data.buy_price) || data.buy_price < 0) {
        errors.push('Buy price must be a non-negative number');
    }

    if (typeof data.sell_price !== 'number' || Number.isNaN(data.sell_price) || data.sell_price < 0) {
        errors.push('Sell price must be a non-negative number');
    }

    if (data.sell_price < data.buy_price) {
        errors.push('Sell price must be greater than or equal to buy price');
    }

    if (data.stock_quantity !== undefined) {
        if (!Number.isInteger(data.stock_quantity) || data.stock_quantity < 0) {
            errors.push('Stock quantity must be a non-negative integer');
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

export function validateService(data) {
    const errors = [];

    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
        errors.push('Service name is required');
    }

    if (typeof data.price !== 'number' || data.price < 0) {
        errors.push('Service price must be a non-negative number');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

export function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return input.trim().replace(/[<>]/g, '');
}
