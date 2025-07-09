export interface LoginResponse {
  error?: string;
  accessToken?: string;  // Changed from jwtToken to match backend response
  userId?: string;
  firstName?: string;
  lastName?: string;
}

export interface RegisterResponse {
  error?: string;
}

export const login = async (userLogin: string, userPassword: string): Promise<LoginResponse> => {
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userLogin,
        userPassword,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return { error: 'Failed to connect to server' };
  }
};

export const register = async (
  userFirstName: string,
  userLastName: string,
  userEmail: string,
  userLogin: string,
  userPassword: string
): Promise<RegisterResponse> => {
  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userFirstName,
        userLastName,
        userEmail,
        userLogin,
        userPassword,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return { error: 'Failed to connect to server' };
  }
}; 