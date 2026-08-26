import { AppError, ProductService } from "@/app/services/productService";
import { getDataSource } from "@/lib/datasource";
import { CreateProductRequest } from "@/lib/dto/product";
import { NextRequest, NextResponse } from "next/server";

const productService = new ProductService();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const productRequest = body as CreateProductRequest;
    const product = await productService.createProduct(productRequest);

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("=== FULL ERROR ===", error);
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}