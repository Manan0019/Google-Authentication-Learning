const ALLOWED_ORIGIN = "http://localhost:5173";

export function requireTrustedOrigin(req, res, next) {
  const origin = req.get("Origin");

  if (origin !== ALLOWED_ORIGIN) {
    return res.status(403).json({
      error: "Request origin is not allowed.",
    });
  }

  next();
}

export function requireJson(req, res, next) {
  if (!req.is("application/json")) {
    return res.status(415).json({
      error: "Content-Type must be application/json.",
    });
  }

  next();
}
