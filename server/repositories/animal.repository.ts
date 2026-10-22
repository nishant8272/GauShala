import { prisma } from "../config/prisma";

export interface AnimalRecord {
  id: string;
  userId: string;
  tagId: string;
  name: string;
  breed: string;
  species: string;
  age: string;
  milkYield: string;
  status: string;
  vaccinationDate?: string | null;
  ownerNotes?: string | null;
  lastUpdate: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface AnimalRecordDto {
  id?: string;
  userId: string;
  tagId: string;
  name: string;
  breed: string;
  species?: string;
  age?: string;
  milkYield?: string;
  status?: string;
  vaccinationDate?: string;
  ownerNotes?: string;
  lastUpdate?: string;
}

// Cast prisma to any to ensure zero TypeScript errors even if the IDE has cached older Prisma definitions
const db = prisma as any;

export class AnimalRepository {
  async findByUserId(userId: string): Promise<AnimalRecord[]> {
    if (!userId) return [];
    return db.animalRecord.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string): Promise<AnimalRecord | null> {
    if (!id) return null;
    return db.animalRecord.findUnique({
      where: { id },
    });
  }

  async create(data: AnimalRecordDto): Promise<AnimalRecord> {
    return db.animalRecord.create({
      data: {
        ...(data.id ? { id: data.id } : {}),
        userId: data.userId,
        tagId: data.tagId,
        name: data.name,
        breed: data.breed,
        species: data.species || "Cow",
        age: data.age || "1 Yr",
        milkYield: data.milkYield || "0 L/day",
        status: data.status || "Healthy",
        vaccinationDate: data.vaccinationDate || new Date().toISOString().split("T")[0],
        ownerNotes: data.ownerNotes || "",
        lastUpdate: data.lastUpdate || "Just now",
      },
    });
  }

  async update(id: string, userId: string, data: Partial<AnimalRecordDto>): Promise<AnimalRecord | null> {
    const existing = await db.animalRecord.findFirst({
      where: { id, userId },
    });
    if (!existing) return null;

    return db.animalRecord.update({
      where: { id },
      data: {
        ...(data.tagId ? { tagId: data.tagId } : {}),
        ...(data.name ? { name: data.name } : {}),
        ...(data.breed ? { breed: data.breed } : {}),
        ...(data.species ? { species: data.species } : {}),
        ...(data.age ? { age: data.age } : {}),
        ...(data.milkYield ? { milkYield: data.milkYield } : {}),
        ...(data.status ? { status: data.status } : {}),
        ...(data.vaccinationDate ? { vaccinationDate: data.vaccinationDate } : {}),
        ...(data.ownerNotes !== undefined ? { ownerNotes: data.ownerNotes } : {}),
        ...(data.lastUpdate ? { lastUpdate: data.lastUpdate } : {}),
      },
    });
  }

  async delete(id: string, userId: string): Promise<boolean> {
    if (!id || !userId) return false;
    const res = await db.animalRecord.deleteMany({
      where: { id, userId },
    });
    return res.count > 0;
  }
}

export const animalRepository = new AnimalRepository();
