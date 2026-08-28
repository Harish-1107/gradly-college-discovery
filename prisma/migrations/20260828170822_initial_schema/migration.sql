-- CreateTable
CREATE TABLE "institutes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "feesPerYear" INTEGER,
    "rating" DOUBLE PRECISION,
    "overview" TEXT,
    "nirfRank" INTEGER,
    "nirfScore" DOUBLE PRECISION,
    "nirfBand" TEXT,
    "goScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "institutes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cutoffs" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "quota" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "round" INTEGER NOT NULL,
    "openingRank" INTEGER NOT NULL,
    "closingRank" INTEGER NOT NULL,

    CONSTRAINT "cutoffs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "reviewerName" TEXT NOT NULL,
    "reviewerCourse" TEXT,
    "graduationYear" INTEGER,
    "rating" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isSample" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "institutes_name_key" ON "institutes"("name");

-- CreateIndex
CREATE UNIQUE INDEX "institutes_slug_key" ON "institutes"("slug");

-- CreateIndex
CREATE INDEX "institutes_type_idx" ON "institutes"("type");

-- CreateIndex
CREATE INDEX "institutes_state_idx" ON "institutes"("state");

-- CreateIndex
CREATE INDEX "institutes_rating_idx" ON "institutes"("rating");

-- CreateIndex
CREATE INDEX "courses_instituteId_idx" ON "courses"("instituteId");

-- CreateIndex
CREATE UNIQUE INDEX "courses_instituteId_name_key" ON "courses"("instituteId", "name");

-- CreateIndex
CREATE INDEX "cutoffs_instituteId_idx" ON "cutoffs"("instituteId");

-- CreateIndex
CREATE INDEX "cutoffs_courseId_idx" ON "cutoffs"("courseId");

-- CreateIndex
CREATE INDEX "cutoffs_quota_category_gender_year_round_idx" ON "cutoffs"("quota", "category", "gender", "year", "round");

-- CreateIndex
CREATE INDEX "cutoffs_closingRank_idx" ON "cutoffs"("closingRank");

-- CreateIndex
CREATE UNIQUE INDEX "cutoffs_instituteId_courseId_quota_category_gender_year_rou_key" ON "cutoffs"("instituteId", "courseId", "quota", "category", "gender", "year", "round");

-- CreateIndex
CREATE INDEX "reviews_instituteId_idx" ON "reviews"("instituteId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "institutes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cutoffs" ADD CONSTRAINT "cutoffs_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "institutes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cutoffs" ADD CONSTRAINT "cutoffs_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "institutes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
