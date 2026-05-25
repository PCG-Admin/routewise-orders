// API service for backend calls
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://bulk-01-1-docker.onrender.com';

export async function loginUser(email: string, password: string) {
    const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || 'Login failed');
    }

    return response.json();
}

export async function uploadExcel(file: File, token: string) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/api/upload/excel`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        body: formData,
    });

    return response.json();
}

export async function uploadPDF(file: File, token: string) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/api/upload/pdf`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        body: formData,
    });

    return response.json();
}

export async function fetchOrders(token: string) {
    const response = await fetch(`${API_URL}/api/orders`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });
    return response.json();
}

export async function createOrder(orderData: any, token: string) {
    const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
    });
    return response.json();
}