-- Enable trigram extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateIndex
CREATE INDEX "LogicNode_moduleId_idx" ON "LogicNode"("moduleId");

-- CreateIndex
CREATE INDEX "LogicNode_status_idx" ON "LogicNode"("status");

-- CreateIndex
CREATE INDEX "LogicNode_priority_idx" ON "LogicNode"("priority");

-- CreateIndex
CREATE INDEX "LogicNode_createdById_idx" ON "LogicNode"("createdById");

-- CreateIndex
CREATE INDEX "LogicNode_tags_idx" ON "LogicNode" USING GIN ("tags");

-- CreateIndex
CREATE INDEX "idx_logic_node_name_trgm" ON "LogicNode" USING GIN ("name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "idx_logic_node_summary_trgm" ON "LogicNode" USING GIN ("summary" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "idx_logic_node_code_ref_trgm" ON "LogicNode" USING GIN ("codeRef" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "Module_systemId_idx" ON "Module"("systemId");

-- CreateIndex
CREATE INDEX "idx_module_name_trgm" ON "Module" USING GIN ("name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "idx_module_description_trgm" ON "Module" USING GIN ("description" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "System_teamId_idx" ON "System"("teamId");

-- CreateIndex
CREATE INDEX "idx_system_name_trgm" ON "System" USING GIN ("name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "idx_system_description_trgm" ON "System" USING GIN ("description" gin_trgm_ops);
