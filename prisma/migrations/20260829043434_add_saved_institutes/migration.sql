-- CreateTable
CREATE TABLE "SavedInstitute" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedInstitute_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavedInstitute_userId_idx" ON "SavedInstitute"("userId");

-- CreateIndex
CREATE INDEX "SavedInstitute_instituteId_idx" ON "SavedInstitute"("instituteId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedInstitute_userId_instituteId_key" ON "SavedInstitute"("userId", "instituteId");

-- AddForeignKey
ALTER TABLE "SavedInstitute" ADD CONSTRAINT "SavedInstitute_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedInstitute" ADD CONSTRAINT "SavedInstitute_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "institutes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
