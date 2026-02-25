import type { Response } from "@/types";

export type AuthResponse = Response<{
  user: {
    id: string;
    email: string;
    name: string;
  };
  tokens?: {
    accessToken: string;
    refreshToken: string;
  };
}>;
