-- CreateTable
CREATE TABLE "AiPromptVersion" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "variant" TEXT NOT NULL DEFAULT 'default',
    "description" TEXT,
    "systemPrompt" TEXT,
    "userPromptTemplate" TEXT NOT NULL,
    "model" TEXT NOT NULL DEFAULT 'claude-sonnet-4-20250514',
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
    "maxTokens" INTEGER NOT NULL DEFAULT 2000,
    "responseSchema" JSONB,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "teamId" TEXT,

    CONSTRAINT "AiPromptVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiPromptVersion_key_isDefault_teamId_idx" ON "AiPromptVersion"("key", "isDefault", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "AiPromptVersion_key_version_variant_teamId_key" ON "AiPromptVersion"("key", "version", "variant", "teamId");
