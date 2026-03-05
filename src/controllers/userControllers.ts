import { registrationService, signinServices } from "services/userServices";

import { Response, Request } from "express";

export const registrationController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const user = await registrationService(req.body);

  res.json({
    message: "User successfully create",
    data: user,
  });
};

export const signinController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const user = await signinServices();
  res.json({
    message: user,
  });
};
