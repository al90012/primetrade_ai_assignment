import jwt from "jsonwebtoken";

const generateToken = (id: string | number): string => {
  const secret: string = process.env.JWT_SECRET || "default_secret"; // Fallback for dev

  return jwt.sign({ id }, secret, {
    expiresIn: "30d",
  });
};

export default generateToken;
