import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import User, { IUser } from "../models/user.model";
import { sendError } from "../utils/response.util";

interface DecodedToken {
  id: string;
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

const protect = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as string,
      ) as DecodedToken;

      (req as any).user = (await User.findById(decoded.id).select(
        "-password",
      )) as IUser;

      next();
    } catch (error) {
      sendError(res, 401, "Not authorized, token failed");
    }
  } else {
    sendError(res, 401, "Not authorized, no token");
  }
};

export { protect };
