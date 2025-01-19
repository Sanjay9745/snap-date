import apiUrl from './apiUrl';

export const createOrFindUser = async (username: string, gender?: string, age?: number, latitude?: number, longitude?: number) => {
    const response = await fetch(`${apiUrl}/users/createOrFind`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, latitude, longitude, gender, age }),
    });
    const data = await response.json();
    return data;
};

export const getUsers = async (options: { page?: number, limit?: number, minAge?: number, maxAge?: number, gender?: string, latitude?: number, longitude?: number, maxDistance?: number, anywhere?: boolean }, token?: string) => {
    const { page = 1, limit = 10, minAge, maxAge, gender, latitude, longitude, maxDistance, anywhere } = options;
    const params = `latitude=${latitude}&longitude=${longitude}&page=${page}&limit=${limit}${minAge ? `&minAge=${minAge}` : ''}${maxAge ? `&maxAge=${maxAge}` : ''}${gender ? `&gender=${gender}` : ''}${maxDistance ? `&maxDistance=${maxDistance}` : ''}${anywhere ? `&anywhere=${anywhere}` : ''}`;
    const response = await fetch(`${apiUrl}/users/getUsers?${params}`, {
        headers: {
            'x-access-token': `${token}`,
        },
    });
    const data = await response.json();
    return data;
};

export const updateLocation = async (username: string, latitude: number, longitude: number, token: string) => {
    const response = await fetch(`${apiUrl}/users/updateLocation`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-access-token': `${token}`,
        },
        body: JSON.stringify({ username, latitude, longitude }),
    });
    const data = await response.json();
    return data;
};

export const protectedRoute = async (token: string) => {
    const response = await fetch(`${apiUrl}/users/protected`, {
        headers: {
            'x-access-token': `${token}`,
        },
    });
    const data = await response.json();
    return data;
};

export const getUser = async (token: string) => {
    const response = await fetch(`${apiUrl}/users/getUser`, {
        headers: {
            'x-access-token': `${token}`,
        },
    });
    const data = await response.json();
    return data;
}

export const updateUser = async (options: any, token: string) => {
    const {
        age,
        gender,
        bio
    } = options;
    const response = await fetch(`${apiUrl}/users/updateUser`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-access-token': `${token}`,
        },
        body: JSON.stringify
            ({ age, gender, bio }),
    });
    const data = await response.json();
    return data;
};

export const deleteAccount = async (token: string) => {
    const response = await fetch(`${apiUrl}/users/deleteUser`, {
        method: 'DELETE',
        headers: {
            'x-access-token': `${token}`,
        },
    });
    const data = await response.json();
    return data;
}
