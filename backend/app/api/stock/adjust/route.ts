import { AppError, ProductService } from "@/app/services/productService";
import { UpdateStockRequest } from "@/lib/dto/product";
import { NextRequest, NextResponse } from "next/server";

const productService = new ProductService();

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const updateRequest = body as UpdateStockRequest;

    const updated = await productService.updateProductRemain(updateRequest);

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("=== FULL ERROR ===", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}