# Sub-Agent Task Specification Template (TASK_TEMPLATE)

## 📋 Task Context
* **Assigned Agent**: [Sub-Agent Name]
* **Orchestrator ID**: [Orchestrator Conversation ID]
* **Target Files**: [List of absolute paths to files]
* **Objective**: [Summary of what needs to be implemented]

## 🛠️ Implementation Plan
* **Proposed Changes**: [Detail modifications file by file]
* **Database/API Dependencies**: [List database tables or APIs accessed]
* **System Rules to Follow**: [E.g., SQLite contains case-insensitivity, no-recursion, ledger debit only]

## 🧪 Verification Tasks
* **Local Tests**: [E.g. ts-node tests or manual UI validations]
* **Linting / Compiling**: `npm run lint` / `npm run type-check`

## 📝 Status Report (To be completed by Sub-Agent)
* **Status**: [PENDING | IN_PROGRESS | COMPLETED | FAILED]
* **Changes Made**: [Summary of changes]
* **Verification Results**: [Build logs or test outputs]
* **Blockers / Open Items**: [Describe any issues]
