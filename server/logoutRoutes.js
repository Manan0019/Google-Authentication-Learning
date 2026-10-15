
import { Router } from "express";

const router = Router();

router.post("/logout", (req, res) => {
  if (!req.session) {
    return res.status(204).end();
  }

  req.session.destroy((error) => {
    if (error) {
      console.error("Logout failed:", error);

      return res.status(500).json({
        error: "Unable to log out.",
      });
    }

    res.clearCookie(
      process.env.NODE_ENV === "production"
        ? "__Host-auth.sid"
        : "auth.sid",
      { path: "/" }
    );

    return res.status(204).end();
  });
});

export default router;
