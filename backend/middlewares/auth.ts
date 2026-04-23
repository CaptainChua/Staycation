import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export interface IUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: "Owner" | "CSR" | "Cleaner" | "Partner";
}

export const isAuthenticatedUser = async (
  req: NextRequest,
  event: any,
  next: any
) => {
  const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!session) {
    return NextResponse.json(
      { message: "Login FIrst to access this route" },
      { status: 401 }
    );
  }

  (req as any).user = session.user as IUser;
  return next();
};

export const authorizedRoles = (...roles: string[]) => {
  return (req: NextRequest, event: any, next: any) => {
    const user = (req as any).user as IUser;

    if (!roles.includes(user.role)) {
      return NextResponse.json(
        {
          errMessage: `Role (${user.role}) is not allowed to acces this resource`,
        },
        {
          status: 403,
        }
      );
    }
    return next();
  };
};
