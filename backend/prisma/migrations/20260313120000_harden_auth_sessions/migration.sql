-- AlterTable
ALTER TABLE "public"."User"
ADD COLUMN     "activationTokenExpiresAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "public"."RefreshTokenSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "family" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "revokedReason" TEXT,
    "replacedByTokenHash" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RefreshTokenSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RefreshTokenSession_tokenHash_key" ON "public"."RefreshTokenSession"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshTokenSession_userId_idx" ON "public"."RefreshTokenSession"("userId");

-- CreateIndex
CREATE INDEX "RefreshTokenSession_family_idx" ON "public"."RefreshTokenSession"("family");

-- CreateIndex
CREATE INDEX "RefreshTokenSession_expiresAt_idx" ON "public"."RefreshTokenSession"("expiresAt");

-- AddForeignKey
ALTER TABLE "public"."RefreshTokenSession" ADD CONSTRAINT "RefreshTokenSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;