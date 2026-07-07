-- CreateTable
CREATE TABLE "ImpactAnalysisReport" (
    "id" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "maxDepth" INTEGER NOT NULL DEFAULT 3,
    "scope" JSONB NOT NULL,
    "reportMarkdown" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImpactAnalysisReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ImpactAnalysisReport_nodeId_createdAt_idx" ON "ImpactAnalysisReport"("nodeId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ImpactAnalysisReport_moduleId_createdAt_idx" ON "ImpactAnalysisReport"("moduleId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Connection_sourceId_idx" ON "Connection"("sourceId");

-- CreateIndex
CREATE INDEX "Connection_targetId_idx" ON "Connection"("targetId");
