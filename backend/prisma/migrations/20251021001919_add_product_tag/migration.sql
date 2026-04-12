-- CreateEnum
CREATE TYPE "public"."ProductTag" AS ENUM ('PROMOCAO', 'NOVO');

-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "tag" "public"."ProductTag";
