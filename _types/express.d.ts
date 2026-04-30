type OwnsToken = (data: { token: string; accountId: number }) => boolean;

declare global {
  namespace Express {
    interface User {
      id: number;
      sub?: string;
      role: 'Admin' | 'User';
      ownsToken?: OwnsToken;
    }
    interface Request {
      user?: User;
    }
  }
}

export {};
