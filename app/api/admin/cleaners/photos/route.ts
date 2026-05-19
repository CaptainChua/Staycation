import { NextRequest } from "next/server";
import {
  handlePhotoPost,
  deletePhoto,
} from "@/backend/controller/cleaningChecklistController";

export async function POST(req: NextRequest) {
  return handlePhotoPost(req);
}

export async function DELETE(req: NextRequest) {
  return deletePhoto(req);
}