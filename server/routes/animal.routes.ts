import { Router, type Request, type Response, type NextFunction } from "express";
import { animalRepository } from "../repositories/animal.repository";

export const animalRouter = Router();

animalRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.currentUser?.id || (req.headers["x-user-id"] as string) || (req.query.userId as string);
    if (!userId) {
      return res.json([]);
    }
    const list = await animalRepository.findByUserId(userId);
    res.json(list);
  } catch (err) {
    next(err);
  }
});

animalRouter.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.currentUser?.id || (req.headers["x-user-id"] as string) || req.body.userId;
    if (!userId) {
      return res.status(401).json({ error: "Please log in to register an animal." });
    }

    const { tagId, name, breed, species, age, milkYield, status, vaccinationDate, ownerNotes, lastUpdate } = req.body;
    if (!name || !breed) {
      return res.status(400).json({ error: "Animal name and breed are required." });
    }

    const created = await animalRepository.create({
      userId,
      tagId: tagId || `TAG-${Math.floor(100 + Math.random() * 900)}`,
      name,
      breed,
      species: species || "Cow",
      age: age || "2 Yrs",
      milkYield: milkYield || "10 L/day",
      status: status || "Healthy",
      vaccinationDate,
      ownerNotes,
      lastUpdate: lastUpdate || "Just now",
    });

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

animalRouter.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.currentUser?.id || (req.headers["x-user-id"] as string);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const success = await animalRepository.delete(id, userId);
    res.json({ success });
  } catch (err) {
    next(err);
  }
});
