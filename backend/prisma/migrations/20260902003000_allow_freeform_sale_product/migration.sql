-- Preserve existing product links while allowing manually typed products.
ALTER TABLE "SaleItem" ADD COLUMN "productName" TEXT;
UPDATE "SaleItem" si
SET "productName" = p."name"
FROM "Product" p
WHERE si."productId" = p."id";
ALTER TABLE "SaleItem" ALTER COLUMN "productName" SET NOT NULL;
ALTER TABLE "SaleItem" ALTER COLUMN "productId" DROP NOT NULL;
