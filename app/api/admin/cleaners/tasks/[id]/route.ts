import { NextRequest, NextResponse } from "next/server";
import { getCleaningTaskById, updateCleaningTask } from "@/backend/controller/cleanersController";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  // Mock the URL structure for the controller
  const url = new URL(`/api/admin/cleaners/tasks/${params.id}`, req.url);
  const mockReq = new Request(url, {
    method: req.method,
    headers: req.headers,
  }) as NextRequest;
  
  return getCleaningTaskById(mockReq);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  // Mock the URL structure for the controller
  const url = new URL(`/api/admin/cleaners/tasks/${params.id}`, req.url);
  const mockReq = new Request(url, {
    method: req.method,
    headers: req.headers,
    body: req.body,
  }) as NextRequest;
  
  return updateCleaningTask(mockReq);
}
