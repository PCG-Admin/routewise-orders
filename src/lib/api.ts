// API service for backend calls
const API_URL = 'http://localhost:8000'; // Your FastAPI backend

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