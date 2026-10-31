import { z } from "zod";

export const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

export const validate = (schema, source = "body") => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const issue = result.error.issues[0];
    return res.status(400).json({
      success: false,
      message: `${issue.path.join(".") || "Request"}: ${issue.message}`,
    });
  }
  req.valid = result.data;
  next();
};

export const validateId = (name = "id") => (req, res, next) => {
  if (!objectId.safeParse(req.params[name]).success) {
    return res.status(404).json({ success: false, message: "Not found" });
  }
  next();
};
