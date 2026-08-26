import { ProductService } from "@/app/services/productService";
import { NextRequest, NextResponse } from "next/server";

const productService = new ProductService();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const amountParam = searchParams.get("amount");
    const amount = amountParam ? Number(amountParam) : 5;

    console.log("---------------------------", amount);
    const result = await productService.getLowStockProducts(amount);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}